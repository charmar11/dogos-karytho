import React, { createContext, useContext, useState, useMemo } from 'react';
import { ref, update } from 'firebase/database';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import { useInventory } from './InventoryContext';
import { useActivity } from './ActivityContext';
import { useHistory } from './HistoryContext';
import telegramService from '../services/TelegramService';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user, userData, activeMember } = useAuth();
  const { deductFromInventory, calculateItemsCogs } = useInventory();
  const { logActivity } = useActivity();
  const { branches } = useHistory();
  const [items, setItems] = useState([]);

  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  }, [items]);

  const addToCart = (product, variation = null, selectedExtras = []) => {
    const variationName = variation ? variation.name : '';
    const extrasStr = selectedExtras.map(e => e.name).sort().join(', ');
    const key = `${product.id}|${variationName}|${extrasStr}`;
    const price = (variation ? variation.price : (product.basePrice || 0)) + 
                  selectedExtras.reduce((s, e) => s + (e.price || 0), 0);

    setItems(prev => {
      const existing = prev.find(i => i.key === key);
      if (existing) {
        return prev.map(i => i.key === key ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, {
        key,
        productId: product.id,
        productName: product.name,
        variationName,
        extras: selectedExtras,
        price,
        qty: 1
      }];
    });
  };

  const updateQty = (key, delta) => {
    setItems(prev => {
      return prev.map(item => {
        if (item.key === key) {
          const newQty = Math.max(0, item.qty + delta);
          return { ...item, qty: newQty };
        }
        return item;
      }).filter(item => item.qty > 0);
    });
  };

  const clearCart = () => setItems([]);

  const submitSale = async (paymentAmount) => {
    if (!user || !userData?.branchId || items.length === 0) return { success: false, message: "Datos incompletos" };

    const saleId = `sale_${Date.now()}`;
    const branchId = userData.branchId;
    const now = new Date();
    
    const saleData = {
      id: saleId,
      ts: Date.now(),
      timestamp: now.toISOString(), // Legacy uses ISO string for sales
      date: now.toISOString(),
      time: now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      items: items.map(i => ({
        name: i.productName + (i.variationName ? ` (${i.variationName})` : ''),
        price: i.price,
        qty: i.qty,
        extras: i.extras.map(e => e.name).join(', ')
      })),
      total,
      amount: total, // Normalized field
      paid: paymentAmount,
      change: paymentAmount - total,
      seller: activeMember || userData?.displayName || user.email,
      person: activeMember || userData?.displayName || user.email,
      branchId: branchId,
      totalCogs: calculateItemsCogs(items) || 0
    };

    try {
      const updates = {};
      updates[`sucursales/${branchId}/sales/${saleId}`] = saleData;
      await update(ref(db), updates);

      // Log Activity
      logActivity('venta', `Venta registrada: $${total} (${items.length} items)`);

      // Deduct from inventory
      try {
        await deductFromInventory(items);
      } catch (invErr) {
        console.error("Error deducting inventory:", invErr);
        // We continue anyway as the sale was already saved, but log it
      }

      // 3. Autonomous Alerts Triggers
      setTimeout(async () => {
        try {
          const branch = branches[branchId];
          if (!branch) return;

          const today = now.toISOString().split('T')[0];
          const todaySales = (branch.sales || []).filter(s => s.timestamp?.startsWith(today));
          
          // Alert 1: First Sale of the Day
          if (todaySales.length === 1) { // The one we just added
            await telegramService.notifyFirstSale(branch.name);
          }

          // Alert 2: 50% Goal threshold
          const goal = branch.config?.dailyGoal || 0;
          if (goal > 0) {
            const currentTotal = todaySales.reduce((sum, s) => sum + (s.total || 0), 0);
            const totalBefore = currentTotal - total;
            const threshold = goal / 2;

            if (totalBefore < threshold && currentTotal >= threshold) {
              await telegramService.notifyGoalThreshold(branch.name, 50);
            }
          }
        } catch (alertErr) {
          console.error("Error triggering autonomous alerts:", alertErr);
        }
      }, 100);

      clearCart();
      return { success: true, saleId };
    } catch (err) {
      console.error("Error saving sale:", err);
      return { success: false, message: err.message };
    }
  };

  const value = {
    items,
    total,
    addToCart,
    updateQty,
    clearCart,
    submitSale
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

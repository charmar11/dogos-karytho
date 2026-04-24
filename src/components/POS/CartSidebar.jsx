import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Minus, CreditCard, Banknote, ShoppingCart, CheckCircle, X, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

/* ── Bottom toast (slides up inside sidebar) ── */
const SuccessToast = ({ saleData, onClose }) => {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onClose]);

  const { paid, change, itemCount } = saleData;
  const exactChange = change === 0;

  return (
    <div className={`absolute bottom-0 left-0 right-0 z-[60] rounded-t-[2.5rem] shadow-[0_-12px_40px_rgba(0,0,0,0.15)] border-t-4 p-8 animate-in slide-in-from-bottom duration-300 ${
      exactChange ? 'bg-success text-success-content border-success' : 'bg-base-100 border-primary text-base-content'
    }`}>
      {/* Close button */}
      <button
        onClick={onClose}
        className={`absolute top-6 right-6 btn btn-circle btn-sm ${
          exactChange ? 'text-success-content/60 hover:text-success-content hover:bg-success-content/10' : 'opacity-30 hover:opacity-100'
        }`}
      >
        <X size={18} />
      </button>

      <div className="flex flex-col items-center text-center gap-4">
        {/* Icon */}
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
          exactChange ? 'bg-success-content/10 text-success-content' : 'bg-primary/10 text-primary'
        }`}>
          <CheckCircle size={36} strokeWidth={1.5} />
        </div>

        {/* Text Area */}
        <div className="w-full">
          <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${
            exactChange ? 'text-success-content/70' : 'text-base-content/40'
          }`}>
            {exactChange ? 'Pago exacto' : 'Cambio a entregar'} • {itemCount} productos
          </p>
          <p className={`text-6xl font-black tracking-tighter italic leading-none ${
            exactChange ? 'text-success-content' : 'text-primary'
          }`}>
            ${change.toLocaleString()}
          </p>
          {!exactChange && (
            <p className="text-[10px] font-bold opacity-30 mt-3 uppercase tracking-tighter">
              Recibió ${paid.toLocaleString()}
            </p>
          )}
        </div>

        {/* Action Button (Optional manual close) */}
        <button
          onClick={onClose}
          className={`btn btn-sm w-full mt-2 rounded-xl border-none font-black text-[10px] uppercase tracking-widest ${
            exactChange ? 'bg-success-content/10 text-success-content hover:bg-success-content/20' : 'bg-base-200 text-base-content/50 hover:bg-base-300'
          }`}
        >
          Entendido
        </button>

        {/* Countdown bar */}
        <div className={`w-full mt-2 h-1 rounded-full overflow-hidden ${
          exactChange ? 'bg-success-content/20' : 'bg-base-200'
        }`}>
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              exactChange ? 'bg-success-content/60' : 'bg-primary'
            }`}
            style={{ width: `${(countdown / 5) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

/* ── Main Sidebar ── */
const CartSidebar = ({ isOpen, onClose }) => {
  const { items, total, updateQty, clearCart, submitSale } = useCart();
  const { userPhoto, activeMember, userData, user } = useAuth();
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSale, setLastSale] = useState(null); // drives success toast
  const [activeBill, setActiveBill] = useState(null); // Track selected bill

  // Calculate change whenever paymentAmount or total changes
  const paidAmount = parseFloat(paymentAmount) || 0;
  const change = paidAmount - total;

  const handleCheckout = async () => {
    if (total <= 0) return;
    setIsSubmitting(true);
    const res = await submitSale(paidAmount);
    setIsSubmitting(false);

    if (res.success) {
      setLastSale({
        total,
        paid: paidAmount,
        change: Math.max(paidAmount - total, 0),
        itemCount: items.reduce((acc, i) => acc + i.qty, 0),
      });
      handleClearPayment();
    } else {
      alert(res.message);
    }
  };

  const handleClearPayment = () => {
    setPaymentAmount('');
    setActiveBill(null);
  };

  const setBill = (amount) => {
    setPaymentAmount(amount.toString());
    setActiveBill(amount);
  };

  const operatorName = activeMember || userData?.displayName || user?.email?.split('@')[0] || 'Invitado';

  // Disable submit if no items, or if payment is insufficient
  const canCheckout = items.length > 0 && paidAmount >= total;

  return (
    <div className={`
      fixed inset-0 z-50 h-[100dvh] bg-base-100 flex flex-col shadow-none transition-transform duration-400 cubic-bezier(0.4, 0, 0.2, 1) transform
      ${isOpen ? 'translate-y-0' : 'translate-y-full'}
      md:relative md:translate-y-0 md:h-full md:w-[400px] md:rounded-none md:border-l md:border-t-0 md:shadow-none
    `}>
      {/* Drawer Handle (Mobile Only) */}
      <div className="flex justify-center pt-3 pb-1 md:hidden">
        <div className="w-12 h-1.5 bg-base-content/10 rounded-full" />
      </div>

      {/* Success toast overlay (inside relative container) */}
      {lastSale && (
        <SuccessToast
          saleData={lastSale}
          onClose={() => setLastSale(null)}
        />
      )}

      {/* Header */}
      <div className="p-6 pt-2 pb-6 md:pt-4 flex items-center justify-between border-b border-base-content/5 bg-base-200/30">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="btn btn-ghost btn-circle btn-sm md:hidden">
            <X size={20} />
          </button>
          <div>
            <h2 className="font-black text-xl md:text-2xl tracking-tight leading-none italic uppercase text-primary">Carrito</h2>
            <p className="text-[10px] uppercase font-black opacity-30 tracking-[0.2em] mt-1">Finalizar pedido</p>
          </div>
        </div>
        <button
          onClick={clearCart}
          disabled={items.length === 0}
          className="btn btn-ghost btn-sm text-error/60 hover:text-error hover:bg-error/10 rounded-lg"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-10 py-20">
            <ShoppingCart size={84} strokeWidth={1} />
            <p className="font-black mt-4 uppercase tracking-[0.3em]">Vacio</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.key} className="bg-base-200/50 rounded-2xl p-4 flex flex-col gap-3 border border-transparent hover:border-primary/10 transition-all group">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm truncate">{item.productName}</h4>
                  {item.variationName && (
                    <p className="text-[10px] font-bold text-primary uppercase truncate">{item.variationName}</p>
                  )}
                  {item.extras?.length > 0 && (
                    <p className="text-[10px] text-base-content/40 leading-tight truncate">
                      {item.extras.map(e => e.name).join(', ')}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className="font-black text-sm text-primary">${item.price * item.qty}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center bg-base-100 p-1 rounded-xl shadow-inner border border-base-content/5">
                  <button
                    onClick={() => updateQty(item.key, -1)}
                    disabled={items.length === 0}
                    className="btn btn-ghost btn-xs w-8 h-8 rounded-lg hover:text-error"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-10 text-center text-sm font-black">{item.qty}</span>
                  <button
                    onClick={() => updateQty(item.key, 1)}
                    className="btn btn-ghost btn-xs w-8 h-8 rounded-lg hover:text-success"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <span className="text-[10px] font-bold text-base-content/30">${item.price} c/u</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary and Checkout */}
      <div className="p-5 bg-base-200 border-t border-base-content/10 space-y-3">
        <div className="flex justify-between items-center bg-primary/10 px-5 py-3 rounded-2xl border border-primary/10">
          <span className="text-[10px] font-black uppercase text-primary tracking-widest">Total</span>
          <span className="text-2xl font-black text-primary italic">${total.toFixed(2)}</span>
        </div>

        {/* Change Display */}
        {paidAmount > 0 && (
          <div className={`p-4 rounded-2xl flex flex-col items-center justify-center border-2 animate-in zoom-in duration-200 ${paidAmount >= total ? 'bg-success text-success-content border-success-content/20' : 'bg-error/10 border-error/20 text-error'}`}>
            <span className="text-[8px] font-black uppercase tracking-[0.2em] mb-0.5 opacity-70">
              {paidAmount >= total ? 'Cambio' : 'Faltante'}
            </span>
            <span className="text-4xl font-black italic tracking-tighter">
              ${Math.abs(change).toFixed(2)}
            </span>
          </div>
        )}

        {/* Quick Cash Presets - ULTRA FAST FLOW */}
        <div className="grid grid-cols-5 gap-2">
          <button
            onClick={() => setBill(total)}
            className={`btn btn-sm h-9 rounded-xl text-[10px] font-black ${
              activeBill === total
                ? 'bg-primary text-primary-content border-primary shadow-lg'
                : 'bg-primary/10 border-primary/20 hover:bg-primary/20 text-primary'
            }`}
          >
            Exacto
          </button>
          {[50, 100, 200, 500].map(amt => (
            <button
              key={amt}
              onClick={() => setBill(amt)}
              className={`btn btn-sm h-9 rounded-xl text-[10px] font-black ${
                activeBill === amt
                  ? 'bg-primary text-primary-content border-primary shadow-lg'
                  : 'bg-base-100 border-base-content/5 hover:border-primary/40'
              }`}
            >
              ${amt}
            </button>
          ))}
        </div>

        {/* Payment Input - Optional, not auto-focused */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-primary/40">
            <Banknote size={18} />
          </div>
          <input
            type="number"
            inputMode="numeric"
            placeholder="Efectivo manual... (opcional)"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            className="input input-md w-full pl-11 bg-base-100 border-2 border-transparent focus:border-primary rounded-xl font-black text-xl shadow-inner text-base-content placeholder:text-base-content/20"
          />
          {paymentAmount && (
            <button
              onClick={handleClearPayment}
              className="absolute inset-y-0 right-4 flex items-center text-error opacity-40"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Submit */}
        <button
          onClick={handleCheckout}
          disabled={!canCheckout || isSubmitting}
          className={`btn btn-primary btn-md w-full h-11 rounded-xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 transition-all ${isSubmitting ? 'loading' : ''} text-primary-content ${!canCheckout ? 'opacity-50' : ''}`}
        >
          {isSubmitting ? (
            <span className="loading loading-spinner"></span>
          ) : (
            <>
              <CreditCard size={20} />
              <span className="text-lg font-black uppercase italic">Cobrar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CartSidebar;

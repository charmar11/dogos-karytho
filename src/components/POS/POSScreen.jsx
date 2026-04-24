import React, { useState, useMemo, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import ProductGrid from './ProductGrid';
import CategoryBar from './CategoryBar';
import SearchBar from './SearchBar';
import VariationModal from './VariationModal';
import InlineCartList from './InlineCartList';
import CorteModal from './CorteModal';

const PosScreen = () => {
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isCorteOpen, setIsCorteOpen] = useState(false);
  const { items, total, clearCart, updateQty } = useCart();
  const { user } = useAuth();
  const hasItems = items.length > 0;

  // Check if user is CIDOP (regardless of active member selection)
  // CIDOP should never see corte/caja functionality
  const isCidop = user?.email === 'cidop@karytho.com';

  // Override: CIDOP can never open corte modal
  const safeSetIsCorteOpen = (value) => {
    if (!isCidop) {
      setIsCorteOpen(value);
    }
  };

  const handleQuickAdd = (product) => {
    // Add 1 unit directly without modal for simple products
    const hasVariations = product.variations && product.variations.length > 0;
    const hasExtras = product.extras && product.extras.length > 0;

    if (hasVariations || hasExtras) {
      setSelectedProduct(product);
    } else {
      // Add directly
      updateQty(product.id + '||', 1);
    }
  };

  useEffect(() => {
    // Cleanup on unmount similar to original
    return () => {
      if (isCidop) {
        // Reset any CIDOP-specific state if needed
      }
    };
  }, [isCidop]);

  return (
    <div className="flex h-[calc(100dvh-64px)] w-full overflow-y-auto bg-base-200/50 relative flex-col">
      {/* Header with Search */}
      <div className="p-4 flex flex-col gap-4 bg-base-100 border-b border-base-300 shadow-sm">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        <CategoryBar activeCategory={activeCategory} onSelect={setActiveCategory} />
      </div>

      {/* Products Grid */}
      <div className="flex-1 p-4 pt-0 bg-base-200/30">
        <ProductGrid
          category={activeCategory}
          searchQuery={searchQuery}
          onOpenDetails={setSelectedProduct}
        />
      </div>

      {/* Inline Cart List */}
      {hasItems && (
        <div className="mx-4 mb-2">
          <InlineCartList />
        </div>
      )}

      {/* Fixed Checkout Button with Total - HIDDEN for CIDOP */}
      {hasItems && !isCidop && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-lg">
          <div className="bg-base-100/95 backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-3xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-base-content/40">Total</span>
              <span className="text-xl font-black text-primary">${total.toFixed(2)}</span>
            </div>
            <button
              onClick={() => setIsCorteOpen(true)}
              className="btn btn-primary btn-md rounded-xl shadow-lg shadow-primary/20 text-primary-content px-6"
            >
              <span className="font-black uppercase tracking-wider">Cobrar</span>
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedProduct && (
        <VariationModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
      <CorteModal isOpen={isCorteOpen} onClose={() => setIsCorteOpen(false)} />
    </div>
  );
};

export default PosScreen;

import React, { useState } from 'react';
import { Star, Plus, Info, CheckCircle2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useProducts } from '../../context/ProductContext';

const ProductCard = ({ product, onOpenDetails, index = 0 }) => {
  const { addToCart } = useCart();
  const { toggleFavorite } = useProducts();
  const [isAdding, setIsAdding] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);

  const hasVariations = product.variations && product.variations.length > 0;
  const hasExtras = product.extras && product.extras.length > 0;
  const needsModal = hasVariations || hasExtras;

  const handleAdd = (e) => {
    e.stopPropagation();
    if (needsModal) {
      onOpenDetails(product);
    } else {
      // Flash effect like original system
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 300);

      addToCart(product);
      setIsAdding(true);
      setTimeout(() => setIsAdding(false), 350);
    }
  };

  const handleToggleFavorite = (e) => {
    e.stopPropagation();
    // Burst effect like original
    const btn = e.currentTarget;
    btn.classList.add('burst');
    setTimeout(() => btn.classList.remove('burst'), 400);

    toggleFavorite(product.id, product.isFavorite);
  };

  const getIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'dogos': return '🌭';
      case 'bebidas': return '🥤';
      case 'combos': return '🎁';
      case 'papas': return '🍟';
      case 'postres': return '🧁';
      default: return '🍔';
    }
  };

  return (
    <div
      onClick={handleAdd}
      className={`
        group relative bg-base-100 rounded-[1.25rem] p-3 flex flex-col gap-1 transition-all duration-300 cursor-pointer border-2
        ${isAdding
          ? 'bg-success/20 border-success shadow-lg shadow-success/20 scale-[0.98]'
          : 'border-transparent hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 active:scale-95'
        }
        ${isFlashing ? 'animate-pulse' : ''}
      `}
      style={{
        animationDelay: `${index * 0.04}s`,
        animation: 'fade-in 0.5s ease-out forwards'
      }}
    >
      {/* Subtle Favorite Trigger */}
      <button
        onClick={handleToggleFavorite}
        className={`absolute top-2 right-2 p-1.5 rounded-full transition-all z-20 ${
          product.isFavorite
            ? 'text-warning bg-warning/10'
            : 'text-base-content/10 hover:text-warning/40 hover:bg-warning/5'
        }`}
      >
        <Star size={12} fill={product.isFavorite ? "currentColor" : "none"} />
      </button>

      {/* Name and Price */}
      <div className="flex flex-col pr-6">
        <h3 className="font-black text-[10px] md:text-[11px] leading-tight line-clamp-2 min-h-[2.2rem] group-hover:text-primary transition-colors uppercase tracking-tight text-base-content/80">
          {product.name}
        </h3>
        <p className="text-primary font-black text-sm md:text-base mt-0.5">
          ${product.basePrice || 0}
        </p>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between mt-1 pt-2 border-t border-base-content/5">
        <span className="text-[7px] md:text-[8px] uppercase font-black text-base-content/30 tracking-widest">
          {needsModal ? 'Personalizar' : 'Básico'}
        </span>
        <div className={`p-1 rounded-lg shadow-md transition-all duration-300 ${isAdding ? 'bg-success text-success-content scale-110' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-content'}`}>
          {isAdding ? <CheckCircle2 size={12} className="animate-in zoom-in" /> : <Plus size={12} />}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

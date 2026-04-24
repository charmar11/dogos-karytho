import React, { useMemo } from 'react';
import { useProducts } from '../../context/ProductContext';
import { Star } from 'lucide-react';

const CategoryBar = ({ activeCategory, onSelect }) => {
  const { products } = useProducts();

  const categories = useMemo(() => {
    const cats = ['Todos', 'Favoritos'];
    const dynamicCats = [...new Set(products.map(p => p.category).filter(Boolean))];
    return [...cats, ...dynamicCats];
  }, [products]);

  return (
    <div className="sticky top-0 z-30 bg-base-100/95 backdrop-blur-md -mx-4 px-4 py-3 border-b border-base-content/5 flex gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`btn btn-sm h-10 px-6 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all duration-300 ${
            activeCategory === cat
              ? 'btn-primary text-primary-content shadow-lg shadow-primary/20 scale-105'
              : 'btn-ghost bg-base-100 hover:bg-base-300 border-none regular-border opacity-80 hover:opacity-100 hover:shadow-md'
          }`}
        >
          {cat === 'Favoritos' && <Star size={14} className={activeCategory === cat ? 'fill-current' : ''} />}
          <span className="font-black">{cat}</span>
        </button>
      ))}
    </div>
  );
};

export default CategoryBar;

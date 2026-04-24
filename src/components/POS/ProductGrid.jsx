import React from 'react';
import { useProducts } from '../../context/ProductContext';
import { useAuth } from '../../context/AuthContext';
import ProductCard from './ProductCard';

const ProductGrid = ({ category, searchQuery, onOpenDetails }) => {
  const { products, loading, error } = useProducts();
  const { userData } = useAuth();

  const filteredProducts = products.filter(product => {
    const matchesCategory = category === 'Todos' ||
      (category === 'Favoritos' && product.isFavorite) ||
      product.category === category;

    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex-1 grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3 animate-pulse">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-48 bg-base-300 rounded-2xl opacity-50"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="text-error text-4xl mb-2">⚠</div>
        <h3 className="font-bold text-lg">Error al cargar productos</h3>
        <p className="text-base-content/60">{error}</p>
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-60">
        <div className="text-6xl mb-4 text-base-content/20">
          {!userData?.branchId ? '🚫' : (category === 'Favoritos' ? '⭐' : '🍔')}
        </div>
        <h3 className="font-bold text-xl uppercase tracking-tighter italic">
          {!userData?.branchId ? 'Sin sucursal asignada' : 'Sin productos'}
        </h3>
        <p className="text-sm max-w-xs mt-2">
          {!userData?.branchId
            ? 'Tu cuenta no tiene una sucursal vinculada. No se pueden cargar productos.'
            : `No hay productos registrados en "${category}" que coincidan con tu búsqueda.`}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
      {filteredProducts.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          onOpenDetails={onOpenDetails}
          index={index}
        />
      ))}
    </div>
  );
};

export default ProductGrid;

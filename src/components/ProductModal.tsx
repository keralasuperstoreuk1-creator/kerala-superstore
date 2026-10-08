'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  X, 
  ShoppingCart, 
  ShieldCheck, 
  MapPin, 
  Check, 
  Plus, 
  Minus, 
  Share2, 
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, onClose }) => {
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  if (!product) return null;

  const currentPrice = product.offerPrice ?? product.price;

  const handleAdd = () => {
    addToCart(product, qty);
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] z-10">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left: Image */}
        <div className="md:w-1/2 bg-slate-50 p-6 flex flex-col items-center justify-center relative border-b md:border-b-0 md:border-r border-slate-100">
          <div className="relative w-56 h-56">
            <Image
              src={product.imageUrl || '/products/matta-rice.png'}
              alt={product.name}
              fill
              className="object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target) target.src = '/products/matta-rice.png';
              }}
            />
          </div>
          {product.origin && (
            <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              <span>{product.origin}</span>
            </div>
          )}
        </div>

        {/* Right: Info */}
        <div className="md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto space-y-4">
          <div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-emerald-800 uppercase tracking-wider">{product.brand}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500">{product.category}</span>
            </div>

            <h2 className="text-lg font-black text-slate-900 mt-1">{product.name}</h2>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">Pack Size: {product.sizeWeight}</div>

            {/* Price Box */}
            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-2xl font-black text-slate-900">£{currentPrice.toFixed(2)}</span>
              {product.offerPrice && (
                <span className="text-sm text-slate-400 line-through">£{product.price.toFixed(2)}</span>
              )}
              <span className="text-xs text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded">In Stock</span>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-600 leading-relaxed mt-3">
              {product.description}
            </p>

            {/* Natasha's Law Allergen & Ingredients Box */}
            <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              {product.ingredients && (
                <div>
                  <span className="font-bold text-slate-700">Ingredients: </span>
                  <span className="text-slate-600">{product.ingredients}</span>
                </div>
              )}
              {product.allergens && product.allergens.length > 0 && (
                <div className="pt-2 border-t border-slate-200 flex items-start gap-1.5 text-amber-900 bg-amber-50/50 p-2 rounded-lg">
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Allergen Advice (Natasha&apos;s Law): </span>
                    <span>{product.allergens.join(', ')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Footer */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-slate-50">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="px-3 py-2 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-3 font-bold text-sm text-slate-900">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="px-3 py-2 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleAdd}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                  justAdded
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-800 hover:bg-emerald-700 text-white'
                }`}
              >
                {justAdded ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Added to Basket!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add to Basket • £{(currentPrice * qty).toFixed(2)}</span>
                  </>
                )}
              </button>
            </div>

            <a
              href={`https://wa.me/447749132122?text=${encodeURIComponent(`Hi, I'm interested in ordering ${product.name} (${product.sizeWeight}) from Kerala Superstore Manchester.`)}`}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Ask a question about this item on WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

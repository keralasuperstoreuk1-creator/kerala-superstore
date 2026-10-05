'use client';

import React from 'react';
import { 
  Wheat, 
  Flame, 
  Coffee, 
  Leaf, 
  Cookie, 
  Droplet, 
  Snowflake, 
  UtensilsCrossed, 
  Layers, 
  CookingPot 
} from 'lucide-react';

interface CategoryIconProps {
  slug: string;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ slug, className = 'w-6 h-6' }) => {
  if (slug.includes('rice')) {
    return (
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex items-center justify-center text-white shadow-md shadow-amber-500/20 group-hover:scale-110 transition-transform">
        <Wheat className={className} />
      </div>
    );
  }
  if (slug.includes('pulses') || slug.includes('dal')) {
    return (
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 via-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-110 transition-transform">
        <Layers className={className} />
      </div>
    );
  }
  if (slug.includes('masala') || slug.includes('curry')) {
    return (
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 via-red-600 to-red-800 flex items-center justify-center text-white shadow-md shadow-red-500/20 group-hover:scale-110 transition-transform">
        <Flame className={className} />
      </div>
    );
  }
  if (slug.includes('breakfast')) {
    return (
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 flex items-center justify-center text-white shadow-md shadow-yellow-500/20 group-hover:scale-110 transition-transform">
        <Coffee className={className} />
      </div>
    );
  }
  if (slug.includes('spices')) {
    return (
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-800 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-110 transition-transform">
        <Leaf className={className} />
      </div>
    );
  }
  if (slug.includes('snacks') || slug.includes('crisps')) {
    return (
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20 group-hover:scale-110 transition-transform">
        <Cookie className={className} />
      </div>
    );
  }
  if (slug.includes('oils') || slug.includes('ghee')) {
    return (
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 via-cyan-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 group-hover:scale-110 transition-transform">
        <Droplet className={className} />
      </div>
    );
  }
  if (slug.includes('pickles')) {
    return (
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 via-rose-600 to-red-700 flex items-center justify-center text-white shadow-md shadow-rose-500/20 group-hover:scale-110 transition-transform">
        <CookingPot className={className} />
      </div>
    );
  }
  if (slug.includes('frozen')) {
    return (
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-110 transition-transform">
        <Snowflake className={className} />
      </div>
    );
  }
  return (
    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 via-yellow-700 to-amber-900 flex items-center justify-center text-white shadow-md shadow-amber-700/20 group-hover:scale-110 transition-transform">
      <UtensilsCrossed className={className} />
    </div>
  );
};

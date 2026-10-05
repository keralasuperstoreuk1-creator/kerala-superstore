'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface FeaturedArchedCategoriesProps {
  onSelectCategory: (slug: string | null) => void;
  selectedCategory: string | null;
}

interface CircularCategoryItem {
  id: string;
  name: string;
  slug: string;
  defaultImage: string;
  itemCount: number;
}

export const FeaturedArchedCategories: React.FC<FeaturedArchedCategoriesProps> = ({
  onSelectCategory,
  selectedCategory,
}) => {
  // 6 Core Categories with pure white background studio product packshots
  const categoryConfig: CircularCategoryItem[] = [
    {
      id: 'cat-1',
      name: 'Rice & Grains',
      slug: 'rice-and-rice-products',
      defaultImage: '/categories/round-rice.jpg',
      itemCount: 28,
    },
    {
      id: 'cat-3',
      name: 'Curry Powders',
      slug: 'masala-and-curry-powders',
      defaultImage: '/categories/round-masala.jpg',
      itemCount: 45,
    },
    {
      id: 'cat-6',
      name: 'Chips & Snacks',
      slug: 'crisps-and-snacks',
      defaultImage: '/categories/round-snacks.jpg',
      itemCount: 38,
    },
    {
      id: 'cat-7',
      name: 'Oils & Ghee',
      slug: 'oils-and-ghee',
      defaultImage: '/categories/round-oils.jpg',
      itemCount: 16,
    },
    {
      id: 'cat-8',
      name: 'Kerala Spices',
      slug: 'spices-and-whole-condiments',
      defaultImage: '/categories/round-spices.jpg',
      itemCount: 34,
    },
    {
      id: 'cat-4',
      name: 'Breakfast Podis',
      slug: 'breakfast-powders',
      defaultImage: '/categories/round-breakfast.jpg',
      itemCount: 30,
    },
  ];

  // Store for admin-customized images: { [slug]: string }
  const [customImages, setCustomImages] = useState<{ [slug: string]: string }>({});
  // Track images that failed to load so we switch to guaranteed fallbacks
  const [failedImages, setFailedImages] = useState<{ [slug: string]: boolean }>({});

  // Sync custom category images from localStorage
  const loadCustomImages = () => {
    try {
      const saved = localStorage.getItem('kss_category_images');
      if (saved) {
        setCustomImages(JSON.parse(saved));
      }
    } catch {
      // Ignore parse errors
    }
  };

  useEffect(() => {
    loadCustomImages();

    // Listen for cross-tab or in-page admin updates
    const handleStorageUpdate = (e: StorageEvent) => {
      if (e.key === 'kss_category_images') {
        loadCustomImages();
      }
    };

    const handleCustomUpdate = () => {
      loadCustomImages();
    };

    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('kss_category_images_updated', handleCustomUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('kss_category_images_updated', handleCustomUpdate);
    };
  }, []);

  const handleImageError = (slug: string) => {
    setFailedImages((prev) => ({ ...prev, [slug]: true }));
  };

  return (
    <section className="max-w-7xl mx-auto px-4 py-8 sm:py-10">
      {/* Header with script accent */}
      <div className="text-center space-y-1 mb-8">
        <span className="text-sm font-serif italic text-[#5ea813] font-bold tracking-wide">
          Our Specialities
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Featured Categories
        </h2>
      </div>

      {/* Circular (Round) Cards Grid with Pure White Backgrounds */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 sm:gap-6">
        {categoryConfig.map((item, index) => {
          const isSelected = selectedCategory === item.slug;
          
          // Determine active image: admin uploaded custom image -> fallback default
          const hasCustom = Boolean(customImages[item.slug]);
          const isFailed = Boolean(failedImages[item.slug]);
          
          let activeImageUrl = item.defaultImage;
          if (hasCustom && !isFailed) {
            activeImageUrl = customImages[item.slug];
          } else if (isFailed) {
            activeImageUrl = item.defaultImage;
          }

          const isExternal = activeImageUrl.startsWith('http') || activeImageUrl.startsWith('data:');

          return (
            <div
              key={item.id}
              onClick={() => onSelectCategory(isSelected ? null : item.slug)}
              className="group cursor-pointer flex flex-col items-center text-center transition-all"
            >
              {/* Perfect Round Circle Card with Pure White Background */}
              <div 
                className={`w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full bg-white border-2 relative overflow-hidden transition-all duration-300 shadow-xs group-hover:shadow-xl group-hover:-translate-y-1.5 flex items-center justify-center p-2.5 sm:p-3.5 ${
                  isSelected 
                    ? 'border-[#5ea813] ring-4 ring-[#5ea813]/25 scale-105' 
                    : 'border-slate-200/90 hover:border-[#5ea813]'
                }`}
              >
                {/* Item with clean pure white background */}
                <div className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-white">
                  <Image
                    src={activeImageUrl}
                    alt={item.name}
                    fill
                    className="object-contain p-1 group-hover:scale-110 transition-transform duration-300 ease-out"
                    sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 16vw"
                    onError={() => handleImageError(item.slug)}
                    unoptimized={isExternal}
                    priority={index < 4}
                  />
                </div>

                {/* Selected badge overlay */}
                {isSelected && (
                  <div className="absolute inset-0 bg-[#5ea813]/15 rounded-full flex items-center justify-center pointer-events-none">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#5ea813] animate-ping" />
                  </div>
                )}
              </div>

              {/* Category Name Below the Circle */}
              <div className="mt-3 space-y-0.5 max-w-[110px] sm:max-w-none">
                <span className={`text-xs sm:text-sm font-black transition-colors block leading-tight ${
                  isSelected ? 'text-[#5ea813]' : 'text-slate-800 group-hover:text-[#5ea813]'
                }`}>
                  {item.name}
                </span>
                <span className="text-[10px] text-slate-400 font-bold block">
                  {item.itemCount} Items
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

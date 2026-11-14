import React, { useState } from 'react';
import type { Product } from '../types/catalog';
import { Plus, Minus, Info, Zap } from 'lucide-react';
import { generatePackshotSvgClient } from '../utils/packshotFallback';

interface ProductCardProps {
  product: Product;
  quantity: number;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onSelectProduct: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  quantity,
  onAddToCart,
  onUpdateQuantity,
  onSelectProduct,
}) => {
  const [imgSrc, setImgSrc] = useState<string>(
    product.images.front_hd || product.images.front_thumb || ''
  );
  const [hasError, setHasError] = useState(false);

  const isVeg = product.dietary_type?.toUpperCase() === 'VEG';

  // Nutri-Score badge coloring
  const getNutriScoreColor = (score: string) => {
    switch (score?.toUpperCase()) {
      case 'A': return 'bg-emerald-600 text-white';
      case 'B': return 'bg-lime-600 text-white';
      case 'C': return 'bg-amber-500 text-white';
      case 'D': return 'bg-orange-500 text-white';
      case 'E': return 'bg-rose-600 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  const handleImageError = () => {
    if (!hasError) {
      setHasError(true);
      const fallbackSvg = generatePackshotSvgClient(
        product.brand,
        product.product_name,
        product.packaging_size,
        product.category_id,
        product.dietary_type
      );
      setImgSrc(fallbackSvg);
    }
  };

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-300 p-3 flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:shadow-slate-200/60 relative">
      {/* Top Badges Strip */}
      <div className="flex items-center justify-between mb-2">
        {/* FSSAI Veg / Non-Veg Dot Emblem */}
        <div className="flex items-center gap-1.5">
          <div
            className={`w-4 h-4 border-2 rounded-xs flex items-center justify-center p-0.5 ${
              isVeg ? 'border-emerald-600' : 'border-rose-600'
            }`}
            title={isVeg ? 'FSSAI Certified 100% Vegetarian' : 'Non-Vegetarian'}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                isVeg ? 'bg-emerald-600' : 'bg-rose-600'
              }`}
            />
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {isVeg ? 'Veg' : 'Non-Veg'}
          </span>
        </div>

        {/* Nutri-Score & NOVA Badges */}
        <div className="flex items-center gap-1">
          {product.nutrition_info?.nutri_score && (
            <span
              className={`text-[10px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tight ${getNutriScoreColor(
                product.nutrition_info.nutri_score
              )}`}
              title={`Nutri-Score Grade: ${product.nutrition_info.nutri_score.toUpperCase()}`}
            >
              Grade {product.nutrition_info.nutri_score.toUpperCase()}
            </span>
          )}
          {product.nutrition_info?.nova_group && (
            <span
              className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1 py-0.5 rounded-md"
              title={`NOVA Processing Group: ${product.nutrition_info.nova_group}`}
            >
              N{product.nutrition_info.nova_group}
            </span>
          )}
        </div>
      </div>

      {/* Product Image Frame */}
      <div
        onClick={() => onSelectProduct(product)}
        className="relative w-full aspect-square bg-slate-50/80 rounded-xl overflow-hidden cursor-pointer flex items-center justify-center p-2 mb-3 group-hover:bg-slate-100/60 transition-colors"
      >
        <img
          src={imgSrc}
          alt={product.product_name}
          onError={handleImageError}
          loading="lazy"
          className="max-h-full max-w-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
        />

        {/* 8-10 Mins Delivery Tag */}
        <div className="absolute bottom-2 left-2 bg-slate-900/85 backdrop-blur-xs text-white text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-0.5">
          <Zap className="w-3 h-3 text-[#f8cb46] fill-[#f8cb46]" />
          <span>{product.delivery_time_mins || 8} MINS</span>
        </div>

        {/* Quick View Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelectProduct(product);
          }}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 shadow-xs text-slate-500 hover:text-slate-900 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
          title="View FSSAI Nutritional Facts"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Details */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Brand */}
          <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">
            {product.brand}
          </span>

          {/* Product Name */}
          <h3
            onClick={() => onSelectProduct(product)}
            className="text-xs font-bold text-slate-900 leading-snug line-clamp-2 mt-0.5 hover:text-[#0c831f] cursor-pointer"
            title={product.product_name}
          >
            {product.product_name}
          </h3>

          {/* Packaging Size */}
          <span className="text-[11px] font-semibold text-slate-500 mt-1 block">
            {product.packaging_size}
          </span>
        </div>

        {/* Pricing & Add Button */}
        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-black text-slate-900">
                ₹{product.price}
              </span>
              {product.mrp > product.price && (
                <span className="text-[11px] text-slate-400 line-through">
                  ₹{product.mrp}
                </span>
              )}
            </div>
            {product.discount_percent > 0 && (
              <span className="text-[10px] font-black text-emerald-600">
                {product.discount_percent}% OFF
              </span>
            )}
          </div>

          {/* ADD / Quantity Stepper Button */}
          {quantity === 0 ? (
            <button
              onClick={() => onAddToCart(product)}
              className="bg-emerald-50 hover:bg-emerald-100 text-[#0c831f] border border-emerald-600/40 hover:border-emerald-600 px-3 py-1.5 rounded-xl text-xs font-black tracking-tight flex items-center gap-1 transition-all active:scale-95 shadow-2xs"
            >
              <span>ADD</span>
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          ) : (
            <div className="flex items-center bg-[#0c831f] text-white rounded-xl overflow-hidden shadow-xs">
              <button
                onClick={() => onUpdateQuantity(product.product_id, quantity - 1)}
                className="px-2 py-1.5 hover:bg-[#086616] transition-colors"
                title="Decrease"
              >
                <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
              <span className="px-2 text-xs font-black select-none">
                {quantity}
              </span>
              <button
                onClick={() => onUpdateQuantity(product.product_id, quantity + 1)}
                className="px-2 py-1.5 hover:bg-[#086616] transition-colors"
                title="Increase"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

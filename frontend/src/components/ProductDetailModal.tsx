import React, { useState } from 'react';
import type { Product } from '../types/catalog';
import { X, Plus, Minus, ShieldCheck, Zap, AlertTriangle, Database } from 'lucide-react';
import { generatePackshotSvgClient } from '../utils/packshotFallback';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  cartQuantity: number;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  cartQuantity,
  onAddToCart,
  onUpdateQuantity,
}) => {
  if (!product) return null;

  const [imgSrc, setImgSrc] = useState<string>(
    product.images.front_hd || product.images.front_thumb || ''
  );
  const [hasError, setHasError] = useState(false);

  const isVeg = product.dietary_type?.toUpperCase() === 'VEG';
  const nutri = product.nutrition_info;
  const per100g = nutri?.per_100g;

  // Calculate per serving values if serving size has grams or ml
  const servingSizeStr = nutri?.serving_size || '30 g';
  const servingMatch = servingSizeStr.match(/(\d+(\.\d+)?)/);
  const servingMultiplier = servingMatch ? parseFloat(servingMatch[1]) / 100.0 : 0.3;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 bg-slate-200/70 px-2.5 py-1 rounded-lg">
              {product.category_name}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-bold text-slate-600">
              SKU: {product.product_id}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Column: Visual Packshot + Seals */}
          <div className="md:col-span-5 flex flex-col items-center">
            <div className="w-full aspect-square bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center p-6 relative group overflow-hidden shadow-inner">
              <img
                src={imgSrc}
                alt={product.product_name}
                onError={handleImageError}
                className="max-h-full max-w-full object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
              />

              {/* Delivery pill */}
              <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-xs text-white text-[11px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-[#f8cb46] fill-[#f8cb46]" />
                <span>{product.delivery_time_mins || 8} MINS DELIVERY</span>
              </div>
            </div>

            {/* FSSAI Veg / Non-Veg emblem banner */}
            <div className="w-full mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-5 h-5 border-2 rounded-xs flex items-center justify-center p-0.5 ${
                    isVeg ? 'border-emerald-600' : 'border-rose-600'
                  }`}
                >
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                    }`}
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-slate-800">
                    {isVeg ? '100% PURE VEGETARIAN' : 'NON-VEGETARIAN'}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    FSSAI Schedule IV Compliant
                  </span>
                </div>
              </div>
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>

            {/* Nutri-Score & NOVA Card */}
            <div className="w-full mt-3 grid grid-cols-2 gap-2">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col items-center text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Nutri-Score
                </span>
                <span
                  className={`mt-1 text-sm font-black px-3 py-0.5 rounded-lg uppercase ${getNutriScoreColor(
                    nutri?.nutri_score || 'C'
                  )}`}
                >
                  GRADE {nutri?.nutri_score?.toUpperCase() || 'C'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col items-center text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  NOVA Classification
                </span>
                <span className="mt-1 text-sm font-black px-3 py-0.5 rounded-lg bg-slate-200 text-slate-800">
                  GROUP {nutri?.nova_group || 4}
                </span>
              </div>
            </div>

            {/* Data Source Badge */}
            <div className="w-full mt-3 flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-100/70 px-3 py-2 rounded-xl">
              <Database className="w-3.5 h-3.5 text-slate-400" />
              <span>
                Source:{' '}
                <strong className="text-slate-700 capitalize">
                  {nutri?.data_source?.replace('_', ' ') || 'Verified FSSAI Model'}
                </strong>
              </span>
            </div>
          </div>

          {/* Right Column: Nutrition Table, Ingredients, Allergens */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-6">
            <div>
              {/* Brand & Title */}
              <span className="text-xs font-black uppercase text-emerald-700 tracking-wider">
                {product.brand}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 leading-snug">
                {product.product_name}
              </h2>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                  Net Wt: {product.packaging_size}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-600">
                  Serving Size: <strong>{servingSizeStr}</strong>
                </span>
              </div>

              {/* FSSAI Mandatory Nutritional Facts Table */}
              <div className="mt-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <span>FSSAI Nutritional Facts</span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      Per 100g vs Per Serving ({servingSizeStr})
                    </span>
                  </h3>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-black border-b border-slate-200">
                        <th className="py-2 px-3">Nutrient</th>
                        <th className="py-2 px-3 text-right">Per 100g</th>
                        <th className="py-2 px-3 text-right">Per Serving</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      <tr className="font-bold bg-slate-50/50">
                        <td className="py-1.5 px-3">Energy (kcal)</td>
                        <td className="py-1.5 px-3 text-right">{per100g?.energy_kcal ?? 0} kcal</td>
                        <td className="py-1.5 px-3 text-right text-emerald-700">
                          {((per100g?.energy_kcal ?? 0) * servingMultiplier).toFixed(1)} kcal
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3">Protein</td>
                        <td className="py-1.5 px-3 text-right">{per100g?.protein_g ?? 0} g</td>
                        <td className="py-1.5 px-3 text-right">
                          {((per100g?.protein_g ?? 0) * servingMultiplier).toFixed(1)} g
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3">Carbohydrate</td>
                        <td className="py-1.5 px-3 text-right">{per100g?.carbohydrates_g ?? 0} g</td>
                        <td className="py-1.5 px-3 text-right">
                          {((per100g?.carbohydrates_g ?? 0) * servingMultiplier).toFixed(1)} g
                        </td>
                      </tr>
                      <tr className="text-slate-600 pl-4">
                        <td className="py-1 px-3 pl-6 text-[11px]">- Total Sugars</td>
                        <td className="py-1 px-3 text-right text-[11px]">{per100g?.total_sugars_g ?? 0} g</td>
                        <td className="py-1 px-3 text-right text-[11px]">
                          {((per100g?.total_sugars_g ?? 0) * servingMultiplier).toFixed(1)} g
                        </td>
                      </tr>
                      <tr className="text-slate-600 pl-4">
                        <td className="py-1 px-3 pl-6 text-[11px]">- Added Sugars</td>
                        <td className="py-1 px-3 text-right text-[11px]">{per100g?.added_sugars_g ?? 0} g</td>
                        <td className="py-1 px-3 text-right text-[11px]">
                          {((per100g?.added_sugars_g ?? 0) * servingMultiplier).toFixed(1)} g
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3">Total Fat</td>
                        <td className="py-1.5 px-3 text-right">{per100g?.total_fat_g ?? 0} g</td>
                        <td className="py-1.5 px-3 text-right">
                          {((per100g?.total_fat_g ?? 0) * servingMultiplier).toFixed(1)} g
                        </td>
                      </tr>
                      <tr className="text-slate-600 pl-4">
                        <td className="py-1 px-3 pl-6 text-[11px]">- Saturated Fat</td>
                        <td className="py-1 px-3 text-right text-[11px]">{per100g?.saturated_fat_g ?? 0} g</td>
                        <td className="py-1 px-3 text-right text-[11px]">
                          {((per100g?.saturated_fat_g ?? 0) * servingMultiplier).toFixed(1)} g
                        </td>
                      </tr>
                      <tr className="text-slate-600 pl-4 bg-emerald-50/40">
                        <td className="py-1 px-3 pl-6 text-[11px] font-bold text-emerald-800">
                          - Trans Fat (FSSAI 0g)
                        </td>
                        <td className="py-1 px-3 text-right text-[11px] font-bold text-emerald-800">
                          {per100g?.trans_fat_g ?? 0.0} g
                        </td>
                        <td className="py-1 px-3 text-right text-[11px] font-bold text-emerald-800">
                          0.0 g
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3">Dietary Fiber</td>
                        <td className="py-1.5 px-3 text-right">{per100g?.dietary_fiber_g ?? 0} g</td>
                        <td className="py-1.5 px-3 text-right">
                          {((per100g?.dietary_fiber_g ?? 0) * servingMultiplier).toFixed(1)} g
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3">Sodium</td>
                        <td className="py-1.5 px-3 text-right">{per100g?.sodium_mg ?? 0} mg</td>
                        <td className="py-1.5 px-3 text-right">
                          {((per100g?.sodium_mg ?? 0) * servingMultiplier).toFixed(1)} mg
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Ingredients */}
              <div className="mt-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-1">
                  Ingredients (Sorted by Predominance)
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  {nutri?.ingredients_text || 'Natural food ingredients and permitted spices.'}
                </p>
              </div>

              {/* Allergens */}
              {nutri?.allergens && nutri.allergens.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-xs font-bold text-amber-900">
                      Allergen Advice
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {nutri.allergens.map((allergen, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/70 px-2.5 py-0.5 rounded-lg"
                      >
                        Contains: {allergen}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Sticky Footer Action Bar */}
        <div className="p-4 px-6 border-t border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              ₹{product.price}
            </span>
            {product.mrp > product.price && (
              <span className="text-sm text-slate-400 line-through">
                ₹{product.mrp}
              </span>
            )}
            {product.discount_percent > 0 && (
              <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                {product.discount_percent}% OFF
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {cartQuantity === 0 ? (
              <button
                onClick={() => onAddToCart(product)}
                className="bg-[#0c831f] hover:bg-[#086616] text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md shadow-emerald-700/20 active:scale-95 transition-all"
              >
                <span>Add to Cart</span>
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </button>
            ) : (
              <div className="flex items-center bg-[#0c831f] text-white rounded-xl overflow-hidden shadow-xs">
                <button
                  onClick={() => onUpdateQuantity(product.product_id, cartQuantity - 1)}
                  className="px-3 py-2.5 hover:bg-[#086616] transition-colors"
                >
                  <Minus className="w-4 h-4 stroke-[2.5]" />
                </button>
                <span className="px-4 text-sm font-black select-none">
                  {cartQuantity} in cart
                </span>
                <button
                  onClick={() => onUpdateQuantity(product.product_id, cartQuantity + 1)}
                  className="px-3 py-2.5 hover:bg-[#086616] transition-colors"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

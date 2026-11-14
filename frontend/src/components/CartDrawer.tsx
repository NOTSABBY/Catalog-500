import React from 'react';
import type { CartItem } from '../types/catalog';
import { X, Plus, Minus, ShoppingBag, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onClearCart: () => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onCheckout,
}) => {
  if (!isOpen) return null;

  const itemTotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const mrpTotal = cartItems.reduce((acc, item) => acc + (item.product.mrp || item.product.price) * item.quantity, 0);
  const totalSavings = Math.max(0, mrpTotal - itemTotal);

  const FREE_DELIVERY_THRESHOLD = 199;
  const isFreeDelivery = itemTotal >= FREE_DELIVERY_THRESHOLD;
  const deliveryFee = itemTotal === 0 ? 0 : isFreeDelivery ? 0 : 25;
  const handlingFee = itemTotal === 0 ? 0 : 4;
  const grandTotal = itemTotal + deliveryFee + handlingFee;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cart Drawer Header */}
        <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#0c831f]" />
            <h2 className="text-base font-black text-slate-900">
              My Cart ({cartItems.reduce((sum, i) => sum + i.quantity, 0)})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Delivery Meter */}
        {itemTotal > 0 && (
          <div className="px-6 py-3 bg-amber-50/70 border-b border-amber-100/80">
            {isFreeDelivery ? (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>🎉 Yay! You've unlocked <strong>FREE Delivery</strong> on this order!</span>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-amber-900 mb-1">
                  <span>Add ₹{FREE_DELIVERY_THRESHOLD - itemTotal} more for FREE Delivery</span>
                  <span>₹{itemTotal} / ₹{FREE_DELIVERY_THRESHOLD}</span>
                </div>
                <div className="w-full h-1.5 bg-amber-200/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (itemTotal / FREE_DELIVERY_THRESHOLD) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cart Items List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-3xl">
                🛒
              </div>
              <h3 className="text-base font-black text-slate-700">Your cart is empty</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Browse our 500 authentic Indian packaged foods catalog and add your favorites to get 8-minute delivery!
              </p>
              <button
                onClick={onClose}
                className="mt-6 bg-[#0c831f] text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-[#086616] transition-colors"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            cartItems.map((item) => {
              const p = item.product;
              return (
                <div
                  key={p.product_id}
                  className="flex items-center gap-3.5 p-3 rounded-2xl border border-slate-100 hover:border-slate-200 bg-white transition-all shadow-2xs"
                >
                  <div className="w-16 h-16 rounded-xl bg-slate-50 p-1 flex items-center justify-center shrink-0 border border-slate-100">
                    <img
                      src={p.images.front_thumb || p.images.front_hd}
                      alt={p.product_name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-black uppercase text-slate-400 block truncate">
                      {p.brand}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {p.product_name}
                    </h4>
                    <span className="text-[11px] text-slate-500 block">
                      {p.packaging_size}
                    </span>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-xs font-black text-slate-900">
                        ₹{p.price}
                      </span>
                      {p.mrp > p.price && (
                        <span className="text-[10px] text-slate-400 line-through">
                          ₹{p.mrp}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center bg-[#0c831f] text-white rounded-xl overflow-hidden shadow-2xs shrink-0">
                    <button
                      onClick={() => onUpdateQuantity(p.product_id, item.quantity - 1)}
                      className="p-1.5 hover:bg-[#086616] transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                    <span className="px-2 text-xs font-black select-none">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(p.product_id, item.quantity + 1)}
                      className="p-1.5 hover:bg-[#086616] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bill Details & Checkout */}
        {cartItems.length > 0 && (
          <div className="p-4 px-6 border-t border-slate-200 bg-white space-y-3">
            {/* Bill Summary */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Item Total</span>
                <span className="font-bold text-slate-800">₹{itemTotal}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="flex items-center gap-1">
                  Delivery Partner Fee
                  {isFreeDelivery && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded-sm">
                      FREE
                    </span>
                  )}
                </span>
                <span>
                  {isFreeDelivery ? (
                    <span className="text-emerald-700 font-bold">
                      <span className="line-through text-slate-400 mr-1">₹25</span>
                      FREE
                    </span>
                  ) : (
                    <span className="font-bold text-slate-800">₹25</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Handling & Packing Fee</span>
                <span className="font-bold text-slate-800">₹{handlingFee}</span>
              </div>

              {totalSavings > 0 && (
                <div className="pt-2 border-t border-slate-200/80 flex justify-between text-emerald-700 font-bold">
                  <span>Total Savings</span>
                  <span>-₹{totalSavings}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline font-black text-sm text-slate-900">
                <span>To Pay</span>
                <span className="text-base text-emerald-800">₹{grandTotal}</span>
              </div>
            </div>

            {/* Delivery address strip */}
            <div className="flex items-center gap-2 text-slate-600 text-[11px] font-medium bg-slate-100/60 p-2 rounded-xl">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
              <span>Delivering in <strong>8-10 mins</strong> to Connaught Place</span>
            </div>

            {/* Checkout Button */}
            <button
              onClick={onCheckout}
              className="w-full bg-[#0c831f] hover:bg-[#086616] text-white py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-between shadow-lg shadow-emerald-700/25 active:scale-98 transition-all"
            >
              <div className="flex flex-col text-left leading-tight">
                <span className="text-xs text-emerald-100 font-semibold">₹{grandTotal} TOTAL</span>
                <span className="text-sm font-black">Proceed to Pay</span>
              </div>
              <div className="flex items-center gap-1 font-black">
                <span>Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

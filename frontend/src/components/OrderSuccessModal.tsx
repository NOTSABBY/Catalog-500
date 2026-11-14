import React from 'react';
import { CheckCircle2, Zap, ArrowRight } from 'lucide-react';

interface OrderSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderTotal: number;
  itemCount: number;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  isOpen,
  onClose,
  orderTotal,
  itemCount,
}) => {
  if (!isOpen) return null;

  const orderId = `BLK-${Math.floor(100000 + Math.random() * 900000)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 text-center border border-slate-200 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 animate-bounce">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
          Order Confirmed • #{orderId}
        </span>
        <h2 className="text-2xl font-black text-slate-900 mt-1">
          Order Placed Successfully!
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Your authentic packaged food items are packed and our delivery partner is on the way!
        </p>

        {/* 8-Minute Delivery Animation Card */}
        <div className="mt-5 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#f8cb46] fill-[#f8cb46]" />
              Superfast Delivery
            </span>
            <span className="text-xs font-black text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
              Arriving in 8 MINS
            </span>
          </div>
          <div className="w-full bg-amber-200/50 h-2 rounded-full overflow-hidden">
            <div className="bg-[#0c831f] h-full w-2/3 rounded-full animate-pulse" />
          </div>
          <p className="text-[11px] text-slate-600 mt-2">
            Delivering <strong>{itemCount} items</strong> (₹{orderTotal}) to Connaught Place, New Delhi.
          </p>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full bg-[#0c831f] hover:bg-[#086616] text-white py-3 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-700/20"
        >
          <span>Continue Shopping</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

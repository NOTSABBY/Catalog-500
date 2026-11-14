import React from 'react';
import { Search, ShoppingBag, MapPin, X, Sparkles } from 'lucide-react';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  dietaryFilter: 'ALL' | 'VEG' | 'NON_VEG';
  onDietaryFilterChange: (filter: 'ALL' | 'VEG' | 'NON_VEG') => void;
  totalCartItems: number;
  cartTotal: number;
  onOpenCart: () => void;
  onOpenMobileCategories: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  dietaryFilter,
  onDietaryFilterChange,
  totalCartItems,
  cartTotal,
  onOpenCart,
  onOpenMobileCategories,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Banner / Delivery Strip */}
      <div className="bg-[#1f1f1f] text-white text-xs px-4 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full px-2">
          <span className="flex items-center gap-1 font-semibold text-[#f8cb46]">
            <Sparkles className="w-3.5 h-3.5" />
            Blinkit Authentic Catalog 500
          </span>
          <span className="hidden md:inline text-slate-400">|</span>
          <span className="hidden md:inline text-slate-300">
            FSSAI Enriched & Verified • 25 Categories • 500 Verified Packaged Food SKUs
          </span>
          <span className="ml-auto text-emerald-400 font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Delivery in 8-10 mins
          </span>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4 lg:gap-8">
        {/* Logo & Delivery Location */}
        <div className="flex items-center gap-5">
          <div className="cursor-pointer select-none" onClick={() => onSearchChange('')}>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black tracking-tight text-[#0c831f]">blink</span>
              <span className="text-3xl font-black tracking-tight text-[#f8cb46]">it</span>
            </div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 -mt-1">Virtual Catalog</p>
          </div>

          {/* Delivery Location Widget */}
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-black text-slate-900 tracking-tight flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#0c831f]" />
              Delivery in 8 minutes
            </span>
            <span className="text-xs text-slate-500 truncate max-w-[140px] md:max-w-[180px]">
              Connaught Place, New Delhi
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 relative max-w-2xl">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search 'Parle-G', 'Maggi', 'Atta', 'Biscuits', 'MTR', 'Amul'..."
              className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0c831f] focus:bg-white transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Dietary Filter Buttons (Veg/Non-Veg) */}
        <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => onDietaryFilterChange('ALL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              dietaryFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => onDietaryFilterChange('VEG')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
              dietaryFilter === 'VEG'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <span className="w-2.5 h-2.5 border border-white rounded-xs flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
            </span>
            Pure Veg
          </button>
          <button
            onClick={() => onDietaryFilterChange('NON_VEG')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
              dietaryFilter === 'NON_VEG'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            <span className="w-2.5 h-2.5 border border-white rounded-xs flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
            </span>
            Non-Veg
          </button>
        </div>

        {/* Mobile Categories Trigger */}
        <button
          onClick={onOpenMobileCategories}
          className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold flex items-center gap-1"
        >
          Categories
        </button>

        {/* Cart Button */}
        <button
          onClick={onOpenCart}
          className="relative flex items-center gap-3 bg-[#0c831f] hover:bg-[#086616] text-white px-4 py-2.5 rounded-xl font-bold transition-transform active:scale-95 shadow-md shadow-emerald-700/20"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {totalCartItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#f8cb46] text-slate-900 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {totalCartItems}
              </span>
            )}
          </div>
          <div className="hidden sm:flex flex-col text-left leading-tight">
            <span className="text-[11px] text-emerald-100 font-semibold">
              {totalCartItems === 0 ? 'My Cart' : `${totalCartItems} items`}
            </span>
            <span className="text-xs font-black">
              ₹{cartTotal}
            </span>
          </div>
        </button>
      </div>
    </header>
  );
};

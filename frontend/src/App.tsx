import { useState, useEffect, useMemo } from 'react';
import type { CatalogData, Product, CartItem } from './types/catalog';
import { Navbar } from './components/Navbar';
import { CategorySidebar } from './components/CategorySidebar';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import {
  Sparkles,
  ArrowUpDown,
  RefreshCw,
  ShoppingBag,
  ShieldCheck,
} from 'lucide-react';

const CATEGORY_ICONS: Record<number, string> = {
  1: '🍪', 2: '🥣', 3: '🍜', 4: '🍫', 5: '🧃',
  6: '🥫', 7: '🍯', 8: '🥔', 9: '☕', 10: '🌶️',
  11: '🫒', 12: '🍛', 13: '🧀', 14: '⚡', 15: '🥨',
  16: '🫙', 17: '🌾', 18: '🥜', 19: '🧁', 20: '🍲',
  21: '💪', 22: '🌾', 23: '🥤', 24: '🍮', 25: '🍦'
};

export function App() {
  const [catalog, setCatalog] = useState<CatalogData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & State
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dietaryFilter, setDietaryFilter] = useState<'ALL' | 'VEG' | 'NON_VEG'>('ALL');
  const [sortBy, setSortBy] = useState<'relevance' | 'price_asc' | 'price_desc' | 'calories_asc' | 'nutri_score'>('relevance');

  // Modals & Drawers
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isOrderSuccessOpen, setIsOrderSuccessOpen] = useState<boolean>(false);
  const [isMobileCategoryOpen, setIsMobileCategoryOpen] = useState<boolean>(false);

  // Cart state persisted to localStorage
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('blinkit_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('blinkit_cart', JSON.stringify(cart));
    } catch {
      // ignore storage error
    }
  }, [cart]);

  // Fetch enriched catalog data
  const fetchCatalog = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/data/enriched_catalog_500.json');
      if (!res.ok) {
        throw new Error(`Failed to load catalog data (HTTP ${res.status})`);
      }
      const data: CatalogData = await res.json();
      setCatalog(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading the catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  // Cart operations
  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.product_id === product.product_id);
      if (existing) {
        return prev.map((item) =>
          item.product.product_id === product.product_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    setCart((prev) => {
      if (quantity <= 0) {
        return prev.filter((item) => item.product.product_id !== productId);
      }
      return prev.map((item) =>
        item.product.product_id === productId ? { ...item, quantity } : item
      );
    });
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    setIsOrderSuccessOpen(true);
    handleClearCart();
  };

  // Cart aggregates
  const totalCartItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );
  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart]
  );

  // Cart lookup map
  const cartQuantityMap = useMemo(() => {
    const map = new Map<string, number>();
    cart.forEach((item) => map.set(item.product.product_id, item.quantity));
    return map;
  }, [cart]);

  // All products flattened
  const allProducts = useMemo(() => {
    if (!catalog) return [];
    return catalog.categories.flatMap((cat) => cat.products);
  }, [catalog]);

  // Selected Category Object
  const currentCategory = useMemo(() => {
    if (!catalog || selectedCategoryId === null) return null;
    return catalog.categories.find((c) => c.category_id === selectedCategoryId) || null;
  }, [catalog, selectedCategoryId]);

  // Filter & Sort products
  const filteredProducts = useMemo(() => {
    if (!catalog) return [];

    let list = selectedCategoryId === null
      ? allProducts
      : currentCategory?.products || [];

    // Dietary filter
    if (dietaryFilter !== 'ALL') {
      list = list.filter((p) => p.dietary_type?.toUpperCase() === dietaryFilter);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.product_name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category_name.toLowerCase().includes(q) ||
          p.packaging_size.toLowerCase().includes(q) ||
          (p.nutrition_info?.ingredients_text &&
            p.nutrition_info.ingredients_text.toLowerCase().includes(q))
      );
    }

    // Sorting
    const sorted = [...list];
    switch (sortBy) {
      case 'price_asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'calories_asc':
        sorted.sort(
          (a, b) =>
            (a.nutrition_info?.per_100g?.energy_kcal || 0) -
            (b.nutrition_info?.per_100g?.energy_kcal || 0)
        );
        break;
      case 'nutri_score':
        sorted.sort((a, b) => {
          const scoreOrder: Record<string, number> = { A: 1, B: 2, C: 3, D: 4, E: 5 };
          const sa = scoreOrder[a.nutrition_info?.nutri_score?.toUpperCase() || 'E'] || 9;
          const sb = scoreOrder[b.nutrition_info?.nutri_score?.toUpperCase() || 'E'] || 9;
          return sa - sb;
        });
        break;
      default:
        // relevance: keep original catalog index order
        break;
    }

    return sorted;
  }, [catalog, allProducts, currentCategory, selectedCategoryId, dietaryFilter, searchQuery, sortBy]);

  return (
    <div className="min-h-screen bg-[#f4f6fb] flex flex-col selection:bg-[#0c831f] selection:text-white">
      {/* Navbar */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        dietaryFilter={dietaryFilter}
        onDietaryFilterChange={setDietaryFilter}
        totalCartItems={totalCartItems}
        cartTotal={cartTotal}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenMobileCategories={() => setIsMobileCategoryOpen(true)}
      />

      {/* Quick Category Rail (Mobile & Horizontal) */}
      {catalog && (
        <div className="bg-white border-b border-slate-200 overflow-x-auto scrollbar-none py-2 px-4 shadow-2xs">
          <div className="max-w-7xl mx-auto flex items-center gap-2 min-w-max">
            <button
              onClick={() => setSelectedCategoryId(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                selectedCategoryId === null
                  ? 'bg-[#0c831f] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>All ({catalog.metadata.total_products})</span>
            </button>
            {catalog.categories.map((cat) => (
              <button
                key={cat.category_id}
                onClick={() => setSelectedCategoryId(cat.category_id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                  selectedCategoryId === cat.category_id
                    ? 'bg-[#0c831f] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{CATEGORY_ICONS[cat.category_id] || '📦'}</span>
                <span>{cat.category_name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedCategoryId === cat.category_id ? 'bg-white/20' : 'bg-slate-200 text-slate-500'
                }`}>
                  {cat.product_count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Catalog Workspace */}
      <main className="max-w-7xl mx-auto w-full px-4 py-6 flex-1 flex gap-6">
        {/* Desktop Category Sidebar */}
        {catalog && (
          <div className="hidden lg:block">
            <CategorySidebar
              categories={catalog.categories}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={setSelectedCategoryId}
              totalProductsCount={catalog.metadata.total_products}
            />
          </div>
        )}

        {/* Product Grid & Controls Area */}
        <div className="flex-1 min-w-0">
          {/* Category Hero / Title Header Banner */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 mb-6 shadow-xs relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-black uppercase text-[#0c831f] tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {selectedCategoryId === null ? 'Master Food Catalog' : 'Category Section'}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 flex items-center gap-2">
                  <span>
                    {selectedCategoryId === null
                      ? 'All Authentic Packaged Foods'
                      : currentCategory?.category_name}
                  </span>
                  <span className="text-sm font-black text-slate-500 bg-slate-100 px-3 py-0.5 rounded-full">
                    {filteredProducts.length} items
                  </span>
                </h1>
                <p className="text-xs text-slate-500 mt-1 max-w-xl">
                  {selectedCategoryId === null
                    ? 'Explore 500 lab-enriched packaged food items across 25 categories with authentic FSSAI nutrition facts and instant 8-minute delivery.'
                    : `Verified nutritional facts, ingredients, and studio packshots for ${currentCategory?.category_name}.`}
                </p>
              </div>

              {/* Sorting and Filter Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="bg-transparent focus:outline-none cursor-pointer text-xs font-bold"
                  >
                    <option value="relevance">Blinkit Featured</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="calories_asc">Calories: Low to High</option>
                    <option value="nutri_score">Nutri-Score: Best First</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Subtle background decoration */}
            <div className="absolute -bottom-10 -right-10 w-44 h-44 rounded-full bg-emerald-50/60 pointer-events-none" />
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-[#0c831f] rounded-full animate-spin mb-4" />
              <h3 className="text-base font-black text-slate-800">
                Loading Authentic Catalog...
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Synchronizing 500 packaged products with FSSAI nutritional standards
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-white rounded-3xl border border-rose-200 p-8 text-center shadow-xs">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900">
                Data Loading Notice
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                {error}
              </p>
              <button
                onClick={fetchCatalog}
                className="mt-4 bg-[#0c831f] hover:bg-[#086616] text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Loading</span>
              </button>
            </div>
          )}

          {/* Empty Search / Filter State */}
          {!loading && !error && filteredProducts.length === 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3 text-2xl">
                🔍
              </div>
              <h3 className="text-base font-black text-slate-900">
                No matching products found
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                We couldn't find any items matching "{searchQuery}". Try searching for brands like Parle, Maggi, Britannia, or MTR.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setDietaryFilter('ALL');
                  setSelectedCategoryId(null);
                }}
                className="mt-4 bg-[#0c831f] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#086616] transition-colors"
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* Products Grid */}
          {!loading && !error && filteredProducts.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.product_id}
                  product={product}
                  quantity={cartQuantityMap.get(product.product_id) || 0}
                  onAddToCart={handleAddToCart}
                  onUpdateQuantity={handleUpdateQuantity}
                  onSelectProduct={setSelectedProduct}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Floating Bottom Cart Bar (Mobile) */}
      {totalCartItems > 0 && !isCartOpen && (
        <div className="fixed bottom-4 inset-x-4 z-40 sm:hidden">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-[#0c831f] text-white p-3.5 rounded-2xl font-black text-sm flex items-center justify-between shadow-xl shadow-emerald-900/30 active:scale-98 transition-transform"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-xs">
                {totalCartItems}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[11px] text-emerald-100">Total</span>
                <span className="text-xs font-black">₹{cartTotal}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span>View Cart</span>
              <ShoppingBag className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Mobile Category Drawer */}
      {isMobileCategoryOpen && catalog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-start lg:hidden">
          <div className="w-80 max-w-full bg-white h-full p-4 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">All Categories</h3>
              <button
                onClick={() => setIsMobileCategoryOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            <div className="mt-3 space-y-1">
              <button
                onClick={() => {
                  setSelectedCategoryId(null);
                  setIsMobileCategoryOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs font-bold ${
                  selectedCategoryId === null ? 'bg-[#0c831f] text-white' : 'text-slate-700'
                }`}
              >
                <span>All Categories</span>
                <span>{catalog.metadata.total_products}</span>
              </button>
              {catalog.categories.map((cat) => (
                <button
                  key={cat.category_id}
                  onClick={() => {
                    setSelectedCategoryId(cat.category_id);
                    setIsMobileCategoryOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs font-medium ${
                    selectedCategoryId === cat.category_id
                      ? 'bg-emerald-50 text-[#0c831f] font-bold border border-emerald-200'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate pr-2">
                    {CATEGORY_ICONS[cat.category_id] || '📦'} {cat.category_name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">{cat.product_count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        cartQuantity={selectedProduct ? cartQuantityMap.get(selectedProduct.product_id) || 0 : 0}
        onAddToCart={handleAddToCart}
        onUpdateQuantity={handleUpdateQuantity}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onClearCart={handleClearCart}
        onCheckout={handleCheckout}
      />

      {/* Order Success Modal */}
      <OrderSuccessModal
        isOpen={isOrderSuccessOpen}
        onClose={() => setIsOrderSuccessOpen(false)}
        orderTotal={cartTotal}
        itemCount={totalCartItems}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex flex-col">
            <div className="flex items-center justify-center md:justify-start gap-1">
              <span className="text-xl font-black text-[#0c831f]">blink</span>
              <span className="text-xl font-black text-[#f8cb46]">it</span>
              <span className="text-xs font-black text-slate-400 ml-2">Virtual Catalog</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Driven by <code>authentic_packaged_food_catalog_500.xlsx</code> • Multi-tier Open Food Facts & FSSAI Enrichment Pipeline
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              FSSAI Compliant Labelling
            </span>
            <span>•</span>
            <span>25 Standard Categories</span>
            <span>•</span>
            <span>500 Packaged SKUs</span>
            <span>•</span>
            <span>Instant 8-Minute Simulation</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

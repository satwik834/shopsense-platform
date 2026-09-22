import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  Package, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  AlertCircle, 
  ShoppingCart, 
  Search, 
  CheckCircle2, 
  ArrowRight, 
  ShoppingBag,
  SlidersHorizontal
} from 'lucide-react';

export default function ProductsCatalog({ currentUser }) {
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [selectedVendorFilter, setSelectedVendorFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  // Customer Storefront State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [orderingId, setOrderingId] = useState(null);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  // Shopping Cart State
  const cartStorageKey = currentUser?.user_id ? `shopsense_cart_${currentUser.user_id}` : 'shopsense_cart';
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(cartStorageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(cartStorageKey, JSON.stringify(cart));
    } catch (e) {
      console.warn('Failed to save cart to localStorage:', e);
    }
  }, [cart, cartStorageKey]);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          alert(`Maximum available stock (${product.stock_quantity}) reached for this item.`);
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          category: product.category || 'General',
          sku: product.sku || `SKU-${product.id}`,
          vendor_id: product.vendor_id,
          stock_quantity: product.stock_quantity,
          quantity: 1
        }
      ];
    });
  };

  const updateCartQuantity = (productId, delta) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.stock_quantity) {
              alert(`Maximum available stock (${item.stock_quantity}) reached for this item.`);
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckoutCart = async () => {
    if (cart.length === 0) return;

    try {
      setCheckingOut(true);
      const orders = [];

      for (const item of cart) {
        const res = await api.recordTransaction({
          customer_id: currentUser.user_id,
          vendor_id: item.vendor_id,
          product_id: item.id,
          quantity: item.quantity
        });
        orders.push({
          transactionId: res.id,
          productName: item.name,
          category: item.category,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: res.unit_price || item.price,
          totalAmount: res.total_amount || (item.price * item.quantity)
        });
      }

      setConfirmedOrder({
        isCartOrder: true,
        items: orders,
        totalAmount: cartTotalAmount,
        itemCount: cartItemCount,
        transactionId: orders.map((o) => o.transactionId).join(', ')
      });

      clearCart();
      setIsCartOpen(false);
      await loadData();
    } catch (err) {
      alert(`Checkout failed: ${err.message}`);
    } finally {
      setCheckingOut(false);
    }
  };

  // Stock Edit Modal State
  const [editingProduct, setEditingProduct] = useState(null);
  const [editStock, setEditStock] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [updating, setUpdating] = useState(false);

  // Add Product Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('100');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [sku, setSku] = useState('');
  const [vendorId, setVendorId] = useState('');

  const isAdmin = currentUser?.role === 'admin';
  const isCustomer = currentUser?.role === 'customer';
  const canManageProducts = isAdmin || currentUser?.role === 'vendor';

  useEffect(() => {
    loadData();
  }, [selectedVendorFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (isAdmin) {
        const [pData, vData] = await Promise.all([
          api.getProducts(selectedVendorFilter || null),
          api.getVendors()
        ]);
        setProducts(pData);
        setVendors(vData);
      } else {
        // Vendors only fetch their own isolated products; customers fetch all available products
        const pData = await api.getProducts();
        setProducts(pData);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!name || !price) {
      setMessage({ type: 'error', text: 'Product Name and Price are required.' });
      return;
    }

    try {
      setSubmitting(true);
      setMessage(null);

      const payload = {
        vendor_id: isAdmin ? (parseInt(vendorId, 10) || currentUser.user_id) : currentUser.user_id,
        name,
        description: description || null,
        price: parseFloat(price),
        stock_quantity: parseInt(stock, 10) || 0,
        category: category || 'General',
        sku: sku || `SKU-${Date.now().toString().slice(-6)}`
      };

      await api.createProduct(payload);

      setMessage({ type: 'success', text: `Product '${name}' added to catalog!` });
      setName('');
      setPrice('');
      setStock('100');
      setDescription('');
      setSku('');
      await loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to create product.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      setUpdating(true);
      await api.updateProduct(editingProduct.id, {
        stock_quantity: parseInt(editStock, 10),
        price: parseFloat(editPrice)
      });
      setEditingProduct(null);
      await loadData();
    } catch (err) {
      alert(`Failed to update product: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm(`Are you sure you want to delete product '${productName}'?`)) return;

    try {
      await api.deleteProduct(productId);
      await loadData();
    } catch (err) {
      alert(`Failed to delete product: ${err.message}`);
    }
  };

  const handlePlaceOrder = async (product) => {
    try {
      setOrderingId(product.id);
      const res = await api.recordTransaction({
        customer_id: currentUser.user_id,
        vendor_id: product.vendor_id,
        product_id: product.id,
        quantity: 1
      });

      setConfirmedOrder({
        transactionId: res.id,
        productName: product.name,
        category: product.category || 'General',
        sku: product.sku || `SKU-${product.id}`,
        unitPrice: res.unit_price || product.price,
        totalAmount: res.total_amount || product.price,
        status: res.status || 'completed',
        date: res.transaction_date || new Date().toISOString()
      });

      await loadData();
    } catch (err) {
      alert(`Failed to place order: ${err.message}`);
    } finally {
      setOrderingId(null);
    }
  };

  const availableCategories = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = !searchQuery || 
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
            {isCustomer ? 'Marketplace Storefront' : 'Product Catalog'}
          </h1>
          <p className="text-xs font-mono text-indigo-400 mt-1 uppercase tracking-wider">
            {isAdmin ? 'ALL MARKETPLACE PRODUCTS' : (isCustomer ? 'BROWSE AVAILABLE ITEMS' : 'MY STORE CATALOG & INVENTORY')}
          </p>
        </div>

        {/* Admin Filter Dropdown */}
        {isAdmin && vendors.length > 0 && (
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold uppercase text-zinc-400 font-mono">FILTER VENDOR:</label>
            <select
              value={selectedVendorFilter}
              onChange={(e) => setSelectedVendorFilter(e.target.value)}
              className="bg-[#12141d] border border-zinc-800 focus:border-indigo-500 rounded-xl px-4 py-2 text-xs text-zinc-100 focus:outline-none font-medium"
            >
              <option value="">All Vendors</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Customer Storefront View */}
      {isCustomer ? (
        <div className="space-y-6">
          {/* Search, Filter & Cart Controls */}
          <div className="bg-[#12141d] border border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search products by name, description, or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#090a0f] border border-zinc-800 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none transition-colors"
                />
              </div>

              <div className="flex items-center gap-3 self-end md:self-center">
                <div className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                  <span>Showing</span>
                  <span className="font-bold text-indigo-400">{filteredProducts.length}</span>
                  <span>items</span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCartOpen(true)}
                  className="relative flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all active:scale-95"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Cart</span>
                  {cartItemCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full bg-white/20 text-white font-mono text-[10px] font-bold">
                      {cartItemCount}
                    </span>
                  ) : (
                    <span className="text-white/60 text-[10px] font-mono">0</span>
                  )}
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'bg-[#090a0f] border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid */}
          {loading ? (
            <div className="py-16 text-center text-xs text-zinc-500 font-mono">
              Loading marketplace inventory...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-16 text-center bg-[#12141d] border border-zinc-800/80 rounded-2xl p-8 space-y-2">
              <Package className="w-8 h-8 text-zinc-600 mx-auto" />
              <div className="text-sm font-semibold text-zinc-300">No matching products found</div>
              <p className="text-xs text-zinc-500">Try adjusting your search query or selecting a different category filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredProducts.map((p) => {
                const isOutOfStock = p.stock_quantity < 1;
                const isOrdering = orderingId === p.id;
                const inCart = cart.find((item) => item.id === p.id);

                return (
                  <div
                    key={p.id}
                    className="bg-[#12141d] border border-zinc-800/80 hover:border-indigo-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/5 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-md bg-[#090a0f] border border-zinc-800 text-zinc-300 text-[10px] font-mono uppercase tracking-wider">
                          {p.category || 'General'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            isOutOfStock
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : p.stock_quantity <= 5
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {isOutOfStock ? 'Out of stock' : `${p.stock_quantity} in stock`}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-bold text-zinc-100 text-sm tracking-tight group-hover:text-indigo-300 transition-colors line-clamp-1">
                          {p.name}
                        </h3>
                        <div className="text-[11px] font-mono text-zinc-500 mt-0.5">
                          {p.sku || `#PROD-${p.id}`}
                        </div>
                      </div>

                      <p className="text-zinc-400 text-xs line-clamp-2 leading-relaxed min-h-[2rem]">
                        {p.description || 'Verified merchant item with guaranteed authenticity.'}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-zinc-800/70 space-y-3">
                      <div>
                        <div className="text-[10px] font-mono uppercase text-zinc-500">Price</div>
                        <div className="text-base font-extrabold text-zinc-100 font-mono">
                          {p.price?.toFixed(2)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => addToCart(p)}
                          disabled={isOutOfStock}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${
                            inCart
                              ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                              : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700/60 text-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed'
                          }`}
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>{inCart ? `Cart (${inCart.quantity})` : 'Add to Cart'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handlePlaceOrder(p)}
                          disabled={isOutOfStock || isOrdering}
                          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 active:scale-95"
                        >
                          <span>{isOrdering ? '...' : 'Buy'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Cart Drawer Slide-Over */}
          {isCartOpen && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-end">
              <div className="bg-[#12141e] border-l border-zinc-800 w-full max-w-md h-full flex flex-col justify-between p-6 shadow-2xl animate-in slide-in-from-right duration-200">
                <div>
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                    <div className="flex items-center gap-2.5">
                      <ShoppingBag className="w-5 h-5 text-indigo-400" />
                      <h3 className="font-bold text-base text-zinc-100">Shopping Cart</h3>
                      <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono text-[11px]">
                        {cartItemCount} items
                      </span>
                    </div>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="text-zinc-500 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800/60 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Cart Items List */}
                  <div className="mt-5 space-y-3 overflow-y-auto max-h-[calc(100vh-270px)] pr-1">
                    {cart.length === 0 ? (
                      <div className="py-20 text-center space-y-3">
                        <ShoppingBag className="w-10 h-10 text-zinc-700 mx-auto" />
                        <div className="text-sm font-semibold text-zinc-400">Your cart is currently empty</div>
                        <p className="text-xs text-zinc-600">Select items from the marketplace to build your order.</p>
                      </div>
                    ) : (
                      cart.map((item) => (
                        <div
                          key={item.id}
                          className="bg-[#090a0f] border border-zinc-800/90 rounded-2xl p-4 flex items-center justify-between gap-3"
                        >
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="text-xs font-bold text-zinc-100 truncate">{item.name}</div>
                            <div className="text-[10px] font-mono text-zinc-500">{item.sku} &bull; {item.category}</div>
                            <div className="text-xs font-mono font-bold text-indigo-400">{item.price?.toFixed(2)} each</div>
                          </div>

                          <div className="flex items-center gap-3">
                            {/* Quantity Controls */}
                            <div className="flex items-center bg-[#12141d] border border-zinc-800 rounded-xl overflow-hidden">
                              <button
                                type="button"
                                onClick={() => updateCartQuantity(item.id, -1)}
                                className="px-2.5 py-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 text-xs font-bold transition-colors"
                              >
                                -
                              </button>
                              <span className="px-2.5 py-1 text-xs font-mono font-bold text-zinc-100">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateCartQuantity(item.id, 1)}
                                disabled={item.quantity >= item.stock_quantity}
                                className="px-2.5 py-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold transition-colors"
                              >
                                +
                              </button>
                            </div>

                            {/* Delete Item */}
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id)}
                              className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Cart Footer & Checkout */}
                {cart.length > 0 && (
                  <div className="border-t border-zinc-800 pt-4 space-y-3">
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-zinc-400">
                        <span>Items Count</span>
                        <span className="font-mono text-zinc-200">{cartItemCount} units</span>
                      </div>
                      <div className="flex justify-between text-zinc-100 font-bold border-t border-zinc-800/80 pt-2">
                        <span>Order Total</span>
                        <span className="font-mono text-indigo-400 text-base">{cartTotalAmount.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={clearCart}
                        className="px-4 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-800/60 text-zinc-400 text-xs font-semibold transition-colors"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={handleCheckoutCart}
                        disabled={checkingOut}
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                      >
                        <span>{checkingOut ? 'Processing Checkout...' : `Checkout (${cartItemCount} items)`}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order Confirmation Receipt Modal */}
          {confirmedOrder && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-[#12141e] border border-zinc-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-zinc-100">Order Confirmed</h3>
                      <p className="text-[11px] text-zinc-400 font-mono">Reference #TX-{confirmedOrder.transactionId}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setConfirmedOrder(null)}
                    className="text-zinc-500 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800/60 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-[#090a0f] border border-zinc-800/90 rounded-2xl p-4 space-y-3 max-h-60 overflow-y-auto">
                  {confirmedOrder.isCartOrder ? (
                    <div className="space-y-2.5">
                      {confirmedOrder.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs pb-2 border-b border-zinc-800/60 last:border-b-0 last:pb-0">
                          <div>
                            <div className="font-bold text-zinc-100">{item.productName}</div>
                            <div className="text-[10px] font-mono text-zinc-500">{item.sku} &bull; Qty: {item.quantity}</div>
                          </div>
                          <div className="font-mono font-bold text-zinc-200">{Number(item.totalAmount).toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold text-zinc-100">{confirmedOrder.productName}</div>
                        <div className="text-[10px] font-mono text-zinc-500">{confirmedOrder.sku} &bull; {confirmedOrder.category}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold uppercase">
                        {confirmedOrder.status}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-zinc-800/80 pt-3 space-y-1.5 text-xs">
                    <div className="flex justify-between text-zinc-400">
                      <span>Total Items</span>
                      <span className="font-mono text-zinc-200">{confirmedOrder.itemCount || 1} units</span>
                    </div>
                    <div className="flex justify-between text-zinc-100 font-bold border-t border-zinc-800/60 pt-2">
                      <span>Total Paid</span>
                      <span className="font-mono text-indigo-400 text-sm">{Number(confirmedOrder.totalAmount).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#090a0f] border border-zinc-800/80 rounded-xl p-3 text-[11px] text-zinc-400 leading-relaxed">
                  Thank you for your purchase. Your order has been placed successfully and the merchant has been notified.
                </div>

                <button
                  type="button"
                  onClick={() => setConfirmedOrder(null)}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <span>Continue Shopping</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Merchant / Admin Management View */
        <div className="space-y-8">
          {/* Add Product Form */}
          {canManageProducts && (
            <div className="bg-[#12141d] border border-zinc-800/80 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Plus className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base font-bold text-zinc-100">Add New Product</h2>
              </div>

              {message && (
                <div className={`p-3 rounded-lg text-xs font-medium mb-5 border ${
                  message.type === 'error'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                }`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleCreateProduct} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                      PRODUCT NAME *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Wireless Headphones"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#090a0f] border border-zinc-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                      PRICE *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="1499.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full bg-[#090a0f] border border-zinc-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                      STOCK QUANTITY
                    </label>
                    <input
                      type="number"
                      placeholder="100"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      className="w-full bg-[#090a0f] border border-zinc-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none transition-colors"
                    />
                  </div>

                  {isAdmin && (
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                        ASSIGN VENDOR *
                      </label>
                      <select
                        value={vendorId}
                        onChange={(e) => setVendorId(e.target.value)}
                        className="w-full bg-[#090a0f] border border-zinc-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none transition-colors"
                        required
                      >
                        <option value="">Select Vendor</option>
                        {vendors.map((v) => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                      CATEGORY
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-[#090a0f] border border-zinc-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none transition-colors"
                    >
                      <option value="Electronics">Electronics</option>
                      <option value="Apparel">Apparel</option>
                      <option value="Footwear">Footwear</option>
                      <option value="Home & Kitchen">Home & Kitchen</option>
                      <option value="Books">Books</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                      SKU (STOCK KEEPING UNIT)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. APX-WHP-01"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="w-full bg-[#090a0f] border border-zinc-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                    DESCRIPTION
                  </label>
                  <textarea
                    rows={2}
                    placeholder="High quality consumer product..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-[#090a0f] border border-zinc-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none transition-colors"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Adding Product...' : 'Add Product'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Product Catalog Table */}
          <div className="bg-[#12141d] border border-zinc-800/80 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base font-bold text-zinc-100">Products List</h2>
              </div>
              <span className="text-xs text-zinc-400 font-mono">Total Items: {products.length}</span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-zinc-500 font-mono">Loading product catalog...</div>
            ) : products.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500">No products found in this store catalog.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-[#090a0f] border-b border-zinc-800 text-[11px] font-mono uppercase text-zinc-400">
                    <tr>
                      <th className="px-4 py-3">PRODUCT</th>
                      <th className="px-4 py-3">DESCRIPTION</th>
                      <th className="px-4 py-3">CATEGORY</th>
                      <th className="px-4 py-3">PRICE</th>
                      <th className="px-4 py-3">STOCK QUANTITY</th>
                      <th className="px-4 py-3 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-4 py-4">
                          <div className="font-bold text-zinc-100 text-sm">{p.name}</div>
                          <div className="text-[11px] font-mono text-zinc-500">{p.sku || `#PROD-${p.id}`}</div>
                        </td>
                        <td className="px-4 py-4 max-w-xs">
                          <p className="text-zinc-300 text-xs line-clamp-2">{p.description || 'No description provided.'}</p>
                        </td>
                        <td className="px-4 py-4 font-mono">
                          <span className="px-2.5 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 text-[11px]">
                            {p.category || 'General'}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-mono font-bold text-zinc-100 text-sm">
                          {p.price?.toFixed(2)}
                        </td>
                        <td className="px-4 py-4 font-mono">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            p.stock_quantity > 10
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {p.stock_quantity} units
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingProduct(p);
                                setEditStock(p.stock_quantity.toString());
                                setEditPrice(p.price.toString());
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors border border-zinc-700/60"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Edit Stock</span>
                            </button>

                            <button
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-medium transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Stock Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141e] border border-zinc-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-sm text-zinc-100">Update Stock & Price</h3>
              <button onClick={() => setEditingProduct(null)} className="text-zinc-400 hover:text-zinc-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">PRODUCT</label>
                <div className="text-xs font-semibold text-zinc-200">{editingProduct.name}</div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">PRICE</label>
                <input
                  type="number"
                  step="0.01"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full bg-[#090a0f] border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 font-mono focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">STOCK QUANTITY</label>
                <input
                  type="number"
                  value={editStock}
                  onChange={(e) => setEditStock(e.target.value)}
                  className="w-full bg-[#090a0f] border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 font-mono focus:outline-none"
                  required
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow-sm transition-colors"
                >
                  {updating ? 'Saving...' : 'Save Updates'}
                </button>

                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 border border-zinc-800 text-zinc-400 text-xs rounded-xl hover:bg-zinc-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

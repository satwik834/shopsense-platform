const API_BASE = '/api/v1';

async function request(url, options = {}) {
  const fetchOptions = {
    ...options,
    credentials: 'include',
    headers: {
      ...options.headers,
    },
  };

  let res = await fetch(url, fetchOptions);

  if (res.status === 401 && !url.includes('/auth/login') && !url.includes('/auth/refresh')) {
    try {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (refreshRes.ok) {
        res = await fetch(url, fetchOptions);
      }
    } catch (e) {
      console.warn('Token refresh attempt failed:', e);
    }
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(errorData.detail || `HTTP Error ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  login: async (email, password) => {
    return request(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  },

  registerVendor: async (vendorData) => {
    return request(`${API_BASE}/auth/register-vendor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vendorData),
    });
  },

  registerCustomer: async (customerData) => {
    return request(`${API_BASE}/auth/register-customer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerData),
    });
  },

  logout: async () => {
    return request(`${API_BASE}/auth/logout`, {
      method: 'POST',
    });
  },

  getMe: async () => {
    return request(`${API_BASE}/auth/me`);
  },

  // Admin Controls
  getPendingVendors: async () => {
    return request(`${API_BASE}/admin/pending-vendors`);
  },

  approveVendor: async (vendorId) => {
    return request(`${API_BASE}/admin/vendors/${vendorId}/approve`, {
      method: 'PUT',
    });
  },

  rejectVendor: async (vendorId) => {
    return request(`${API_BASE}/admin/vendors/${vendorId}/reject`, {
      method: 'PUT',
    });
  },

  // Analytics
  getMarketplaceSummary: async () => {
    return request(`${API_BASE}/analytics/marketplace`);
  },

  getVendorAnalytics: async (vendorId) => {
    return request(`${API_BASE}/analytics/vendors/${vendorId}`);
  },

  // Vendors
  getVendors: async () => {
    return request(`${API_BASE}/vendors/`);
  },

  updateVendor: async (vendorId, data) => {
    return request(`${API_BASE}/vendors/${vendorId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  deactivateVendor: async (vendorId) => {
    return request(`${API_BASE}/vendors/${vendorId}`, {
      method: 'DELETE',
    });
  },

  // Products
  getProducts: async (vendorId = null) => {
    const url = vendorId ? `${API_BASE}/products/?vendor_id=${vendorId}` : `${API_BASE}/products/`;
    return request(url);
  },

  createProduct: async (productData) => {
    return request(`${API_BASE}/products/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
    });
  },

  updateProduct: async (productId, data) => {
    return request(`${API_BASE}/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  deleteProduct: async (productId) => {
    return request(`${API_BASE}/products/${productId}`, {
      method: 'DELETE',
    });
  },

  // Customers & Transactions
  getCustomers: async () => {
    return request(`${API_BASE}/customers/`);
  },

  getTransactions: async (vendorId = null) => {
    const url = vendorId ? `${API_BASE}/transactions/?vendor_id=${vendorId}` : `${API_BASE}/transactions/`;
    return request(url);
  },

  recordTransaction: async (txData) => {
    return request(`${API_BASE}/transactions/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(txData),
    });
  },

  // Milestone 2: Inventory Intelligence
  getInventoryLevels: async (threshold = 10) => {
    return request(`${API_BASE}/inventory/stock-levels?threshold=${threshold}`);
  },

  getLowStockAlerts: async (threshold = 10) => {
    return request(`${API_BASE}/inventory/low-stock-alerts?threshold=${threshold}`);
  },

  restockProduct: async (productId, additionalQuantity) => {
    return request(`${API_BASE}/inventory/${productId}/restock`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ additional_quantity: additionalQuantity }),
    });
  },

  getInventoryForecast: async (productId, days = 30) => {
    return request(`${API_BASE}/inventory/${productId}/forecast?days=${days}`);
  },

  // Milestone 2: Customer Analytics & Segmentation
  getCustomerSegments: async () => {
    return request(`${API_BASE}/customer-analytics/segments`);
  },

  getSegmentedCustomers: async (segment = null) => {
    const url = segment ? `${API_BASE}/customer-analytics/customers?segment=${segment}` : `${API_BASE}/customer-analytics/customers`;
    return request(url);
  },

  getCustomerProfile: async (customerId) => {
    return request(`${API_BASE}/customer-analytics/customers/${customerId}`);
  },

  // Milestone 2: Product Recommendations
  getTopSellingRecommendations: async (category = null) => {
    const url = category ? `${API_BASE}/recommendations/top-selling?category=${encodeURIComponent(category)}` : `${API_BASE}/recommendations/top-selling`;
    return request(url);
  },

  getFrequentlyBoughtTogether: async (productId) => {
    return request(`${API_BASE}/recommendations/frequently-bought-together/${productId}`);
  },

  getCustomerRecommendations: async (customerId) => {
    return request(`${API_BASE}/recommendations/customer/${customerId}`);
  },

  // Milestone 3: BI Reporting & Charts
  getSalesTrendsChart: async (days = 30) => {
    return request(`${API_BASE}/bi/charts/sales-trends?days=${days}`);
  },

  getCategoryDistributionChart: async () => {
    return request(`${API_BASE}/bi/charts/category-distribution`);
  },

  getVendorBenchmarking: async (vendorId = null) => {
    const url = vendorId ? `${API_BASE}/bi/benchmarking?vendor_id=${vendorId}` : `${API_BASE}/bi/benchmarking`;
    return request(url);
  },

  // Milestone 3: CSV Export URLs
  getSalesCsvUrl: () => `${API_BASE}/bi/export/sales-csv`,
  getInventoryCsvUrl: () => `${API_BASE}/bi/export/inventory-csv`,
  getCustomersCsvUrl: () => `${API_BASE}/bi/export/customers-csv`,

  // Milestone 3: AI & Decision Intelligence
  askAIShoppingAssistant: async (query, maxPrice = null, category = null) => {
    return request(`${API_BASE}/ai/shopping-assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, max_price: maxPrice, category }),
    });
  },

  getAIStoreAdvisorReport: async (vendorId = null) => {
    return request(`${API_BASE}/ai/store-advisor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vendor_id: vendorId }),
    });
  },

  // Milestone 4: AI Merchant Copywriter & Price Optimizer
  generateProductListing: async (rawNotes, category, targetPrice = null) => {
    return request(`${API_BASE}/ai/generate-listing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw_notes: rawNotes, category, target_price: targetPrice }),
    });
  },

  optimizeProductPrice: async (productId) => {
    return request(`${API_BASE}/ai/price-optimizer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId }),
    });
  }
};

export default api;

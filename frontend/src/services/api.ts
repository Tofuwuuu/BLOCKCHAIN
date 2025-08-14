import axios, { AxiosInstance, AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios';

// API base configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';

// Create axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies in requests
});

// Request interceptor to add auth token or session cookie
api.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // Check for auth token in localStorage
    const token = localStorage.getItem('authToken');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Ensure headers object exists
    if (!config.headers) {
      config.headers = {};
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear auth token and redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Standard API response interface
export interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
}

// Helper method to handle API responses
const handleApiResponse = <T>(response: AxiosResponse<T>): ApiResponse<T> => ({
  ok: true,
  data: response.data,
});

// Helper method to handle API errors
const handleApiError = (error: AxiosError): ApiResponse => {
  const errorMessage = (error.response?.data as any)?.message || error.message || 'An error occurred';
  return {
    ok: false,
    error: errorMessage,
  };
};

// Helper methods with standardized response format
export const httpService = {
  // GET request
  get: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    try {
      const response = await api.get<T>(url, config);
      return handleApiResponse(response);
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  // POST request
  post: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    try {
      const response = await api.post<T>(url, data, config);
      return handleApiResponse(response);
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  // PUT request
  put: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    try {
      const response = await api.put<T>(url, data, config);
      return handleApiResponse(response);
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  // DELETE request
  delete: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    try {
      const response = await api.delete<T>(url, config);
      return handleApiResponse(response);
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  // PATCH request
  patch: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    try {
      const response = await api.patch<T>(url, data, config);
      return handleApiResponse(response);
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },
};

// ===== TYPES =====

export interface User {
  id: number;
  username: string;
  full_name: string;
  position: string;
  department: string;
  is_admin: boolean;
}

export interface DashboardStats {
  pending_orders: number;
  approved_orders: number;
  low_inventory: number;
  recent_orders: RecentOrder[];
}

export interface RecentOrder {
  id: number;
  po_number: string;
  supplier: {
    name: string;
  };
  date_created: string;
  status: string;
  total_amount: number;
}

// Blockchain Types
export interface Block {
  index: number;
  timestamp: string;
  transactions: Transaction[];
  nonce: number;
  previous_hash: string;
  hash: string;
}

export interface Transaction {
  sender: string;
  recipient: string;
  amount?: number;
  action: string;
  data?: any;
  timestamp: string;
}

export interface Chain {
  chain: Block[];
  length: number;
}

export interface Peer {
  id: string;
  url: string;
  is_active: boolean;
}

// Procurement Types
export interface Supplier {
  id: number;
  name: string;
  address: string;
  province: string;
  contact_person: string;
  phone: string;
  email?: string;
  bir_tin: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  supplier: Supplier;
  delivery_address: string;
  notes?: string;
  status: 'Draft' | 'Pending' | 'Approved' | 'Completed' | 'Cancelled';
  total_amount: number;
  date_created: string;
  date_updated: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: number;
  product_id: number;
  product: Product;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  unit: string;
  unit_price: number;
  category: string;
  is_active: boolean;
}

export interface Inventory {
  id: number;
  product_id: number;
  product: Product;
  quantity: number;
  unit_price: number;
  total_value: number;
  last_updated: string;
}

export interface InventoryAdjustment {
  id: number;
  product_id: number;
  product: Product;
  adjustment: number;
  reason: string;
  adjusted_by: string;
  date_adjusted: string;
}

// Form Types
export interface CreateSupplierData {
  name: string;
  address: string;
  province: string;
  contact_person: string;
  phone: string;
  email?: string;
  bir_tin: string;
  is_active: boolean;
}

export interface CreateOrderData {
  supplier_id: number;
  delivery_address: string;
  notes?: string;
  items: {
    product_id: number;
    quantity: number;
    unit_price: number;
  }[];
}

export interface CreateTransactionData {
  sender: string;
  recipient: string;
  action: string;
  data?: any;
}

// ===== LEGACY API ENDPOINTS (for backward compatibility) =====

export const legacyApiService = {
  // ===== AUTHENTICATION =====
  login: (credentials: { username: string; password: string }) =>
    api.post('/api/auth/login', credentials).then(response => response.data),
  
  logout: () =>
    api.post('/api/auth/logout').then(response => response.data),
  
  getCurrentUser: (): Promise<User> =>
    api.get('/api/auth/me').then(response => response.data),

  // ===== DASHBOARD =====
  getDashboardStats: (): Promise<DashboardStats> => 
    api.get('/api/stats').then(response => response.data),
  
  getChain: (): Promise<DashboardStats> => 
    api.get('/chain').then(response => response.data),

  // ===== BLOCKCHAIN =====
  getBlockchain: (): Promise<Chain> =>
    api.get('/chain').then(response => response.data),

  getBlock: (index: number): Promise<Block> =>
    api.get(`/chain/block/${index}`).then(response => response.data),

  createTransaction: (data: CreateTransactionData): Promise<Transaction> =>
    api.post('/transactions/new', data).then(response => response.data),

  mineBlock: (): Promise<Block> =>
    api.get('/mine').then(response => response.data),

  // ===== PEERS =====
  getPeers: (): Promise<Peer[]> =>
    api.get('/peers').then(response => response.data),

  addPeer: (url: string): Promise<Peer> =>
    api.post('/add_peer', { url }).then(response => response.data),

  // ===== SUPPLIERS =====
  getSuppliers: (): Promise<Supplier[]> =>
    api.get('/api/suppliers').then(response => response.data),

  getSupplier: (id: number): Promise<Supplier> =>
    api.get(`/api/suppliers/${id}`).then(response => response.data),

  createSupplier: (data: CreateSupplierData): Promise<Supplier> =>
    api.post('/api/suppliers', data).then(response => response.data),

  updateSupplier: (id: number, data: Partial<CreateSupplierData>): Promise<Supplier> =>
    api.put(`/api/suppliers/${id}`, data).then(response => response.data),

  deleteSupplier: (id: number): Promise<void> =>
    api.delete(`/api/suppliers/${id}`).then(response => response.data),

  // ===== PURCHASE ORDERS =====
  getOrders: (): Promise<PurchaseOrder[]> =>
    api.get('/api/orders').then(response => response.data),

  getOrder: (id: number): Promise<PurchaseOrder> =>
    api.get(`/api/orders/${id}`).then(response => response.data),

  createOrder: (data: CreateOrderData): Promise<PurchaseOrder> =>
    api.post('/api/orders', data).then(response => response.data),

  updateOrder: (id: number, data: Partial<CreateOrderData>): Promise<PurchaseOrder> =>
    api.put(`/api/orders/${id}`, data).then(response => response.data),

  deleteOrder: (id: number): Promise<void> =>
    api.delete(`/api/orders/${id}`).then(response => response.data),

  approveOrder: (id: number): Promise<PurchaseOrder> =>
    api.post(`/api/orders/${id}/approve`).then(response => response.data),

  // ===== INVENTORY =====
  getInventory: (): Promise<Inventory[]> =>
    api.get('/api/inventory').then(response => response.data),

  getInventoryItem: (id: number): Promise<Inventory> =>
    api.get(`/api/inventory/${id}`).then(response => response.data),

  adjustInventory: (data: { product_id: number; adjustment: number; reason: string }): Promise<InventoryAdjustment> =>
    api.post('/api/inventory/adjust', data).then(response => response.data),

  // ===== PRODUCTS =====
  getProducts: (): Promise<Product[]> =>
    api.get('/api/products').then(response => response.data),

  getProduct: (id: number): Promise<Product> =>
    api.get(`/api/products/${id}`).then(response => response.data),

  createProduct: (data: Omit<Product, 'id'>): Promise<Product> =>
    api.post('/api/products', data).then(response => response.data),

  updateProduct: (id: number, data: Partial<Product>): Promise<Product> =>
    api.put(`/api/products/${id}`, data).then(response => response.data),

  deleteProduct: (id: number): Promise<void> =>
    api.delete(`/api/products/${id}`).then(response => response.data),
};

// Export both new and legacy services for backward compatibility
export { legacyApiService as apiService };
export default api;

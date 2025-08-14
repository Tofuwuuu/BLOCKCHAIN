import axios, { AxiosInstance, AxiosResponse } from 'axios';

// API base configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types for API responses
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

export interface User {
  id: number;
  username: string;
  full_name: string;
  position: string;
  department: string;
  is_admin: boolean;
}

// API endpoints
export const apiService = {
  // Dashboard
  getDashboardStats: (): Promise<DashboardStats> => 
    api.get('/api/stats').then(response => response.data),
  
  // Alternative endpoint if /api/stats doesn't exist
  getChain: (): Promise<DashboardStats> => 
    api.get('/chain').then(response => response.data),

  // Auth
  login: (credentials: { username: string; password: string }) =>
    api.post('/api/auth/login', credentials).then(response => response.data),
  
  logout: () =>
    api.post('/api/auth/logout').then(response => response.data),
  
  getCurrentUser: (): Promise<User> =>
    api.get('/api/auth/me').then(response => response.data),

  // Orders
  getOrders: () =>
    api.get('/api/orders').then(response => response.data),
  
  getOrder: (id: number) =>
    api.get(`/api/orders/${id}`).then(response => response.data),

  // Suppliers
  getSuppliers: () =>
    api.get('/api/suppliers').then(response => response.data),

  // Inventory
  getInventory: () =>
    api.get('/api/inventory').then(response => response.data),
};

export default api;

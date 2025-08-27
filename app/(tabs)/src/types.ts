// Common Types for Inventory App

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  category: string | null;
  location: string | null;
  image: string | null;
  status: 'Active' | 'Inactive';
  brand: string | null;
  sizes: string | null;
  productCode: string | null;
  orderName: string | null;
  storeAvailability: StoreAvailability[];
  lastUpdate: string;
}

export interface StoreAvailability {
  location: string;
  available: boolean;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

export interface FormData {
  name: string;
  description: string;
  price: string;
  stock: string;
  category: string;
  location: string;
  image: string;
  status: 'Active' | 'Inactive';
  brand: string;
  sizes: string;
  productCode: string;
  orderName: string;
  storeAvailability: StoreAvailability[];
}

export interface Category {
  id: string;
  name: string;
  count: number;
  icon: string;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  error?: string;
  data?: T;
  token?: string;
  user?: User;
  id?: string;
  product_id?: string;
}

export interface StatCard {
  label: string;
  value: number;
  color: string;
}

export interface NavItem {
  key: string;
  icon: string;
  label: string;
  adminOnly?: boolean;
}

export interface MenuItem {
  key: string;
  label: string;
  icon?: string;
}

export type ScreenType = 
  | 'login' 
  | 'register' 
  | 'dashboard' 
  | 'products' 
  | 'product-detail' 
  | 'categories' 
  | 'add-product' 
  | 'edit-product';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface ImagePickerResult {
  canceled: boolean;
  assets?: {
    uri: string;
    width: number;
    height: number;
    type?: string;
  }[];
}

export interface ApiConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
  signal?: AbortSignal;
}

export interface SearchResultsInfo {
  count: number;
  query: string;
}

export interface ComponentProps {
  style?: any;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
}
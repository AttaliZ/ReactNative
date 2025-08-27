import { FormData, Product, ValidationResult } from './types';

// Validation utilities
export const validateForm = (data: FormData, isEdit = false): ValidationResult => {
  if (!data.name || !data.name.trim()) {
    return { isValid: false, error: 'Name is required' };
  }
  
  if (!data.price || !data.price.trim()) {
    return { isValid: false, error: 'Price is required' };
  }
  
  const price = parseFloat(data.price);
  if (isNaN(price) || price <= 0) {
    return { isValid: false, error: 'Price must be a valid positive number' };
  }
  
  if (data.stock && data.stock.trim()) {
    const stock = parseInt(data.stock, 10);
    if (isNaN(stock) || stock < 0) {
      return { isValid: false, error: 'Stock must be a valid non-negative number' };
    }
  }
  
  return { isValid: true };
};

export const validateLoginForm = (username: string, password: string): ValidationResult => {
  if (!username.trim()) {
    return { isValid: false, error: 'Username is required' };
  }
  
  if (!password.trim()) {
    return { isValid: false, error: 'Password is required' };
  }
  
  return { isValid: true };
};

export const validateRegistrationForm = (username: string, password: string, email?: string): ValidationResult => {
  if (!username.trim()) {
    return { isValid: false, error: 'Username is required' };
  }
  
  if (!password.trim()) {
    return { isValid: false, error: 'Password is required' };
  }
  
  if (password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters' };
  }
  
  if (email && email.trim() && !isValidEmail(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  
  return { isValid: true };
};

// Utility functions
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const formatPrice = (price: number): string => {
  return `$${price.toFixed(2)}`;
};

export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const getStockColor = (stock: number): string => {
  if (stock <= 0) return '#ef4444';
  if (stock < 10) return '#f59e0b';
  return '#22c55e';
};

export const getStockText = (stock: number): string => {
  if (stock <= 0) return 'Out of stock';
  if (stock < 10) return 'Low stock';
  return `${stock} in stock`;
};

export const getStatusColor = (status: 'Active' | 'Inactive'): string => {
  return status === 'Active' ? '#22c55e' : '#ef4444';
};

export const getCategoryIcon = (category: string): string => {
  const iconMap: { [key: string]: string } = {
    bottoms: '👖',
    coats: '🧥',
    jeans: '👖',
    tops: '👕',
    shirts: '👔',
    accessories: '👜',
    shoes: '👟',
    electronics: '📱',
    home: '🏠',
    books: '📚',
    sports: '⚽',
    toys: '🧸',
    beauty: '💄',
    food: '🍎',
    clothing: '👗',
    jewelry: '💍',
    bags: '👜',
    watches: '⌚',
  };
  return iconMap[category.toLowerCase()] || '📦';
};

// Product utilities
export const filterProducts = (products: Product[], searchQuery: string): Product[] => {
  if (!searchQuery.trim()) return products;
  
  const query = searchQuery.toLowerCase();
  return products.filter(product => {
    const name = product.name || '';
    const category = product.category || '';
    const brand = product.brand || '';
    const productCode = product.productCode || '';
    const description = product.description || '';
    
    return name.toLowerCase().includes(query) ||
           category.toLowerCase().includes(query) ||
           brand.toLowerCase().includes(query) ||
           productCode.toLowerCase().includes(query) ||
           description.toLowerCase().includes(query);
  });
};

export const sortProducts = (products: Product[], sortBy: 'name' | 'price' | 'stock' | 'category' = 'name'): Product[] => {
  return [...products].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.name || '').localeCompare(b.name || '');
      case 'price':
        return (a.price || 0) - (b.price || 0);
      case 'stock':
        return (a.stock || 0) - (b.stock || 0);
      case 'category':
        return (a.category || '').localeCompare(b.category || '');
      default:
        return 0;
    }
  });
};

export const getProductStats = (products: Product[]) => {
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.status === 'Active').length;
  const lowStockProducts = products.filter(p => (p.stock || 0) < 10).length;
  const outOfStockProducts = products.filter(p => (p.stock || 0) === 0).length;
  const categories = new Set(products.map(p => p.category).filter(Boolean)).size;
  
  const totalValue = products.reduce((sum, product) => {
    return sum + ((product.price || 0) * (product.stock || 0));
  }, 0);
  
  return {
    totalProducts,
    activeProducts,
    lowStockProducts,
    outOfStockProducts,
    categories,
    totalValue,
  };
};

export const getTopCategories = (products: Product[], limit = 6) => {
  const categoryCount: { [key: string]: number } = {};
  
  products.forEach(product => {
    if (product.category) {
      categoryCount[product.category] = (categoryCount[product.category] || 0) + 1;
    }
  });
  
  return Object.entries(categoryCount)
    .map(([name, count]) => ({
      id: name,
      name,
      count,
      icon: getCategoryIcon(name),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};

// String utilities
export const truncateString = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
};

export const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};

// API utilities
export const createApiConfig = (
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any,
  authToken?: string
) => {
  const config: any = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  };
  
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  
  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }
  
  return config;
};

export const handleApiError = (error: any): string => {
  if (error.name === 'AbortError') {
    return 'Request timed out. Please check your internet connection.';
  }
  
  if (error.message?.includes('401')) {
    return 'Authentication failed. Please login again.';
  }
  
  if (error.message?.includes('403')) {
    return 'Access denied. You do not have permission to perform this action.';
  }
  
  if (error.message?.includes('404')) {
    return 'Resource not found.';
  }
  
  if (error.message?.includes('500')) {
    return 'Server error. Please try again later.';
  }
  
  return error.message || 'Network error occurred';
};

// Platform utilities
export const isWeb = (): boolean => {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined';
};

export const isMobile = (): boolean => {
  return !isWeb();
};

// Storage utilities (for future use with AsyncStorage)
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@inventory_auth_token',
  USER_DATA: '@inventory_user_data',
  LAST_SYNC: '@inventory_last_sync',
  OFFLINE_PRODUCTS: '@inventory_offline_products',
} as const;

export default {
  validateForm,
  validateLoginForm,
  validateRegistrationForm,
  isValidEmail,
  formatPrice,
  formatCurrency,
  getStockColor,
  getStockText,
  getStatusColor,
  getCategoryIcon,
  filterProducts,
  sortProducts,
  getProductStats,
  getTopCategories,
  truncateString,
  capitalizeFirst,
  formatDate,
  createApiConfig,
  handleApiError,
  isWeb,
  isMobile,
  STORAGE_KEYS,
};
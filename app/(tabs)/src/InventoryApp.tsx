import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// Import custom components
import BottomNavigation from './components/BottomNavigation';
import CategoryCard from './components/CategoryCard';
import CustomTextInput from './components/CustomTextInput';
import Header from './components/Header';
import ImageUploadComponent from './components/ImageUploadComponent';
import { EmptyState, ErrorMessage, LoadingIndicator } from './components/LoadingAndError';
import ProductCard from './components/ProductCard';
import SearchBar from './components/SearchBar';
import SideMenu from './components/SideMenu';
import StatusSelector from './components/StatusSelector';
// Types
interface Product {
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
  storeAvailability: { location: string; available: boolean }[];
  lastUpdate: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface FormData {
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
  storeAvailability: { location: string; available: boolean }[];
}

// Constants
const API_BASE_URL = 'http://nindam.sytes.net:3008/api';
const EMPTY_FORM: FormData = {
  name: '',
  description: '',
  price: '',
  stock: '',
  category: '',
  location: '',
  image: '',
  status: 'Active',
  brand: '',
  sizes: '',
  productCode: '',
  orderName: '',
  storeAvailability: [],
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loginContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 30,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  loginTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  loginButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  switchScreenButton: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchScreenText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '500',
  },
  dashboardContent: {
    flex: 1,
    padding: 20,
  },
  connectionStatus: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  connectionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  viewAllButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  viewAllText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  productsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  searchResultsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
  },
  searchResultsText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  clearSearchLink: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  productDetailContainer: {
    flex: 1,
    padding: 20,
  },
  productDetailImageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  detailImageUpload: {
    width: 200,
    height: 200,
  },
  productDetailInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  productDetailName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  productDetailBrand: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  productDetailCategory: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '700',
  },
  descriptionText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  editButton: {
    backgroundColor: '#8b5cf6',
  },
  deleteButton: {
    backgroundColor: '#dc2626',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  lastUpdateContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  lastUpdateText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#22c55e',
    marginLeft: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  categoriesContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  fallbackImage: {
    width: 200,
    height: 200,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const InventoryApp = () => {
  // State Management
  const [currentScreen, setCurrentScreen] = useState<
    'login' | 'register' | 'dashboard' | 'products' | 'product-detail' | 'categories' | 'add-product' | 'edit-product'
  >('login');
  
  // User & Auth States
 const [username, setUsername] = useState<string>('');
const [password, setPassword] = useState<string>('');
  const [email, setEmail] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  
  // Product States
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  
  // UI States
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs for TextInput focus management
  const inputRefs = useRef<{ [key: string]: TextInput | null }>({});

  // Helper Functions
  const resetForm = useCallback(() => {
    setFormData(EMPTY_FORM);
    setError(null);
  }, []);

  const showAlert = useCallback((title: string, message: string, onPress?: () => void) => {
    Alert.alert(title, message, onPress ? [{ text: 'OK', onPress }] : undefined);
  }, []);

  const validateForm = useCallback((data: FormData, isEdit = false): string | null => {
    if (!data.name || !data.name.trim()) return 'Name is required';
    if (!data.price || !data.price.trim()) return 'Price is required';
    
    const price = parseFloat(data.price);
    if (isNaN(price) || price <= 0) return 'Price must be a valid positive number';
    
    if (data.stock && data.stock.trim()) {
      const stock = parseInt(data.stock, 10);
      if (isNaN(stock) || stock < 0) return 'Stock must be a valid non-negative number';
    }
    
    return null;
  }, []);

  const focusNextInput = useCallback((nextInputKey: string) => {
    const nextInput = inputRefs.current[nextInputKey];
    if (nextInput) {
      nextInput.focus();
    }
  }, []);

  // Memoized onChangeText handlers to prevent re-renders
  const handleUsernameChange = useCallback((text: string) => {
    setUsername(text);
  }, []);

  const handlePasswordChange = useCallback((text: string) => {
    setPassword(text);
  }, []);

  const handleEmailChange = useCallback((text: string) => {
    setEmail(text);
  }, []);

  const handleFormDataChange = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // API Functions
  const apiCall = useCallback(async (endpoint: string, options: any = {}) => {
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        ...options.headers,
      },
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...config,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `HTTP error ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error('Request timed out. Please check your internet connection.');
      }
      if (err.message.includes('401')) {
        throw new Error('Authentication failed. Please login again.');
      }
      throw new Error(err.message || 'Network error occurred');
    }
  }, [authToken]);

  const testConnection = useCallback(async () => {
    try {
      await apiCall('/ping');
      return true;
    } catch {
      return false;
    }
  }, [apiCall]);

  // Authentication Functions
  const handleLogin = useCallback(async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      setError(null);

      const validationError = !username.trim() ? 'Username is required' : 
                             !password.trim() ? 'Password is required' : null;
      if (validationError) throw new Error(validationError);

      const isConnected = await testConnection();
      if (!isConnected) throw new Error('Cannot connect to server.');

      const response = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ 
          username: username.trim(), 
          password: password.trim() 
        }),
      });

      if (response.token && response.user) {
        setAuthToken(response.token);
        setUser(response.user);
        setCurrentScreen('dashboard');
        setPassword('');
        setUsername('');
        setError(null);
        showAlert('Success', 'Login successful!');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      setError(err.message);
      showAlert('Login Error', err.message);
    } finally {
      setLoading(false);
    }
  }, [username, password, loading, apiCall, testConnection, showAlert]);

  const handleRegister = useCallback(async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      setError(null);

      const validationError = !username.trim() ? 'Username is required' : 
                             !password.trim() ? 'Password is required' :
                             password.length < 6 ? 'Password must be at least 6 characters' : null;
      if (validationError) throw new Error(validationError);

      const isConnected = await testConnection();
      if (!isConnected) throw new Error('Cannot connect to server.');

      const response = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ 
          username: username.trim(), 
          password: password.trim(), 
          email: email.trim() || null 
        }),
      });

      if (response.success || response.message === 'User registered successfully') {
        showAlert('Success', 'Registration successful! Please login.');
        setCurrentScreen('login');
        setEmail('');
        setPassword('');
        setUsername('');
        setError(null);
      } else {
        throw new Error('Registration failed');
      }
    } catch (err: any) {
      setError(err.message);
      showAlert('Registration Error', err.message);
    } finally {
      setLoading(false);
    }
  }, [username, password, email, loading, apiCall, testConnection, showAlert]);

  const handleLogout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
    setProducts([]);
    setUsername('');
    setPassword('');
    setEmail('');
    setCurrentScreen('login');
    setShowSideMenu(false);
    setSelectedProduct(null);
    setError(null);
    setSearchQuery('');
    resetForm();
  }, [resetForm]);

  // Product CRUD Operations
  const fetchProducts = useCallback(async () => {
    if (!authToken) {
      setError('Please log in to view products');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await apiCall('/products');

      if (!Array.isArray(data)) {
        throw new Error('Invalid data format received');
      }

      const parsedData = data.map((product: any) => ({
        ...product,
        price: product.price ? Number(product.price) : 0,
        stock: product.stock ? Number(product.stock) : 0,
        name: product.name || 'Unnamed Product',
        storeAvailability: typeof product.storeAvailability === 'string'
          ? JSON.parse(product.storeAvailability || '[]')
          : product.storeAvailability || [],
      }));

      setProducts(parsedData);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load products';
      setError(errorMessage);
      
      if (errorMessage.includes('Authentication') || errorMessage.includes('login')) {
        showAlert('Session Expired', 'Please login again.', handleLogout);
      } else {
        showAlert('Error', `Failed to load products: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  }, [authToken, apiCall, showAlert, handleLogout]);

  const handleAddProduct = useCallback(async () => {
    if (loading) return;
    try {
      setLoading(true);
      setError(null);

      const validationError = validateForm(formData);
      if (validationError) throw new Error(validationError);

      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock, 10) || 0,
        storeAvailability: JSON.stringify(formData.storeAvailability || []),
      };

      const response = await apiCall('/products', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (response.success || response.id || response.product_id) {
        showAlert('Success', 'Product added successfully!');
        resetForm();
        setCurrentScreen('products');
        await fetchProducts();
      } else {
        throw new Error(response.message || 'Failed to add product');
      }
    } catch (err: any) {
      setError(err.message);
      showAlert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm, apiCall, showAlert, resetForm, fetchProducts, loading]);

  const handleUpdateProduct = useCallback(async () => {
    if (!selectedProduct || loading) return;
    try {
      setLoading(true);
      setError(null);

      const validationError = validateForm(formData, true);
      if (validationError) throw new Error(validationError);

      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock, 10) || 0,
        storeAvailability: JSON.stringify(formData.storeAvailability || []),
      };

      const response = await apiCall(`/products/${selectedProduct.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (response.success || response.message === 'Product updated successfully') {
        showAlert('Success', 'Product updated successfully!');
        resetForm();
        setCurrentScreen('products');
        setSelectedProduct(null);
        await fetchProducts();
      } else {
        throw new Error(response.message || 'Failed to update product');
      }
    } catch (err: any) {
      setError(err.message);
      showAlert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedProduct, formData, validateForm, apiCall, showAlert, resetForm, fetchProducts, loading]);

  const handleDeleteProduct = useCallback(async (productId: string) => {
    if (loading) return;
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              setError(null);

              const response = await apiCall(`/products/${productId}`, {
                method: 'DELETE',
              });

              if (response.success || response.message === 'Product deleted successfully') {
                showAlert('Success', 'Product deleted successfully!');
                setCurrentScreen('products');
                setSelectedProduct(null);
                await fetchProducts();
              } else {
                throw new Error(response.message || 'Failed to delete product');
              }
            } catch (err: any) {
              setError(err.message);
              showAlert('Error', err.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }, [apiCall, showAlert, fetchProducts, loading]);

  // Navigation Functions
  const navigateToScreen = useCallback((screen: string, product?: Product) => {
    setError(null);
    setSearchQuery('');
    if (product) setSelectedProduct(product);
    setCurrentScreen(screen as any);
    setShowSideMenu(false);
  }, []);

  const handleEditProduct = useCallback(() => {
    if (!selectedProduct) return;
    
    setFormData({
      name: selectedProduct.name || '',
      description: selectedProduct.description || '',
      price: selectedProduct.price?.toString() || '',
      stock: selectedProduct.stock?.toString() || '',
      category: selectedProduct.category || '',
      location: selectedProduct.location || '',
      image: selectedProduct.image || '',
      status: selectedProduct.status,
      brand: selectedProduct.brand || '',
      sizes: selectedProduct.sizes || '',
      productCode: selectedProduct.productCode || '',
      orderName: selectedProduct.orderName || '',
      storeAvailability: selectedProduct.storeAvailability || [],
    });
    setCurrentScreen('edit-product');
  }, [selectedProduct]);

  // Effects
  useEffect(() => {
    if (authToken && (currentScreen === 'products' || currentScreen === 'dashboard')) {
      fetchProducts();
    }
  }, [authToken, currentScreen, fetchProducts]);

  useEffect(() => {
    setError(null);
  }, [currentScreen]);

  // Helper function for category icons
  const getCategoryIcon = (category: string): string => {
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
    };
    return iconMap[category.toLowerCase()] || '📦';
  };

  // Custom Fallback Image Component
  const FallbackImage = () => (
    <View style={styles.fallbackImage}>
      <Text>No Image Available</Text>
    </View>
  );

  // Screen Components
  const LoginScreen = () => {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.loginContainer}>
          <StatusBar barStyle="light-content" />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.flex}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.loginContent}>
                <Text style={styles.loginTitle}>Inventor.io</Text>
                <Text style={styles.loginSubtitle}>Welcome back! Please login to your account</Text>

                <CustomTextInput
                  label="Username"
                  value={username}
                  onChangeText={handleUsernameChange}
                  placeholder="Enter your username"
                  required
                  refKey="loginUsername"
                  nextRefKey="loginPassword"
                  inputRefs={inputRefs}
                  focusNextInput={focusNextInput}
                  returnKeyType="next"
                  textContentType="username"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onSubmitEditing={() => focusNextInput('loginPassword')}
                />

                <CustomTextInput
                  label="Password"
                  value={password}
                  onChangeText={handlePasswordChange}
                  placeholder="Enter your password"
                  secureTextEntry
                  required
                  refKey="loginPassword"
                  nextRefKey="loginSubmit"
                  inputRefs={inputRefs}
                  focusNextInput={focusNextInput}
                  returnKeyType="next"
                  textContentType="password"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onSubmitEditing={() => focusNextInput('loginSubmit')}
                />

                {/* ช่อง submit ซ่อน (ใช้ refKey="loginSubmit") เพื่อให้ focus ได้ต่อเนื่อง */}
                <TextInput
                  ref={ref => { inputRefs.current['loginSubmit'] = ref; }}
                  style={{ height: 0, width: 0, opacity: 0 }}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  blurOnSubmit={true}
                />

                <ErrorMessage error={error} />
                <LoadingIndicator loading={loading} />

                <TouchableOpacity
                  style={[styles.loginButton, loading && styles.disabledButton]}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Text style={styles.loginButtonText}>
                    {loading ? 'Logging in...' : 'Log in'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.switchScreenButton}
                  onPress={() => navigateToScreen('register')}
                >
                  <Text style={styles.switchScreenText}>Don't have an account? Sign up</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </LinearGradient>
      </SafeAreaView>
    );
  };

  const RegisterScreen = () => {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.loginContainer}>
          <StatusBar barStyle="light-content" />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.flex}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.loginContent}>
                <Text style={styles.loginTitle}>Sign Up</Text>
                <Text style={styles.loginSubtitle}>Create your Inventor.io account</Text>

                <CustomTextInput
                  label="Username"
                  value={username}
                  onChangeText={handleUsernameChange}
                  placeholder="Enter your username"
                  required
                  refKey="regUsername"
                  nextRefKey="regEmail"
                  inputRefs={inputRefs}
                  focusNextInput={focusNextInput}
                  returnKeyType="next"
                  textContentType="username"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <CustomTextInput
                  label="Email (Optional)"
                  value={email}
                  onChangeText={handleEmailChange}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  refKey="regEmail"
                  nextRefKey="regPassword"
                  inputRefs={inputRefs}
                  focusNextInput={focusNextInput}
                  returnKeyType="next"
                  textContentType="emailAddress"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <CustomTextInput
                  label="Password"
                  value={password}
                  onChangeText={handlePasswordChange}
                  placeholder="Enter your password (min 6 characters)"
                  secureTextEntry
                  required
                  refKey="regPassword"
                  inputRefs={inputRefs}
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                  textContentType="newPassword"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <ErrorMessage error={error} />
                <LoadingIndicator loading={loading} />

                <TouchableOpacity
                  style={[styles.loginButton, loading && styles.disabledButton]}
                  onPress={handleRegister}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Text style={styles.loginButtonText}>
                    {loading ? 'Signing up...' : 'Sign Up'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.switchScreenButton}
                  onPress={() => navigateToScreen('login')}
                >
                  <Text style={styles.switchScreenText}>Already have an account? Log in</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </LinearGradient>
      </SafeAreaView>
    );
  };

  const DashboardScreen = () => {
    const stats = [
      { label: 'TOTAL PRODUCTS', value: products.length, color: '#8B5CF6' },
      { label: 'LOW STOCK', value: products.filter(p => (p.stock || 0) < 10).length, color: '#ef4444' },
      { label: 'CATEGORIES', value: new Set(products.map(p => p.category).filter(Boolean)).size, color: '#22c55e' },
      { label: 'ACTIVE ITEMS', value: products.filter(p => p.status === 'Active').length, color: '#3b82f6' },
    ];

    const categories = Array.from(new Set(products.map(p => p.category)))
      .filter(Boolean)
      .slice(0, 6)
      .map(category => ({
        id: category!,
        name: category!,
        count: products.filter(p => p.category === category).length,
        icon: getCategoryIcon(category!),
      }));

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <Header 
          title="Inventor.io" 
          onMenuPress={() => setShowSideMenu(true)}
        />

        <ScrollView style={styles.dashboardContent}>
          <View style={styles.connectionStatus}>
            <Text style={[
              styles.connectionText,
              { color: authToken ? '#22c55e' : '#ef4444' }
            ]}>
              {authToken ? '🟢 Connected to Cloud' : '🔴 Not Connected'}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Inventory Overview</Text>
            <View style={styles.statsGrid}>
              {stats.map((stat, index) => (
                <View key={index} style={styles.statCard}>
                  <Text style={[styles.statValue, { color: stat.color }]}>
                    {stat.value}
                  </Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Categories</Text>
            <View style={styles.categoryGrid}>
              {categories.map((category, index) => (
                <CategoryCard
                  key={index}
                  category={category}
                  variant="grid"
                  onPress={(cat) => {
                    setSearchQuery(cat.name);
                    navigateToScreen('products');
                  }}
                />
              ))}
            </View>
            <TouchableOpacity 
              style={styles.viewAllButton} 
              onPress={() => navigateToScreen('categories')}
            >
              <Text style={styles.viewAllText}>View All Categories</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <BottomNavigation 
          activeScreen="dashboard"
          user={user}
          onNavigate={navigateToScreen}
          onAdminActionDenied={(message) => showAlert('Access Denied', message)}
        />
      </SafeAreaView>
    );
  };

  const ProductsScreen = () => {
    const filteredProducts = products.filter(product => {
      const name = product.name || '';
      const category = product.category || '';
      const brand = product.brand || '';
      const productCode = product.productCode || '';
      const query = searchQuery.toLowerCase();
      
      return name.toLowerCase().includes(query) ||
             category.toLowerCase().includes(query) ||
             brand.toLowerCase().includes(query) ||
             productCode.toLowerCase().includes(query);
    });

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <Header 
          title="Products" 
          onMenuPress={() => setShowSideMenu(true)}
        />
        
        <SearchBar 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          placeholder="Search products..."
        />

        {searchQuery.length > 0 && (
          <View style={styles.searchResultsInfo}>
            <Text style={styles.searchResultsText}>
              {filteredProducts.length} {filteredProducts.length === 1 ? 'result' : 'results'} found
            </Text>
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearchLink}>Clear search</Text>
            </TouchableOpacity>
          </View>
        )}

       <ScrollView style={styles.productsContainer} showsVerticalScrollIndicator={false}>
  {loading ? (
    <LoadingIndicator loading />
  ) : error ? (
    <ErrorMessage error={error} />
  ) : filteredProducts.length === 0 ? (
    <EmptyState
      title={searchQuery ? 'No products found' : 'No products available'}
      subtitle={
        searchQuery
          ? 'Try a different search term'
          : 'Add a product to get started'
      }
      icon="📦"
      actionText={
        searchQuery
          ? 'Clear Search'
          : (user?.role === 'admin' ? 'Add Product' : undefined)
      }
      // มีปุ่มเมื่อ actionText มีค่าเท่านั้น
      onAction={
        searchQuery
          ? () => setSearchQuery('')
          : (user?.role === 'admin'
              ? () => {
                  resetForm();
                  navigateToScreen('add-product');
                }
              : undefined)
      }
    />
  ) : (
    <>
      {filteredProducts.map((product) => (
        <ProductCard
          key={String(product.id)}
          product={product}
          onPress={() => navigateToScreen('product-detail', product)}
        />
      ))}
    </>
  )}
</ScrollView>


        <BottomNavigation 
          activeScreen="products"
          user={user}
          onNavigate={(screen) => {
            if (screen === 'add-product') {
              resetForm();
              setSelectedProduct(null);
            }
            navigateToScreen(screen);
          }}
          onAdminActionDenied={(message) => showAlert('Access Denied', message)}
        />
      </SafeAreaView>
    );
  };

  const ProductDetailScreen = () => {
    if (!selectedProduct) return null;

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <Header 
          title="Product Details" 
          showBack 
          onBack={() => navigateToScreen('products')} 
        />

        <ScrollView style={styles.productDetailContainer}>
          <View style={styles.productDetailImageContainer}>
            {selectedProduct.image ? (
              <ImageUploadComponent
                imageUri={selectedProduct.image}
                onImageChange={() => {}} // Read-only in detail view
                style={styles.detailImageUpload}
              />
            ) : (
              <FallbackImage />
            )}
          </View>
          
          <View style={styles.productDetailInfo}>
            <Text style={styles.productDetailName}>{selectedProduct.name}</Text>
            <Text style={styles.productDetailBrand}>
              {selectedProduct.brand || 'No brand'}
            </Text>
            <Text style={styles.productDetailCategory}>
              {selectedProduct.category || 'No category'}
            </Text>
          </View>

          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Price:</Text>
              <Text style={styles.detailValue}>
                ${selectedProduct.price ? Number(selectedProduct.price).toFixed(2) : '0.00'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Stock:</Text>
              <Text style={[
                styles.detailValue,
                { color: (selectedProduct.stock || 0) < 10 ? '#ef4444' : '#22c55e' }
              ]}>
                {selectedProduct.stock || 0} items
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <Text style={[
                styles.detailValue,
                { color: selectedProduct.status === 'Active' ? '#22c55e' : '#ef4444' }
              ]}>
                {selectedProduct.status}
              </Text>
            </View>
            {selectedProduct.productCode && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Product Code:</Text>
                <Text style={styles.detailValue}>{selectedProduct.productCode}</Text>
              </View>
            )}
            {selectedProduct.sizes && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Sizes:</Text>
                <Text style={styles.detailValue}>{selectedProduct.sizes}</Text>
              </View>
            )}
            {selectedProduct.location && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Location:</Text>
                <Text style={styles.detailValue}>{selectedProduct.location}</Text>
              </View>
            )}
          </View>

          {selectedProduct.description && (
            <View style={styles.detailCard}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.descriptionText}>{selectedProduct.description}</Text>
            </View>
          )}

          {user?.role === 'admin' && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={handleEditProduct}
              >
                <Text style={styles.actionButtonText}>Edit Product</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDeleteProduct(selectedProduct.id)}
              >
                <Text style={styles.actionButtonText}>Delete Product</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.lastUpdateContainer}>
            <Text style={styles.lastUpdateText}>
              Last updated: {selectedProduct.lastUpdate}
            </Text>
          </View>
        </ScrollView>

        <BottomNavigation 
          activeScreen="products"
          user={user}
          onNavigate={navigateToScreen}
          onAdminActionDenied={(message) => showAlert('Access Denied', message)}
        />
      </SafeAreaView>
    );
  };

  const AddProductScreen = () => {
    if (user?.role !== 'admin') {
      navigateToScreen('products');
      showAlert('Access Denied', 'Only admins can add products.');
      return null;
    }

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <Header 
          title="Add Product" 
          showBack 
          onBack={() => {
            resetForm();
            navigateToScreen('products');
          }} 
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formContainer}>
              <CustomTextInput
                label="Name"
                value={formData.name}
                onChangeText={(text) => handleFormDataChange('name', text)}
                placeholder="Enter product name"
                required
                refKey="name"
                nextRefKey="description"
                inputRefs={inputRefs}
                focusNextInput={focusNextInput}
                returnKeyType="next"
                autoFocus={true}
                onSubmitEditing={() => focusNextInput('description')}
              />

              <CustomTextInput
                label="Description"
                value={formData.description}
                onChangeText={(text) => handleFormDataChange('description', text)}
                placeholder="Enter description"
                multiline
                numberOfLines={4}
                refKey="description"
                nextRefKey="price"
                inputRefs={inputRefs}
                focusNextInput={focusNextInput}
                returnKeyType="next"
                onSubmitEditing={() => focusNextInput('price')}
              />

              <CustomTextInput
                label="Price"
                value={formData.price}
                onChangeText={(text) => handleFormDataChange('price', text)}
                placeholder="Enter price"
                keyboardType="numeric"
                required
                refKey="price"
                nextRefKey="stock"
                inputRefs={inputRefs}
                focusNextInput={focusNextInput}
                returnKeyType="next"
                onSubmitEditing={() => focusNextInput('stock')}
              />

              <CustomTextInput
                label="Stock"
                value={formData.stock}
                onChangeText={(text) => handleFormDataChange('stock', text)}
                placeholder="Enter stock quantity"
                keyboardType="numeric"
                refKey="stock"
                nextRefKey="category"
                inputRefs={inputRefs}
                focusNextInput={focusNextInput}
                returnKeyType="next"
                onSubmitEditing={() => focusNextInput('category')}
              />

              <CustomTextInput
                label="Category"
                value={formData.category}
                onChangeText={(text) => handleFormDataChange('category', text)}
                placeholder="Enter category"
                refKey="category"
                nextRefKey="brand"
                inputRefs={inputRefs}
                focusNextInput={focusNextInput}
                returnKeyType="next"
                onSubmitEditing={() => focusNextInput('brand')}
              />

              <CustomTextInput
                label="Brand"
                value={formData.brand}
                onChangeText={(text) => handleFormDataChange('brand', text)}
                placeholder="Enter brand"
                refKey="brand"
                nextRefKey="location"
                inputRefs={inputRefs}
                focusNextInput={focusNextInput}
                returnKeyType="next"
                onSubmitEditing={() => focusNextInput('location')}
              />

              <CustomTextInput
                label="Location"
                value={formData.location}
                onChangeText={(text) => handleFormDataChange('location', text)}
                placeholder="Enter location"
                refKey="location"
                nextRefKey="sizes"
                inputRefs={inputRefs}
                focusNextInput={focusNextInput}
                returnKeyType="next"
                onSubmitEditing={() => focusNextInput('sizes')}
              />

              <CustomTextInput
                label="Sizes"
                value={formData.sizes}
                onChangeText={(text) => handleFormDataChange('sizes', text)}
                placeholder="Enter sizes (e.g., S,M,L)"
                refKey="sizes"
                nextRefKey="productCode"
                inputRefs={inputRefs}
                focusNextInput={focusNextInput}
                returnKeyType="next"
                onSubmitEditing={() => focusNextInput('productCode')}
              />

              <CustomTextInput
                label="Product Code"
                value={formData.productCode}
                onChangeText={(text) => handleFormDataChange('productCode', text)}
                placeholder="Enter product code"
                refKey="productCode"
                nextRefKey="orderName"
                inputRefs={inputRefs}
                focusNextInput={focusNextInput}
                returnKeyType="next"
                onSubmitEditing={() => focusNextInput('orderName')}
              />

              <CustomTextInput
                label="Order Name"
                value={formData.orderName}
                onChangeText={(text) => handleFormDataChange('orderName', text)}
                placeholder="Enter order name"
                refKey="orderName"
                inputRefs={inputRefs}
                returnKeyType="done"
                onSubmitEditing={handleAddProduct}
              />

              <ImageUploadComponent
                imageUri={formData.image}
                onImageChange={(uri: string) => handleFormDataChange('image', uri)}
                placeholder="Add product image"
                style={styles.detailImageUpload}
              />

              <StatusSelector
                status={formData.status}
                onStatusChange={status => handleFormDataChange('status', status)}
              />

              <ErrorMessage error={error} />
              <LoadingIndicator loading={loading} />

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    resetForm();
                    navigateToScreen('products');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButton, loading && styles.disabledButton]}
                  onPress={handleAddProduct}
                  disabled={loading}
                >
                  <Text style={styles.submitButtonText}>Add Product</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  };

  const EditProductScreen = () => {
    if (user?.role !== 'admin' || !selectedProduct) {
      navigateToScreen('products');
      showAlert('Access Denied', 'Only admins can edit products.');
      return null;
    }

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <Header 
          title="Edit Product" 
          showBack 
          onBack={() => navigateToScreen('product-detail')} 
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formContainer}>
              <CustomTextInput
                label="Name"
                value={formData.name}
                onChangeText={(text) => handleFormDataChange('name', text)}
                placeholder="Enter product name"
                required
                refKey="editName"
                nextRefKey="editDescription"
                inputRefs={inputRefs}
                focusNextInput={focusNextInput}
                returnKeyType="next"
                autoFocus={true}
                onSubmitEditing={() => focusNextInput('editDescription')}
              />

              <CustomTextInput
                label="Description"
                value={formData.description}
                onChangeText={(text) => handleFormDataChange('description', text)}
                placeholder="Enter description"
                multiline
                numberOfLines={4}
                refKey="editDescription"
                nextRefKey="editPrice"
                inputRefs={inputRefs}
                focusNextInput={focusNextInput}
                returnKeyType="next"
                onSubmitEditing={() => focusNextInput('editPrice')}
              />

              <CustomTextInput
                label="Price"
                value={formData.price}
                onChangeText={(text) => handleFormDataChange('price', text)}
                placeholder="Enter price"
                keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
                required
                refKey="editPrice"
                nextRefKey="editStock"
                inputRefs={inputRefs}
                focusNextInput={focusNextInput}
                returnKeyType="next"
                onSubmitEditing={() => focusNextInput('editStock')}
              />

              <CustomTextInput
                label="Stock"
                value={formData.stock}
                onChangeText={(text) => handleFormDataChange('stock', text)}
                placeholder="Enter stock quantity"
                keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
                refKey="editStock"
                nextRefKey="editCategory"
                inputRefs={inputRefs}
                focusNextInput={focusNextInput}
                returnKeyType="next"
                onSubmitEditing={() => focusNextInput('editCategory')}
              />

              <CustomTextInput
                label="Category"
                value={formData.category}
                onChangeText={(text) => handleFormDataChange('category', text)}
                placeholder="Enter category"
                refKey="editCategory"
                nextRefKey="editBrand"
                inputRefs={inputRefs}
                focusNextInput={focusNextInput}
                returnKeyType="next"
                onSubmitEditing={() => focusNextInput('editBrand')}
              />

              <CustomTextInput
                label="Brand"
                value={formData.brand}
                onChangeText={(text) => handleFormDataChange('brand', text)}
                placeholder="Enter brand"
                refKey="editBrand"
                nextRefKey="editLocation"
                inputRefs={inputRefs}
                focusNextInput={focusNextInput}
                returnKeyType="next"
                onSubmitEditing={() => focusNextInput('editLocation')}
              />

              <CustomTextInput
                label="Location"
                value={formData.location}
                onChangeText={(text) => handleFormDataChange('location', text)}
                placeholder="Enter location"
                refKey="editLocation"
                nextRefKey="editSizes"
                inputRefs={inputRefs}
                focusNextInput={focusNextInput}
                returnKeyType="next"
                onSubmitEditing={() => focusNextInput('editSizes')}
              />

              <CustomTextInput
                label="Sizes"
                value={formData.sizes}
                onChangeText={(text) => handleFormDataChange('sizes', text)}
                placeholder="Enter sizes (e.g., S,M,L)"
                refKey="editSizes"
                nextRefKey="editProductCode"
                inputRefs={inputRefs}
                focusNextInput={focusNextInput}
                returnKeyType="next"
                onSubmitEditing={() => focusNextInput('editProductCode')}
              />

              <CustomTextInput
                label="Product Code"
                value={formData.productCode}
                onChangeText={(text) => handleFormDataChange('productCode', text)}
                placeholder="Enter product code"
                refKey="editProductCode"
                nextRefKey="editOrderName"
                inputRefs={inputRefs}
                focusNextInput={focusNextInput}
                returnKeyType="next"
                onSubmitEditing={() => focusNextInput('editOrderName')}
              />

              <CustomTextInput
                label="Order Name"
                value={formData.orderName}
                onChangeText={(text) => handleFormDataChange('orderName', text)}
                placeholder="Enter order name"
                refKey="editOrderName"
                inputRefs={inputRefs}
                returnKeyType="done"
                onSubmitEditing={handleUpdateProduct}
              />

              <ImageUploadComponent
                imageUri={formData.image}
                onImageChange={uri => handleFormDataChange('image', uri)}
                placeholder="Update product image"
                style={styles.detailImageUpload}
              />

              <StatusSelector
                status={formData.status}
                onStatusChange={status => handleFormDataChange('status', status)}
              />

              <ErrorMessage error={error} />
              <LoadingIndicator loading={loading} />

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => navigateToScreen('product-detail')}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButton, loading && styles.disabledButton]}
                  onPress={handleUpdateProduct}
                  disabled={loading}
                >
                  <Text style={styles.submitButtonText}>Update Product</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  };

  const CategoriesScreen = () => {
    const categories = Array.from(new Set(products.map(p => p.category)))
      .filter(Boolean)
      .map(category => ({
        id: category!,
        name: category!,
        count: products.filter(p => p.category === category).length,
        icon: getCategoryIcon(category!),
      }));

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <Header 
          title="Categories" 
          showBack 
          onBack={() => navigateToScreen('dashboard')} 
        />

        <ScrollView style={styles.categoriesContainer}>
          <LoadingIndicator loading={loading} />
          <ErrorMessage error={error} />
          
          {!loading && !error && (
            <>
              {categories.length === 0 ? (
                <EmptyState
                  title="No categories available"
                  subtitle="Add products to create categories"
                  icon="📂"
                  actionText={user?.role === 'admin' ? 'Add Product' : undefined}
                  onAction={() => {
                    if (user?.role === 'admin') {
                      resetForm();
                      navigateToScreen('add-product');
                    }
                  }}
                />
              ) : (
                categories.map((category, index) => (
                  <CategoryCard
                    key={index}
                    category={category}
                    variant="list"
                    onPress={(cat) => {
                      setSearchQuery(cat.name);
                      navigateToScreen('products');
                    }}
                  />
                ))
              )}
            </>
          )}
        </ScrollView>

        <BottomNavigation 
          activeScreen="categories"
          user={user}
          onNavigate={(screen) => {
            if (screen === 'add-product') {
              resetForm();
              setSelectedProduct(null);
            }
            navigateToScreen(screen);
          }}
          onAdminActionDenied={(message) => showAlert('Access Denied', message)}
        />
      </SafeAreaView>
    );
  };

  // Render Main App
  return (
    <>
      {currentScreen === 'login' && <LoginScreen />}
      {currentScreen === 'register' && <RegisterScreen />}
      {currentScreen === 'dashboard' && <DashboardScreen />}
      {currentScreen === 'products' && <ProductsScreen />}
      {currentScreen === 'product-detail' && <ProductDetailScreen />}
      {currentScreen === 'add-product' && <AddProductScreen />}
      {currentScreen === 'edit-product' && <EditProductScreen />}
      {currentScreen === 'categories' && <CategoriesScreen />}
      
      {showSideMenu && (
        <SideMenu
          visible={showSideMenu}
          user={user}
          onNavigate={(screen) => {
            if (screen === 'add-product') {
              resetForm();
              setSelectedProduct(null);
            }
            navigateToScreen(screen);
          }}
          onLogout={handleLogout}
          onClose={() => setShowSideMenu(false)}
        />
      )}
    </>
  );
};

export default InventoryApp;
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

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

const InventoryApp = () => {
  // State Management
  const [currentScreen, setCurrentScreen] = useState<
    'login' | 'register' | 'dashboard' | 'products' | 'product-detail' | 'categories' | 'add-product' | 'edit-product'
  >('login');
  
  // User & Auth States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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

  // Focus Management
  const focusNextInput = useCallback((nextInputKey: string) => {
    setTimeout(() => {
      const nextInput = inputRefs.current[nextInputKey];
      if (nextInput && typeof nextInput.focus === 'function') {
        nextInput.focus();
      }
    }, 100);
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

  // UI Components
  const LoadingIndicator = React.memo(() => (
    loading ? (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    ) : null
  ));

  const ErrorMessage = React.memo(() => (
    error ? (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    ) : null
  ));

  const CustomTextInput = React.memo(({ 
    label, 
    value, 
    onChangeText, 
    placeholder, 
    secureTextEntry = false, 
    keyboardType = 'default',
    multiline = false,
    required = false,
    refKey,
    nextRefKey,
    onSubmitEditing,
    returnKeyType,
    autoFocus = false,
    autoComplete,
    textContentType,
  }: any) => {
    const handleSubmitEditing = useCallback(() => {
      if (nextRefKey && !multiline) {
        focusNextInput(nextRefKey);
      }
      if (onSubmitEditing) {
        onSubmitEditing();
      }
    }, [nextRefKey, multiline, onSubmitEditing]);

    const getReturnKeyType = useCallback(() => {
      if (returnKeyType) return returnKeyType;
      if (multiline) return 'default';
      if (nextRefKey) return 'next';
      return 'done';
    }, [returnKeyType, multiline, nextRefKey]);

    return (
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
        <TextInput
          ref={(ref) => {
            if (refKey) {
              inputRefs.current[refKey] = ref;
            }
          }}
          style={[styles.input, multiline && styles.multilineInput]}
          value={value ?? ''}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          onSubmitEditing={handleSubmitEditing}
          returnKeyType={getReturnKeyType()}
          autoFocus={autoFocus}
          blurOnSubmit={!multiline && !nextRefKey}
          autoCorrect={false}
          spellCheck={false}
          {...(autoComplete && { autoComplete })}
          {...(textContentType && { textContentType })}
        />
      </View>
    );
  });

  const StatusSelector = React.memo(() => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>Status</Text>
      <View style={styles.statusButtons}>
        <TouchableOpacity
          style={[
            styles.statusButton,
            formData.status === 'Active' && styles.statusButtonActive
          ]}
          onPress={() => setFormData(prev => ({ ...prev, status: 'Active' }))}
        >
          <Text style={[
            styles.statusText,
            formData.status === 'Active' && styles.statusTextActive
          ]}>
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.statusButton,
            formData.status === 'Inactive' && styles.statusButtonInactive
          ]}
          onPress={() => setFormData(prev => ({ ...prev, status: 'Inactive' }))}
        >
          <Text style={[
            styles.statusText,
            formData.status === 'Inactive' && styles.statusTextActive
          ]}>
            Inactive
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  ));

  // Screen Components
  const SideMenu = () => {
    if (!showSideMenu) return null;

    return (
      <View style={styles.sideMenuOverlay}>
        <TouchableOpacity 
          style={styles.sideMenuBackdrop} 
          onPress={() => setShowSideMenu(false)} 
        />
        <View style={styles.sideMenuContainer}>
          <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.sideMenuContent}>
            <View style={styles.sideMenuHeader}>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => setShowSideMenu(false)}
              >
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.sideMenuTitle}>Inventor.io</Text>
            </View>

            {user && (
              <View style={styles.userInfo}>
                <Text style={styles.userInfoText}>Welcome, {user.username}</Text>
                <Text style={styles.userRoleText}>{user.role}</Text>
              </View>
            )}

            <View style={styles.sideMenuItems}>
              {['dashboard', 'products', 'categories'].map((screen) => (
                <TouchableOpacity
                  key={screen}
                  style={styles.sideMenuItem}
                  onPress={() => navigateToScreen(screen)}
                >
                  <Text style={styles.sideMenuItemText}>
                    {screen.charAt(0).toUpperCase() + screen.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>Log out</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    );
  };

  const LoginScreen = () => {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.loginContainer}>
          <StatusBar barStyle="light-content" />
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.flex}
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
                  onChangeText={setUsername}
                  placeholder="Enter your username"
                  required
                  refKey="loginUsername"
                  nextRefKey="loginPassword"
                  autoComplete="username"
                  textContentType="username"
                  autoFocus={Platform.OS === 'ios'}
                />

                <CustomTextInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secureTextEntry
                  required
                  refKey="loginPassword"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  autoComplete="current-password"
                  textContentType="password"
                />

                <ErrorMessage />
                <LoadingIndicator />

                <TouchableOpacity
                  style={[styles.loginButton, loading && styles.disabledButton]}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.loginButtonText}>Log in</Text>
                  )}
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
                  onChangeText={setUsername}
                  placeholder="Enter your username"
                  required
                  refKey="regUsername"
                  nextRefKey="regEmail"
                  autoComplete="username"
                  textContentType="username"
                  autoFocus={Platform.OS === 'ios'}
                />

                <CustomTextInput
                  label="Email (Optional)"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  refKey="regEmail"
                  nextRefKey="regPassword"
                  autoComplete="email"
                  textContentType="emailAddress"
                />

                <CustomTextInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password (min 6 characters)"
                  secureTextEntry
                  required
                  refKey="regPassword"
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                  autoComplete="new-password"
                  textContentType="newPassword"
                />

                <ErrorMessage />
                <LoadingIndicator />

                <TouchableOpacity
                  style={[styles.loginButton, loading && styles.disabledButton]}
                  onPress={handleRegister}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.loginButtonText}>Sign Up</Text>
                  )}
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

  const Header = ({ title, showBack = false, onBack }: any) => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={showBack ? onBack : () => setShowSideMenu(true)}
      >
        <Text style={styles.menuIcon}>{showBack ? '←' : '☰'}</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <TouchableOpacity style={styles.profileButton}>
        <Text style={styles.profileIcon}>👤</Text>
      </TouchableOpacity>
    </View>
  );

  const SearchBar = ({ placeholder = "Search..." }: any) => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            style={styles.clearSearchButton} 
            onPress={() => setSearchQuery('')}
          >
            <Text style={styles.clearSearchText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const BottomNavigation = ({ activeScreen }: any) => {
    const navItems = [
      { key: 'dashboard', icon: '🏠', label: 'Home' },
      { key: 'add-product', icon: '➕', label: 'Add', adminOnly: true },
      { key: 'products', icon: '📦', label: 'Products' },
      { key: 'categories', icon: '📁', label: 'Categories' },
    ];

    return (
      <View style={styles.bottomNav}>
        {navItems.map((item) => {
          if (item.adminOnly && user?.role !== 'admin') return null;
          
          return (
            <TouchableOpacity
              key={item.key}
              style={styles.navItem}
              onPress={() => {
                if (item.adminOnly && user?.role !== 'admin') {
                  showAlert('Access Denied', 'Only admins can add products.');
                  return;
                }
                if (item.key === 'add-product') {
                  resetForm();
                  setSelectedProduct(null);
                }
                navigateToScreen(item.key);
              }}
            >
              <Text style={styles.navIcon}>{item.icon}</Text>
              <Text style={[
                styles.navText,
                activeScreen === item.key && styles.navTextActive
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const DashboardScreen = () => {
    const stats = [
      { label: 'TOTAL PRODUCTS', value: products.length, color: '#8B5CF6' },
      { label: 'LOW STOCK', value: products.filter(p => (p.stock || 0) < 10).length, color: '#ef4444' },
      { label: 'CATEGORIES', value: new Set(products.map(p => p.category).filter(Boolean)).size, color: '#22c55e' },
      { label: 'ACTIVE ITEMS', value: products.filter(p => p.status === 'Active').length, color: '#3b82f6' },
    ];

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <Header title="Inventor.io" />

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
              {Array.from(new Set(products.map(p => p.category)))
                .filter(Boolean)
                .slice(0, 6)
                .map((category, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.categoryCard}
                    onPress={() => {
                      setSearchQuery(category!);
                      navigateToScreen('products');
                    }}
                  >
                    <Text style={styles.categoryIcon}>
                      {getCategoryIcon(category!)}
                    </Text>
                    <Text style={styles.categoryName}>{category}</Text>
                  </TouchableOpacity>
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

        <BottomNavigation activeScreen="dashboard" />
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
        <Header title="Products" />
        <SearchBar placeholder="Search products..." />

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

        <ScrollView style={styles.productsContainer}>
          <LoadingIndicator />
          <ErrorMessage />
          
          {!loading && !error && (
            <>
              {filteredProducts.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateTitle}>
                    {searchQuery ? 'No products found' : 'No products available'}
                  </Text>
                  <Text style={styles.emptyStateSubtitle}>
                    {searchQuery ? 'Try a different search term' : 'Add a product to get started'}
                  </Text>
                  {!searchQuery && user?.role === 'admin' && (
                    <TouchableOpacity
                      style={styles.emptyStateButton}
                      onPress={() => {
                        resetForm();
                        navigateToScreen('add-product');
                      }}
                    >
                      <Text style={styles.emptyStateButtonText}>Add Product</Text>
                    </TouchableOpacity>
                  )}
                  {searchQuery && (
                    <TouchableOpacity
                      style={styles.emptyStateButton}
                      onPress={() => setSearchQuery('')}
                    >
                      <Text style={styles.emptyStateButtonText}>Clear Search</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                filteredProducts.map(product => (
                  <TouchableOpacity
                    key={product.id}
                    style={styles.productCard}
                    onPress={() => navigateToScreen('product-detail', product)}
                  >
                    <Image
                      source={{ uri: product.image || 'https://via.placeholder.com/80' }}
                      style={styles.productImage}
                      defaultSource={{ uri: 'https://via.placeholder.com/80' }}
                    />
                    <View style={styles.productInfo}>
                      <Text style={styles.productName} numberOfLines={2}>
                        {product.name}
                      </Text>
                      <Text style={styles.productCategory}>
                        {product.category || 'No category'}
                      </Text>
                      <View style={styles.productDetails}>
                        <Text style={styles.productPrice}>
                          ${product.price ? Number(product.price).toFixed(2) : '0.00'}
                        </Text>
                        <Text style={[
                          styles.productStock,
                          { color: (product.stock || 0) < 10 ? '#ef4444' : '#22c55e' }
                        ]}>
                          Stock: {product.stock || 0}
                        </Text>
                      </View>
                      <View style={styles.productFooter}>
                        <Text style={[
                          styles.productStatus,
                          { 
                            color: product.status === 'Active' ? '#22c55e' : '#ef4444',
                            backgroundColor: product.status === 'Active' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'
                          }
                        ]}>
                          {product.status}
                        </Text>
                        {product.brand && (
                          <Text style={styles.productBrand}>
                            {product.brand}
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </>
          )}
        </ScrollView>

        <BottomNavigation activeScreen="products" />
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
            <Image
              source={{ uri: selectedProduct.image || 'https://via.placeholder.com/200' }}
              style={styles.productDetailImage}
              defaultSource={{ uri: 'https://via.placeholder.com/200' }}
            />
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

        <BottomNavigation activeScreen="products" />
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
        >
          <ScrollView 
            style={styles.formContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <CustomTextInput
              label="Name"
              value={formData.name}
              onChangeText={(text: string) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="Enter product name"
              required
              autoFocus
              refKey="name"
              nextRefKey="description"
            />

            <CustomTextInput
              label="Description"
              value={formData.description}
              onChangeText={(text: string) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Enter description"
              multiline
              refKey="description"
              nextRefKey="price"
            />

            <CustomTextInput
              label="Price"
              value={formData.price}
              onChangeText={(text: string) => setFormData(prev => ({ ...prev, price: text }))}
              placeholder="Enter price"
              keyboardType="numeric"
              required
              refKey="price"
              nextRefKey="stock"
            />

            <CustomTextInput
              label="Stock"
              value={formData.stock}
              onChangeText={(text: string) => setFormData(prev => ({ ...prev, stock: text }))}
              placeholder="Enter stock quantity"
              keyboardType="numeric"
              refKey="stock"
              nextRefKey="category"
            />

            <CustomTextInput
              label="Category"
              value={formData.category}
              onChangeText={(text: string) => setFormData(prev => ({ ...prev, category: text }))}
              placeholder="Enter category"
              refKey="category"
              nextRefKey="brand"
            />

            <CustomTextInput
              label="Brand"
              value={formData.brand}
              onChangeText={(text: string) => setFormData(prev => ({ ...prev, brand: text }))}
              placeholder="Enter brand"
              refKey="brand"
              nextRefKey="location"
            />

            <CustomTextInput
              label="Location"
              value={formData.location}
              onChangeText={(text: string) => setFormData(prev => ({ ...prev, location: text }))}
              placeholder="Enter location"
              refKey="location"
              nextRefKey="sizes"
            />

            <CustomTextInput
              label="Sizes"
              value={formData.sizes}
              onChangeText={(text: string) => setFormData(prev => ({ ...prev, sizes: text }))}
              placeholder="Enter sizes (e.g., S,M,L)"
              refKey="sizes"
              nextRefKey="productCode"
            />

            <CustomTextInput
              label="Product Code"
              value={formData.productCode}
              onChangeText={(text: string) => setFormData(prev => ({ ...prev, productCode: text }))}
              placeholder="Enter product code"
              refKey="productCode"
              nextRefKey="orderName"
            />

            <CustomTextInput
              label="Order Name"
              value={formData.orderName}
              onChangeText={(text: string) => setFormData(prev => ({ ...prev, orderName: text }))}
              placeholder="Enter order name"
              refKey="orderName"
              nextRefKey="image"
            />

            <CustomTextInput
              label="Image URL"
              value={formData.image}
              onChangeText={(text: string) => setFormData(prev => ({ ...prev, image: text }))}
              placeholder="Enter image URL"
              refKey="image"
              returnKeyType="done"
            />

            <StatusSelector />

            <ErrorMessage />
            <LoadingIndicator />

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
        >
          <ScrollView 
            style={styles.formContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <CustomTextInput
              label="Name"
              value={formData.name}
              onChangeText={(text: string) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="Enter product name"
              required
              refKey="editName"
              nextRefKey="editDescription"
            />

            <CustomTextInput
              label="Description"
              value={formData.description}
              onChangeText={(text: string) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Enter description"
              multiline
              refKey="editDescription"
              nextRefKey="editPrice"
            />

            <CustomTextInput
              label="Price"
              value={formData.price}
              onChangeText={(text: string) => setFormData(prev => ({ ...prev, price: text }))}
              placeholder="Enter price"
              keyboardType="numeric"
              required
              refKey="editPrice"
              nextRefKey="editStock"
            />

            <CustomTextInput
              label="Stock"
              value={formData.stock}
              onChangeText={(text: string) => setFormData(prev => ({ ...prev, stock: text }))}
              placeholder="Enter stock quantity"
              keyboardType="numeric"
              refKey="editStock"
              nextRefKey="editCategory"
            />

            <CustomTextInput
              label="Category"
              value={formData.category}
              onChangeText={(text: string) => setFormData(prev => ({ ...prev, category: text }))}
              placeholder="Enter category"
              refKey="editCategory"
              nextRefKey="editBrand"
            />

            <CustomTextInput
              label="Brand"
              value={formData.brand}
              onChangeText={(text: string) => setFormData(prev => ({ ...prev, brand: text }))}
              placeholder="Enter brand"
              refKey="editBrand"
              nextRefKey="editLocation"
            />

            <CustomTextInput
              label="Location"
              value={formData.location}
              onChangeText={(text: string) => setFormData(prev => ({ ...prev, location: text }))}
              placeholder="Enter location"
              refKey="editLocation"
              nextRefKey="editSizes"
            />

            <CustomTextInput
              label="Sizes"
              value={formData.sizes}
              onChangeText={(text: string) => setFormData(prev => ({ ...prev, sizes: text }))}
              placeholder="Enter sizes (e.g., S,M,L)"
              refKey="editSizes"
              nextRefKey="editProductCode"
            />

            <CustomTextInput
              label="Product Code"
              value={formData.productCode}
              onChangeText={(text: string) => setFormData(prev => ({ ...prev, productCode: text }))}
              placeholder="Enter product code"
              refKey="editProductCode"
              nextRefKey="editOrderName"
            />

            <CustomTextInput
              label="Order Name"
              value={formData.orderName}
              onChangeText={(text: string) => setFormData(prev => ({ ...prev, orderName: text }))}
              placeholder="Enter order name"
              refKey="editOrderName"
              nextRefKey="editImage"
            />

            <CustomTextInput
              label="Image URL"
              value={formData.image}
              onChangeText={(text: string) => setFormData(prev => ({ ...prev, image: text }))}
              placeholder="Enter image URL"
              refKey="editImage"
              returnKeyType="done"
            />

            <StatusSelector />

            <ErrorMessage />
            <LoadingIndicator />

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

    const filteredCategories = categories.filter(category =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <Header title="Categories" />
        <SearchBar placeholder="Search categories..." />

        {searchQuery.length > 0 && (
          <View style={styles.searchResultsInfo}>
            <Text style={styles.searchResultsText}>
              {filteredCategories.length} {filteredCategories.length === 1 ? 'result' : 'results'} found
            </Text>
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearchLink}>Clear search</Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView style={styles.categoriesContainer}>
          <LoadingIndicator />
          <ErrorMessage />
          
          {!loading && !error && (
            <>
              {filteredCategories.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateTitle}>
                    {searchQuery ? 'No categories found' : 'No categories available'}
                  </Text>
                  <Text style={styles.emptyStateSubtitle}>
                    {searchQuery ? 'Try a different search term' : 'Add products to see categories'}
                  </Text>
                  {searchQuery && (
                    <TouchableOpacity
                      style={styles.emptyStateButton}
                      onPress={() => setSearchQuery('')}
                    >
                      <Text style={styles.emptyStateButtonText}>Clear Search</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                filteredCategories.map(category => (
                  <TouchableOpacity
                    key={category.id}
                    style={styles.categoryListCard}
                    onPress={() => {
                      setSearchQuery(category.name);
                      navigateToScreen('products');
                    }}
                  >
                    <View style={styles.categoryIconContainer}>
                      <Text style={styles.categoryIconText}>{category.icon}</Text>
                    </View>
                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryNameText}>{category.name}</Text>
                      <Text style={styles.categoryCountText}>
                        {category.count} {category.count === 1 ? 'item' : 'items'}
                      </Text>
                    </View>
                    <Text style={styles.categoryArrow}>›</Text>
                  </TouchableOpacity>
                ))
              )}
            </>
          )}
        </ScrollView>

        <BottomNavigation activeScreen="categories" />
      </SafeAreaView>
    );
  };

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

  // Main render
  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'login': return <LoginScreen />;
      case 'register': return <RegisterScreen />;
      case 'dashboard': return <DashboardScreen />;
      case 'products': return <ProductsScreen />;
      case 'product-detail': return <ProductDetailScreen />;
      case 'categories': return <CategoriesScreen />;
      case 'add-product': return <AddProductScreen />;
      case 'edit-product': return <EditProductScreen />;
      default: return <LoginScreen />;
    }
  };

  return (
    <>
      {renderCurrentScreen()}
      <SideMenu />
    </>
  );
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
  
  // Login/Register Styles
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
  
  // Input Styles
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#374151',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  
  // Button Styles
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
  
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
  },
  menuIcon: {
    fontSize: 24,
    color: '#374151',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  profileButton: {
    padding: 8,
    borderRadius: 8,
  },
  profileIcon: {
    fontSize: 24,
    color: '#6b7280',
  },
  
  // Search Styles
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    fontSize: 20,
    color: '#6b7280',
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  clearSearchButton: {
    padding: 8,
    marginLeft: 8,
  },
  clearSearchText: {
    fontSize: 18,
    color: '#6b7280',
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
  
  // Loading and Error Styles
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#8B5CF6',
    marginTop: 8,
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    marginHorizontal: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
    fontWeight: '500',
  },
  
  // Side Menu Styles
  sideMenuOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  sideMenuBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sideMenuContainer: {
    width: '75%',
    maxWidth: 300,
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  sideMenuContent: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sideMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
  },
  closeIcon: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '600',
  },
  sideMenuTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginRight: 32,
  },
  userInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  userInfoText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
    marginBottom: 4,
  },
  userRoleText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  sideMenuItems: {
    flex: 1,
  },
  sideMenuItem: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  sideMenuItemText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  
  // Dashboard Styles
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
  categoryCard: {
    width: '30%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'capitalize',
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
  
  // Product Styles
  productsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
    backgroundColor: '#f3f4f6',
  },
  productInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    textTransform: 'capitalize',
    marginBottom: 8,
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '700',
  },
  productStock: {
    fontSize: 14,
    fontWeight: '600',
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productStatus: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  productBrand: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  
  // Product Detail Styles
  productDetailContainer: {
    flex: 1,
    padding: 20,
  },
  productDetailImageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  productDetailImage: {
    width: 200,
    height: 200,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
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
  
  // Form Styles
  formContainer: {
    flex: 1,
    padding: 20,
  },
  statusButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  statusButtonActive: {
    backgroundColor: '#dcfce7',
    borderColor: '#22c55e',
  },
  statusButtonInactive: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  statusText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  statusTextActive: {
    color: '#fff',
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
  
  // Categories Styles
  categoriesContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  categoryListCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryIconText: {
    fontSize: 24,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  categoryCountText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  categoryArrow: {
    fontSize: 20,
    color: '#6b7280',
    fontWeight: '300',
  },
  
  // Empty State Styles
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyStateButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Bottom Navigation Styles
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 60,
  },
  navIcon: {
    fontSize: 24,
    color: '#6b7280',
    marginBottom: 4,
  },
  navText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  navTextActive: {
    color: '#8b5cf6',
  },
});

export default InventoryApp;
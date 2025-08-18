import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
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
  stock: number;
  category: string;
  location: string;
  image: string;
  status: 'Active' | 'Inactive';
  brand: string;
  sizes: string;
  productCode: string;
  orderName: string;
  storeAvailability: { location: string; available: boolean }[];
  lastUpdate: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

// API URL to use cloud server
const API_BASE_URL = 'http://nindam.sytes.net:3008/api';

const InventoryApp = () => {
  const [currentScreen, setCurrentScreen] = useState<
    'login' | 'register' | 'dashboard' | 'products' | 'product-detail' | 'categories'
  >('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Enhanced API Call Function with better error handling for cloud
  const apiCall = async (endpoint: string, options: any = {}) => {
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        ...options.headers,
      },
    };

    try {
      console.log(`Making API call to: ${API_BASE_URL}${endpoint}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for cloud
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...config,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      console.log(`API Response Status: ${response.status}`);
      
      if (!response.ok) {
        let errorMessage = `HTTP error ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // If can't parse error response, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('API call successful');
      return data;
      
    } catch (err: any) {
      console.error('API call failed:', {
        endpoint,
        error: err.message,
        name: err.name,
      });
      
      if (err.name === 'AbortError') {
        throw new Error('Request timed out. Please check your internet connection.');
      }
      
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error('Cannot connect to server. Please check your internet connection.');
      }
      
      // Handle specific HTTP errors
      if (err.message.includes('401')) {
        throw new Error('Authentication failed. Please login again.');
      }
      
      if (err.message.includes('403')) {
        throw new Error('Access denied. Please login again.');
      }
      
      if (err.message.includes('404')) {
        throw new Error('Service not found. Please try again later.');
      }
      
      if (err.message.includes('500')) {
        throw new Error('Server error. Please try again later.');
      }
      
      throw new Error(err.message || 'Network error occurred');
    }
  };

  // Test API connection
  const testConnection = async () => {
    try {
      const response = await apiCall('/ping');
      console.log('API Connection Test:', response);
      return true;
    } catch (error) {
      console.error('API Connection Test Failed:', error);
      return false;
    }
  };

  // Authentication Functions
  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!username.trim() || !password.trim()) {
        throw new Error('Username and password are required');
      }

      // Test connection first
      const isConnected = await testConnection();
      if (!isConnected) {
        throw new Error('Cannot connect to server. Please check your internet connection.');
      }

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
        Alert.alert('Success', 'Login successful!');
        
        // Clear form
        setPassword('');
        setError(null);
        
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message);
      Alert.alert('Login Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!username.trim() || !password.trim()) {
        throw new Error('Username and password are required');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // Test connection first
      const isConnected = await testConnection();
      if (!isConnected) {
        throw new Error('Cannot connect to server. Please check your internet connection.');
      }

      const response = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ 
          username: username.trim(), 
          password: password.trim(), 
          email: email.trim() || null 
        }),
      });

      if (response.success) {
        Alert.alert('Success', 'Registration successful! Please login.');
        setCurrentScreen('login');
        setEmail('');
        setPassword('');
        setError(null);
      } else {
        throw new Error('Registration failed');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message);
      Alert.alert('Registration Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
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
  };

  // Fetch Products with enhanced error handling
  const fetchProducts = async () => {
    if (!authToken) {
      setError('Please log in to view products');
      Alert.alert('Error', 'Please log in to view products');
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
        storeAvailability: typeof product.storeAvailability === 'string'
          ? JSON.parse(product.storeAvailability || '[]')
          : product.storeAvailability || [],
      }));
      
      setProducts(parsedData);
      console.log(`Loaded ${parsedData.length} products`);
      
    } catch (err: any) {
      console.error('Fetch products error:', err);
      setError(err.message);
      
      if (err.message.includes('Authentication') || err.message.includes('login')) {
        Alert.alert('Session Expired', 'Please login again.', [
          { text: 'OK', onPress: handleLogout }
        ]);
      } else {
        Alert.alert('Error', `Failed to load products: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authToken && currentScreen === 'products') {
      fetchProducts();
    }
  }, [authToken, currentScreen]);

  // Auto-fetch products when accessing dashboard
  useEffect(() => {
    if (authToken && currentScreen === 'dashboard' && products.length === 0) {
      fetchProducts();
    }
  }, [authToken, currentScreen]);

  // Side Menu Component
  const SideMenu = () => {
    if (!showSideMenu) return null;

    return (
      <View style={styles.sideMenuOverlay}>
        <TouchableOpacity style={styles.sideMenuBackdrop} onPress={() => setShowSideMenu(false)} />
        <View style={styles.sideMenuContainer}>
          <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.sideMenuContent}>
            <View style={styles.sideMenuHeader}>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowSideMenu(false)}>
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
              <TouchableOpacity style={styles.sideMenuItem} onPress={() => { setCurrentScreen('dashboard'); setShowSideMenu(false); setSearchQuery(''); }}>
                <Text style={styles.sideMenuItemText}>Home</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sideMenuItem} onPress={() => { setCurrentScreen('products'); setShowSideMenu(false); setSearchQuery(''); }}>
                <Text style={styles.sideMenuItemText}>Products</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sideMenuItem} onPress={() => { setCurrentScreen('categories'); setShowSideMenu(false); setSearchQuery(''); }}>
                <Text style={styles.sideMenuItemText}>Categories</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sideMenuItem}>
                <Text style={styles.sideMenuItemText}>Stores</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sideMenuItem}>
                <Text style={styles.sideMenuItemText}>Finances</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sideMenuItem}>
                <Text style={styles.sideMenuItemText}>Settings</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>Log out</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    );
  };

  // Register Screen Component
  const RegisterScreen = () => {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.loginContainer}>
          <StatusBar barStyle="light-content" />
          <View style={styles.loginContent}>
            <Text style={styles.loginTitle}>Sign Up</Text>
            <Text style={styles.loginSubtitle}>Create your Inventor.io account</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter your username"
                placeholderTextColor="#ccc"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email (Optional)</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor="#ccc"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password (min 6 characters)"
                placeholderTextColor="#ccc"
                secureTextEntry
              />
            </View>

            {loading && <Text style={styles.loadingText}>Creating Account...</Text>}
            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity 
              style={[styles.loginButton, loading && styles.disabledButton]} 
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>Sign Up</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.switchScreenButton} 
              onPress={() => {
                setCurrentScreen('login');
                setError(null);
              }}
            >
              <Text style={styles.switchScreenText}>Already have an account? Log in</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  };

  // Login Screen Component
  const LoginScreen = () => {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.loginContainer}>
          <StatusBar barStyle="light-content" />
          <View style={styles.loginContent}>
            <Text style={styles.loginTitle}>Inventor.io</Text>
            <Text style={styles.loginSubtitle}>Welcome back! Please login to your account</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter your username"
                placeholderTextColor="#ccc"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor="#ccc"
                secureTextEntry
              />
            </View>

            {loading && <Text style={styles.loadingText}>Logging in...</Text>}
            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity 
              style={[styles.loginButton, loading && styles.disabledButton]} 
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>Log in</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.switchScreenButton} 
              onPress={() => {
                setCurrentScreen('register');
                setError(null);
              }}
            >
              <Text style={styles.switchScreenText}>Don't have an account? Sign up</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  };

  // Product Detail Screen Component
  const ProductDetailScreen = () => {
    if (!selectedProduct) return null;

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.menuButton} 
            onPress={() => {
              setCurrentScreen('products');
              setSelectedProduct(null);
              setSearchQuery('');
            }}
          >
            <Text style={styles.menuIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Product Details</Text>
          <TouchableOpacity style={styles.profileButton}>
            <Text style={styles.profileIcon}>👤</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.productDetailContainer}>
          <View style={styles.productDetailImageContainer}>
            <Image 
              source={{ uri: selectedProduct.image || 'https://via.placeholder.com/200' }} 
              style={styles.productDetailImage}
              onError={() => console.log(`Failed to load image for ${selectedProduct.name}`)}
            />
          </View>
          <Text style={styles.productDetailName}>{selectedProduct.name}</Text>
          <Text style={styles.productDetailBrand}>{selectedProduct.brand}</Text>
          <Text style={styles.productDetailSizes}>Available sizes: {selectedProduct.sizes}</Text>
          <Text style={styles.productDetailCategory}>Category: {selectedProduct.category}</Text>

          <View style={styles.productDetailCard}>
            <View style={styles.productDetailInfo}>
              <Text style={styles.productDetailLabel}>Product code: {selectedProduct.productCode}</Text>
              <Text style={styles.productDetailLabel}>Order name: {selectedProduct.orderName}</Text>
              <Text style={styles.productDetailLabel}>Stock: {selectedProduct.stock} items</Text>
              <Text style={styles.productDetailLabel}>Status: {selectedProduct.status}</Text>
            </View>
            <View style={styles.qrCodeContainer}>
              <View style={styles.qrCodePlaceholder}>
                <Text style={styles.qrCodeText}>QR</Text>
              </View>
            </View>
            <Text style={styles.storeAvailabilityTitle}>Store availability:</Text>
            {selectedProduct.storeAvailability && selectedProduct.storeAvailability.length > 0 ? (
              selectedProduct.storeAvailability.map((store, index) => (
                <View key={index} style={styles.storeAvailabilityItem}>
                  <Text style={styles.storeLocation}>{store.location}</Text>
                  <Text style={[styles.storeStatus, { color: store.available ? '#22c55e' : '#ef4444' }]}>
                    {store.available ? '✓' : '✕'}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.productDetailLabel}>No store availability data</Text>
            )}
            <Text style={styles.lastUpdate}>Last update {selectedProduct.lastUpdate}</Text>
          </View>
        </ScrollView>

        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => { setSearchQuery(''); setCurrentScreen('dashboard'); }}>
            <Text style={styles.navIcon}>🏠</Text>
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => Alert.alert('Info', 'Add product functionality coming soon!')}>
            <Text style={styles.navIcon}>➕</Text>
            <Text style={styles.navText}>Add</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => { setSearchQuery(''); setCurrentScreen('products'); setSelectedProduct(null); }}>
            <Text style={styles.navIcon}>📦</Text>
            <Text style={[styles.navText, { color: '#8B5CF6' }]}>Products</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => { setSearchQuery(''); setCurrentScreen('categories'); }}>
            <Text style={styles.navIcon}>📁</Text>
            <Text style={styles.navText}>Categories</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  };

  // Categories Screen Component
  const CategoriesScreen = () => {
    const categories = Array.from(new Set(products.map(p => p.category)))
      .map(category => ({
        id: category,
        name: category,
        count: products.filter(p => p.category === category).length,
        icon: getCategoryIcon(category)
      }));

    function getCategoryIcon(category: string): string {
      const iconMap: { [key: string]: string } = {
        'bottoms': '👖',
        'coats': '🧥',
        'jeans': '👖',
        'tops': '👕',
        'shirts': '👔',
        'accessories': '👜',
        'shoes': '👟'
      };
      return iconMap[category.toLowerCase()] || '📦';
    }

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuButton} onPress={() => setShowSideMenu(true)}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Categories</Text>
          <TouchableOpacity style={styles.profileButton}>
            <Text style={styles.profileIcon}>👤</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search categories..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity style={styles.clearSearchButton} onPress={() => setSearchQuery('')}>
                <Text style={styles.clearSearchText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {loading && (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>Loading categories...</Text>
          </View>
        )}
        {error && (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>Error: {error}</Text>
            <TouchableOpacity style={styles.clearSearchButton2} onPress={fetchProducts}>
              <Text style={styles.clearSearchButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && searchQuery.length > 0 && (
          <View style={styles.searchResultsInfo}>
            <Text style={styles.searchResultsText}>
              {categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).length} {categories.length === 1 ? 'result' : 'results'} found
            </Text>
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearchLink}>Clear search</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && (
          <ScrollView style={styles.categoriesContainer}>
            {categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && searchQuery.length > 0 ? (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsText}>No categories found</Text>
                <Text style={styles.noResultsSubtext}>Try a different search term</Text>
                <TouchableOpacity style={styles.clearSearchButton2} onPress={() => setSearchQuery('')}>
                  <Text style={styles.clearSearchButtonText}>Clear Search</Text>
                </TouchableOpacity>
              </View>
            ) : categories.length === 0 ? (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsText}>No categories available</Text>
                <Text style={styles.noResultsSubtext}>Add products to see categories</Text>
              </View>
            ) : (
              categories
                .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((category) => (
                  <TouchableOpacity 
                    key={category.id} 
                    style={styles.categoryCard}
                    onPress={() => {
                      setSearchQuery(category.name);
                      setCurrentScreen('products');
                    }}
                  >
                    <View style={styles.categoryIconContainer}>
                      <Text style={styles.categoryIconText}>{category.icon}</Text>
                    </View>
                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryName}>{category.name}</Text>
                      <Text style={styles.categoryCount}>{category.count} items</Text>
                    </View>
                  </TouchableOpacity>
                ))
            )}
          </ScrollView>
        )}

        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => { setSearchQuery(''); setCurrentScreen('dashboard'); }}>
            <Text style={styles.navIcon}>🏠</Text>
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => Alert.alert('Info', 'Add product functionality coming soon!')}>
            <Text style={styles.navIcon}>➕</Text>
            <Text style={styles.navText}>Add</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => { setSearchQuery(''); setCurrentScreen('products'); }}>
            <Text style={styles.navIcon}>📦</Text>
            <Text style={[styles.navText, { color: '#8B5CF6' }]}>Products</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => { setSearchQuery(''); setCurrentScreen('categories'); }}>
            <Text style={styles.navIcon}>📁</Text>
            <Text style={[styles.navText, { color: '#8B5CF6' }]}>Categories</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  };

  // Dashboard Screen Component
  const DashboardScreen = () => {
    const activityData = [
      { label: 'TOTAL PRODUCTS', value: products.length, color: '#8B5CF6' },
      { label: 'LOW STOCK', value: products.filter(p => p.stock < 10).length, color: '#ef4444' },
      { label: 'CATEGORIES', value: new Set(products.map(p => p.category)).size, color: '#22c55e' },
      { label: 'ACTIVE ITEMS', value: products.filter(p => p.status === 'Active').length, color: '#8B5CF6' },
    ];

    const salesData = [
      { label: 'Active', value: products.filter(p => p.status === 'Active').length * 2, color: '#22c55e' },
      { label: 'Inactive', value: products.filter(p => p.status === 'Inactive').length * 2, color: '#ef4444' },
      { label: 'Low Stock', value: products.filter(p => p.stock < 10).length * 3, color: '#f59e0b' },
      { label: 'In Stock', value: products.filter(p => p.stock >= 10).length * 2, color: '#8B5CF6' },
    ];

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuButton} onPress={() => setShowSideMenu(true)}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Inventor.io</Text>
          <TouchableOpacity style={styles.profileButton}>
            <Text style={styles.profileIcon}>👤</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.dashboardContent}>
          {/* Connection Status Indicator */}
          <View style={styles.connectionStatus}>
            <Text style={[styles.connectionText, { color: authToken ? '#22c55e' : '#ef4444' }]}>
              {authToken ? '🟢 Connected to Cloud' : '🔴 Not Connected'}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Inventory Overview</Text>
            <View style={styles.activityGrid}>
              {activityData.map((item, index) => (
                <View key={index} style={styles.activityCard}>
                  <Text style={[styles.activityValue, { color: item.color }]}>{item.value}</Text>
                  <Text style={styles.activityLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Product Status Distribution</Text>
            <View style={styles.chartContainer}>
              <View style={styles.chartBars}>
                {salesData.map((item, index) => (
                  <View key={index} style={styles.barContainer}>
                    <View style={[styles.bar, { height: Math.max(item.value * 2, 10), backgroundColor: item.color }]} />
                    <Text style={styles.barLabel}>{item.label}</Text>
                    <Text style={styles.barValue}>{item.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Categories</Text>
            <View style={styles.categoryIconsGrid}>
              {Array.from(new Set(products.map(p => p.category))).slice(0, 6).map((category, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.categoryIconCard}
                  onPress={() => {
                    setSearchQuery(category);
                    setCurrentScreen('products');
                  }}
                >
                  <Text style={styles.categoryIcon}>
                    {category.toLowerCase().includes('bottom') || category.toLowerCase().includes('jean') ? '👖' :
                     category.toLowerCase().includes('top') || category.toLowerCase().includes('shirt') ? '👕' :
                     category.toLowerCase().includes('coat') || category.toLowerCase().includes('jacket') ? '🧥' :
                     category.toLowerCase().includes('shoe') ? '👟' :
                     category.toLowerCase().includes('access') ? '👜' : '📦'}
                  </Text>
                  <Text style={styles.categoryName2}>{category}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.viewMoreLink} onPress={() => setCurrentScreen('categories')}>
              <Text style={styles.viewMoreLinkText}>View more</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Inventory Statistics</Text>
            <View style={styles.categoryStatsCard}>
              <View style={styles.categoryStatRow}>
                <Text style={styles.categoryStatLabel}>Low stock items</Text>
                <View style={styles.categoryStatValue}>
                  <Text style={[styles.categoryStatNumber, { color: '#ef4444' }]}>
                    {products.filter(p => p.stock < 10).length}
                  </Text>
                  <Text style={styles.categoryStatIcon}>⚠️</Text>
                </View>
              </View>
              <View style={styles.categoryStatRow}>
                <Text style={styles.categoryStatLabel}>Item categories</Text>
                <Text style={styles.categoryStatNumber}>{new Set(products.map(p => p.category)).size}</Text>
              </View>
              <View style={styles.categoryStatRow}>
                <Text style={styles.categoryStatLabel}>Total products</Text>
                <Text style={styles.categoryStatNumber}>{products.length}</Text>
              </View>
              <View style={styles.categoryStatRow}>
                <Text style={styles.categoryStatLabel}>Active products</Text>
                <Text style={[styles.categoryStatNumber, { color: '#22c55e' }]}>
                  {products.filter(p => p.status === 'Active').length}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.storesListCard}>
              <TouchableOpacity style={styles.storeItem} onPress={() => setCurrentScreen('products')}>
                <Text style={styles.storeLocation}>View All Products</Text>
                <Text style={styles.storeArrow}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.storeItem} onPress={() => setCurrentScreen('categories')}>
                <Text style={styles.storeLocation}>Browse Categories</Text>
                <Text style={styles.storeArrow}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.storeItem} onPress={() => Alert.alert('Info', 'Add product functionality coming soon!')}>
                <Text style={styles.storeLocation}>Add New Product</Text>
                <Text style={styles.storeArrow}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.storeItem}>
                <Text style={styles.storeLocation}>Low Stock Alert</Text>
                <Text style={styles.storeArrow}>›</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => { setSearchQuery(''); setCurrentScreen('dashboard'); }}>
            <Text style={styles.navIcon}>🏠</Text>
            <Text style={[styles.navText, { color: '#8B5CF6' }]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => Alert.alert('Info', 'Add product functionality coming soon!')}>
            <Text style={styles.navIcon}>➕</Text>
            <Text style={styles.navText}>Add</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => { setSearchQuery(''); setCurrentScreen('products'); }}>
            <Text style={styles.navIcon}>📦</Text>
            <Text style={styles.navText}>Products</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => { setSearchQuery(''); setCurrentScreen('categories'); }}>
            <Text style={styles.navIcon}>📁</Text>
            <Text style={styles.navText}>Categories</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  };

  // Products Screen Component
  const ProductsScreen = () => {
    const filteredProducts = products.filter((product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuButton} onPress={() => setShowSideMenu(true)}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Products</Text>
          <TouchableOpacity style={styles.profileButton}>
            <Text style={styles.profileIcon}>👤</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity style={styles.clearSearchButton} onPress={() => setSearchQuery('')}>
                <Text style={styles.clearSearchText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => Alert.alert('Info', 'Add product functionality coming soon!')}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton} onPress={fetchProducts}>
            <Text style={styles.filterText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>Loading products...</Text>
          </View>
        )}
        {error && (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>Error: {error}</Text>
            <TouchableOpacity style={styles.clearSearchButton2} onPress={fetchProducts}>
              <Text style={styles.clearSearchButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && searchQuery.length > 0 && (
          <View style={styles.searchResultsInfo}>
            <Text style={styles.searchResultsText}>
              {filteredProducts.length} {filteredProducts.length === 1 ? 'result' : 'results'} found
            </Text>
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearchLink}>Clear search</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && (
          <ScrollView style={styles.productsList}>
            {filteredProducts.length === 0 && searchQuery.length > 0 ? (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsText}>No products found</Text>
                <Text style={styles.noResultsSubtext}>Try a different search term</Text>
                <TouchableOpacity style={styles.clearSearchButton2} onPress={() => setSearchQuery('')}>
                  <Text style={styles.clearSearchButtonText}>Clear Search</Text>
                </TouchableOpacity>
              </View>
            ) : filteredProducts.length === 0 && products.length === 0 ? (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsText}>No products available</Text>
                <Text style={styles.noResultsSubtext}>Add some products to get started</Text>
              </View>
            ) : (
              filteredProducts.map((product) => (
                <View key={product.id} style={styles.productCard}>
                  <Image 
                    source={{ uri: product.image || 'https://via.placeholder.com/60' }} 
                    style={styles.productImage}
                    onError={() => console.log(`Failed to load image for ${product.name}`)}
                  />
                  <View style={styles.productInfo}>
                    <View style={styles.productDetails}>
                      <Text style={styles.stockText}>Stock: {product.stock} in stock</Text>
                      <Text style={styles.categoryText}>Category: {product.category}</Text>
                      <Text style={styles.locationText}>Location: {product.location}</Text>
                      <Text style={styles.brandText}>Brand: {product.brand}</Text>
                    </View>
                    <View style={styles.productActions}>
                      <TouchableOpacity style={[styles.statusButton, { backgroundColor: product.status === 'Active' ? '#22c55e' : '#ef4444' }]}>
                        <Text style={styles.statusText}>{product.status}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.moreButton} onPress={() => {
                        setSelectedProduct(product);
                        setCurrentScreen('product-detail');
                      }}>
                        <Text style={styles.moreIcon}>›</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.productName}>{product.name}</Text>
                </View>
              ))
            )}
          </ScrollView>
        )}

        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => { setSearchQuery(''); setCurrentScreen('dashboard'); }}>
            <Text style={styles.navIcon}>🏠</Text>
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => Alert.alert('Info', 'Add product functionality coming soon!')}>
            <Text style={styles.navIcon}>➕</Text>
            <Text style={styles.navText}>Add</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => { setSearchQuery(''); setCurrentScreen('products'); }}>
            <Text style={styles.navIcon}>📦</Text>
            <Text style={[styles.navText, { color: '#8B5CF6' }]}>Products</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => { setSearchQuery(''); setCurrentScreen('categories'); }}>
            <Text style={styles.navIcon}>📁</Text>
            <Text style={styles.navText}>Categories</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  };

  // Main Render
  return (
    <>
      {currentScreen === 'login' && <LoginScreen />}
      {currentScreen === 'register' && <RegisterScreen />}
      {currentScreen === 'dashboard' && <DashboardScreen />}
      {currentScreen === 'products' && <ProductsScreen />}
      {currentScreen === 'product-detail' && <ProductDetailScreen />}
      {currentScreen === 'categories' && <CategoriesScreen />}
      <SideMenu />
    </>
  );
};

// Enhanced Styles with cloud connection indicator
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loginContent: {
    width: '100%',
    maxWidth: 400,
    padding: 30,
  },
  loginTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  loginSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: 'white',
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: '#333',
  },
  loginButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 15,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  disabledButton: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  switchScreenButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchScreenText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontSize: 16,
    marginVertical: 10,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginVertical: 10,
  },
  userInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  userInfoText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  userRoleText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textTransform: 'capitalize',
  },
  connectionStatus: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  connectionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  menuButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 18,
    color: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  profileButton: {
    width: 30,
    height: 30,
    backgroundColor: '#8B5CF6',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 16,
    color: 'white',
  },
  dashboardContent: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    width: '48%',
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: 5,
  },
  activityLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
  },
  barContainer: {
    alignItems: 'center',
  },
  bar: {
    width: 20,
    borderRadius: 10,
    marginBottom: 10,
    minHeight: 10,
  },
  barLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  barValue: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
  categoryIconsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  categoryIconCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#E0D1FF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryName2: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  viewMoreLink: {
    alignItems: 'flex-end',
    marginTop: 5,
  },
  viewMoreLinkText: {
    color: '#8B5CF6',
    fontSize: 14,
  },
  categoryStatsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryStatLabel: {
    fontSize: 14,
    color: '#333',
  },
  categoryStatValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryStatNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5CF6',
    marginRight: 5,
  },
  categoryStatIcon: {
    fontSize: 16,
  },
  storesListCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  storeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  storeLocation: {
    fontSize: 14,
    color: '#333',
  },
  storeArrow: {
    fontSize: 18,
    color: '#8B5CF6',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  searchIcon: {
    fontSize: 16,
    color: '#999',
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  addButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  filterButton: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  filterText: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '500',
  },
  productsList: {
    flex: 1,
    padding: 20,
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginBottom: 10,
  },
  productInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  productDetails: {
    flex: 1,
  },
  stockText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  brandText: {
    fontSize: 14,
    color: '#666',
  },
  productActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 5,
    marginRight: 10,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  moreButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreIcon: {
    fontSize: 20,
    color: '#8B5CF6',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 5,
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  navText: {
    fontSize: 12,
    color: '#666',
  },
  sideMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  sideMenuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sideMenuContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '80%',
    maxWidth: 300,
  },
  sideMenuContent: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  sideMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    marginRight: 20,
  },
  closeIcon: {
    fontSize: 20,
    color: 'white',
  },
  sideMenuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  sideMenuItems: {
    flex: 1,
  },
  sideMenuItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  sideMenuItemText: {
    fontSize: 18,
    color: 'white',
    fontWeight: '500',
  },
  logoutButton: {
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 40,
  },
  logoutText: {
    fontSize: 18,
    color: 'white',
    fontWeight: '500',
  },
  productDetailContainer: {
    flex: 1,
    padding: 20,
  },
  productDetailImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  productDetailImage: {
    width: 200,
    height: 200,
    borderRadius: 16,
  },
  productDetailName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  productDetailBrand: {
    fontSize: 16,
    color: '#8B5CF6',
    textAlign: 'center',
    marginBottom: 20,
  },
  productDetailSizes: {
    fontSize: 16,
    color: '#8B5CF6',
    textAlign: 'center',
    marginBottom: 5,
  },
  productDetailCategory: {
    fontSize: 16,
    color: '#8B5CF6',
    textAlign: 'center',
    marginBottom: 20,
  },
  productDetailCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#8B5CF6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productDetailInfo: {
    marginBottom: 20,
  },
  productDetailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrCodePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrCodeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  storeAvailabilityTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  storeAvailabilityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  storeLocation: {
    fontSize: 14,
    color: '#333',
  },
  storeStatus: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  lastUpdate: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 15,
  },
  categoriesContainer: {
    flex: 1,
    padding: 20,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#E0D1FF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  categoryIconText: {
    fontSize: 24,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  categoryCount: {
    fontSize: 14,
    color: '#666',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  clearSearchButton: {
    padding: 5,
    marginLeft: 5,
  },
  clearSearchText: {
    fontSize: 16,
    color: '#999',
  },
  searchResultsInfo: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
  },
  searchResultsText: {
    fontSize: 14,
    color: '#666',
  },
  clearSearchLink: {
    fontSize: 14,
    color: '#8B5CF6',
    marginTop: 5,
  },
  clearSearchButton2: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 15,
  },
  clearSearchButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default InventoryApp;
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
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
  username: string;
  password: string;
}

// Mock user data
const mockUser: User = {
  username: '1',
  password: '2',
};

const InventoryApp = () => {
  const [currentScreen, setCurrentScreen] = useState<'login' | 'dashboard' | 'products' | 'product-detail' | 'categories'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3008/api/products');
        const data = await response.json();
        if (response.ok) {
          setProducts(data);
          setError(null);
        } else {
          setError('Failed to load products');
        }
      } catch (err) {
        setError('Error fetching products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

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

            <View style={styles.sideMenuItems}>
              <TouchableOpacity style={styles.sideMenuItem} onPress={() => { setCurrentScreen('dashboard'); setShowSideMenu(false); }}>
                <Text style={styles.sideMenuItemText}>Home</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sideMenuItem} onPress={() => { setCurrentScreen('products'); setShowSideMenu(false); }}>
                <Text style={styles.sideMenuItemText}>Products</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sideMenuItem} onPress={() => { setCurrentScreen('categories'); setShowSideMenu(false); }}>
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

            <TouchableOpacity style={styles.logoutButton} onPress={() => {
              setCurrentScreen('login');
              setShowSideMenu(false);
              setUsername('');
              setPassword('');
            }}>
              <Text style={styles.logoutText}>Log out</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    );
  };

  // Product Detail Screen Component
  const ProductDetailScreen = () => {
    if (!selectedProduct) return null;

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuButton} onPress={() => setCurrentScreen('products')}>
            <Text style={styles.menuIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Products</Text>
          <TouchableOpacity style={styles.profileButton}>
            <Text style={styles.profileIcon}>👤</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.productDetailContainer}>
          <View style={styles.productDetailImageContainer}>
            <Image source={{ uri: selectedProduct.image }} style={styles.productDetailImage} />
          </View>
          <Text style={styles.productDetailName}>{selectedProduct.name}</Text>
          <Text style={styles.productDetailBrand}>{selectedProduct.brand}</Text>
          <Text style={styles.productDetailSizes}>Available sizes: {selectedProduct.sizes}</Text>
          <Text style={styles.productDetailCategory}>Category: {selectedProduct.category}</Text>

          <View style={styles.productDetailCard}>
            <Text style={styles.productDetailCardTitle}>Gender: Male, Female</Text>
            <View style={styles.productDetailInfo}>
              <Text style={styles.productDetailLabel}>Product code: {selectedProduct.productCode}</Text>
              <Text style={styles.productDetailLabel}>Order name: {selectedProduct.orderName}</Text>
            </View>
            <View style={styles.qrCodeContainer}>
              <View style={styles.qrCodePlaceholder}>
                <Text style={styles.qrCodeText}>QR</Text>
              </View>
            </View>
            <Text style={styles.storeAvailabilityTitle}>Store availability:</Text>
            {selectedProduct.storeAvailability.map((store, index) => (
              <View key={index} style={styles.storeAvailabilityItem}>
                <Text style={styles.storeLocation}>{store.location}</Text>
                <Text style={[styles.storeStatus, { color: store.available ? '#22c55e' : '#ef4444' }]}>
                  {store.available ? '✓' : '✕'}
                </Text>
              </View>
            ))}
            <Text style={styles.lastUpdate}>Last update {selectedProduct.lastUpdate}</Text>
          </View>
        </ScrollView>

        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => { setSearchQuery(''); setCurrentScreen('dashboard'); }}>
            <Text style={styles.navIcon}>🏠</Text>
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navIcon}>➕</Text>
            <Text style={styles.navText}>Add</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('products')}>
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
    const categories = [
      { id: '1', name: 'Bottoms', count: 49, icon: '👕' },
      { id: '2', name: 'Coats', count: 23, icon: '🧥' },
      { id: '3', name: 'Jeans', count: 11, icon: '👖' },
      { id: '4', name: 'Tops', count: 7, icon: '👔' },
    ];

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

        <ScrollView style={styles.categoriesContainer}>
          {categories.map((category) => (
            <View key={category.id} style={styles.categoryCard}>
              <View style={styles.categoryIconContainer}>
                <Text style={styles.categoryIconText}>{category.icon}</Text>
              </View>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryCount}>{category.count} items</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('dashboard')}>
            <Text style={styles.navIcon}>🏠</Text>
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navIcon}>➕</Text>
            <Text style={styles.navText}>Add</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('products')}>
            <Text style={styles.navIcon}>📦</Text>
            <Text style={styles.navText}>Products</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('categories')}>
            <Text style={styles.navIcon}>📁</Text>
            <Text style={[styles.navText, { color: '#8B5CF6' }]}>Categories</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  };

  // Login Screen Component
  const LoginScreen = () => {
    const handleLogin = () => {
      if (username === mockUser.username && password === mockUser.password) {
        setCurrentScreen('dashboard');
      } else {
        alert('Invalid credentials');
      }
    };

    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.loginContainer}>
          <StatusBar barStyle="light-content" />
          <View style={styles.loginContent}>
            <Text style={styles.loginTitle}>Inventor.io</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder=""
                placeholderTextColor="#ccc"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder=""
                placeholderTextColor="#ccc"
                secureTextEntry
              />
            </View>
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>Log in</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  };

  // Dashboard Screen Component
  const DashboardScreen = () => {
    const activityData = [
      { label: 'NEW ITEMS', value: 741, color: '#8B5CF6' },
      { label: 'NEW ORDERS', value: 123, color: '#8B5CF6' },
      { label: 'REFUNDS', value: 12, color: '#8B5CF6' },
      { label: 'MESSAGE', value: 1, color: '#8B5CF6' },
      { label: 'GROUPS', value: 4, color: '#8B5CF6' },
    ];

    const salesData = [
      { label: 'Confirmed', value: 40, color: '#8B5CF6' },
      { label: 'Packed', value: 80, color: '#8B5CF6' },
      { label: 'Refunded', value: 60, color: '#8B5CF6' },
      { label: 'Shipped', value: 100, color: '#7C3AED' },
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
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent activity</Text>
            <View style={styles.activityGrid}>
              {activityData.map((item, index) => (
                <View key={index} style={styles.activityCard}>
                  <Text style={styles.activityValue}>{item.value}</Text>
                  <Text style={styles.activityLabel}>{item.label}</Text>
                </View>
              ))}
              <TouchableOpacity style={styles.viewMoreButton}>
                <Text style={styles.viewMoreText}>|</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sales</Text>
            <View style={styles.chartContainer}>
              <View style={styles.chartBars}>
                {salesData.map((item, index) => (
                  <View key={index} style={styles.barContainer}>
                    <View style={[styles.bar, { height: item.value, backgroundColor: item.color }]} />
                    <Text style={styles.barLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top item categories</Text>
            <View style={styles.categoryIconsGrid}>
              <View style={styles.categoryIconCard}><Text style={styles.categoryIcon}>👕</Text></View>
              <View style={styles.categoryIconCard}><Text style={styles.categoryIcon}>👖</Text></View>
              <View style={styles.categoryIconCard}><Text style={styles.categoryIcon}>👜</Text></View>
              <View style={styles.categoryIconCard}><Text style={styles.categoryIcon}>🧥</Text></View>
              <View style={styles.categoryIconCard}><Text style={styles.categoryIcon}>👔</Text></View>
              <View style={styles.categoryIconCard}><Text style={styles.categoryIcon}>👓</Text></View>
            </View>
            <TouchableOpacity style={styles.viewMoreLink}>
              <Text style={styles.viewMoreLinkText}>View more</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top item categories</Text>
            <View style={styles.categoryStatsCard}>
              <View style={styles.categoryStatRow}>
                <Text style={styles.categoryStatLabel}>Low stock items</Text>
                <View style={styles.categoryStatValue}>
                  <Text style={styles.categoryStatNumber}>12</Text>
                  <Text style={styles.categoryStatIcon}>⚠️</Text>
                </View>
              </View>
              <View style={styles.categoryStatRow}>
                <Text style={styles.categoryStatLabel}>Item categories</Text>
                <Text style={styles.categoryStatNumber}>6</Text>
              </View>
              <View style={styles.categoryStatRow}>
                <Text style={styles.categoryStatLabel}>Refunded items</Text>
                <Text style={styles.categoryStatNumber}>1</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Stores list</Text>
            <View style={styles.storesListCard}>
              <TouchableOpacity style={styles.storeItem}>
                <Text style={styles.storeLocation}>Manchester, UK</Text>
                <Text style={styles.storeArrow}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.storeItem}>
                <Text style={styles.storeLocation}>Yorkshire, UK</Text>
                <Text style={styles.storeArrow}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.storeItem}>
                <Text style={styles.storeLocation}>Hull, UK</Text>
                <Text style={styles.storeArrow}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.storeItem}>
                <Text style={styles.storeLocation}>Leicester, UK</Text>
                <Text style={styles.storeArrow}>›</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('dashboard')}>
            <Text style={styles.navIcon}>🏠</Text>
            <Text style={[styles.navText, { color: '#8B5CF6' }]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navIcon}>➕</Text>
            <Text style={styles.navText}>Add</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('products')}>
            <Text style={styles.navIcon}>📦</Text>
            <Text style={styles.navText}>Product</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('categories')}>
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
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
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
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>+ Add Product</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterText}>Filter ▼</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>Loading products...</Text>
          </View>
        )}
        {error && (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>{error}</Text>
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
            ) : (
              filteredProducts.map((product) => (
                <View key={product.id} style={styles.productCard}>
                  <Image source={{ uri: product.image }} style={styles.productImage} />
                  <View style={styles.productInfo}>
                    <View style={styles.productDetails}>
                      <Text style={styles.stockText}>Stock: {product.stock} in stock</Text>
                      <Text style={styles.categoryText}>Category: {product.category}</Text>
                      <Text style={styles.locationText}>Location: {product.location}</Text>
                    </View>
                    <View style={styles.productActions}>
                      <TouchableOpacity style={styles.statusButton}>
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
          <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('dashboard')}>
            <Text style={styles.navIcon}>🏠</Text>
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navIcon}>➕</Text>
            <Text style={styles.navText}>Add</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('products')}>
            <Text style={styles.navIcon}>📦</Text>
            <Text style={[styles.navText, { color: '#8B5CF6' }]}>Products</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('categories')}>
            <Text style={styles.navIcon}>📁</Text>
            <Text style={styles.navText}>Categories</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  };

  // Main render
  return (
    <>
      {currentScreen === 'login' && <LoginScreen />}
      {currentScreen === 'dashboard' && <DashboardScreen />}
      {currentScreen === 'products' && <ProductsScreen />}
      {currentScreen === 'product-detail' && <ProductDetailScreen />}
      {currentScreen === 'categories' && <CategoriesScreen />}
      <SideMenu />
    </>
  );
};

// Styles (from your provided code)
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
    marginBottom: 50,
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
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
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
  viewMoreButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  viewMoreText: {
    color: 'white',
    fontSize: 12,
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
  },
  barLabel: {
    fontSize: 12,
    color: '#666',
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
    marginBottom: 40,
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
  productDetailCardTitle: {
    fontSize: 16,
    color: '#8B5CF6',
    marginBottom: 15,
    fontWeight: '500',
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
  },
  debugText: {
    fontSize: 12,
    color: '#999',
    padding: 10,
    backgroundColor: '#f0f0f0',
    marginBottom: 10,
    borderRadius: 4,
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
  productImagePlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  productImageText: {
    fontSize: 24,
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
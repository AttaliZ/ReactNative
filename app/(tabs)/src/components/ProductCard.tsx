import { Image } from 'expo-image';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

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

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
  style?: any;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  style,
}) => {
  const handlePress = () => {
    onPress(product);
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  const getStockColor = (stock: number) => {
    if (stock <= 0) return '#ef4444';
    if (stock < 10) return '#f59e0b';
    return '#22c55e';
  };

  const getStockText = (stock: number) => {
    if (stock <= 0) return 'Out of stock';
    if (stock < 10) return 'Low stock';
    return `${stock} in stock`;
  };

  return (
    <TouchableOpacity
      style={[styles.productCard, style]}
      onPress={handlePress}
      activeOpacity={0.7}
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
            {formatPrice(product.price || 0)}
          </Text>
          <Text style={[
            styles.productStock,
            { color: getStockColor(product.stock || 0) }
          ]}>
            {getStockText(product.stock || 0)}
          </Text>
        </View>
        
        <View style={styles.productFooter}>
          <View style={[
            styles.statusBadge,
            { 
              backgroundColor: product.status === 'Active' 
                ? 'rgba(34, 197, 94, 0.1)' 
                : 'rgba(239, 68, 68, 0.1)'
            }
          ]}>
            <Text style={[
              styles.productStatus,
              { color: product.status === 'Active' ? '#22c55e' : '#ef4444' }
            ]}>
              {product.status}
            </Text>
          </View>
          
          {product.brand && (
            <Text style={styles.productBrand} numberOfLines={1}>
              {product.brand}
            </Text>
          )}
        </View>
        
        {product.productCode && (
          <Text style={styles.productCode} numberOfLines={1}>
            #{product.productCode}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
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
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  productStatus: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  productBrand: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    fontStyle: 'italic',
    flex: 1,
    textAlign: 'right',
  },
  productCode: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '500',
  },
});

export default ProductCard;
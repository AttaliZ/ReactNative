import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface Category {
  id: string;
  name: string;
  count: number;
  icon: string;
}

interface CategoryCardProps {
  category: Category;
  onPress: (category: Category) => void;
  variant?: 'grid' | 'list';
  style?: any;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  onPress,
  variant = 'grid',
  style,
}) => {
  const handlePress = () => {
    onPress(category);
  };

  if (variant === 'list') {
    return (
      <TouchableOpacity
        style={[styles.categoryListCard, style]}
        onPress={handlePress}
        activeOpacity={0.7}
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
    );
  }

  return (
    <TouchableOpacity
      style={[styles.categoryCard, style]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Text style={styles.categoryIcon}>{category.icon}</Text>
      <Text style={styles.categoryName} numberOfLines={2}>
        {category.name}
      </Text>
      <Text style={styles.categoryCount}>
        {category.count} {category.count === 1 ? 'item' : 'items'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Grid variant styles
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
    minHeight: 100,
    justifyContent: 'center',
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
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // List variant styles
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
});

export default CategoryCard;
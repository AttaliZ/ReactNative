import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface NavItem {
  key: string;
  icon: string;
  label: string;
  adminOnly?: boolean;
}

interface BottomNavigationProps {
  activeScreen: string;
  user: User | null;
  onNavigate: (screen: string) => void;
  onAdminActionDenied?: (message: string) => void;
  style?: any;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeScreen,
  user,
  onNavigate,
  onAdminActionDenied,
  style,
}) => {
  const navItems: NavItem[] = [
    { key: 'dashboard', icon: '🏠', label: 'Home' },
    { key: 'add-product', icon: '➕', label: 'Add', adminOnly: true },
    { key: 'products', icon: '📦', label: 'Products' },
    { key: 'categories', icon: '📁', label: 'Categories' },
  ];

  const handleNavPress = (item: NavItem) => {
    if (item.adminOnly && user?.role !== 'admin') {
      if (onAdminActionDenied) {
        onAdminActionDenied('Only admins can add products.');
      }
      return;
    }
    onNavigate(item.key);
  };

  return (
    <View style={[styles.bottomNav, style]}>
      {navItems.map((item) => {
        if (item.adminOnly && user?.role !== 'admin') return null;
        
        const isActive = activeScreen === item.key;
        
        return (
          <TouchableOpacity
            key={item.key}
            style={styles.navItem}
            onPress={() => handleNavPress(item)}
            activeOpacity={0.7}
          >
            <Text style={[styles.navIcon, isActive && styles.navIconActive]}>
              {item.icon}
            </Text>
            <Text style={[styles.navText, isActive && styles.navTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
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
  navIconActive: {
    color: '#8b5cf6',
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

export default BottomNavigation;
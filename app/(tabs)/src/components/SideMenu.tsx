import { LinearGradient } from 'expo-linear-gradient';
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

interface MenuItem {
  key: string;
  label: string;
  icon?: string;
}

interface SideMenuProps {
  visible: boolean;
  user: User | null;
  onClose: () => void;
  onNavigate: (screen: string) => void;
  onLogout: () => void;
  style?: any;
}

const SideMenu: React.FC<SideMenuProps> = ({
  visible,
  user,
  onClose,
  onNavigate,
  onLogout,
  style,
}) => {
  if (!visible) return null;

  const menuItems: MenuItem[] = [
    { key: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { key: 'products', label: 'Products', icon: '📦' },
    { key: 'categories', label: 'Categories', icon: '📁' },
  ];

  const handleNavigation = (screen: string) => {
    onNavigate(screen);
    onClose();
  };

  const handleLogout = () => {
    onLogout();
    onClose();
  };

  return (
    <View style={[styles.sideMenuOverlay, style]}>
      <TouchableOpacity 
        style={styles.sideMenuBackdrop} 
        onPress={onClose} 
        activeOpacity={1}
      />
      <View style={styles.sideMenuContainer}>
        <LinearGradient 
          colors={['#8B5CF6', '#7C3AED']} 
          style={styles.sideMenuContent}
        >
          <View style={styles.sideMenuHeader}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={onClose}
              activeOpacity={0.7}
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
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={styles.sideMenuItem}
                onPress={() => handleNavigation(item.key)}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemContent}>
                  {item.icon && (
                    <Text style={styles.menuItemIcon}>{item.icon}</Text>
                  )}
                  <Text style={styles.sideMenuItemText}>{item.label}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sideMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  sideMenuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemIcon: {
    fontSize: 20,
    color: '#fff',
    marginRight: 12,
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
});

export default SideMenu;
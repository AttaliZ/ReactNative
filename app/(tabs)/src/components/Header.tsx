import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  onMenuPress?: () => void;
  onProfilePress?: () => void;
  rightComponent?: React.ReactNode;
  style?: any;
}

const Header: React.FC<HeaderProps> = ({
  title,
  showBack = false,
  onBack,
  onMenuPress,
  onProfilePress,
  rightComponent,
  style,
}) => {
  const handleLeftPress = () => {
    if (showBack && onBack) {
      onBack();
    } else if (onMenuPress) {
      onMenuPress();
    }
  };

  const handleRightPress = () => {
    if (onProfilePress) {
      onProfilePress();
    }
  };

  return (
    <View style={[styles.header, style]}>
      <TouchableOpacity
        style={styles.leftButton}
        onPress={handleLeftPress}
        activeOpacity={0.7}
      >
        <Text style={styles.leftIcon}>
          {showBack ? '←' : '☰'}
        </Text>
      </TouchableOpacity>
      
      <Text style={styles.headerTitle} numberOfLines={1}>
        {title}
      </Text>
      
      {rightComponent || (
        <TouchableOpacity
          style={styles.rightButton}
          onPress={handleRightPress}
          activeOpacity={0.7}
        >
          <Text style={styles.rightIcon}>👤</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
  leftButton: {
    padding: 8,
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  leftIcon: {
    fontSize: 24,
    color: '#374151',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  rightButton: {
    padding: 8,
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  rightIcon: {
    fontSize: 24,
    color: '#6b7280',
  },
});

export default Header;
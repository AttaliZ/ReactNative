import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface StatusSelectorProps {
  status: 'Active' | 'Inactive';
  onStatusChange: (status: 'Active' | 'Inactive') => void;
  label?: string;
  style?: any;
}

const StatusSelector: React.FC<StatusSelectorProps> = ({
  status,
  onStatusChange,
  label = "Status",
  style,
}) => {
  return (
    <View style={[styles.inputContainer, style]}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.statusButtons}>
        <TouchableOpacity
          style={[
            styles.statusButton,
            status === 'Active' && styles.statusButtonActive
          ]}
          onPress={() => onStatusChange('Active')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.statusText,
            status === 'Active' && styles.statusTextActive
          ]}>
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.statusButton,
            status === 'Inactive' && styles.statusButtonInactive
          ]}
          onPress={() => onStatusChange('Inactive')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.statusText,
            status === 'Inactive' && styles.statusTextInactive
          ]}>
            Inactive
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  statusButtons: {
    flexDirection: 'row',
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    padding: 4,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginHorizontal: 2,
  },
  statusButtonActive: {
    backgroundColor: '#22c55e',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  statusButtonInactive: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  statusTextActive: {
    color: '#fff',
  },
  statusTextInactive: {
    color: '#fff',
  },
});

export default StatusSelector;
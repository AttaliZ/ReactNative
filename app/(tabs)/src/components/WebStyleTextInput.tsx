import React, { useCallback, useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface FormData {
  name: string;
  description: string;
  price: string;
  stock: string;
  category: string;
  brand: string;
}

// Simple TextInput component - แบบเดียวกับ web form
const CustomTextInput = ({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  secureTextEntry = false,
  keyboardType = 'default' as const,
  multiline = false,
  required = false,
  showPasswordToggle = false
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  multiline?: boolean;
  required?: boolean;
  showPasswordToggle?: boolean;
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = secureTextEntry && showPasswordToggle;

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.input, multiline && styles.multilineInput]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          secureTextEntry={isPassword ? !showPassword : secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {isPassword && (
          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.passwordToggleText}>
              {showPassword ? '👁️' : '🙈'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Main form component - ใช้แบบเดียวกับ web
const ProductForm = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    brand: ''
  });

  // Handle input change - แบบเดียวกับ web form
  const handleInputChange = useCallback((field: keyof FormData) => {
    return (value: string) => {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    };
  }, []);

  // Submit handler
  const handleSubmit = useCallback(() => {
    console.log('Form Data:', formData);
  }, [formData]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      price: '',
      stock: '',
      category: '',
      brand: ''
    });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Product</Text>
      
      <View style={styles.form}>
        <CustomTextInput
          label="Product Name"
          value={formData.name}
          onChangeText={handleInputChange('name')}
          placeholder="Enter product name"
          required
        />

        <CustomTextInput
          label="Description"
          value={formData.description}
          onChangeText={handleInputChange('description')}
          placeholder="Enter description"
          multiline
        />

        <CustomTextInput
          label="Price"
          value={formData.price}
          onChangeText={handleInputChange('price')}
          placeholder="0.00"
          keyboardType="numeric"
          required
        />

        <CustomTextInput
          label="Stock"
          value={formData.stock}
          onChangeText={handleInputChange('stock')}
          placeholder="0"
          keyboardType="numeric"
        />

        <CustomTextInput
          label="Category"
          value={formData.category}
          onChangeText={handleInputChange('category')}
          placeholder="Enter category"
        />

        <CustomTextInput
          label="Brand"
          value={formData.brand}
          onChangeText={handleInputChange('brand')}
          placeholder="Enter brand"
        />

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={resetForm}
          >
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!formData.name || !formData.price) && styles.disabledButton
            ]}
            onPress={handleSubmit}
            disabled={!formData.name || !formData.price}
          >
            <Text style={styles.submitButtonText}>Add Product</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Debug Info */}
      <View style={styles.debugContainer}>
        <Text style={styles.debugTitle}>Current Values:</Text>
        <Text style={styles.debugText}>Name: "{formData.name}"</Text>
        <Text style={styles.debugText}>Description: "{formData.description}"</Text>
        <Text style={styles.debugText}>Price: "{formData.price}"</Text>
        <Text style={styles.debugText}>Stock: "{formData.stock}"</Text>
        <Text style={styles.debugText}>Category: "{formData.category}"</Text>
        <Text style={styles.debugText}>Brand: "{formData.brand}"</Text>
      </View>
    </View>
  );
};

// Login form example - เหมือน AdminLogin
const LoginForm = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });

  const handleInputChange = useCallback((field: string) => {
    return (value: string) => {
      setCredentials(prev => ({
        ...prev,
        [field]: value
      }));
    };
  }, []);

  const handleLogin = useCallback(() => {
    console.log('Login with:', credentials);
  }, [credentials]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Login</Text>
      
      <View style={styles.form}>
        <CustomTextInput
          label="Username"
          value={credentials.username}
          onChangeText={handleInputChange('username')}
          placeholder="Enter username"
          required
        />

        <CustomTextInput
          label="Password"
          value={credentials.password}
          onChangeText={handleInputChange('password')}
          placeholder="Enter password"
          secureTextEntry
          showPasswordToggle
          required
        />

        <TouchableOpacity
          style={[
            styles.submitButton,
            (!credentials.username || !credentials.password) && styles.disabledButton
          ]}
          onPress={handleLogin}
          disabled={!credentials.username || !credentials.password}
        >
          <Text style={styles.submitButtonText}>Login</Text>
        </TouchableOpacity>
      </View>

      {/* Debug Info */}
      <View style={styles.debugContainer}>
        <Text style={styles.debugTitle}>Current Values:</Text>
        <Text style={styles.debugText}>Username: "{credentials.username}"</Text>
        <Text style={styles.debugText}>Password: "{credentials.password.replace(/./g, '*')}"</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 20,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
    minHeight: 48,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -12 }],
    padding: 4,
  },
  passwordToggleText: {
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  debugContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
});

// Export both components
export default ProductForm;
export { CustomTextInput, LoginForm };

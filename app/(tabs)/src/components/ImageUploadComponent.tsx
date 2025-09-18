import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface ImageUploadComponentProps {
  imageUri: string;
  onImageChange: (uri: string) => void;
  placeholder?: string;
  style?: any;
}

const ImageUploadComponent: React.FC<ImageUploadComponentProps> = ({
  imageUri,
  onImageChange,
  placeholder = "Add product image",
  style,
}) => {
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Validate if URI is a proper image
  const isValidImage = (uri: string) => {
    if (!uri) return false;
    
    // Check for data URL (base64)
    if (uri.startsWith('data:image/')) return true;
    
    // Check for HTTP/HTTPS URLs with image extensions
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    const isHttpUrl = uri.startsWith('http://') || uri.startsWith('https://');
    const hasImageExt = imageExtensions.some(ext => uri.toLowerCase().includes(ext));
    
    return isHttpUrl && hasImageExt;
  };

  const handleImagePicker = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        openWebFilePicker();
        return;
      }
      
      // For mobile - simple alert for now
      Alert.alert('Image Picker', 'Mobile image picking not implemented yet');
    } catch (error) {
      Alert.alert('Error', 'Failed to open image picker');
    }
  }, []);

  const openWebFilePicker = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setUploading(true);
        setImageError(false);
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          onImageChange(result);
          setUploading(false);
        };
        reader.onerror = () => {
          setUploading(false);
          setImageError(true);
          Alert.alert('Error', 'Error reading file');
        };
        reader.readAsDataURL(file);
      }
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    };
    
    document.body.appendChild(input);
    input.click();
  };

  const handleRemoveImage = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to remove this image?');
      if (confirmed) {
        onImageChange('');
        setImageError(false);
      }
    } else {
      Alert.alert(
        'Remove Image',
        'Are you sure you want to remove this image?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: () => {
            onImageChange('');
            setImageError(false);
          }},
        ]
      );
    }
  };

  const shouldShowImage = imageUri && !imageError && isValidImage(imageUri);

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>Product Image</Text>
      
      <TouchableOpacity
        style={styles.imageContainer}
        onPress={handleImagePicker}
        disabled={uploading}
        activeOpacity={0.7}
      >
        {uploading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : shouldShowImage ? (
          <View style={styles.imageWrapper}>
            <Image 
              source={{ uri: imageUri }} 
              style={styles.image}
              resizeMode="cover"
              onError={() => {
                setImageError(true);
              }}
              onLoad={() => {
                setImageError(false);
              }}
            />
            <View style={styles.imageOverlay}>
              <Text style={styles.changeText}>Tap to change</Text>
            </View>
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderIcon}>📷</Text>
            <Text style={styles.placeholderText}>
              {imageUri && !isValidImage(imageUri) ? 'Invalid Image Format' : placeholder}
            </Text>
            <Text style={styles.placeholderSubtext}>
              {imageUri && !isValidImage(imageUri) 
                ? 'Tap to select a valid image'
                : 'Tap to select from gallery'
              }
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {shouldShowImage && !uploading && (
        <View style={styles.removeButtonWrapper}>
          <TouchableOpacity style={styles.removeButton} onPress={handleRemoveImage}>
            <Text style={styles.removeButtonText}>Remove Image</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    width: '100%',
    position: 'relative',
    zIndex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  imageContainer: {
    height: 200,
    width: '100%',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 8,
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    width: '100%',
    height: '100%',
  },
  placeholderIcon: {
    fontSize: 48,
    marginBottom: 12,
    opacity: 0.6,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 4,
    width: '100%',
  },
  placeholderSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 200,
    width: '100%',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    width: '100%',
    height: '100%',
  },
  loadingText: {
    fontSize: 14,
    color: '#8B5CF6',
    marginTop: 8,
    fontWeight: '500',
    textAlign: 'center',
  },
  removeButtonWrapper: {
    position: 'relative',
    zIndex: 100,
    marginTop: 8,
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  removeButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
    width: '100%',
    minHeight: 40,
    alignSelf: 'center',
  },
  removeButtonText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ImageUploadComponent;
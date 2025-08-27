import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  placeholder = "Tap to add image",
  style,
}) => {
  const [uploading, setUploading] = useState(false);

  const handleImagePicker = useCallback(async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Please grant permission to access your photo library');
          return;
        }
      }

      Alert.alert(
        'Select Image',
        'Choose how you want to add an image',
        [
          { text: 'Camera', onPress: () => openCamera() },
          { text: 'Gallery', onPress: () => openImagePicker() },
          { text: 'Cancel', style: 'cancel' },
        ],
        { cancelable: true }
      );
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to request permissions');
    }
  }, []);

  const openCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is needed');
        return;
      }

      setUploading(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onImageChange(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open camera');
    } finally {
      setUploading(false);
    }
  };

  const openImagePicker = async () => {
    try {
      setUploading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onImageChange(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => onImageChange('') },
      ]
    );
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>Product Image</Text>
      
      <TouchableOpacity
        style={styles.imageContainer}
        onPress={handleImagePicker}
        disabled={uploading}
      >
        {uploading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={styles.loadingText}>Uploading...</Text>
          </View>
        ) : imageUri ? (
          <>
            <Image source={{ uri: imageUri }} style={styles.image} />
            <View style={styles.imageOverlay}>
              <Text style={styles.changeText}>Tap to change</Text>
            </View>
          </>
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderIcon}>📷</Text>
            <Text style={styles.placeholderText}>{placeholder}</Text>
            <Text style={styles.placeholderSubtext}>
              Tap to select from gallery or take photo
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {imageUri && !uploading && (
        <TouchableOpacity style={styles.removeButton} onPress={handleRemoveImage}>
          <Text style={styles.removeButtonText}>Remove Image</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  imageContainer: {
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    alignItems: 'center',
  },
  changeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  placeholderContainer: {
    alignItems: 'center',
    padding: 20,
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
  },
  placeholderSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#8B5CF6',
    marginTop: 8,
    fontWeight: '500',
  },
  removeButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  removeButtonText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ImageUploadComponent;
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
  placeholder = "Add product image",
  style,
}) => {
  const [uploading, setUploading] = useState(false);

  const handleImagePicker = useCallback(async () => {
    try {
      console.log('Image picker pressed'); // Debug log

      // สำหรับ web - เปิด file picker โดยตรง
      if (Platform.OS === 'web') {
        console.log('Running on web - opening file picker directly');
        openWebFilePicker();
        return;
      }

      console.log('Requesting permissions...'); // Debug log
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Permission status:', status); // Debug log
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photo library');
        return;
      }
      
      console.log('Permissions granted - showing options'); // Debug log
      showImageOptions();
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to request permissions: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }, []);

  const openWebFilePicker = () => {
    console.log('Opening web file picker');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        console.log('Web file selected:', file.name);
        setUploading(true);
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          console.log('File read successfully');
          onImageChange(result);
          setUploading(false);
        };
        reader.onerror = () => {
          console.error('File read error');
          setUploading(false);
          alert('Error reading file');
        };
        reader.readAsDataURL(file);
      } else {
        console.log('No file selected');
      }
      document.body.removeChild(input);
    };
    
    document.body.appendChild(input);
    input.click();
  };

  const showImageOptions = () => {
    console.log('Showing image options alert'); // Debug log
    Alert.alert(
      'Select Image',
      'Choose how you want to add an image',
      [
        { 
          text: 'Camera', 
          onPress: () => {
            console.log('Camera option selected');
            openCamera();
          }
        },
        { 
          text: 'Gallery', 
          onPress: () => {
            console.log('Gallery option selected');
            openImagePicker();
          }
        },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const openCamera = async () => {
    try {
      console.log('Opening camera...'); // Debug log
      
      // บน Web - Camera API ซับซ้อนกว่า ให้ใช้ gallery แทน
      if (Platform.OS === 'web') {
        Alert.alert('Camera not available on web', 'Please use Gallery option instead');
        return;
      }
      
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

      console.log('Camera result:', result); // Debug log

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        console.log('Selected from camera:', asset.uri); // Debug log
        onImageChange(asset.uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const openImagePicker = async () => {
    try {
      console.log('Opening image picker...'); // Debug log
      setUploading(true);
      
      // สำหรับ Web - ใช้ HTML input file
      if (Platform.OS === 'web') {
        console.log('Using web file input');
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              console.log('Web file selected:', file.name);
              onImageChange(result);
              setUploading(false);
            };
            reader.readAsDataURL(file);
          } else {
            setUploading(false);
          }
        };
        input.click();
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log('Image picker result:', result); // Debug log

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        console.log('Selected from gallery:', asset.uri); // Debug log
        onImageChange(asset.uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image: ' + (error instanceof Error ? error.message : 'Unknown error'));
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
        activeOpacity={0.7}
      >
        {uploading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={styles.loadingText}>Loading...</Text>
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
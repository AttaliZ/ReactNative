import * as DocumentPicker from 'expo-document-picker';
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

interface FileUploadComponentProps {
  imageUri: string;
  onImageChange: (uri: string) => void;
  placeholder?: string;
  style?: any;
  allowDocuments?: boolean; // เพิ่มตัวเลือกให้อัปโหลดไฟล์อื่นได้
  acceptedTypes?: string[]; // กำหนดประเภทไฟล์ที่รับได้
}

const FileUploadComponent: React.FC<FileUploadComponentProps> = ({
  imageUri,
  onImageChange,
  placeholder = "Tap to add file",
  style,
  allowDocuments = true,
  acceptedTypes = ['image/*', 'application/pdf', 'text/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
}) => {
  const [uploading, setUploading] = useState(false);
  const [fileInfo, setFileInfo] = useState<{
    name: string;
    type: string;
    size?: number;
  } | null>(null);

  // ตรวจสอบว่าไฟล์เป็นรูปภาพหรือไม่
  const isImageFile = (uri: string, mimeType?: string) => {
    if (mimeType) {
      return mimeType.startsWith('image/');
    }
    // ตรวจสอบจาก extension
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    return imageExtensions.some(ext => uri.toLowerCase().endsWith(ext));
  };

  // ได้ icon สำหรับไฟล์ต่างๆ
  const getFileIcon = (fileName: string, mimeType?: string) => {
    if (isImageFile(fileName, mimeType)) return '🖼️';
    if (mimeType?.includes('pdf')) return '📄';
    if (mimeType?.includes('word') || fileName.endsWith('.docx') || fileName.endsWith('.doc')) return '📝';
    if (mimeType?.includes('excel') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) return '📊';
    if (mimeType?.includes('text')) return '📋';
    return '📎';
  };

  // แสดงขนาดไฟล์ในรูปแบบที่อ่านง่าย
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFilePicker = useCallback(async () => {
    try {
      console.log('File picker pressed'); // Debug log

      if (Platform.OS !== 'web') {
        console.log('Requesting permissions...'); // Debug log
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Please grant permission to access your files');
          return;
        }
        console.log('Permissions granted'); // Debug log
      }

      const options = ['Camera (Photo only)', 'Photo Gallery', ...(allowDocuments ? ['Document/File'] : []), 'Cancel'];
      
      console.log('Showing alert with options:', options); // Debug log
      
      Alert.alert(
        'Select File',
        'Choose how you want to add a file',
        options.map(option => {
          if (option === 'Camera (Photo only)') {
            return { text: option, onPress: () => {
              console.log('Camera selected');
              openCamera();
            }};
          } else if (option === 'Photo Gallery') {
            return { text: option, onPress: () => {
              console.log('Photo Gallery selected');
              openImagePicker();
            }};
          } else if (option === 'Document/File') {
            return { text: option, onPress: () => {
              console.log('Document/File selected');
              openDocumentPicker();
            }};
          } else {
            return { text: option, style: 'cancel' as const };
          }
        }),
        { cancelable: true }
      );
    } catch (error) {
      console.error('File picker error:', error);
      const errorMessage = typeof error === 'object' && error !== null && 'message' in error ? (error as { message: string }).message : String(error);
      Alert.alert('Error', 'Failed to request permissions: ' + errorMessage);
    }
  }, [allowDocuments]);

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
        const asset = result.assets[0];
        onImageChange(asset.uri);
        setFileInfo({
          name: asset.fileName || 'camera_photo.jpg',
          type: asset.type || 'image/jpeg',
          size: asset.fileSize
        });
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
        const asset = result.assets[0];
        onImageChange(asset.uri);
        setFileInfo({
          name: asset.fileName || 'selected_image.jpg',
          type: asset.type || 'image/jpeg',
          size: asset.fileSize
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    } finally {
      setUploading(false);
    }
  };

  const openDocumentPicker = async () => {
    try {
      setUploading(true);
      console.log('Opening document picker...'); // Debug log
      
      const result = await DocumentPicker.getDocumentAsync({
        type: acceptedTypes,
        copyToCacheDirectory: true,
        multiple: false,
      });

      console.log('Document picker result:', result); // Debug log

      if (!result.canceled) {
        // Check for different result structures
        let asset = null;
        
        // New API structure (result.assets)
        if (result.assets && result.assets[0]) {
          asset = result.assets[0];
        }
        // Legacy API structure (result.output or result.file)
        else if (result.output) {
          // If result.output is a FileList or array, use the first file
          const file =
            Array.isArray(result.output) || (typeof FileList !== 'undefined' && result.output instanceof FileList)
              ? result.output[0]
              : result.output;
          asset = file && typeof file === 'object' && 'name' in file
            ? {
                uri: (file as any).uri || (file as any).path || '',
                name: (file as any).name || 'file',
                mimeType: (file as any).mimeType || (file as any).type || 'unknown',
                size: (file as any).size
              }
            : null;
        } // <-- Add this closing bracket to properly close the else-if block

        // Remove legacy result.file block since it's not part of DocumentPickerSuccessResult
        // If future API changes, handle here accordingly.

        if (asset) {
          console.log('Selected file:', asset); // Debug log
          onImageChange(asset.uri);
          setFileInfo({
            name: asset.name,
            type: asset.mimeType || 'unknown',
            size: asset.size
          });
        } else {
          console.log('No asset found in result'); // Debug log
        }
      } else {
        console.log('Document picker was canceled'); // Debug log
      }
    } catch (error) {
      console.error('Document picker error:', error);
      const errorMessage = typeof error === 'object' && error !== null && 'message' in error ? (error as { message: string }).message : String(error);
      Alert.alert('Error', 'Failed to pick document: ' + errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    Alert.alert(
      'Remove File',
      'Are you sure you want to remove this file?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive', 
          onPress: () => {
            onImageChange('');
            setFileInfo(null);
          }
        },
      ]
    );
  };

  // กำหนดข้อมูลไฟล์จาก imageUri ถ้ายังไม่มี fileInfo
  const currentFileInfo = React.useMemo(() => {
    if (fileInfo) return fileInfo;
    if (imageUri) {
      const fileName = imageUri.split('/').pop() || 'file';
      return {
        name: fileName,
        type: isImageFile(imageUri) ? 'image' : 'file'
      };
    }
    return null;
  }, [fileInfo, imageUri]);

  const renderFilePreview = () => {
    if (!imageUri || !currentFileInfo) return null;

    // ถ้าเป็นรูปภาพให้แสดงรูป
    if (isImageFile(imageUri, currentFileInfo.type)) {
      return (
        <>
          <Image source={{ uri: imageUri }} style={styles.image} />
          <View style={styles.imageOverlay}>
            <Text style={styles.changeText}>Tap to change</Text>
          </View>
        </>
      );
    }

    // ถ้าเป็นไฟล์อื่นให้แสดง icon และข้อมูล
    return (
      <View style={styles.filePreview}>
        <Text style={styles.fileIcon}>
          {getFileIcon(currentFileInfo.name, currentFileInfo.type)}
        </Text>
        <Text style={styles.fileName} numberOfLines={2}>
          {currentFileInfo.name}
        </Text>
        {currentFileInfo.size && (
          <Text style={styles.fileSize}>
            {formatFileSize(currentFileInfo.size)}
          </Text>
        )}
        <Text style={styles.changeText}>Tap to change file</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>
        {allowDocuments ? 'File Upload' : 'Product Image'}
      </Text>
      
      <TouchableOpacity
        style={[
          styles.fileContainer,
          imageUri && !isImageFile(imageUri, currentFileInfo?.type) && styles.fileContainerWithFile
        ]}
        onPress={handleFilePicker}
        disabled={uploading}
      >
        {uploading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={styles.loadingText}>Uploading...</Text>
          </View>
        ) : imageUri ? (
          renderFilePreview()
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderIcon}>
              {allowDocuments ? '📎' : '📷'}
            </Text>
            <Text style={styles.placeholderText}>{placeholder}</Text>
            <Text style={styles.placeholderSubtext}>
              {allowDocuments 
                ? 'Tap to select image, document, or take photo'
                : 'Tap to select from gallery or take photo'
              }
            </Text>
            {allowDocuments && (
              <Text style={styles.acceptedTypes}>
                Supported: Images, PDF, Word, Text files
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>

      {imageUri && !uploading && (
        <TouchableOpacity style={styles.removeButton} onPress={handleRemoveFile}>
          <Text style={styles.removeButtonText}>Remove File</Text>
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
  fileContainer: {
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
  fileContainerWithFile: {
    borderStyle: 'solid',
    borderColor: '#8B5CF6',
    backgroundColor: '#f8f7ff',
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
  filePreview: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    borderRadius: 8,
    margin: 10,
    width: '90%',
  },
  fileIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
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
    marginBottom: 8,
  },
  acceptedTypes: {
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
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

export default FileUploadComponent;
import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';

const SimpleImageTest = () => {
  const testImagePicker = async () => {
    console.log('Test button pressed!'); // ควรเห็น log นี้
    
    try {
      Alert.alert('Test', 'Image picker test started');
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Permission status:', status);
      
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Need photo library permission');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      console.log('Result:', result);
      
      if (!result.canceled) {
        Alert.alert('Success!', 'Image selected: ' + result.assets[0].fileName);
      } else {
        Alert.alert('Cancelled', 'No image selected');
      }
    } catch (error) {
      console.error('Test error:', error);
      Alert.alert('Error', 'Something went wrong: ' + error);
    }
  };

  return (
    <View style={{ padding: 20, backgroundColor: 'white' }}>
      <TouchableOpacity 
        onPress={testImagePicker}
        style={{ 
          backgroundColor: '#007AFF', 
          padding: 15, 
          borderRadius: 8,
          alignItems: 'center'
        }}
      >
        <Text style={{ color: 'white', fontSize: 16 }}>Test Image Picker</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SimpleImageTest;
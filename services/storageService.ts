// services/storageService.ts
import { Platform } from 'react-native';

interface CloudinaryResponse {
  success: boolean;
  url?: string;
  secureUrl?: string;
  publicId?: string;
  message?: string;
}

class StorageService {
  private cloudinaryConfig = {
    cloudName: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dslzwj6v1',
    uploadPreset:
      process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET ||
      'react_native_profile_images',
    apiKey: process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY || '',
  };

  /**
   * Upload image to Cloudinary
   * Supports both file paths and base64 strings
   */
  async uploadImage(imageUri: string): Promise<CloudinaryResponse> {
    try {
      console.log('📤 Starting image upload to Cloudinary...');

      // Prepare form data
      const formData = new FormData();

      // Handle different image sources
      if (imageUri.startsWith('data:')) {
        // Base64 image
        formData.append('file', imageUri);
      } else if (Platform.OS === 'web') {
        // Web file upload
        const response = await fetch(imageUri);
        const blob = await response.blob();
        formData.append('file', blob);
      } else {
        // Mobile file upload
        const filename = imageUri.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('file', {
          uri: imageUri,
          name: filename,
          type,
        } as any);
      }

      formData.append('upload_preset', this.cloudinaryConfig.uploadPreset);
      formData.append('folder', 'dating-app/profiles');

      // Upload to Cloudinary
      const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudinaryConfig.cloudName}/image/upload`;

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Upload failed');
      }

      const data = await response.json();

      console.log('✅ Image uploaded successfully:', data.secure_url);

      return {
        success: true,
        url: data.url,
        secureUrl: data.secure_url,
        publicId: data.public_id,
        message: 'Image uploaded successfully',
      };
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to upload image',
      };
    }
  }

  /**
   * Delete image from Cloudinary
   */
  async deleteImage(
    publicId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🗑️ Deleting image from Cloudinary:', publicId);

      // Note: Deletion requires authenticated request with API secret
      // For security, this should be done on the backend
      // This is a placeholder for backend implementation

      return {
        success: true,
        message: 'Image deletion should be handled on backend',
      };
    } catch (error) {
      console.error('❌ Error deleting image:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to delete image',
      };
    }
  }

  /**
   * Get optimized image URL with transformations
   */
  getOptimizedUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'auto' | 'jpg' | 'png' | 'webp';
    } = {}
  ): string {
    const {
      width = 800,
      height = 800,
      quality = 80,
      format = 'auto',
    } = options;

    return `https://res.cloudinary.com/${this.cloudinaryConfig.cloudName}/image/upload/w_${width},h_${height},c_fill,q_${quality},f_${format}/${publicId}`;
  }
}

export default new StorageService();

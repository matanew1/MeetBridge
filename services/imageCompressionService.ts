// services/imageCompressionService.ts
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1
  format?: 'jpeg' | 'png' | 'webp';
}

export interface CompressionResult {
  uri: string;
  width: number;
  height: number;
  originalSize?: number;
  compressedSize?: number;
  compressionRatio?: number;
}

class ImageCompressionService {
  /**
   * Compress image for profile upload
   */
  async compressProfileImage(
    imageUri: string,
    options?: CompressionOptions
  ): Promise<CompressionResult> {
    const defaultOptions: CompressionOptions = {
      maxWidth: 1024,
      maxHeight: 1024,
      quality: 0.8,
      format: 'jpeg',
    };

    return this.compressImage(imageUri, { ...defaultOptions, ...options });
  }

  /**
   * Compress image for chat message
   */
  async compressChatImage(
    imageUri: string,
    options?: CompressionOptions
  ): Promise<CompressionResult> {
    const defaultOptions: CompressionOptions = {
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 0.85,
      format: 'jpeg',
    };

    return this.compressImage(imageUri, { ...defaultOptions, ...options });
  }

  /**
   * Compress thumbnail image
   */
  async compressThumbnail(
    imageUri: string,
    options?: CompressionOptions
  ): Promise<CompressionResult> {
    const defaultOptions: CompressionOptions = {
      maxWidth: 300,
      maxHeight: 300,
      quality: 0.7,
      format: 'jpeg',
    };

    return this.compressImage(imageUri, { ...defaultOptions, ...options });
  }

  /**
   * Main compression function
   */
  async compressImage(
    imageUri: string,
    options: CompressionOptions
  ): Promise<CompressionResult> {
    try {
      const {
        maxWidth = 1024,
        maxHeight = 1024,
        quality = 0.8,
        format = 'jpeg',
      } = options;

      // Get original image size if possible
      let originalSize: number | undefined;
      try {
        if (Platform.OS !== 'web' && imageUri.startsWith('file://')) {
          const response = await fetch(imageUri);
          const blob = await response.blob();
          originalSize = blob.size;
        }
      } catch (e) {
        console.log('Could not get original image size:', e);
      }

      // Manipulate image
      const manipulateResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            resize: {
              width: maxWidth,
              height: maxHeight,
            },
          },
        ],
        {
          compress: quality,
          format:
            format === 'jpeg'
              ? ImageManipulator.SaveFormat.JPEG
              : format === 'png'
              ? ImageManipulator.SaveFormat.PNG
              : ImageManipulator.SaveFormat.WEBP,
        }
      );

      // Get compressed size if possible
      let compressedSize: number | undefined;
      let compressionRatio: number | undefined;
      try {
        if (Platform.OS !== 'web') {
          const response = await fetch(manipulateResult.uri);
          const blob = await response.blob();
          compressedSize = blob.size;

          if (originalSize && compressedSize) {
            compressionRatio = (compressedSize / originalSize) * 100;
          }
        }
      } catch (e) {
        console.log('Could not get compressed image size:', e);
      }

      console.log('📸 Image compression result:', {
        originalSize: originalSize
          ? `${(originalSize / 1024).toFixed(2)} KB`
          : 'unknown',
        compressedSize: compressedSize
          ? `${(compressedSize / 1024).toFixed(2)} KB`
          : 'unknown',
        compressionRatio: compressionRatio
          ? `${compressionRatio.toFixed(1)}%`
          : 'unknown',
        dimensions: `${manipulateResult.width}x${manipulateResult.height}`,
      });

      return {
        uri: manipulateResult.uri,
        width: manipulateResult.width,
        height: manipulateResult.height,
        originalSize,
        compressedSize,
        compressionRatio,
      };
    } catch (error) {
      console.error('Error compressing image:', error);
      // Return original image if compression fails
      return {
        uri: imageUri,
        width: 0,
        height: 0,
      };
    }
  }

  /**
   * Batch compress multiple images
   */
  async compressMultipleImages(
    imageUris: string[],
    options?: CompressionOptions
  ): Promise<CompressionResult[]> {
    const results: CompressionResult[] = [];

    for (const uri of imageUris) {
      try {
        const result = await this.compressImage(uri, options || {});
        results.push(result);
      } catch (error) {
        console.error('Error compressing image:', uri, error);
        // Add original URI if compression fails
        results.push({
          uri,
          width: 0,
          height: 0,
        });
      }
    }

    return results;
  }

  /**
   * Check if image needs compression
   */
  async needsCompression(
    imageUri: string,
    maxSize: number = 1024 * 1024 // 1MB
  ): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        return true; // Always compress on web
      }

      const response = await fetch(imageUri);
      const blob = await response.blob();
      return blob.size > maxSize;
    } catch (error) {
      console.error('Error checking image size:', error);
      return true; // Compress by default if we can't check
    }
  }

  /**
   * Get image dimensions without compression
   */
  async getImageDimensions(
    imageUri: string
  ): Promise<{ width: number; height: number }> {
    try {
      const result = await ImageManipulator.manipulateAsync(imageUri, [], {
        format: ImageManipulator.SaveFormat.JPEG,
      });
      return {
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      console.error('Error getting image dimensions:', error);
      return { width: 0, height: 0 };
    }
  }
}

export const imageCompressionService = new ImageCompressionService();
export default imageCompressionService;

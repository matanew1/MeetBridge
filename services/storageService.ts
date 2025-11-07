// services/storageService.ts
// [SECURITY FIX] Added comprehensive security measures for Cloudinary uploads
import { Platform } from 'react-native';
import imageCompressionService from './imageCompressionService';

interface CloudinaryResponse {
  success: boolean;
  url?: string;
  secureUrl?: string;
  publicId?: string;
  message?: string;
}

// [SECURITY] Allowed file types for image uploads
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

class StorageService {
  // [SECURITY FIX] Load Cloudinary config from environment variables only
  private cloudinaryConfig = {
    cloudName: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME,
    uploadPreset: process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
    // Note: API Key should NOT be exposed in frontend, only used for backend operations
  };

  constructor() {
    // [SECURITY] Validate required Cloudinary configuration on startup
    if (
      !this.cloudinaryConfig.cloudName ||
      !this.cloudinaryConfig.uploadPreset
    ) {
      console.error(
        '[SECURITY] Missing Cloudinary configuration. Check your .env file.'
      );
    }
  }

  /**
   * [SECURITY] Validate image file before upload
   */
  private async validateImage(
    imageUri: string,
    blob?: Blob
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      // [SECURITY] Validate file extension
      const filename =
        imageUri.split('/').pop() ||
        imageUri.split('?')[0].split('/').pop() ||
        '';
      const extension = filename.split('.').pop()?.toLowerCase();

      if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
        return {
          valid: false,
          error: `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
        };
      }

      // [SECURITY] Validate file size (if blob is available)
      if (blob && blob.size > MAX_FILE_SIZE) {
        return {
          valid: false,
          error: `File too large. Maximum size: ${
            MAX_FILE_SIZE / 1024 / 1024
          }MB`,
        };
      }

      // [SECURITY] Validate MIME type (if blob is available)
      if (blob && !ALLOWED_IMAGE_TYPES.includes(blob.type)) {
        return {
          valid: false,
          error: `Invalid MIME type. Allowed: ${ALLOWED_IMAGE_TYPES.join(
            ', '
          )}`,
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: 'Failed to validate image',
      };
    }
  }

  /**
   * [SECURITY] Sanitize filename to prevent path traversal
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9_.-]/g, '_') // Remove special characters
      .replace(/\.\.+/g, '.') // Remove directory traversal
      .substring(0, 100); // Limit length
  }

  /**
   * Upload image to Cloudinary
   * [SECURITY FIX] Added file validation, size limits, and type checking
   * [PERFORMANCE] Added automatic image compression
   */
  async uploadImage(imageUri: string): Promise<CloudinaryResponse> {
    try {
      // [SECURITY] Validate configuration
      if (
        !this.cloudinaryConfig.cloudName ||
        !this.cloudinaryConfig.uploadPreset
      ) {
        return {
          success: false,
          message: 'Cloudinary configuration is missing',
        };
      }

      console.log('📤 Starting secure image upload to Cloudinary...');

      // [SECURITY] Sanitize and validate input URI
      if (!imageUri || typeof imageUri !== 'string') {
        return {
          success: false,
          message: 'Invalid image URI provided',
        };
      }

      // [PERFORMANCE] Compress image before upload
      console.log('🔄 Compressing image before upload...');
      const compressionResult =
        await imageCompressionService.compressProfileImage(imageUri);
      const compressedUri = compressionResult.uri;
      console.log('✅ Image compressed successfully');

      // Prepare form data
      const formData = new FormData();
      let blob: Blob | undefined;

      // Handle different image sources
      if (compressedUri.startsWith('data:')) {
        // [SECURITY] Base64 image - validate size and type
        const base64Data = compressedUri.split(',')[1];
        const sizeInBytes = (base64Data.length * 3) / 4;

        if (sizeInBytes > MAX_FILE_SIZE) {
          return {
            success: false,
            message: `File too large. Maximum size: ${
              MAX_FILE_SIZE / 1024 / 1024
            }MB`,
          };
        }

        // Validate MIME type from data URI
        const mimeMatch = compressedUri.match(/data:([^;]+);/);
        if (!mimeMatch || !ALLOWED_IMAGE_TYPES.includes(mimeMatch[1])) {
          return {
            success: false,
            message: 'Invalid image type',
          };
        }

        formData.append('file', compressedUri);
      } else if (Platform.OS === 'web') {
        // [SECURITY] Web file upload - validate blob
        const response = await fetch(compressedUri);
        blob = await response.blob();

        const validation = await this.validateImage(compressedUri, blob);
        if (!validation.valid) {
          return {
            success: false,
            message: validation.error || 'Invalid image',
          };
        }

        formData.append('file', blob);
      } else {
        // [SECURITY] Mobile file upload - validate filename and type
        const filename = compressedUri.split('/').pop() || 'photo.jpg';
        const sanitizedFilename = this.sanitizeFilename(filename);
        const match = /\.(\w+)$/.exec(sanitizedFilename);
        const extension = match ? match[1].toLowerCase() : 'jpg';

        if (!ALLOWED_EXTENSIONS.includes(extension)) {
          return {
            success: false,
            message: 'Invalid file type',
          };
        }

        const type = `image/${extension === 'jpg' ? 'jpeg' : extension}`;

        formData.append('file', {
          uri: compressedUri,
          name: sanitizedFilename,
          type,
        } as any);
      }

      // [SECURITY] Use unsigned upload with upload preset (no API secret exposed)
      formData.append('upload_preset', this.cloudinaryConfig.uploadPreset);
      formData.append('folder', 'dating-app/profiles');

      // Note: Transformations are not allowed in unsigned uploads
      // The upload preset should be configured in Cloudinary dashboard with transformations
      // or use the image compression service before upload (already done above)

      // [SECURITY] Use HTTPS endpoint only
      const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudinaryConfig.cloudName}/image/upload`;

      // [SECURITY] Set timeout for upload
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Upload failed');
      }

      const data = await response.json();

      // [SECURITY] Only return secure HTTPS URL, never HTTP
      console.log('✅ Image uploaded successfully');

      return {
        success: true,
        url: data.secure_url, // Always use secure_url
        secureUrl: data.secure_url,
        publicId: data.public_id,
        message: 'Image uploaded successfully',
      };
    } catch (error) {
      console.error('❌ Error uploading image:', error);

      // [SECURITY] Don't expose internal error details to users
      const message =
        error instanceof Error && error.name === 'AbortError'
          ? 'Upload timeout - please try again'
          : 'Failed to upload image';

      return {
        success: false,
        message,
      };
    }
  }

  /**
   * Delete image from Cloudinary
   * [SECURITY] Image deletion requires API secret and should ONLY be done on backend
   */
  async deleteImage(
    publicId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // [SECURITY] Sanitize publicId to prevent injection
      const sanitizedPublicId = publicId.replace(/[^a-zA-Z0-9_/-]/g, '');

      console.log('🗑️ Image deletion requested (backend operation required)');

      // [SECURITY CRITICAL] Deletion requires API secret and signature
      // This MUST be implemented on a secure backend with proper authentication
      // NEVER expose your Cloudinary API secret in frontend code

      return {
        success: false,
        message: 'Image deletion must be handled by backend API for security',
      };
    } catch (error) {
      console.error('❌ Error deleting image:', error);
      return {
        success: false,
        message: 'Failed to delete image',
      };
    }
  }

  /**
   * Get optimized image URL with transformations
   * [SECURITY] Always use HTTPS and validate parameters
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
    // [SECURITY] Sanitize publicId to prevent injection
    const sanitizedPublicId = publicId.replace(/[^a-zA-Z0-9_/-]/g, '');

    // [SECURITY] Validate and constrain transformation parameters
    const width = Math.min(Math.max(options.width || 800, 50), 4000);
    const height = Math.min(Math.max(options.height || 800, 50), 4000);
    const quality = Math.min(Math.max(options.quality || 80, 1), 100);
    const format = ['auto', 'jpg', 'png', 'webp'].includes(
      options.format || 'auto'
    )
      ? options.format
      : 'auto';

    // [SECURITY] Always use HTTPS for image URLs
    return `https://res.cloudinary.com/${this.cloudinaryConfig.cloudName}/image/upload/w_${width},h_${height},c_fill,q_${quality},f_${format}/${sanitizedPublicId}`;
  }

  /**
   * Upload chat image with compression
   */
  async uploadChatImage(imageUri: string): Promise<string> {
    try {
      console.log('📷 Uploading chat image...', imageUri);

      // Validate image URI
      if (!imageUri || typeof imageUri !== 'string' || imageUri.trim() === '') {
        throw new Error('Invalid image URI provided');
      }

      // Compress first
      const compressionResult = await imageCompressionService.compressChatImage(
        imageUri
      );

      console.log('📤 Compressed URI:', compressionResult.uri);

      // Upload to Cloudinary
      const result = await this.uploadImage(compressionResult.uri);

      if (!result.success || !result.secureUrl) {
        throw new Error(result.message || 'Upload failed');
      }

      return result.secureUrl;
    } catch (error) {
      console.error('❌ Error uploading chat image:', error);
      throw error;
    }
  }
}

export default new StorageService();

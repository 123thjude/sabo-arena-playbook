/**
 * Cloudinary Image Upload Service
 * Free: 25 credits/month (~10GB storage, unlimited transformations)
 * 
 * Setup: https://cloudinary.com/users/register_free
 * Sau khi đăng ký, lấy Cloud Name, API Key, API Secret từ Dashboard
 */

// Cloudinary credentials - Lấy từ Dashboard
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'sabo_arena'; // Unsigned preset

export interface CloudinaryImage {
  public_id: string;
  url: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  created_at: string;
  thumbnail_url: string;
}

export interface UploadResult {
  success: boolean;
  data?: CloudinaryImage;
  error?: string;
}

/**
 * Upload image to Cloudinary (Unsigned - không cần API Secret)
 */
export async function uploadImageToCloudinary(file: File, folder: string = 'sabo-arena'): Promise<UploadResult> {
  try {
    if (!CLOUD_NAME) {
      return { success: false, error: 'Cloudinary chưa được cấu hình' };
    }

    // Validate
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return { success: false, error: 'Chỉ chấp nhận JPG, PNG, GIF, WEBP' };
    }

    if (file.size > 10 * 1024 * 1024) {
      return { success: false, error: 'File không được vượt quá 10MB' };
    }

    console.log('📤 Uploading to Cloudinary:', file.name);

    // Upload via unsigned preset
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    const result = await response.json();

    if (result.error) {
      console.error('❌ Cloudinary error:', result.error);
      return { success: false, error: result.error.message };
    }

    console.log('✅ Upload successful:', result.secure_url);

    return {
      success: true,
      data: {
        public_id: result.public_id,
        url: result.url,
        secure_url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        created_at: result.created_at,
        thumbnail_url: result.secure_url.replace('/upload/', '/upload/c_thumb,w_200,h_200/')
      }
    };

  } catch (error) {
    console.error('❌ Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get optimized URL with transformations
 */
export function getOptimizedUrl(publicId: string, options: {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'thumb';
  quality?: 'auto' | number;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
} = {}): string {
  if (!CLOUD_NAME) return '';
  
  const transforms = [];
  
  if (options.width) transforms.push(`w_${options.width}`);
  if (options.height) transforms.push(`h_${options.height}`);
  if (options.crop) transforms.push(`c_${options.crop}`);
  if (options.quality) transforms.push(`q_${options.quality}`);
  if (options.format) transforms.push(`f_${options.format}`);
  
  const transformStr = transforms.length > 0 ? transforms.join(',') + '/' : '';
  
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transformStr}${publicId}`;
}

/**
 * Delete image (requires signed request - use with backend)
 */
export async function deleteImageFromCloudinary(publicId: string): Promise<{ success: boolean; error?: string }> {
  // Note: Delete requires API Secret, phải gọi qua backend API
  console.warn('Delete requires backend API with API Secret');
  return { success: false, error: 'Delete requires backend API' };
}

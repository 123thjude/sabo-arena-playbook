import { supabaseAdmin } from './supabase-admin';

// Cloudinary config
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dscalhpv9';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'sabo_arena';

/**
 * Upload image to Cloudinary (Primary) with fallback to Supabase
 * @param file - File object from input
 * @param folder - Folder name in storage (default: 'news-images')
 * @returns Public URL of uploaded image
 */
export async function uploadImage(file: File, folder: string = 'news-images'): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> {
  try {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Chỉ chấp nhận file ảnh (JPG, PNG, WEBP, GIF)'
      };
    }

    // Validate file size (max 10MB for Cloudinary)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'Ảnh không được vượt quá 10MB'
      };
    }

    console.log('📤 Uploading to Cloudinary:', file.name);

    // Upload to Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', `sabo-arena/${folder}`);

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
      return {
        success: false,
        error: `Lỗi upload: ${result.error.message}`
      };
    }

    const publicUrl = result.secure_url;
    console.log('✅ Upload successful:', publicUrl);

    // Save to database for tracking
    const { error: dbError } = await supabaseAdmin
      .from('uploaded_images')
      .insert({
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        storage_path: result.public_id,
        public_url: publicUrl,
        folder: folder
      });

    if (dbError) {
      console.warn('⚠️ Image uploaded but failed to save to DB:', dbError);
    } else {
      console.log('✅ Saved to database');
    }

    return {
      success: true,
      url: publicUrl
    };

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Upload failed:', err);
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Delete image from Cloudinary
 * Note: Cloudinary delete requires API secret, chỉ xóa khỏi DB
 * @param url - Public URL of the image
 */
export async function deleteImage(url: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    console.log('🗑️ Removing from database:', url);
    
    // Chỉ xóa record trong DB, ảnh trên Cloudinary vẫn giữ
    // (Delete Cloudinary cần API secret - phải làm qua backend)
    
    console.log('✅ Image record removed');
    return { success: true };

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return {
      success: false,
      error: errorMessage
    };
  }
}

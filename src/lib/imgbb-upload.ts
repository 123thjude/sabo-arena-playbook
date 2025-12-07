/**
 * ImgBB Image Upload Service
 * Free image hosting với 32MB/file, không giới hạn
 * 
 * API Key: Đăng ký miễn phí tại https://api.imgbb.com/
 */

// ImgBB API - Bạn cần đăng ký lấy API key miễn phí
const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY || '';

export interface ImgBBImage {
  id: string;
  title: string;
  url: string;
  display_url: string;
  thumbnail: string;
  delete_url: string;
  size: number;
}

export interface UploadResult {
  success: boolean;
  data?: ImgBBImage;
  error?: string;
}

/**
 * Upload image to ImgBB
 */
export async function uploadImageToImgBB(file: File): Promise<UploadResult> {
  try {
    // Validate
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return { success: false, error: 'Chỉ chấp nhận JPG, PNG, GIF, WEBP' };
    }

    if (file.size > 32 * 1024 * 1024) {
      return { success: false, error: 'File không được vượt quá 32MB' };
    }

    // Convert to base64
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:image/...;base64,
      };
      reader.readAsDataURL(file);
    });

    // Upload to ImgBB
    const formData = new FormData();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', base64);
    formData.append('name', file.name.replace(/\.[^.]+$/, '')); // Remove extension

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (!result.success) {
      return { success: false, error: result.error?.message || 'Upload failed' };
    }

    return {
      success: true,
      data: {
        id: result.data.id,
        title: result.data.title,
        url: result.data.url,
        display_url: result.data.display_url,
        thumbnail: result.data.thumb?.url || result.data.display_url,
        delete_url: result.data.delete_url,
        size: result.data.size
      }
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Google Drive Image Service
 * Upload và quản lý ảnh trên Google Drive thay vì Supabase Storage
 * 
 * Lợi ích:
 * - 15GB miễn phí (so với 1GB của Supabase)
 * - Thống nhất với các dự án khác
 * - Dễ quản lý trực tiếp từ Google Drive
 */

const API_BASE = import.meta.env.PROD 
  ? '/api/upload-image'  // Vercel serverless function
  : 'http://localhost:3000/api/upload-image';

export interface DriveImage {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl: string;
  webViewLink?: string;
  createdAt?: string;
}

export interface UploadResult {
  success: boolean;
  file?: DriveImage;
  error?: string;
}

/**
 * Convert File to base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

/**
 * Upload image to Google Drive
 * @param file - File object from input
 * @param folder - Optional folder ID on Google Drive
 */
export async function uploadImageToDrive(
  file: File, 
  folder?: string
): Promise<UploadResult> {
  try {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Chỉ chấp nhận file ảnh (JPG, PNG, WEBP, GIF)'
      };
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'Ảnh không được vượt quá 10MB'
      };
    }

    console.log('📤 Uploading image to Google Drive:', file.name);

    // Convert file to base64
    const fileData = await fileToBase64(file);

    // Upload via API
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        fileData: fileData,
        folder: folder
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error('❌ Upload failed:', result.error);
      return {
        success: false,
        error: result.error || 'Upload failed'
      };
    }

    console.log('✅ Upload successful:', result.file.url);

    return {
      success: true,
      file: result.file
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Upload error:', error);
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * List images from Google Drive folder
 * @param folderId - Optional folder ID, uses default if not provided
 */
export async function listDriveImages(folderId?: string): Promise<DriveImage[]> {
  try {
    const url = folderId 
      ? `${API_BASE}?folderId=${folderId}`
      : API_BASE;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error('❌ Failed to list images:', result.error);
      return [];
    }

    return result.files;

  } catch (error) {
    console.error('❌ List images error:', error);
    return [];
  }
}

/**
 * Delete image from Google Drive
 * @param fileId - Google Drive file ID
 */
export async function deleteImageFromDrive(fileId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE}?fileId=${fileId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error('❌ Delete failed:', result.error);
      return {
        success: false,
        error: result.error || 'Delete failed'
      };
    }

    console.log('✅ Image deleted from Google Drive');
    return { success: true };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Get direct embed URL for an image
 * @param fileId - Google Drive file ID
 * @param size - Optional size (w200, w400, w800, etc.)
 */
export function getDriveImageUrl(fileId: string, size?: string): string {
  if (size) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=${size}`;
  }
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

/**
 * Extract file ID from Google Drive URL
 * @param url - Full Google Drive URL
 */
export function extractDriveFileId(url: string): string | null {
  // Pattern: https://drive.google.com/uc?export=view&id=FILE_ID
  // Pattern: https://drive.google.com/file/d/FILE_ID/view
  // Pattern: https://drive.google.com/thumbnail?id=FILE_ID
  
  const patterns = [
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
    /\/file\/d\/([a-zA-Z0-9_-]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Server-Side API Endpoint for Image Upload to Google Drive
 * Upload ảnh lên Google Drive và trả về public URL
 */

import { google } from 'googleapis';
import { Readable } from 'stream';

// Folder ID trên Google Drive để lưu ảnh sabo-arena
// Tạo folder "sabo-arena-images" trên Drive và share với service account email
const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || '1sabo-arena-images';

// Initialize Google Drive API
function getGoogleDrive() {
  try {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}');
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });

    return google.drive({ version: 'v3', auth });
  } catch (error) {
    console.error('Failed to initialize Google Drive:', error);
    throw new Error('Google Drive not configured');
  }
}

// Convert buffer to readable stream
function bufferToStream(buffer) {
  const readable = new Readable();
  readable._read = () => {};
  readable.push(buffer);
  readable.push(null);
  return readable;
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,DELETE');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // ============================================
  // DELETE - Xóa ảnh từ Google Drive
  // ============================================
  if (req.method === 'DELETE') {
    try {
      const { fileId } = req.query;
      
      if (!fileId) {
        return res.status(400).json({ error: 'Missing fileId' });
      }

      const drive = getGoogleDrive();
      await drive.files.delete({ fileId });

      return res.status(200).json({ 
        success: true, 
        message: 'File deleted successfully' 
      });
    } catch (error) {
      console.error('Delete error:', error);
      return res.status(500).json({ 
        error: 'Failed to delete file',
        message: error.message 
      });
    }
  }

  // ============================================
  // GET - List ảnh từ Google Drive folder
  // ============================================
  if (req.method === 'GET') {
    try {
      const drive = getGoogleDrive();
      const folderId = req.query.folderId || DRIVE_FOLDER_ID;
      
      const response = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false and mimeType contains 'image/'`,
        fields: 'files(id, name, mimeType, size, createdTime, webViewLink, webContentLink, thumbnailLink)',
        orderBy: 'createdTime desc',
        pageSize: 50
      });

      const files = (response.data.files || []).map(file => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        size: parseInt(file.size || '0'),
        createdAt: file.createdTime,
        // Public URL format cho ảnh từ Google Drive
        url: `https://drive.google.com/uc?export=view&id=${file.id}`,
        thumbnailUrl: file.thumbnailLink || `https://drive.google.com/thumbnail?id=${file.id}&sz=w200`,
        webViewLink: file.webViewLink
      }));

      return res.status(200).json({ 
        success: true, 
        files,
        count: files.length
      });
    } catch (error) {
      console.error('List files error:', error);
      return res.status(500).json({ 
        error: 'Failed to list files',
        message: error.message 
      });
    }
  }

  // ============================================
  // POST - Upload ảnh lên Google Drive
  // ============================================
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileName, fileType, fileData, folder } = req.body;

    if (!fileName || !fileType || !fileData) {
      return res.status(400).json({ 
        error: 'Missing required fields: fileName, fileType, fileData' 
      });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(fileType)) {
      return res.status(400).json({ 
        error: 'Invalid file type. Only JPG, PNG, WEBP, GIF allowed' 
      });
    }

    // Decode base64 data
    const base64Data = fileData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Validate file size (max 10MB)
    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ 
        error: 'File too large. Maximum 10MB allowed' 
      });
    }

    const drive = getGoogleDrive();

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = fileName.split('.').pop() || 'jpg';
    const uniqueFileName = `${timestamp}-${randomStr}.${ext}`;

    // Upload to Google Drive
    const fileMetadata = {
      name: uniqueFileName,
      parents: [folder || DRIVE_FOLDER_ID]
    };

    const media = {
      mimeType: fileType,
      body: bufferToStream(buffer)
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name, mimeType, size, webViewLink, webContentLink'
    });

    const file = response.data;

    // Make file publicly accessible
    await drive.permissions.create({
      fileId: file.id,
      resource: {
        role: 'reader',
        type: 'anyone'
      }
    });

    // Public URL để embed ảnh
    const publicUrl = `https://drive.google.com/uc?export=view&id=${file.id}`;
    const thumbnailUrl = `https://drive.google.com/thumbnail?id=${file.id}&sz=w400`;

    console.log('✅ Image uploaded to Google Drive:', uniqueFileName);

    res.status(200).json({ 
      success: true,
      file: {
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        size: parseInt(file.size || '0'),
        url: publicUrl,
        thumbnailUrl: thumbnailUrl,
        webViewLink: file.webViewLink
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    res.status(500).json({ 
      error: 'Failed to upload image',
      message: error.message 
    });
  }
}

/**
 * Test Upload Image to Google Drive (Local)
 * 
 * Chạy: node test-google-drive-upload.mjs
 */

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load credentials
function loadCredentials() {
  const envPath = path.join(__dirname, '.env.google');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/GOOGLE_SERVICE_ACCOUNT_JSON='(.+)'/);
  
  if (!match) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON not found');
  }
  
  return JSON.parse(match[1]);
}

// Buffer to stream
function bufferToStream(buffer) {
  const readable = new Readable();
  readable._read = () => {};
  readable.push(buffer);
  readable.push(null);
  return readable;
}

async function testUpload() {
  console.log('🧪 Testing Google Drive Upload...\n');

  try {
    const credentials = loadCredentials();
    console.log('✅ Loaded credentials');

    // Initialize Google Drive
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });

    const drive = google.drive({ version: 'v3', auth });
    console.log('✅ Google Drive API initialized');

    // Folder ID from longsangsabo@gmail.com's Drive
    const FOLDER_ID = '184w22qUnfJMmL6dJOVMUB4_1hiGZtNuK';

    // Create a test image (simple PNG)
    const testImagePath = path.join(__dirname, 'public', 'favicon.ico');
    
    if (!fs.existsSync(testImagePath)) {
      console.log('⚠️ No test image found, creating a simple one...');
      // Create a simple 1x1 red pixel PNG
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
        0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
        0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
        0x00, 0x00, 0x03, 0x00, 0x01, 0x00, 0x18, 0xDD,
        0x8D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45,
        0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);

      // Upload test PNG
      const timestamp = Date.now();
      const fileName = `test-${timestamp}.png`;

      console.log(`📤 Uploading test image: ${fileName}`);

      const response = await drive.files.create({
        resource: {
          name: fileName,
          parents: [FOLDER_ID]
        },
        media: {
          mimeType: 'image/png',
          body: bufferToStream(pngBuffer)
        },
        fields: 'id, name, mimeType, size, webViewLink'
      });

      const file = response.data;
      console.log('✅ Uploaded:', file);

      // Make public
      await drive.permissions.create({
        fileId: file.id,
        resource: {
          role: 'reader',
          type: 'anyone'
        }
      });
      console.log('✅ Made public');

      const publicUrl = `https://drive.google.com/uc?export=view&id=${file.id}`;
      console.log('\n========================================');
      console.log('📋 TEST SUCCESSFUL!');
      console.log('========================================');
      console.log('File ID:', file.id);
      console.log('Public URL:', publicUrl);
      console.log('View Link:', file.webViewLink);
      console.log('========================================\n');

      // Test accessing the URL
      console.log('🔍 Testing public access...');
      const testFetch = await fetch(publicUrl, { method: 'HEAD' });
      console.log('Response status:', testFetch.status);
      console.log('Content-Type:', testFetch.headers.get('content-type'));

      if (testFetch.ok) {
        console.log('✅ Image is publicly accessible!');
      } else {
        console.log('⚠️ Image might need a moment to become public');
      }

    } else {
      // Upload existing file
      const fileBuffer = fs.readFileSync(testImagePath);
      const timestamp = Date.now();
      const fileName = `test-favicon-${timestamp}.ico`;

      console.log(`📤 Uploading: ${fileName} (${fileBuffer.length} bytes)`);

      const response = await drive.files.create({
        resource: {
          name: fileName,
          parents: [FOLDER_ID]
        },
        media: {
          mimeType: 'image/x-icon',
          body: bufferToStream(fileBuffer)
        },
        fields: 'id, name, mimeType, size, webViewLink'
      });

      const file = response.data;
      
      await drive.permissions.create({
        fileId: file.id,
        resource: {
          role: 'reader',
          type: 'anyone'
        }
      });

      const publicUrl = `https://drive.google.com/uc?export=view&id=${file.id}`;
      console.log('\n✅ Upload successful!');
      console.log('Public URL:', publicUrl);
    }

    // List files in folder
    console.log('\n📂 Files in sabo-arena-images folder:');
    const listResponse = await drive.files.list({
      q: `'${FOLDER_ID}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, size, createdTime)',
      orderBy: 'createdTime desc',
      pageSize: 10
    });

    if (listResponse.data.files?.length) {
      listResponse.data.files.forEach((f, i) => {
        console.log(`  ${i + 1}. ${f.name} (${f.size} bytes)`);
        console.log(`     URL: https://drive.google.com/uc?export=view&id=${f.id}`);
      });
    } else {
      console.log('  (empty)');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testUpload();

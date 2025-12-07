/**
 * Setup Google Drive Folder for SABO Arena Images
 * 
 * Script này tạo folder trên Google Drive để lưu ảnh
 * Chạy: node setup-google-drive-folder.mjs
 */

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load credentials from .env.google
function loadCredentials() {
  const envPath = path.join(__dirname, '.env.google');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/GOOGLE_SERVICE_ACCOUNT_JSON='(.+)'/);
  
  if (!match) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON not found in .env.google');
  }
  
  return JSON.parse(match[1]);
}

async function setupGoogleDriveFolder() {
  console.log('🚀 Setting up Google Drive folder for SABO Arena...\n');

  try {
    const credentials = loadCredentials();
    console.log('✅ Loaded credentials for:', credentials.client_email);

    // Initialize Google Drive API
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive']
    });

    const drive = google.drive({ version: 'v3', auth });

    // Check if folder already exists
    const folderName = 'sabo-arena-images';
    const searchResponse = await drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name, webViewLink)'
    });

    let folderId;
    
    if (searchResponse.data.files && searchResponse.data.files.length > 0) {
      folderId = searchResponse.data.files[0].id;
      console.log('📁 Folder already exists:', searchResponse.data.files[0].webViewLink);
    } else {
      // Create new folder
      const createResponse = await drive.files.create({
        resource: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder'
        },
        fields: 'id, name, webViewLink'
      });

      folderId = createResponse.data.id;
      console.log('📁 Created new folder:', createResponse.data.webViewLink);

      // Make folder publicly accessible for viewing
      await drive.permissions.create({
        fileId: folderId,
        resource: {
          role: 'reader',
          type: 'anyone'
        }
      });
      console.log('🔓 Made folder publicly accessible');
    }

    console.log('\n========================================');
    console.log('📋 SETUP COMPLETE!');
    console.log('========================================');
    console.log('Folder ID:', folderId);
    console.log('\nAdd this to your .env.local:');
    console.log(`GOOGLE_DRIVE_FOLDER_ID=${folderId}`);
    console.log('\n👉 Also add GOOGLE_SERVICE_ACCOUNT_JSON from .env.google to .env.local');
    console.log('========================================\n');

    // Create subfolders for organization
    const subfolders = ['news', 'tournaments', 'players', 'clubs', 'general'];
    
    console.log('📂 Creating subfolders...');
    for (const subfolder of subfolders) {
      const subSearch = await drive.files.list({
        q: `name='${subfolder}' and '${folderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)'
      });

      if (subSearch.data.files && subSearch.data.files.length > 0) {
        console.log(`  ✅ ${subfolder} (exists): ${subSearch.data.files[0].id}`);
      } else {
        const subCreate = await drive.files.create({
          resource: {
            name: subfolder,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [folderId]
          },
          fields: 'id, name'
        });
        console.log(`  📁 ${subfolder} (created): ${subCreate.data.id}`);
      }
    }

    console.log('\n✅ All done! Google Drive is ready for image uploads.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setupGoogleDriveFolder();

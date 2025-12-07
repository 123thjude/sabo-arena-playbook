/**
 * Setup Google Drive với OAuth - Tạo folder từ tài khoản cá nhân
 * Chạy: node setup-drive-oauth.mjs
 */

import { google } from 'googleapis';
import http from 'http';
import open from 'open';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// OAuth2 credentials - Sử dụng từ Google Cloud Console
const CLIENT_ID = '117804804101353490237';
const CLIENT_SECRET = ''; // Cần tạo OAuth credentials

// Đọc service account để lấy project info
function getServiceAccountEmail() {
  const envPath = path.join(__dirname, '.env.google');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/client_email":"([^"]+)"/);
  return match ? match[1] : null;
}

async function main() {
  console.log('🔧 Google Drive Setup for SABO Arena\n');
  
  const serviceEmail = getServiceAccountEmail();
  console.log('Service Account:', serviceEmail);
  
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  HƯỚNG DẪN NHANH - Làm thủ công (30 giây)                 ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  1. Vào: https://drive.google.com                         ║
║                                                            ║
║  2. Click "New" → "New folder"                            ║
║     Đặt tên: sabo-arena-images                            ║
║                                                            ║
║  3. Click chuột phải folder → "Share"                     ║
║                                                            ║
║  4. Thêm email này (copy):                                ║
║     ${serviceEmail}
║                                                            ║
║  5. Chọn quyền: "Editor"                                  ║
║                                                            ║
║  6. Click "Share"                                         ║
║                                                            ║
║  7. Copy Folder ID từ URL:                                ║
║     https://drive.google.com/drive/folders/XXXXXX         ║
║                                                    ↑       ║
║                                          Copy phần này     ║
║                                                            ║
║  8. Chạy lệnh:                                            ║
║     node test-google-drive-upload.mjs YOUR_FOLDER_ID      ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`);

  // Mở Google Drive
  console.log('🌐 Đang mở Google Drive...\n');
  await open('https://drive.google.com/drive/my-drive');
}

main().catch(console.error);

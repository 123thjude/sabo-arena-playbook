import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';

export default function ImageAdmin() {
  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link 
            to="/" 
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">📷 Image Manager</h1>
            <p className="text-slate-400 text-sm">Upload và quản lý ảnh cho website</p>
          </div>
        </div>

        {/* Image Uploader */}
        <ImageUploader />

        {/* Info */}
        <div className="mt-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
          <h3 className="text-white font-medium mb-2">💡 Hướng dẫn</h3>
          <ul className="text-slate-400 text-sm space-y-1">
            <li>• Click vào ô chọn file hoặc kéo thả ảnh vào</li>
            <li>• Chấp nhận: JPG, PNG, WEBP, GIF (tối đa 10MB)</li>
            <li>• Sau khi upload, copy URL để sử dụng</li>
            <li>• Ảnh được lưu trữ trên Cloudinary CDN</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

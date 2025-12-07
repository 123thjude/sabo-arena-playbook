import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { uploadImage } from '@/lib/image-upload';
import { useUploadedImages } from '@/hooks/useUploadedImages';
import { Upload, Image as ImageIcon, Copy, CheckCircle2, Loader2, X, Trash2, ImageOff } from 'lucide-react';

// Component hiển thị ảnh với fallback
function ImageWithFallback({ src, alt, className }: { src: string; alt: string; className: string }) {
  const [error, setError] = useState(false);
  
  if (error) {
    return (
      <div className={`${className} bg-slate-600 flex items-center justify-center`}>
        <ImageOff className="w-6 h-6 text-slate-400" />
      </div>
    );
  }
  
  return (
    <img 
      src={src} 
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
}

export default function ImageUploader() {
  const { images, loading: imagesLoading, fetchImages, deleteImage } = useUploadedImages();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setResult(null);

    const uploadResult = await uploadImage(selectedFile, 'news-images');

    if (uploadResult.success && uploadResult.url) {
      setResult({
        type: 'success',
        message: '✅ Upload thành công!'
      });

      // Refresh images from database
      await fetchImages();

      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Auto-hide success message
      setTimeout(() => setResult(null), 3000);
    } else {
      setResult({
        type: 'error',
        message: `❌ ${uploadResult.error}`
      });
    }

    setUploading(false);
  };

  // Copy URL to clipboard
  const copyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Upload className="w-5 h-5 text-gold" />
            Upload Ảnh
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Result Alert */}
          {result && (
            <Alert className={result.type === 'success' ? 'bg-green-500/10 border-green-500' : 'bg-red-500/10 border-red-500'}>
              <AlertDescription className={result.type === 'success' ? 'text-green-400' : 'text-red-400'}>
                {result.message}
              </AlertDescription>
            </Alert>
          )}

          {/* File Input */}
          <div>
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploading}
              className="bg-slate-700 border-slate-600 text-white cursor-pointer"
            />
            <p className="text-xs text-slate-400 mt-1">
              Chấp nhận: JPG, PNG, WEBP, GIF. Tối đa 10MB • Powered by Cloudinary
            </p>
          </div>

          {/* Preview */}
          {previewUrl && (
            <div className="relative">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="w-full max-h-64 object-contain rounded border border-slate-600"
              />
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2 bg-slate-800/80 hover:bg-slate-700"
                onClick={clearSelection}
              >
                <X className="w-4 h-4 text-white" />
              </Button>
              <p className="text-sm text-slate-300 mt-2">
                📁 {selectedFile?.name} ({(selectedFile!.size / 1024).toFixed(0)} KB)
              </p>
            </div>
          )}

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="w-full bg-gold hover:bg-gold/90 text-slate-900 font-semibold"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang upload...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Ảnh
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Uploaded Images List */}
      {images.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <ImageIcon className="w-5 h-5 text-gold" />
              Ảnh Đã Upload ({images.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {imagesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gold" />
              </div>
            ) : (
              <div className="space-y-3">
                {images.map((img) => (
                  <div key={img.id} className="flex items-center gap-3 p-3 bg-slate-700/50 rounded border border-slate-600">
                    <ImageWithFallback 
                      src={img.public_url} 
                      alt={img.file_name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{img.file_name}</p>
                      <p className="text-xs text-slate-400 truncate">{img.public_url}</p>
                      <p className="text-xs text-slate-500">{(img.file_size / 1024).toFixed(0)} KB • {new Date(img.created_at).toLocaleString('vi-VN')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyUrl(img.public_url)}
                        className="text-gold hover:text-gold/80 hover:bg-gold/10"
                      >
                        {copiedUrl === img.public_url ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteImage(img.id, img.public_url)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

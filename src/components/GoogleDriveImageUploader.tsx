import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  uploadImageToDrive, 
  listDriveImages, 
  deleteImageFromDrive,
  type DriveImage 
} from '@/lib/google-drive-upload';
import { Upload, Image as ImageIcon, Copy, CheckCircle2, Loader2, X, Trash2, ExternalLink, Cloud } from 'lucide-react';

export default function GoogleDriveImageUploader() {
  const [images, setImages] = useState<DriveImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load images on mount
  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    setLoading(true);
    const files = await listDriveImages();
    setImages(files);
    setLoading(false);
  };

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

    const uploadResult = await uploadImageToDrive(selectedFile);

    if (uploadResult.success && uploadResult.file) {
      setResult({
        type: 'success',
        message: '✅ Upload lên Google Drive thành công!'
      });

      // Add new image to list
      setImages(prev => [uploadResult.file!, ...prev]);

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

  // Delete image
  const handleDelete = async (fileId: string) => {
    if (!confirm('Xác nhận xóa ảnh này?')) return;

    const result = await deleteImageFromDrive(fileId);
    if (result.success) {
      setImages(prev => prev.filter(img => img.id !== fileId));
    } else {
      setResult({
        type: 'error',
        message: `❌ ${result.error}`
      });
    }
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
            <Cloud className="w-5 h-5 text-blue-400" />
            Upload Ảnh lên Google Drive
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Info */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <p className="text-sm text-blue-300">
              📁 Ảnh sẽ được lưu trữ trên Google Drive với 15GB miễn phí
            </p>
          </div>

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
              Chấp nhận: JPG, PNG, WEBP, GIF. Tối đa 10MB
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
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang upload lên Google Drive...
              </>
            ) : (
              <>
                <Cloud className="w-4 h-4 mr-2" />
                Upload lên Google Drive
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Uploaded Images List */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <ImageIcon className="w-5 h-5 text-gold" />
            Ảnh trên Google Drive ({images.length})
          </CardTitle>
          <Button
            size="sm"
            variant="ghost"
            onClick={fetchImages}
            disabled={loading}
            className="text-slate-300 hover:text-white"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '🔄 Refresh'}
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gold" />
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Chưa có ảnh nào được upload</p>
            </div>
          ) : (
            <div className="space-y-3">
              {images.map((img) => (
                <div key={img.id} className="flex items-center gap-3 p-3 bg-slate-700/50 rounded border border-slate-600">
                  <img 
                    src={img.thumbnailUrl} 
                    alt={img.name}
                    className="w-16 h-16 object-cover rounded"
                    onError={(e) => {
                      // Fallback if thumbnail fails
                      (e.target as HTMLImageElement).src = img.url;
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{img.name}</p>
                    <p className="text-xs text-slate-400 truncate">{img.url}</p>
                    <p className="text-xs text-slate-500">
                      {(img.size / 1024).toFixed(0)} KB
                      {img.createdAt && ` • ${new Date(img.createdAt).toLocaleString('vi-VN')}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyUrl(img.url)}
                      className="text-gold hover:text-gold/80 hover:bg-gold/10"
                      title="Copy URL"
                    >
                      {copiedUrl === img.url ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    {img.webViewLink && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(img.webViewLink, '_blank')}
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                        title="Xem trên Google Drive"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(img.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      title="Xóa"
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
    </div>
  );
}

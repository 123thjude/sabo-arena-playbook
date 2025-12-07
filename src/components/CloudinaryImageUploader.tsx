'use client'

import React, { useState, useCallback, useRef } from 'react'
import { Upload, X, Image, Loader2, Check, ExternalLink, Copy } from 'lucide-react'
import { uploadImageToCloudinary, type CloudinaryImage } from '@/lib/cloudinary-upload'

interface CloudinaryImageUploaderProps {
  folder?: string
  onUploadSuccess?: (image: CloudinaryImage) => void
  onUrlCopied?: (url: string) => void
}

export default function CloudinaryImageUploader({ 
  folder = 'sabo-arena',
  onUploadSuccess,
  onUrlCopied
}: CloudinaryImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<CloudinaryImage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const processFile = async (file: File) => {
    setError(null)
    setUploading(true)

    const result = await uploadImageToCloudinary(file, folder)

    if (result.success && result.data) {
      setUploadedImages(prev => [result.data!, ...prev])
      onUploadSuccess?.(result.data)
    } else {
      setError(result.error || 'Upload thất bại')
    }

    setUploading(false)
  }

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0])
    }
  }, [folder])

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0])
    }
  }

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopied(url)
    onUrlCopied?.(url)
    setTimeout(() => setCopied(null), 2000)
  }

  const removeFromList = (publicId: string) => {
    setUploadedImages(prev => prev.filter(img => img.public_id !== publicId))
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4 space-y-4">
      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />
        
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-gray-600">Đang upload...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-10 h-10 text-gray-400" />
            <p className="text-gray-600">
              Kéo thả ảnh vào đây hoặc <span className="text-blue-500 font-medium">click để chọn</span>
            </p>
            <p className="text-sm text-gray-400">JPG, PNG, GIF, WEBP (max 10MB)</p>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
          ❌ {error}
        </div>
      )}

      {/* Uploaded Images */}
      {uploadedImages.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-gray-700">Ảnh đã upload ({uploadedImages.length})</h3>
          
          {uploadedImages.map((image) => (
            <div 
              key={image.public_id} 
              className="flex items-center gap-3 bg-white border rounded-lg p-3"
            >
              {/* Thumbnail */}
              <img
                src={image.thumbnail_url}
                alt=""
                className="w-16 h-16 object-cover rounded"
              />
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {image.public_id.split('/').pop()}
                </p>
                <p className="text-xs text-gray-400">
                  {image.width}x{image.height} • {image.format.toUpperCase()} • {(image.bytes / 1024).toFixed(1)}KB
                </p>
                <p className="text-xs text-gray-500 truncate">{image.secure_url}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    copyUrl(image.secure_url)
                  }}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  title="Copy URL"
                >
                  {copied === image.secure_url ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                
                <a
                  href={image.secure_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  title="Xem ảnh"
                >
                  <ExternalLink className="w-4 h-4 text-gray-500" />
                </a>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFromList(image.public_id)
                  }}
                  className="p-2 rounded-full hover:bg-red-100 transition-colors"
                  title="Xóa khỏi danh sách"
                >
                  <X className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="text-xs text-gray-400 text-center">
        💡 Powered by Cloudinary - Free 25 credits/month
      </div>
    </div>
  )
}

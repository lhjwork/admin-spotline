import { useState, useRef, useCallback } from 'react'
import { Upload, X, Image as ImageIcon, AlertCircle, Check, Trash2 } from 'lucide-react'

// 전역 타입 선언
declare global {
  interface Window {
    refreshStoreData?: (storeId: string) => Promise<void>;
  }
}

interface UploadedImage {
  id: string
  url: string
  filename: string
  size: number
  isUploading?: boolean
  progress?: number
}

interface ImageUploadProps {
  onImagesChange: (images: UploadedImage[]) => void
  maxImages?: number
  maxSizeInMB?: number
  acceptedFormats?: string[]
  initialImages?: UploadedImage[]
  storeId?: string // 매장 ID (업로드 시 필요)
}

const ACCEPTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE_MB = 5

export default function ImageUpload({
  onImagesChange,
  maxImages = 5,
  maxSizeInMB = MAX_SIZE_MB,
  acceptedFormats = ACCEPTED_FORMATS,
  initialImages = [],
  storeId
}: ImageUploadProps) {
  const [images, setImages] = useState<UploadedImage[]>(initialImages)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 파일 유효성 검사
  const validateFile = (file: File): string | null => {
    if (!acceptedFormats.includes(file.type)) {
      return `지원하지 않는 파일 형식입니다. (${acceptedFormats.map(f => f.split('/')[1]?.toUpperCase() || '').join(', ')} 만 지원)`
    }
    
    if (file.size > maxSizeInMB * 1024 * 1024) {
      return `파일 크기가 너무 큽니다. (최대 ${maxSizeInMB}MB)`
    }
    
    if (images.length >= maxImages) {
      return `최대 ${maxImages}개의 이미지만 업로드할 수 있습니다.`
    }
    
    return null
  }

  // S3 업로드 함수 (실제 API 호출)
  const uploadToS3 = async (file: File, onProgress?: (progress: number) => void): Promise<string> => {
    try {
      const token = localStorage.getItem('admin_token')
      if (!token) {
        throw new Error('인증 토큰이 없습니다.')
      }

      // storeId가 없으면 에러 (매장 생성 전에는 업로드 불가)
      if (!storeId) {
        throw new Error('매장을 먼저 저장한 후 이미지를 업로드할 수 있습니다.');
      }

      // 메인 배너 이미지 업로드 (모든 이미지가 메인 배너로 처리됨)
      const { s3UploadAPI } = await import('../services/upload/s3UploadAPI');
      if (onProgress) {
        return await s3UploadAPI.uploadMainBannerImageWithProgress(storeId, file, onProgress);
      } else {
        const response = await s3UploadAPI.uploadMainBannerImage(storeId, file);
        return response.data.data.url;
      }
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  // 파일 업로드 처리
  const handleFileUpload = useCallback(async (files: FileList) => {
    setUploadError(null)
    
    const fileArray = Array.from(files)
    
    for (const file of fileArray) {
      const validationError = validateFile(file)
      if (validationError) {
        setUploadError(validationError)
        continue
      }

      // 임시 이미지 객체 생성 (업로드 중 표시용)
      const tempImage: UploadedImage = {
        id: `temp-${Date.now()}-${Math.random()}`,
        url: URL.createObjectURL(file),
        filename: file.name,
        size: file.size,
        isUploading: true,
        progress: 0
      }

      const newImages = [...images, tempImage]
      setImages(newImages)
      onImagesChange(newImages)

      try {
        // S3에 업로드
        const uploadedUrl = await uploadToS3(file, (progress) => {
          setImages(prev => prev.map(img => 
            img.id === tempImage.id 
              ? { ...img, progress }
              : img
          ))
        })

        // 업로드 완료 후 실제 URL로 업데이트
        const finalImage: UploadedImage = {
          id: `uploaded-${Date.now()}-${Math.random()}`,
          url: uploadedUrl,
          filename: file.name,
          size: file.size,
          isUploading: false
        }

        // 업로드 완료 후 매장 정보 새로고침 (메인 배너 이미지)
        // 메인 배너 이미지 업로드 완료 - 부모 컴포넌트에서 매장 정보 새로고침하도록 알림
        if (onImagesChange) {
          // 임시 이미지 제거하고 새로고침 신호 전송
          const filteredImages = images.filter(img => img.id !== tempImage.id)
          setImages(filteredImages)
          onImagesChange(filteredImages)
          
          // 매장 정보 새로고침을 위한 콜백 호출 (부모에서 구현)
          if (window.refreshStoreData && storeId) {
            window.refreshStoreData(storeId)
          }
        }

      } catch (error) {
        // 업로드 실패 시 임시 이미지 제거
        const filteredImages = images.filter(img => img.id !== tempImage.id)
        setImages(filteredImages)
        onImagesChange(filteredImages)
        
        setUploadError(error instanceof Error ? error.message : '업로드에 실패했습니다.')
      }
    }
  }, [images, maxImages, maxSizeInMB, acceptedFormats, onImagesChange, storeId])

  // 이미지 삭제
  const handleRemoveImage = (imageId: string) => {
    const updatedImages = images.filter(img => img.id !== imageId)
    setImages(updatedImages)
    onImagesChange(updatedImages)
  }



  // 드래그 앤 드롭 이벤트
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files)
    }
  }

  // 파일 선택
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files)
    }
    // 파일 입력 초기화 (같은 파일 재선택 가능)
    e.target.value = ''
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      {/* 업로드 영역 */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          !storeId
            ? 'border-gray-200 bg-gray-50'
            : isDragging
            ? 'border-purple-500 bg-purple-50'
            : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
        }`}
        onDragOver={storeId ? handleDragOver : undefined}
        onDragLeave={storeId ? handleDragLeave : undefined}
        onDrop={storeId ? handleDrop : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedFormats.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          disabled={!storeId}
        />
        
        <div className="space-y-3">
          <div className="flex justify-center">
            <Upload className={`h-12 w-12 ${!storeId ? 'text-gray-300' : 'text-gray-400'}`} />
          </div>
          
          <div>
            {!storeId ? (
              <>
                <p className="text-lg font-medium text-gray-500">
                  매장을 먼저 저장해주세요
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  매장 정보를 저장한 후 이미지를 업로드할 수 있습니다
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-medium text-gray-900">
                  이미지를 드래그하거나 클릭하여 업로드
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {acceptedFormats.map(f => f.split('/')[1]?.toUpperCase() || '').join(', ')} 파일, 
                  최대 {maxSizeInMB}MB, {maxImages}개까지
                </p>
              </>
            )}
          </div>
          
          <button
            type="button"
            onClick={() => storeId && fileInputRef.current?.click()}
            disabled={!storeId}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md ${
              !storeId
                ? 'text-gray-400 bg-gray-200 cursor-not-allowed'
                : 'text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500'
            }`}
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            {!storeId ? '매장 저장 후 이용 가능' : '파일 선택'}
          </button>
        </div>
      </div>

      {/* 에러 메시지 */}
      {uploadError && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <span className="text-sm text-red-700">{uploadError}</span>
          <button
            onClick={() => setUploadError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 업로드된 이미지 목록 */}
      {images.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">
            업로드된 이미지 ({images.length}/{maxImages})
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div
                key={image.id}
                className="relative border rounded-lg overflow-hidden border-gray-200"
              >
                {/* 이미지 미리보기 */}
                <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                  <img
                    src={image.url}
                    alt={image.filename}
                    className="w-full h-32 object-cover"
                  />
                  
                  {/* 업로드 진행률 오버레이 */}
                  {image.isUploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="text-sm font-medium">업로드 중...</div>
                        <div className="text-xs mt-1">{image.progress || 0}%</div>
                        <div className="w-24 bg-gray-200 rounded-full h-2 mt-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${image.progress || 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 이미지 정보 및 액션 */}
                <div className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {image.filename}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(image.size)}
                      </p>
                    </div>
                    
                    {!image.isUploading && (
                      <div className="flex items-center space-x-1 ml-2">
                        {/* 삭제 버튼 */}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(image.id)}
                          className="p-1 rounded text-red-600 hover:bg-red-100"
                          title="이미지 삭제"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* 이미지 순서 표시 */}
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      메인 배너 #{index + 1}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 사용법 안내 */}
      <div className={`border rounded-md p-3 ${!storeId ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'}`}>
        <div className={`text-sm ${!storeId ? 'text-yellow-800' : 'text-blue-800'}`}>
          <p className="font-medium mb-1">
            {!storeId ? '⚠️ 이미지 업로드 안내' : '💡 이미지 업로드 가이드'}
          </p>
          <ul className="text-xs space-y-1 ml-4 list-disc">
            {!storeId ? (
              <>
                <li>매장 정보를 먼저 저장한 후 이미지를 업로드할 수 있습니다</li>
                <li>매장 저장 후 수정 모드에서 이미지를 추가해주세요</li>
                <li>임시로 이미지 URL을 직접 입력하여 테스트할 수 있습니다</li>
              </>
            ) : (
              <>
                <li>메인 배너 이미지를 최대 {maxImages}개까지 업로드할 수 있습니다</li>
                <li>이미���는 하나씩 업로드되며, 업로드 후 자동으로 목록이 새로고침됩니다</li>
                <li>각 이미지는 최대 {maxSizeInMB}MB까지 지원됩니다</li>
                <li>이미지 삭제는 아래 "현재 업로드된 이미지" 섹션에서 할 수 있습니다</li>
                <li>모든 이미지는 메인 배너로 사용됩니다 (대표/갤러리 구분 없음)</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
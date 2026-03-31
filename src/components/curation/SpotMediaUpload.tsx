import { useState, useRef, useCallback } from "react";
import { Upload, X, Film, Image, Loader2, GripVertical } from "lucide-react";
import { mediaAPI, type PresignedUrlResponse } from "../../services/media/mediaAPI";

export interface MediaItem {
  s3Key: string;
  publicUrl: string;
  mediaType: "IMAGE" | "VIDEO";
  thumbnailS3Key?: string;
  thumbnailUrl?: string;
  durationSec?: number;
  displayOrder: number;
  fileSizeBytes: number;
  mimeType: string;
}

interface SpotMediaUploadProps {
  value: MediaItem[];
  onChange: (items: MediaItem[]) => void;
}

interface UploadingFile {
  id: string;
  file: File;
  preview: string;
  progress: number;
  mediaType: "IMAGE" | "VIDEO";
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const MAX_VIDEO_DURATION = 30;
const MAX_MEDIA_COUNT = 10;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

function isImageType(type: string) {
  return ALLOWED_IMAGE_TYPES.includes(type);
}

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(Math.round(video.duration));
    };
    video.onerror = () => resolve(0);
    video.src = URL.createObjectURL(file);
  });
}

function generateVideoThumbnail(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.currentTime = 1;

    video.oncanplay = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      } else {
        resolve(null);
      }
      URL.revokeObjectURL(video.src);
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      resolve(null);
    };

    video.src = URL.createObjectURL(file);
  });
}

export default function SpotMediaUpload({ value, onChange }: SpotMediaUploadProps) {
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalCount = value.length + uploading.length;

  const validateFile = useCallback(async (file: File): Promise<string | null> => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `${file.name}: 허용되지 않는 파일 형식입니다`;
    }
    if (isImageType(file.type) && file.size > MAX_IMAGE_SIZE) {
      return `${file.name}: 이미지는 10MB 이하만 가능합니다`;
    }
    if (!isImageType(file.type) && file.size > MAX_VIDEO_SIZE) {
      return `${file.name}: 영상은 50MB 이하만 가능합니다`;
    }
    if (!isImageType(file.type)) {
      const duration = await getVideoDuration(file);
      if (duration > MAX_VIDEO_DURATION) {
        return `${file.name}: 영상은 ${MAX_VIDEO_DURATION}초 이하만 가능합니다`;
      }
    }
    return null;
  }, []);

  const uploadSingleFile = useCallback(async (
    file: File,
    uploadId: string,
    baseOrder: number,
  ): Promise<MediaItem | null> => {
    const mediaType = isImageType(file.type) ? "IMAGE" as const : "VIDEO" as const;
    const preview = URL.createObjectURL(file);

    const uploadingItem: UploadingFile = {
      id: uploadId,
      file,
      preview,
      progress: 0,
      mediaType,
    };

    setUploading((prev) => [...prev, uploadingItem]);

    try {
      let durationSec: number | undefined;
      if (mediaType === "VIDEO") {
        durationSec = await getVideoDuration(file);
      }

      const presigned: PresignedUrlResponse = await mediaAPI.getPresignedUrl({
        filename: file.name,
        contentType: file.type,
        contentLength: file.size,
        durationSec,
      });

      await mediaAPI.uploadToS3(presigned.uploadUrl, file, (percent) => {
        setUploading((prev) =>
          prev.map((u) => (u.id === uploadId ? { ...u, progress: percent } : u))
        );
      });

      let thumbnailUrl: string | undefined;
      if (mediaType === "VIDEO") {
        thumbnailUrl = (await generateVideoThumbnail(file)) ?? undefined;
      }

      return {
        s3Key: presigned.s3Key,
        publicUrl: presigned.publicUrl,
        mediaType: presigned.mediaType,
        durationSec,
        displayOrder: baseOrder,
        fileSizeBytes: file.size,
        mimeType: file.type,
        thumbnailUrl,
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : "업로드 실패");
      return null;
    } finally {
      setUploading((prev) => prev.filter((u) => u.id !== uploadId));
      URL.revokeObjectURL(preview);
    }
  }, []);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    setError(null);
    const fileArray = Array.from(files);
    const remaining = MAX_MEDIA_COUNT - totalCount;

    if (fileArray.length > remaining) {
      setError(`최대 ${MAX_MEDIA_COUNT}개까지 업로드 가능합니다 (현재 ${totalCount}개)`);
      return;
    }

    for (let i = 0; i < fileArray.length; i++) {
      const err = await validateFile(fileArray[i]);
      if (err) {
        setError(err);
        return;
      }
    }

    const uploadPromises = fileArray.map((file, i) =>
      uploadSingleFile(file, `${Date.now()}-${i}`, value.length + i)
    );

    const results = await Promise.all(uploadPromises);
    const successItems = results.filter((item): item is MediaItem => item !== null);

    if (successItems.length > 0) {
      onChange([...value, ...successItems]);
    }
  }, [totalCount, validateFile, uploadSingleFile, value, onChange]);

  const handleRemove = useCallback(async (index: number) => {
    const item = value[index];
    try {
      await mediaAPI.deleteMedia(item.s3Key);
    } catch {
      // S3 삭제 실패해도 UI에서는 제거
    }
    const next = value.filter((_, i) => i !== index).map((item, i) => ({
      ...item,
      displayOrder: i,
    }));
    onChange(next);
  }, [value, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        미디어 (이미지/영상, 최대 {MAX_MEDIA_COUNT}개)
      </label>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors ${
          dragOver
            ? "border-primary-400 bg-primary-50"
            : "border-gray-300 hover:border-gray-400 bg-gray-50"
        }`}
      >
        <Upload className="h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600">드래그 앤 드롭 또는 클릭하여 업로드</p>
        <p className="text-xs text-gray-400 mt-1">
          이미지(JPEG, PNG, WebP, 10MB) · 영상(MP4, WebM, 50MB, 30초)
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ALLOWED_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {/* Preview grid */}
      {(value.length > 0 || uploading.length > 0) && (
        <div className="grid grid-cols-3 gap-2">
          {value.map((item, index) => (
            <div key={item.s3Key} className="relative group rounded-lg overflow-hidden bg-gray-100 aspect-square">
              {item.mediaType === "IMAGE" ? (
                <img
                  src={item.publicUrl}
                  alt={`미디어 ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="relative w-full h-full">
                  {item.thumbnailUrl ? (
                    <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <video src={item.publicUrl} className="w-full h-full object-cover" muted />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Film className="h-6 w-6 text-white drop-shadow-lg" />
                  </div>
                  {item.durationSec && (
                    <span className="absolute bottom-1 right-1 text-[10px] bg-black/60 text-white px-1 rounded">
                      0:{item.durationSec.toString().padStart(2, "0")}
                    </span>
                  )}
                </div>
              )}
              <div className="absolute top-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <GripVertical className="h-3 w-3" />
                {index + 1}
              </div>
              {item.mediaType === "IMAGE" ? (
                <Image className="absolute top-1 right-6 h-3.5 w-3.5 text-white drop-shadow" />
              ) : (
                <Film className="absolute top-1 right-6 h-3.5 w-3.5 text-white drop-shadow" />
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleRemove(index); }}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          {uploading.map((item) => (
            <div key={item.id} className="relative rounded-lg overflow-hidden bg-gray-100 aspect-square">
              {item.mediaType === "IMAGE" ? (
                <img src={item.preview} alt="" className="w-full h-full object-cover opacity-50" />
              ) : (
                <video src={item.preview} className="w-full h-full object-cover opacity-50" muted />
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
                <Loader2 className="h-6 w-6 text-white animate-spin" />
                <span className="text-xs text-white mt-1">{item.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

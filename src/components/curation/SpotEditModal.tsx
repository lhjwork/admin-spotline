import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { X, Loader2 } from "lucide-react";
import type { SpotDetailResponse, UpdateSpotRequest, SpotCategory } from "../../types/v2";
import { AREAS, SPOT_CATEGORIES } from "../../constants";
import SpotMediaUpload, { type MediaItem } from "./SpotMediaUpload";

interface SpotEditModalProps {
  spot: SpotDetailResponse;
  onClose: () => void;
  onSave: (slug: string, data: UpdateSpotRequest) => Promise<void>;
  saving: boolean;
}

interface FormValues {
  title: string;
  category: SpotCategory;
  area: string;
  crewNote: string;
  tags: string;
  description: string;
}

export default function SpotEditModal({ spot, onClose, onSave, saving }: SpotEditModalProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);

  useEffect(() => {
    reset({
      title: spot.title,
      category: spot.category,
      area: spot.area,
      crewNote: spot.crewNote ?? "",
      tags: spot.tags?.join(", ") ?? "",
      description: spot.description ?? "",
    });
    // 기존 mediaItems 초기화
    if (spot.mediaItems) {
      setMediaItems(
        spot.mediaItems.map((m) => ({
          s3Key: m.url.split("/").slice(3).join("/"), // URL에서 S3 key 추출
          publicUrl: m.url,
          mediaType: m.mediaType,
          thumbnailUrl: m.thumbnailUrl ?? undefined,
          durationSec: m.durationSec ?? undefined,
          displayOrder: m.displayOrder,
          fileSizeBytes: 0,
          mimeType: "",
        }))
      );
    }
  }, [spot, reset]);

  const doSubmit = async (values: FormValues) => {
    const req: UpdateSpotRequest = {
      title: values.title,
      category: values.category,
      crewNote: values.crewNote || undefined,
      area: values.area,
      description: values.description || undefined,
      tags: values.tags ? values.tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
      mediaItems: mediaItems.map((m) => ({
        s3Key: m.s3Key,
        mediaType: m.mediaType,
        thumbnailS3Key: m.thumbnailS3Key,
        durationSec: m.durationSec,
        displayOrder: m.displayOrder,
        fileSizeBytes: m.fileSizeBytes,
        mimeType: m.mimeType,
      })),
    };
    await onSave(spot.slug, req);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Spot 편집</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(doSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
            <input
              {...register("title", { required: "제목을 입력하세요" })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
              <select
                {...register("category")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                {Object.entries(SPOT_CATEGORIES).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">지역</label>
              <select
                {...register("area")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="">선택</option>
                {AREAS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">크루 노트</label>
            <textarea
              {...register("crewNote", { maxLength: { value: 200, message: "200자 이내" } })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            {errors.crewNote && <p className="mt-1 text-xs text-red-500">{errors.crewNote.message}</p>}
          </div>

          {/* 미디어 */}
          <SpotMediaUpload value={mediaItems} onChange={setMediaItems} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">태그 (쉼표 구분)</label>
            <input
              {...register("tags")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
            <textarea
              {...register("description")}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 flex items-center"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

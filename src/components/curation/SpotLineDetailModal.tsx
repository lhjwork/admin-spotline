import { useQuery } from "@tanstack/react-query";
import { X, Pencil, Trash2, MapPin, Clock, Route as RouteIcon } from "lucide-react";
import { spotLineAPI } from "../../services/v2/spotLineAPI";
import { SPOTLINE_THEMES } from "../../constants";
import type { SpotLineTheme } from "../../types/v2";

interface SpotLineDetailModalProps {
  slug: string;
  onClose: () => void;
  onEdit: (slug: string) => void;
  onDelete: (slug: string) => void;
}

export default function SpotLineDetailModal({ slug, onClose, onEdit, onDelete }: SpotLineDetailModalProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["spotLine", slug],
    queryFn: () => spotLineAPI.getBySlug(slug),
  });

  const spotLine = data?.data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">SpotLine 상세</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isLoading && (
            <div className="flex items-center justify-center py-12 text-gray-400">불러오는 중...</div>
          )}

          {spotLine && (
            <div className="space-y-4">
              {/* 기본 정보 */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{spotLine.title}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                    {SPOTLINE_THEMES[spotLine.theme as SpotLineTheme] ?? spotLine.theme}
                  </span>
                  <span className="text-sm text-gray-500">{spotLine.area}</span>
                </div>
                {spotLine.description && (
                  <p className="mt-2 text-sm text-gray-600">{spotLine.description}</p>
                )}
              </div>

              {/* Spots */}
              {spotLine.spots.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Spots ({spotLine.spots.length}개)
                  </h4>
                  <div className="border rounded-lg divide-y">
                    {spotLine.spots.map((s, i) => (
                      <div key={`${s.spotId}-${i}`} className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xs font-bold">
                            {s.order}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{s.spotTitle}</p>
                            <p className="text-xs text-gray-500">{s.spotArea}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-1 ml-7 text-xs text-gray-500">
                          {s.stayDuration != null && (
                            <span className="flex items-center gap-0.5">
                              <Clock className="h-3 w-3" /> 체류 {s.stayDuration}분
                            </span>
                          )}
                          {s.walkingTimeToNext != null && (
                            <span className="flex items-center gap-0.5">
                              <MapPin className="h-3 w-3" /> 도보 {s.walkingTimeToNext}분
                            </span>
                          )}
                          {s.distanceToNext != null && (
                            <span>{s.distanceToNext}m</span>
                          )}
                        </div>
                        {s.transitionNote && (
                          <p className="ml-7 mt-1 text-xs text-gray-400 italic">{s.transitionNote}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 통계 */}
              <div className="grid grid-cols-3 gap-3">
                {spotLine.totalDistance != null && (
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <RouteIcon className="h-4 w-4 mx-auto text-gray-400 mb-1" />
                    <p className="text-sm font-semibold text-gray-900">
                      {spotLine.totalDistance >= 1000
                        ? `${(spotLine.totalDistance / 1000).toFixed(1)}km`
                        : `${spotLine.totalDistance}m`}
                    </p>
                    <p className="text-xs text-gray-500">총 거리</p>
                  </div>
                )}
                {spotLine.totalDuration != null && (
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <Clock className="h-4 w-4 mx-auto text-gray-400 mb-1" />
                    <p className="text-sm font-semibold text-gray-900">{spotLine.totalDuration}분</p>
                    <p className="text-xs text-gray-500">소요시간</p>
                  </div>
                )}
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-sm font-semibold text-gray-900">{spotLine.likesCount}</p>
                  <p className="text-xs text-gray-500">좋아요</p>
                </div>
              </div>

              {/* 메타 */}
              <div className="text-xs text-gray-400 space-y-0.5">
                {spotLine.creatorName && <p>생성자: {spotLine.creatorName}</p>}
                <p>생성일: {new Date(spotLine.createdAt).toLocaleDateString("ko-KR")}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {spotLine && (
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t">
            <button
              onClick={() => onEdit(slug)}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
            >
              <Pencil className="h-4 w-4 mr-1" /> 수정하기
            </button>
            <button
              onClick={() => onDelete(slug)}
              className="flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100"
            >
              <Trash2 className="h-4 w-4 mr-1" /> 삭제
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

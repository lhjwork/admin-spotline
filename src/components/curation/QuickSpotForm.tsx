import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import type { PlaceInfo, CreateSpotRequest } from "../../types/v2";
import { SPOT_CATEGORIES } from "../../constants";
import { placeToSpotRequest } from "../../utils/placeConverter";
import { extractAreaFromAddress, mapPlaceCategoryToSpotCategory } from "../../constants";

interface QuickSpotFormProps {
  place: PlaceInfo;
  onSubmit: (data: CreateSpotRequest) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

export default function QuickSpotForm({ place, onSubmit, onCancel, saving }: QuickSpotFormProps) {
  const [crewNote, setCrewNote] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const autoArea = extractAreaFromAddress(place.address);
  const autoCategory = mapPlaceCategoryToSpotCategory(place.category);

  const handleSubmit = async () => {
    if (!crewNote.trim()) {
      setError("crewNote를 입력해주세요");
      return;
    }
    setError(null);
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    try {
      await onSubmit(placeToSpotRequest(place, crewNote.trim(), tags));
    } catch (e: any) {
      setError(e?.message ?? "등록에 실패했습니다");
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{place.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{place.address}</p>
        </div>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* 자동 매핑 필드 */}
      <div className="flex gap-2 mb-3">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
          {SPOT_CATEGORIES[autoCategory]}
        </span>
        {autoArea && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
            {autoArea}
          </span>
        )}
        {!autoArea && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
            지역 자동 추출 실패
          </span>
        )}
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
          {place.provider === "kakao" ? "카카오" : "네이버"}
        </span>
      </div>

      {/* crewNote 입력 */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          crewNote <span className="text-red-500">*</span>
        </label>
        <textarea
          value={crewNote}
          onChange={(e) => setCrewNote(e.target.value)}
          placeholder="한줄 추천 코멘트를 입력하세요"
          rows={2}
          maxLength={100}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
        />
        <p className="text-xs text-gray-400 text-right">{crewNote.length}/100</p>
      </div>

      {/* 태그 입력 */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-700 mb-1">태그 (선택)</label>
        <input
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="콤마로 구분 (예: 성수카페, 디저트)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* 에러 */}
      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

      {/* 등록 버튼 */}
      <button
        onClick={handleSubmit}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        {saving ? "등록 중..." : "등록하기"}
      </button>
    </div>
  );
}

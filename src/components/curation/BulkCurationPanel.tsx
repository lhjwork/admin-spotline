import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PlaceInfo } from "../../types/v2";
import { SPOT_CATEGORIES } from "../../constants";
import { placeToSpotRequest } from "../../utils/placeConverter";
import { extractAreaFromAddress, mapPlaceCategoryToSpotCategory } from "../../constants";
import { spotAPI } from "../../services/v2/spotAPI";
import BulkResultToast from "./BulkResultToast";

interface BulkCurationPanelProps {
  places: PlaceInfo[];
  onComplete: () => void;
  onRemove: (placeId: string) => void;
}

export default function BulkCurationPanel({ places, onComplete, onRemove }: BulkCurationPanelProps) {
  const queryClient = useQueryClient();
  const [defaultNote, setDefaultNote] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ total: number; success: number } | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const requests = places.map((place) => {
        const key = `${place.provider}-${place.placeId}`;
        const note = notes[key]?.trim() || defaultNote.trim() || undefined;
        return placeToSpotRequest(place, note);
      });
      return spotAPI.bulkCreate(requests);
    },
    onSuccess: (res) => {
      const successCount = Array.isArray(res.data) ? res.data.length : places.length;
      setResult({ total: places.length, success: successCount });
      queryClient.invalidateQueries({ queryKey: ["spots"] });
      if (successCount === places.length) {
        onComplete();
      }
    },
    onError: () => {
      setResult({ total: places.length, success: 0 });
    },
  });

  const updateNote = (key: string, value: string) => {
    setNotes((prev) => ({ ...prev, [key]: value }));
  };

  if (places.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-sm text-gray-500">좌측에서 Place를 선택하세요</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">
        일괄 등록 ({places.length}개 선택)
      </h3>

      {/* 기본 crewNote */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          기본 crewNote (선택)
        </label>
        <input
          type="text"
          value={defaultNote}
          onChange={(e) => setDefaultNote(e.target.value)}
          placeholder="모든 Spot에 적용할 기본 코멘트"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* 선택된 Place 목록 */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto mb-4">
        {places.map((place) => {
          const key = `${place.provider}-${place.placeId}`;
          const area = extractAreaFromAddress(place.address);
          const cat = mapPlaceCategoryToSpotCategory(place.category);
          return (
            <div key={key} className="border border-gray-100 rounded-md p-3">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{place.name}</p>
                  <div className="flex gap-1 mt-0.5">
                    <span className="text-xs text-blue-600">{SPOT_CATEGORIES[cat]}</span>
                    {area && <span className="text-xs text-green-600">· {area}</span>}
                  </div>
                </div>
                <button
                  onClick={() => onRemove(`${place.provider}-${place.placeId}`)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <input
                type="text"
                value={notes[key] ?? ""}
                onChange={(e) => updateNote(key, e.target.value)}
                placeholder={defaultNote || "개별 crewNote (선택)"}
                className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          );
        })}
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center justify-between">
        <button
          onClick={onComplete}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          전체 취소
        </button>
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {mutation.isPending ? "등록 중..." : `${places.length}개 일괄 등록`}
        </button>
      </div>

      {/* 결과 토스트 */}
      {result && (
        <BulkResultToast
          total={result.total}
          success={result.success}
          onClose={() => setResult(null)}
        />
      )}
    </div>
  );
}

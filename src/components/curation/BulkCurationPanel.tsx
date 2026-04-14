import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import type { PlaceInfo, BulkMeta, BatchStatus } from "../../types/v2";
import { SPOT_CATEGORIES } from "../../constants";
import { placeToSpotRequest } from "../../utils/placeConverter";
import { extractAreaFromAddress, mapPlaceCategoryToSpotCategory } from "../../constants";
import { bulkCreateBatched } from "../../services/v2/spotAPI";
import BulkActionBar from "./BulkActionBar";
import BulkProgressModal from "./BulkProgressModal";
import BulkResultToast from "./BulkResultToast";

interface BulkCurationPanelProps {
  places: PlaceInfo[];
  onComplete: () => void;
  onRemove: (placeId: string) => void;
}

const DEFAULT_BULK_META: BulkMeta = {
  tags: [],
  category: null,
  area: null,
  crewNote: "",
};

export default function BulkCurationPanel({ places, onComplete, onRemove }: BulkCurationPanelProps) {
  const queryClient = useQueryClient();
  const [bulkMeta, setBulkMeta] = useState<BulkMeta>(DEFAULT_BULK_META);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ total: number; success: number } | null>(null);
  const [batches, setBatches] = useState<BatchStatus[]>([]);
  const [showProgress, setShowProgress] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const updateNote = (key: string, value: string) => {
    setNotes((prev) => ({ ...prev, [key]: value }));
  };

  const buildRequests = (placesToConvert: PlaceInfo[] = places) => {
    return placesToConvert.map((place) => {
      const key = `${place.provider}-${place.placeId}`;
      const note = notes[key]?.trim() || bulkMeta.crewNote.trim() || undefined;
      const tags = bulkMeta.tags.length > 0 ? bulkMeta.tags : undefined;
      const req = placeToSpotRequest(place, note, tags);
      // Apply bulk overrides (placeToSpotRequest doesn't accept category/area)
      if (bulkMeta.category) req.category = bulkMeta.category;
      if (bulkMeta.area) req.area = bulkMeta.area;
      return req;
    });
  };

  const handleBulkSubmit = async () => {
    const requests = buildRequests();
    setIsSending(true);
    setShowProgress(true);

    // Initialize batch statuses
    const batchSize = 10;
    const batchCount = Math.ceil(requests.length / batchSize);
    const initialBatches: BatchStatus[] = Array.from({ length: batchCount }, (_, i) => ({
      batchIndex: i,
      items: requests.slice(i * batchSize, (i + 1) * batchSize),
      status: "pending" as const,
    }));
    setBatches(initialBatches);

    const { success, failed } = await bulkCreateBatched(requests, batchSize, (_idx, status) => {
      setBatches((prev) => prev.map((b) => (b.batchIndex === status.batchIndex ? status : b)));
    });

    setIsSending(false);
    queryClient.invalidateQueries({ queryKey: ["spots"] });

    if (failed === 0) {
      setResult({ total: requests.length, success });
      onComplete();
    }
  };

  const handleRetry = async (batchIndex: number) => {
    const batch = batches.find((b) => b.batchIndex === batchIndex);
    if (!batch) return;

    setIsSending(true);
    setBatches((prev) =>
      prev.map((b) => (b.batchIndex === batchIndex ? { ...b, status: "processing" as const } : b)),
    );

    const { success } = await bulkCreateBatched(batch.items, batch.items.length, (_idx, status) => {
      setBatches((prev) =>
        prev.map((b) => (b.batchIndex === batchIndex ? { ...status, batchIndex } : b)),
      );
    });

    setIsSending(false);
    queryClient.invalidateQueries({ queryKey: ["spots"] });

    // Check if all batches are now done
    setBatches((prev) => {
      const allDone = prev.every((b) => b.status === "success" || (b.batchIndex !== batchIndex && b.status === "failed"));
      if (allDone && !prev.some((b) => b.status === "failed")) {
        const totalSuccess = prev.reduce((sum, b) => sum + (b.successCount ?? b.items.length), 0);
        setResult({ total: places.length, success: totalSuccess });
        onComplete();
      }
      return prev;
    });
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

      {/* 일괄 메타 설정 */}
      <BulkActionBar
        bulkMeta={bulkMeta}
        onChange={setBulkMeta}
        selectedCount={places.length}
      />

      {/* 선택된 Place 목록 */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto mb-4">
        {places.map((place) => {
          const key = `${place.provider}-${place.placeId}`;
          const area = bulkMeta.area || extractAreaFromAddress(place.address);
          const cat = bulkMeta.category || mapPlaceCategoryToSpotCategory(place.category);
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
                placeholder={bulkMeta.crewNote || "개별 crewNote (선택)"}
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
          onClick={handleBulkSubmit}
          disabled={isSending}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSending ? "등록 중..." : `${places.length}개 일괄 등록`}
        </button>
      </div>

      {/* 진행 모달 */}
      <BulkProgressModal
        isOpen={showProgress}
        batches={batches}
        onRetry={handleRetry}
        onClose={() => setShowProgress(false)}
      />

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

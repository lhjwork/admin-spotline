import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Search, Plus, Loader2 } from "lucide-react";
import { spotAPI } from "../../services/v2/spotAPI";
import { AREAS, SPOT_CATEGORIES } from "../../constants";
import type { SpotDetailResponse, SpotCategory } from "../../types/v2";

interface SpotLineSpotSelectorProps {
  onAdd: (spot: SpotDetailResponse) => void;
  addedSpotIds: Set<string>;
}

export default function SpotLineSpotSelector({ onAdd, addedSpotIds }: SpotLineSpotSelectorProps) {
  const [page, setPage] = useState(1);
  const [areaFilter, setAreaFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["spots-for-spotline", page, areaFilter, categoryFilter],
    queryFn: () => spotAPI.getList({
      page,
      size: 10,
      area: areaFilter || undefined,
      category: (categoryFilter as SpotCategory) || undefined,
    }),
    placeholderData: keepPreviousData,
  });

  const spots = data?.data?.content ?? [];
  const totalPages = data?.data?.totalPages ?? 0;

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Spot 선택</h3>

      <div className="flex gap-2 mb-3">
        <select
          value={areaFilter}
          onChange={(e) => { setAreaFilter(e.target.value); setPage(1); }}
          className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs"
        >
          <option value="">전체 지역</option>
          {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs"
        >
          <option value="">전체</option>
          {Object.entries(SPOT_CATEGORIES).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {isLoading && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
          </div>
        )}

        {spots.map((spot) => {
          const added = addedSpotIds.has(spot.id);
          return (
            <div
              key={spot.id}
              className={`border rounded-md p-2.5 flex items-center justify-between ${
                added ? "border-gray-200 bg-gray-50 opacity-60" : "border-gray-200 hover:border-primary-300"
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{spot.title}</p>
                <p className="text-xs text-gray-500">
                  {SPOT_CATEGORIES[spot.category]} · {spot.area}
                </p>
              </div>
              <button
                onClick={() => onAdd(spot)}
                disabled={added}
                className="ml-2 p-1.5 rounded-md text-primary-600 hover:bg-primary-50 disabled:text-gray-300 disabled:hover:bg-transparent"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* 간단한 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 border-t mt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="text-xs text-gray-600 hover:text-gray-900 disabled:text-gray-300"
          >
            이전
          </button>
          <span className="text-xs text-gray-500">{page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="text-xs text-gray-600 hover:text-gray-900 disabled:text-gray-300"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}

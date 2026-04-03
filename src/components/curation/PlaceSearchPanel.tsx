import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useDebounce } from "../../hooks/useDebounce";
import { placeAPI } from "../../services/v2/placeAPI";
import type { PlaceInfo } from "../../types/v2";
import PlaceSearchResultCard from "./PlaceSearchResultCard";

interface PlaceSearchPanelProps {
  onSelect: (place: PlaceInfo) => void;
  selectedPlaceId?: string | null;
  bulkMode?: boolean;
  checkedPlaces?: PlaceInfo[];
  onCheckedChange?: (places: PlaceInfo[]) => void;
  onQuickRegister?: (place: PlaceInfo) => void;
}

export default function PlaceSearchPanel({
  onSelect,
  selectedPlaceId,
  bulkMode,
  checkedPlaces = [],
  onCheckedChange,
  onQuickRegister,
}: PlaceSearchPanelProps) {
  const [query, setQuery] = useState("");
  const [provider, setProvider] = useState<"kakao" | "naver">("kakao");
  const debouncedQuery = useDebounce(query, 400);

  const checkedIds = new Set(checkedPlaces.map((p) => `${p.provider}-${p.placeId}`));

  const { data, isLoading, isError } = useQuery({
    queryKey: ["placeSearch", debouncedQuery, provider],
    queryFn: () => placeAPI.search(debouncedQuery, provider),
    enabled: debouncedQuery.length >= 2,
    placeholderData: keepPreviousData,
  });

  const places: PlaceInfo[] = data?.data ?? [];

  const handleCheckChange = (place: PlaceInfo, checked: boolean) => {
    if (!onCheckedChange) return;
    const key = `${place.provider}-${place.placeId}`;
    if (checked) {
      onCheckedChange([...checkedPlaces, place]);
    } else {
      onCheckedChange(checkedPlaces.filter((p) => `${p.provider}-${p.placeId}` !== key));
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 검색 입력 */}
      <div className="space-y-2 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="장소명, 주소 검색..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {(["kakao", "naver"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setProvider(p)}
                className={`px-3 py-1 text-xs rounded-full ${
                  provider === p
                    ? "bg-primary-100 text-primary-700 font-medium"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {p === "kakao" ? "카카오" : "네이버"}
              </button>
            ))}
          </div>
          {bulkMode && checkedPlaces.length > 0 && (
            <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
              {checkedPlaces.length}개 선택됨
            </span>
          )}
        </div>
      </div>

      {/* 결과 목록 */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
          </div>
        )}

        {isError && (
          <p className="text-sm text-red-500 text-center py-4">검색 중 오류가 발생했습니다</p>
        )}

        {!isLoading && places.length === 0 && debouncedQuery.length >= 2 && (
          <p className="text-sm text-gray-500 text-center py-4">검색 결과가 없습니다</p>
        )}

        {!isLoading && debouncedQuery.length < 2 && (
          <p className="text-sm text-gray-400 text-center py-8">2글자 이상 입력하세요</p>
        )}

        {places.map((place) => {
          const key = `${place.provider}-${place.placeId}`;
          return (
            <PlaceSearchResultCard
              key={key}
              place={place}
              onSelect={onSelect}
              selected={selectedPlaceId === place.placeId}
              bulkMode={bulkMode}
              checked={checkedIds.has(key)}
              onCheckChange={(checked) => handleCheckChange(place, checked)}
              onQuickRegister={onQuickRegister}
            />
          );
        })}
      </div>
    </div>
  );
}

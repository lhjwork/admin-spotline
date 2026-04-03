import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, ExternalLink, Zap, Layers, PenTool } from "lucide-react";
import { spotAPI } from "../services/v2/spotAPI";
import type { CreateSpotRequest, PlaceInfo } from "../types/v2";
import PlaceSearchPanel from "../components/curation/PlaceSearchPanel";
import SpotFormPanel from "../components/curation/SpotFormPanel";
import QuickSpotForm from "../components/curation/QuickSpotForm";
import BulkCurationPanel from "../components/curation/BulkCurationPanel";
import CurationProgress from "../components/curation/CurationProgress";

interface LocationInfo {
  address: string;
  lat: number;
  lng: number;
}

type CurationMode = "quick" | "bulk" | "manual";

const MODE_TABS: { key: CurationMode; label: string; icon: typeof Zap }[] = [
  { key: "quick", label: "Quick 모드", icon: Zap },
  { key: "bulk", label: "Bulk 모드", icon: Layers },
  { key: "manual", label: "수동 입력", icon: PenTool },
];

export default function SpotCuration() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<CurationMode>("quick");
  const [selectedPlace, setSelectedPlace] = useState<PlaceInfo | null>(null);
  const [checkedPlaces, setCheckedPlaces] = useState<PlaceInfo[]>([]);
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const kakaoMapRef = useRef<HTMLDivElement>(null);
  const kakaoMapInstance = useRef<any>(null);
  const kakaoMarkerInstance = useRef<any>(null);

  const { data: spotsPage } = useQuery({
    queryKey: ["spots", "today"],
    queryFn: () => spotAPI.getList({ page: 1, size: 1 }),
    refetchOnWindowFocus: false,
  });
  const totalSpots = spotsPage?.data?.totalElements ?? 0;

  const createMutation = useMutation({
    mutationFn: (data: CreateSpotRequest) => spotAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spots"] });
      setSelectedPlace(null);
    },
  });

  const handleQuickSubmit = async (data: CreateSpotRequest) => {
    await createMutation.mutateAsync(data);
  };

  const handleManualSubmit = async (data: CreateSpotRequest) => {
    await createMutation.mutateAsync(data);
    setLocation(null);
  };

  const handleQuickRegister = (place: PlaceInfo) => {
    setSelectedPlace(place);
  };

  const handleBulkRemove = (placeKey: string) => {
    setCheckedPlaces((prev) =>
      prev.filter((p) => `${p.provider}-${p.placeId}` !== placeKey)
    );
  };

  const handleBulkComplete = () => {
    setCheckedPlaces([]);
  };

  // 모드 전환 시 상태 초기화
  useEffect(() => {
    setSelectedPlace(null);
    setCheckedPlaces([]);
    setLocation(null);
  }, [mode]);

  // 카카오 지도 (수동 모드)
  useEffect(() => {
    if (mode !== "manual" || !location || !kakaoMapRef.current) return;
    if (!window.kakao?.maps) return;

    window.kakao.maps.load(() => {
      const container = kakaoMapRef.current;
      if (!container) return;

      const center = new window.kakao.maps.LatLng(location.lat, location.lng);

      if (!kakaoMapInstance.current) {
        kakaoMapInstance.current = new window.kakao.maps.Map(container, {
          center,
          level: 3,
        });
      } else {
        kakaoMapInstance.current.setCenter(center);
      }

      if (kakaoMarkerInstance.current) {
        kakaoMarkerInstance.current.setMap(null);
      }

      kakaoMarkerInstance.current = new window.kakao.maps.Marker({
        position: center,
      });
      kakaoMarkerInstance.current.setMap(kakaoMapInstance.current);

      const infoWindow = new window.kakao.maps.InfoWindow({
        content: `<div style="padding:8px 12px;font-size:13px;white-space:nowrap;">${location.address}</div>`,
      });
      infoWindow.open(kakaoMapInstance.current, kakaoMarkerInstance.current);

      setTimeout(() => {
        kakaoMapInstance.current?.relayout();
        kakaoMapInstance.current?.setCenter(center);
      }, 100);
    });
  }, [location, mode]);

  const naverMapUrl = location
    ? `https://map.naver.com/p/search/${encodeURIComponent(location.address)}`
    : null;

  const kakaoMapUrl = location
    ? `https://map.kakao.com/?q=${encodeURIComponent(location.address)}`
    : null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Spot 큐레이션</h1>
        <p className="text-sm text-gray-500 mt-1">Place를 검색하여 Spot으로 등록합니다</p>
      </div>

      <CurationProgress todayCount={totalSpots} />

      {/* 모드 탭 */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
        {MODE_TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={`flex items-center gap-1.5 flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              mode === key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* 성공/에러 메시지 */}
      {createMutation.isSuccess && mode === "quick" && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
          Spot이 성공적으로 등록되었습니다!
        </div>
      )}
      {createMutation.isError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          저장에 실패했습니다: {(createMutation.error as any)?.message ?? "알 수 없는 오류"}
        </div>
      )}

      {/* Quick / Bulk 모드 */}
      {(mode === "quick" || mode === "bulk") && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 좌측: Place 검색 */}
          <div className="bg-white rounded-lg shadow-sm p-6 min-h-[500px]">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Place 검색</h2>
            <PlaceSearchPanel
              onSelect={(place) => {
                if (mode === "quick") setSelectedPlace(place);
              }}
              selectedPlaceId={selectedPlace?.placeId}
              bulkMode={mode === "bulk"}
              checkedPlaces={checkedPlaces}
              onCheckedChange={setCheckedPlaces}
              onQuickRegister={handleQuickRegister}
            />
          </div>

          {/* 우측: Quick 또는 Bulk 패널 */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            {mode === "quick" && selectedPlace && (
              <QuickSpotForm
                place={selectedPlace}
                onSubmit={handleQuickSubmit}
                onCancel={() => setSelectedPlace(null)}
                saving={createMutation.isPending}
              />
            )}
            {mode === "quick" && !selectedPlace && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                <Zap className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">검색 결과에서 "바로 등록" 또는 Place를 선택하세요</p>
              </div>
            )}
            {mode === "bulk" && (
              <BulkCurationPanel
                places={checkedPlaces}
                onComplete={handleBulkComplete}
                onRemove={handleBulkRemove}
              />
            )}
          </div>
        </div>
      )}

      {/* 수동 입력 모드 */}
      {mode === "manual" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Spot 등록</h2>
            <SpotFormPanel
              onSubmit={handleManualSubmit}
              saving={createMutation.isPending}
              onLocationChange={setLocation}
            />
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 lg:sticky lg:top-6 lg:self-start">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">위치 확인</h2>

            {!location ? (
              <div className="flex flex-col items-center justify-center h-80 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <MapPin className="h-12 w-12 text-gray-300 mb-3" />
                <p className="text-sm text-gray-400">주소를 검색하면 지도가 표시됩니다</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500">카카오 지도</span>
                    {kakaoMapUrl && (
                      <a
                        href={kakaoMapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                      >
                        크게 보기 <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <div
                    ref={kakaoMapRef}
                    className="w-full h-64 rounded-lg border border-gray-200 bg-gray-100"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500">네이버 지도</span>
                    {naverMapUrl && (
                      <a
                        href={naverMapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800"
                      >
                        크게 보기 <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  {naverMapUrl && (
                    <a
                      href={naverMapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full h-20 rounded-lg border border-gray-200 bg-green-50 hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <span className="text-sm text-green-700 font-medium">네이버 지도에서 확인하기</span>
                    </a>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">주소</p>
                  <p className="text-sm text-gray-800 font-medium">{location.address}</p>
                  <div className="mt-2 flex gap-4">
                    <div>
                      <p className="text-xs text-gray-500">위도</p>
                      <p className="text-sm text-gray-700 font-mono">{location.lat.toFixed(6)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">경도</p>
                      <p className="text-sm text-gray-700 font-mono">{location.lng.toFixed(6)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

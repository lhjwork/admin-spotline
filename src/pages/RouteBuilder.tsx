import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { Loader2 } from "lucide-react";
import { routeAPI } from "../services/v2/routeAPI";
import type {
  SpotDetailResponse,
  CreateRouteRequest,
  UpdateRouteRequest,
  RouteTheme,
  RouteSpotDetail,
} from "../types/v2";
import { AREAS, ROUTE_THEMES } from "../constants";
import RouteSpotSelector from "../components/curation/RouteSpotSelector";
import RouteSpotList, { RouteSpotItem } from "../components/curation/RouteSpotList";
import RouteSummary from "../components/curation/RouteSummary";
import { calculateRouteDistances } from "../utils/geo";

interface FormValues {
  title: string;
  description: string;
  theme: RouteTheme;
  area: string;
}

/** RouteSpotDetail → SpotDetailResponse 최소 매핑 */
function toSpotDetail(rs: RouteSpotDetail): SpotDetailResponse {
  return {
    id: rs.spotId,
    slug: rs.spotSlug,
    title: rs.spotTitle,
    category: rs.spotCategory as SpotDetailResponse["category"],
    area: rs.spotArea,
    address: rs.spotAddress,
    latitude: rs.spotLatitude,
    longitude: rs.spotLongitude,
    crewNote: rs.crewNote,
    media: rs.spotMedia,
    // 미사용 필드 기본값
    description: null,
    source: "CREW",
    sido: null,
    sigungu: null,
    dong: null,
    blogUrl: null,
    instagramUrl: null,
    websiteUrl: null,
    naverPlaceId: null,
    kakaoPlaceId: null,
    tags: [],
    likesCount: 0,
    savesCount: 0,
    viewsCount: 0,
    creatorType: "crew",
    creatorName: null,
    createdAt: "",
    placeInfo: null,
  };
}

export default function RouteBuilder() {
  const { slug } = useParams<{ slug?: string }>();
  const isEditMode = !!slug;

  const [items, setItems] = useState<RouteSpotItem[]>([]);
  const [initialized, setInitialized] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: { title: "", description: "", theme: "DATE", area: "" },
  });

  // Edit mode: 기존 데이터 로드
  const { data: existingRoute } = useQuery(
    ["route", slug],
    () => routeAPI.getBySlug(slug!),
    { enabled: isEditMode },
  );

  // 로드 완료 시 form + items 초기화
  useEffect(() => {
    if (existingRoute && !initialized) {
      const r = existingRoute.data;
      reset({
        title: r.title,
        description: r.description ?? "",
        theme: r.theme,
        area: r.area,
      });
      setItems(
        r.spots.map((s) => ({
          spot: toSpotDetail(s),
          meta: {
            spotId: s.spotId,
            order: s.order,
            suggestedTime: s.suggestedTime ?? undefined,
            stayDuration: s.stayDuration ?? undefined,
            walkingTimeToNext: s.walkingTimeToNext ?? undefined,
            distanceToNext: s.distanceToNext ?? undefined,
            transitionNote: s.transitionNote ?? undefined,
          },
        })),
      );
      setInitialized(true);
    }
  }, [existingRoute, initialized, reset]);

  const addedIds = new Set(items.map((i) => i.spot.id));

  const distances = useMemo(() => calculateRouteDistances(items), [items]);

  const totalDistanceM = distances.reduce((sum, d) => sum + (d.distanceToNext ?? 0), 0);
  const totalWalkingMin = distances.reduce((sum, d) => sum + (d.walkingTimeToNext ?? 0), 0);
  const totalStayMin = items.reduce((sum, item) => sum + (item.meta.stayDuration ?? 0), 0);

  const createMutation = useMutation(
    (data: CreateRouteRequest) => routeAPI.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["routes"]);
        navigate("/routes");
      },
    }
  );

  const updateMutation = useMutation(
    (data: UpdateRouteRequest) => routeAPI.update(slug!, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["routes"]);
        queryClient.invalidateQueries(["route", slug]);
        navigate("/routes");
      },
    }
  );

  const mutation = isEditMode ? updateMutation : createMutation;

  const handleAdd = (spot: SpotDetailResponse) => {
    if (addedIds.has(spot.id)) return;
    setItems((prev) => [
      ...prev,
      {
        spot,
        meta: {
          spotId: spot.id,
          order: prev.length + 1,
        },
      },
    ]);
  };

  const buildSpots = () =>
    items.map((item, i) => {
      const auto = distances[i];
      return {
        spotId: item.meta.spotId,
        order: item.meta.order,
        suggestedTime: item.meta.suggestedTime || undefined,
        stayDuration: item.meta.stayDuration || undefined,
        walkingTimeToNext: item.meta.walkingTimeToNext || auto?.walkingTimeToNext || undefined,
        distanceToNext: auto?.distanceToNext || undefined,
        transitionNote: item.meta.transitionNote || undefined,
      };
    });

  const doSubmit = (values: FormValues) => {
    if (items.length === 0) return;

    if (isEditMode) {
      const req: UpdateRouteRequest = {
        title: values.title,
        description: values.description || undefined,
        theme: values.theme,
        area: values.area,
        spots: buildSpots(),
      };
      updateMutation.mutate(req);
    } else {
      const req: CreateRouteRequest = {
        title: values.title,
        description: values.description || undefined,
        theme: values.theme,
        area: values.area,
        spots: buildSpots(),
        creatorName: "crew",
      };
      createMutation.mutate(req);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? "Route 수정" : "Route 빌더"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isEditMode ? "Route 정보를 수정합니다" : "Spot을 선택하여 Route를 구성합니다"}
        </p>
      </div>

      {mutation.isError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          Route {isEditMode ? "수정" : "생성"}에 실패했습니다: {(mutation.error as any)?.message ?? "알 수 없는 오류"}
        </div>
      )}

      <form onSubmit={handleSubmit(doSubmit)}>
        {/* Route 메타데이터 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Route 제목 *</label>
              <input
                {...register("title", { required: "제목을 입력하세요" })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="성수동 카페 투어"
              />
              {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">테마 *</label>
              <select
                {...register("theme")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                {Object.entries(ROUTE_THEMES).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">지역 *</label>
              <select
                {...register("area", { required: "지역을 선택하세요" })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="">선택</option>
                {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              {errors.area && <p className="mt-1 text-xs text-red-500">{errors.area.message}</p>}
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">설명 (선택)</label>
            <textarea
              {...register("description")}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="이 Route에 대한 설명..."
            />
          </div>
        </div>

        {/* Route 요약 */}
        {items.length > 0 && (
          <div className="mb-6">
            <RouteSummary
              spotCount={items.length}
              totalDistanceM={totalDistanceM}
              totalWalkingMin={totalWalkingMin}
              totalStayMin={totalStayMin}
            />
          </div>
        )}

        {/* 메인 영역: Spot 선택 + 순서 배치 */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* 왼쪽: Spot 선택 */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-4 h-[calc(100vh-480px)] flex flex-col">
            <RouteSpotSelector onAdd={handleAdd} addedSpotIds={addedIds} />
          </div>

          {/* 오른쪽: 선택된 Spot 순서 배치 */}
          <div className="lg:col-span-3 bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">
                선택된 Spot ({items.length}개)
              </h3>
            </div>
            <RouteSpotList items={items} onChange={setItems} distances={distances} />
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={mutation.isLoading || items.length === 0}
            className="flex items-center px-6 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mutation.isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {isEditMode ? "Route 수정" : "Route 생성"} ({items.length}개 Spot)
          </button>
        </div>
      </form>
    </div>
  );
}

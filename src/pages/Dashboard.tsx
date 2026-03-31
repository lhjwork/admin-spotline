import { useQuery } from "react-query";
import { useNavigate } from "react-router-dom";
import { MapPin, Route, Search, ArrowUpRight } from "lucide-react";
import { spotAPI } from "../services/v2/spotAPI";
import { routeAPI } from "../services/v2/routeAPI";
import { AREAS, SPOT_CATEGORIES } from "../constants";
import type { SpotCategory } from "../types/v2";
import CurationProgress from "../components/curation/CurationProgress";
import AreaHeatmap from "../components/dashboard/AreaHeatmap";
import CategoryPieChart from "../components/dashboard/CategoryPieChart";
import CurationGoalDetail from "../components/dashboard/CurationGoalDetail";

// 목표 지역 (7개)
const GOAL_AREAS = [
  { area: "성수", target: 50 },
  { area: "을지로", target: 40 },
  { area: "연남동", target: 40 },
  { area: "홍대", target: 40 },
  { area: "이태원", target: 30 },
  { area: "한남동", target: 30 },
  { area: "종로", target: 30 },
];
const TOTAL_SPOT_TARGET = 300;

const CATEGORY_KEYS = Object.keys(SPOT_CATEGORIES) as SpotCategory[];

export default function Dashboard() {
  const navigate = useNavigate();

  const { data: spotsData, isLoading: spotsLoading } = useQuery(
    ["dashboard-spots"],
    () => spotAPI.getList({ page: 1, size: 1 }),
    { refetchOnWindowFocus: false }
  );

  const { data: routesData, isLoading: routesLoading } = useQuery(
    ["dashboard-routes"],
    () => routeAPI.getPopular({ page: 1, size: 1 }),
    { refetchOnWindowFocus: false }
  );

  // 20개 지역별 Spot 수
  const areaQueries = AREAS.map((area) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useQuery(
      ["dashboard-area", area],
      () => spotAPI.getList({ page: 1, size: 1, area }),
      { refetchOnWindowFocus: false }
    )
  );

  // 10개 카테고리별 Spot 수
  const categoryQueries = CATEGORY_KEYS.map((cat) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useQuery(
      ["dashboard-category", cat],
      () => spotAPI.getList({ page: 1, size: 1, category: cat }),
      { refetchOnWindowFocus: false }
    )
  );

  const totalSpots = spotsData?.data?.totalElements ?? 0;
  const totalRoutes = routesData?.data?.totalElements ?? 0;
  const isLoading = spotsLoading || routesLoading;

  const areaCounts = AREAS.map((area, i) => ({
    area,
    count: areaQueries[i].data?.data?.totalElements ?? 0,
  }));

  const categoryCounts = CATEGORY_KEYS.map((cat, i) => ({
    category: cat,
    label: SPOT_CATEGORIES[cat],
    count: categoryQueries[i].data?.data?.totalElements ?? 0,
  }));

  const goals = GOAL_AREAS.map((g) => ({
    ...g,
    current: areaCounts.find((a) => a.area === g.area)?.count ?? 0,
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">크루 큐레이션 대시보드</h1>
        <p className="text-sm text-gray-500 mt-1">Spot과 Route 큐레이션 현황을 한눈에 확인합니다</p>
      </div>

      <CurationProgress todayCount={totalSpots} />

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">총 Spot 수</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{totalSpots}</p>
              <p className="text-xs text-gray-400 mt-1">목표: 200~300개</p>
            </div>
            <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <MapPin className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">총 Route 수</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{totalRoutes}</p>
              <p className="text-xs text-gray-400 mt-1">목표: 15~20개</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Route className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 히트맵 + 파이 차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <AreaHeatmap areaCounts={areaCounts} />
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <CategoryPieChart categoryCounts={categoryCounts} />
        </div>
      </div>

      {/* 목표 달성률 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <CurationGoalDetail
          goals={goals}
          totalTarget={TOTAL_SPOT_TARGET}
          totalCurrent={totalSpots}
        />
      </div>

      {/* 빠른 액션 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => navigate("/curation")}
          className="flex items-center justify-between p-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Search className="h-5 w-5" />
            <span className="font-medium">큐레이션 시작</span>
          </div>
          <ArrowUpRight className="h-5 w-5" />
        </button>

        <button
          onClick={() => navigate("/routes/new")}
          className="flex items-center justify-between p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Route className="h-5 w-5" />
            <span className="font-medium">Route 만들기</span>
          </div>
          <ArrowUpRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

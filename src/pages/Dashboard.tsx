import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { MapPin, Route, Search, ArrowUpRight, Eye, MessageSquare, Flag, TrendingUp } from "lucide-react";
import { spotAPI } from "../services/v2/spotAPI";
import { routeAPI } from "../services/v2/routeAPI";
import { analyticsAPI } from "../services/v2/analyticsAPI";
import { AREAS, SPOT_CATEGORIES } from "../constants";
import type { SpotCategory } from "../types/v2";
import CurationProgress from "../components/curation/CurationProgress";
import AreaHeatmap from "../components/dashboard/AreaHeatmap";
import CategoryPieChart from "../components/dashboard/CategoryPieChart";
import CurationGoalDetail from "../components/dashboard/CurationGoalDetail";
import { MetricCard, ChartCard, BarChartComponent } from "../components/Chart";

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

  const { data: spotsData, isLoading: spotsLoading } = useQuery({
    queryKey: ["dashboard-spots"],
    queryFn: () => spotAPI.getList({ page: 1, size: 1 }),
    refetchOnWindowFocus: false,
  });

  const { data: routesData, isLoading: routesLoading } = useQuery({
    queryKey: ["dashboard-routes"],
    queryFn: () => routeAPI.getPopular({ page: 1, size: 1 }),
    refetchOnWindowFocus: false,
  });

  // 20개 지역별 Spot 수
  const areaQueries = AREAS.map((area) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useQuery({
      queryKey: ["dashboard-area", area],
      queryFn: () => spotAPI.getList({ page: 1, size: 1, area }),
      refetchOnWindowFocus: false,
    })
  );

  // 10개 카테고리별 Spot 수
  const categoryQueries = CATEGORY_KEYS.map((cat) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useQuery({
      queryKey: ["dashboard-category", cat],
      queryFn: () => spotAPI.getList({ page: 1, size: 1, category: cat }),
      refetchOnWindowFocus: false,
    })
  );

  // ---- 플랫폼 성과 데이터 ----
  const { data: platformStats } = useQuery({
    queryKey: ["platform-stats"],
    queryFn: () => analyticsAPI.getStats(),
    refetchOnWindowFocus: false,
  });

  const { data: popularSpots } = useQuery({
    queryKey: ["popular-spots"],
    queryFn: () => analyticsAPI.getPopularSpots(),
    refetchOnWindowFocus: false,
  });

  const { data: popularRoutes } = useQuery({
    queryKey: ["popular-routes"],
    queryFn: () => analyticsAPI.getPopularRoutes(),
    refetchOnWindowFocus: false,
  });

  const { data: dailyTrend } = useQuery({
    queryKey: ["daily-trend"],
    queryFn: () => analyticsAPI.getDailyTrend(30),
    refetchOnWindowFocus: false,
  });

  const totalSpots = spotsData?.data?.totalElements ?? 0;
  const totalRoutes = routesData?.data?.totalElements ?? 0;
  const isLoading = spotsLoading || routesLoading;

  const areaCounts = AREAS.map((area, i) => ({
    area,
    count: areaQueries[i]?.data?.data?.totalElements ?? 0,
  }));

  const categoryCounts = CATEGORY_KEYS.map((cat, i) => ({
    category: cat,
    label: SPOT_CATEGORIES[cat],
    count: categoryQueries[i]?.data?.data?.totalElements ?? 0,
  }));

  const goals = GOAL_AREAS.map((g) => ({
    ...g,
    current: areaCounts.find((a) => a.area === g.area)?.count ?? 0,
  }));

  // 트렌드 차트 데이터 변환
  const trendChartData = (dailyTrend ?? []).map((d) => ({
    name: d.date.slice(5), // MM-DD
    Spot: d.spotCount,
    Route: d.routeCount,
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

      {/* ===== 플랫폼 성과 섹션 (신규) ===== */}
      {platformStats && (
        <>
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-bold text-gray-900">플랫폼 성과</h2>
            <p className="text-sm text-gray-500 mt-1">조회수, 댓글, 신고 등 플랫폼 활동 지표</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="Spot 조회수"
              value={platformStats.totalSpotViews.toLocaleString()}
              change=""
              icon={Eye}
            />
            <MetricCard
              title="Route 조회수"
              value={platformStats.totalRouteViews.toLocaleString()}
              change=""
              icon={TrendingUp}
            />
            <MetricCard
              title="총 댓글"
              value={platformStats.totalComments.toLocaleString()}
              change=""
              icon={MessageSquare}
            />
            <MetricCard
              title="총 신고"
              value={platformStats.totalReports.toLocaleString()}
              change=""
              icon={Flag}
            />
          </div>
        </>
      )}

      {/* 인기 콘텐츠 테이블 */}
      {(popularSpots || popularRoutes) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {popularSpots && popularSpots.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">인기 Spot Top 10</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-gray-500 font-medium">#</th>
                      <th className="text-left py-2 text-gray-500 font-medium">제목</th>
                      <th className="text-left py-2 text-gray-500 font-medium">지역</th>
                      <th className="text-right py-2 text-gray-500 font-medium">조회</th>
                      <th className="text-right py-2 text-gray-500 font-medium">댓글</th>
                    </tr>
                  </thead>
                  <tbody>
                    {popularSpots.map((spot, i) => (
                      <tr key={spot.id} className="border-b border-gray-100">
                        <td className="py-2 text-gray-400">{i + 1}</td>
                        <td className="py-2 font-medium text-gray-900 max-w-[140px] truncate">{spot.title}</td>
                        <td className="py-2 text-gray-500">{spot.label}</td>
                        <td className="py-2 text-right text-gray-900">{spot.viewsCount}</td>
                        <td className="py-2 text-right text-gray-500">{spot.commentsCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {popularRoutes && popularRoutes.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">인기 Route Top 10</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-gray-500 font-medium">#</th>
                      <th className="text-left py-2 text-gray-500 font-medium">제목</th>
                      <th className="text-left py-2 text-gray-500 font-medium">테마</th>
                      <th className="text-right py-2 text-gray-500 font-medium">조회</th>
                      <th className="text-right py-2 text-gray-500 font-medium">댓글</th>
                    </tr>
                  </thead>
                  <tbody>
                    {popularRoutes.map((route, i) => (
                      <tr key={route.id} className="border-b border-gray-100">
                        <td className="py-2 text-gray-400">{i + 1}</td>
                        <td className="py-2 font-medium text-gray-900 max-w-[140px] truncate">{route.title}</td>
                        <td className="py-2 text-gray-500">{route.label}</td>
                        <td className="py-2 text-right text-gray-900">{route.viewsCount}</td>
                        <td className="py-2 text-right text-gray-500">{route.commentsCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 일별 콘텐츠 생성 트렌드 */}
      {trendChartData.length > 0 && (
        <ChartCard title="일별 콘텐츠 생성 트렌드" subtitle="최근 30일간 Spot/Route 생성 건수">
          <BarChartComponent
            data={trendChartData}
            xKey="name"
            bars={[
              { dataKey: "Spot", color: "#3B82F6" },
              { dataKey: "Route", color: "#10B981" },
            ]}
            height={300}
          />
        </ChartCard>
      )}

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

import { useQuery } from "react-query";
import { dashboardAPI, demoStoreAPI } from "../services/api";
import { useNavigate } from "react-router-dom";
import { Store, QrCode, TrendingUp, Users, Activity, Calendar, ArrowUpRight, CheckCircle, TestTube, BarChart3, Settings, AlertTriangle } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();

  const {
    data: stats,
    isLoading,
    error,
  } = useQuery("dashboard-stats", () => dashboardAPI.getStats(), {
    select: (response) => response.data,
    refetchInterval: 30000, // 30초마다 새로고침
  });

  const { data: demoStats } = useQuery("demo-stats", () => demoStoreAPI.getDemoStats(), {
    select: (response) => response.data,
    refetchInterval: 60000, // 1분마다 새로고침
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">데이터를 불러오는데 실패했습니다.</div>;
  }

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">SpotLine 관리자 대시보드</h1>
        <p className="text-gray-600 mt-2">실제 운영과 데모 시스템을 통합 관리합니다</p>
      </div>

      {/* 실제 운영 통계 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">실제 운영 서비스</h2>
            <span className="text-sm text-gray-500">사용자 분석 데이터 수집</span>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">운영 매장</p>
                  <p className="text-2xl font-bold text-green-900">{stats?.totalStores || 0}</p>
                  <p className="text-xs text-green-700">활성: {stats?.activeStores || 0}개</p>
                </div>
                <Store className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">QR 스캔</p>
                  <p className="text-2xl font-bold text-blue-900">{stats?.totalQRScans || 0}</p>
                  <p className="text-xs text-blue-700">오늘: {stats?.todayScans || 0}회</p>
                </div>
                <QrCode className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">추천 관계</p>
                  <p className="text-2xl font-bold text-purple-900">{stats?.totalRecommendations || 0}</p>
                  <p className="text-xs text-purple-700">활성 연결</p>
                </div>
                <ArrowUpRight className="h-8 w-8 text-purple-600" />
              </div>
            </div>

            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">방문자</p>
                  <p className="text-2xl font-bold text-orange-900">{stats?.uniqueVisitors || 0}</p>
                  <p className="text-xs text-orange-700">전환율: {stats?.conversionRate || 0}%</p>
                </div>
                <Users className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 데모 시스템 통계 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <TestTube className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">데모 시스템</h2>
            <span className="text-sm text-gray-500">업주 소개용 (통계 수집 없음)</span>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">데모 매장</p>
                  <p className="text-2xl font-bold text-orange-900">{demoStats?.totalDemoStores || 0}</p>
                  <p className="text-xs text-orange-700">활성: {demoStats?.activeDemoStores || 0}개</p>
                </div>
                <Store className="h-8 w-8 text-orange-600" />
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">데모 사용</p>
                  <p className="text-2xl font-bold text-yellow-900">{demoStats?.demoUsageCount || 0}</p>
                  <p className="text-xs text-yellow-700">총 사용 횟수</p>
                </div>
                <Activity className="h-8 w-8 text-yellow-600" />
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">마지막 사용</p>
                  <p className="text-lg font-bold text-gray-900">{demoStats?.lastUsed ? new Date(demoStats.lastUsed).toLocaleDateString("ko-KR") : "없음"}</p>
                  <p className="text-xs text-gray-700">최근 데모 접근</p>
                </div>
                <Calendar className="h-8 w-8 text-gray-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 빠른 작업 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 실제 운영 관리 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">실제 운영 관리</h3>
          </div>
          <div className="p-6 space-y-3">
            <button onClick={() => navigate("/stores")} className="w-full flex items-center justify-between p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="flex items-center space-x-3">
                <Store className="h-5 w-5 text-green-600" />
                <span className="font-medium">매장 관리</span>
              </div>
              <ArrowUpRight className="h-4 w-4 text-gray-400" />
            </button>

            <button onClick={() => navigate("/recommendations")} className="w-full flex items-center justify-between p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="flex items-center space-x-3">
                <ArrowUpRight className="h-5 w-5 text-purple-600" />
                <span className="font-medium">추천 관리</span>
              </div>
              <ArrowUpRight className="h-4 w-4 text-gray-400" />
            </button>

            <button onClick={() => navigate("/analytics")} className="w-full flex items-center justify-between p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="flex items-center space-x-3">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <span className="font-medium">분석 데이터</span>
              </div>
              <ArrowUpRight className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* 데모 시스템 관리 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">데모 시스템 관리</h3>
          </div>
          <div className="p-6 space-y-3">
            <button onClick={() => navigate("/demo-stores")} className="w-full flex items-center justify-between p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="flex items-center space-x-3">
                <TestTube className="h-5 w-5 text-orange-600" />
                <span className="font-medium">데모 매장 관리</span>
              </div>
              <ArrowUpRight className="h-4 w-4 text-gray-400" />
            </button>

            <button onClick={() => navigate("/experience-configs")} className="w-full flex items-center justify-between p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="flex items-center space-x-3">
                <Settings className="h-5 w-5 text-gray-600" />
                <span className="font-medium">체험 설정</span>
              </div>
              <ArrowUpRight className="h-4 w-4 text-gray-400" />
            </button>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">데모 시스템 안내</p>
                  <p className="text-yellow-700">업주 소개용으로만 사용되며 사용자 데이터를 수집하지 않습니다.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useQuery } from "react-query";
import { dashboardAPI } from "../services/api";
import { useNavigate } from "react-router-dom";
import { Store, QrCode, TrendingUp, Users, Activity, ArrowUpRight, CheckCircle, TestTube, BarChart3 } from "lucide-react";

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
        <p className="text-gray-600 mt-2">실제 운영 서비스를 관리합니다</p>
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

        {/* 데모 시스템 전환 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">데모 시스템</h3>
          </div>
          <div className="p-6">
            <div className="text-center space-y-4">
              <TestTube className="h-12 w-12 text-orange-600 mx-auto" />
              <div>
                <h4 className="text-lg font-medium text-gray-900">데모 관리 모드</h4>
                <p className="text-sm text-gray-600 mt-1">업주 소개용 데모 시스템을 별도로 관리합니다</p>
              </div>
              <button onClick={() => navigate("/demo")} className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                <TestTube className="h-5 w-5" />
                <span>데모 관리 모드로 전환</span>
              </button>
              <div className="text-xs text-gray-500 space-y-1">
                <p>• 업주 소개용 전용 시스템</p>
                <p>• 실제 데이터와 완전 분리</p>
                <p>• 사용자 데이터 수집 없음</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useQuery } from "react-query";
import { demoStoreAPI } from "../../services/api";
import { useNavigate } from "react-router-dom";
import { TestTube, Activity, Calendar, ArrowUpRight, AlertTriangle, Settings, BarChart3, ExternalLink, Users } from "lucide-react";

export default function DemoDashboard() {
  const navigate = useNavigate();

  const {
    data: demoStats,
    isLoading,
    error,
  } = useQuery("demo-stats", () => demoStoreAPI.getDemoStats(), {
    select: (response) => response.data,
    refetchInterval: 60000, // 1분마다 새로고침
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">데모 데이터를 불러오는데 실패했습니다.</div>;
  }

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div>
        <div className="flex items-center space-x-3">
          <TestTube className="h-8 w-8 text-orange-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">데모 시스템 대시보드</h1>
            <p className="text-gray-600 mt-1">업주 소개용 데모 매장을 관리합니다</p>
          </div>
        </div>
      </div>

      {/* 중요 안내 */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-6 w-6 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="text-lg font-medium text-yellow-800">데모 시스템 안내</h3>
            <div className="mt-2 text-sm text-yellow-700 space-y-1">
              <p>• 이 시스템은 업주에게 SpotLine 서비스를 소개하기 위한 데모용입니다</p>
              <p>• 실제 사용자 데이터를 수집하지 않으며, 통계에도 포함되지 않습니다</p>
              <p>• 데모 매장은 실제 서비스와 별도로 관리됩니다</p>
            </div>
          </div>
        </div>
      </div>

      {/* 데모 통계 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">데모 시스템 현황</h2>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-orange-50 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">데모 매장</p>
                  <p className="text-3xl font-bold text-orange-900">{demoStats?.totalDemoStores || 0}</p>
                  <p className="text-sm text-orange-700 mt-1">활성: {demoStats?.activeDemoStores || 0}개</p>
                </div>
                <TestTube className="h-10 w-10 text-orange-600" />
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">데모 사용</p>
                  <p className="text-3xl font-bold text-blue-900">{demoStats?.demoUsageCount || 0}</p>
                  <p className="text-sm text-blue-700 mt-1">총 사용 횟수</p>
                </div>
                <Activity className="h-10 w-10 text-blue-600" />
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">마지막 사용</p>
                  <p className="text-lg font-bold text-gray-900">{demoStats?.lastUsed ? new Date(demoStats.lastUsed).toLocaleDateString("ko-KR") : "없음"}</p>
                  <p className="text-sm text-gray-700 mt-1">최근 데모 접근</p>
                </div>
                <Calendar className="h-10 w-10 text-gray-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 빠른 작업 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 데모 관리 작업 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">데모 관리</h3>
          </div>
          <div className="p-6 space-y-3">
            <button
              onClick={() => navigate("/demo/stores")}
              className="w-full flex items-center justify-between p-4 text-left border border-gray-200 rounded-lg hover:bg-orange-50 hover:border-orange-200"
            >
              <div className="flex items-center space-x-3">
                <TestTube className="h-6 w-6 text-orange-600" />
                <div>
                  <span className="font-medium">데모 매장 관리</span>
                  <p className="text-sm text-gray-500">데모용 매장 생성, 수정, 관리</p>
                </div>
              </div>
              <ArrowUpRight className="h-5 w-5 text-gray-400" />
            </button>

            <button
              onClick={() => navigate("/demo/experience-configs")}
              className="w-full flex items-center justify-between p-4 text-left border border-gray-200 rounded-lg hover:bg-orange-50 hover:border-orange-200"
            >
              <div className="flex items-center space-x-3">
                <Settings className="h-6 w-6 text-gray-600" />
                <div>
                  <span className="font-medium">체험 설정</span>
                  <p className="text-sm text-gray-500">데모 체험 버튼 동작 설정</p>
                </div>
              </div>
              <ArrowUpRight className="h-5 w-5 text-gray-400" />
            </button>

            <button
              onClick={() => navigate("/demo/analytics")}
              className="w-full flex items-center justify-between p-4 text-left border border-gray-200 rounded-lg hover:bg-orange-50 hover:border-orange-200"
            >
              <div className="flex items-center space-x-3">
                <BarChart3 className="h-6 w-6 text-blue-600" />
                <div>
                  <span className="font-medium">사용 현황</span>
                  <p className="text-sm text-gray-500">데모 사용 통계 및 현황</p>
                </div>
              </div>
              <ArrowUpRight className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* 업주 소개 도구 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">업주 소개 도구</h3>
          </div>
          <div className="p-6 space-y-3">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <ExternalLink className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800">데모 링크 생성</h4>
                  <p className="text-sm text-green-700 mt-1">업주에게 보여줄 수 있는 데모 링크를 생성합니다</p>
                  <button className="mt-2 text-sm text-green-600 hover:text-green-800 font-medium">링크 생성하기 →</button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800">프레젠테이션 모드</h4>
                  <p className="text-sm text-blue-700 mt-1">업주 미팅용 전체화면 데모 모드</p>
                  <button className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium">프레젠테이션 시작 →</button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <BarChart3 className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-purple-800">데모 시나리오</h4>
                  <p className="text-sm text-purple-700 mt-1">업주별 맞춤 데모 시나리오 관리</p>
                  <button className="mt-2 text-sm text-purple-600 hover:text-purple-800 font-medium">시나리오 관리 →</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

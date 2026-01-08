import { useState } from "react";
import { useQuery } from "react-query";
import { demoStoreAPI } from "../../services/api";
import { BarChart3, Calendar, Activity, Users, TestTube, TrendingUp } from "lucide-react";

export default function DemoAnalytics() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  const {
    data: demoStats,
    isLoading,
    error,
  } = useQuery(["demo-analytics", dateRange], () => demoStoreAPI.getDemoStats(), {
    select: (response) => response.data,
    refetchInterval: 60000,
  });

  // 샘플 데이터 (실제로는 API에서 받아와야 함)
  const sampleUsageData = [
    { date: "2026-01-01", usage: 5, stores: 3 },
    { date: "2026-01-02", usage: 8, stores: 4 },
    { date: "2026-01-03", usage: 12, stores: 5 },
    { date: "2026-01-04", usage: 7, stores: 3 },
    { date: "2026-01-05", usage: 15, stores: 6 },
    { date: "2026-01-06", usage: 10, stores: 4 },
    { date: "2026-01-07", usage: 9, stores: 5 },
  ];

  const sampleStoreUsage = [
    { storeName: "카페 데모", qrId: "demo_cafe_001", usage: 25, lastUsed: "2026-01-07" },
    { storeName: "레스토랑 데모", qrId: "demo_restaurant_001", usage: 18, lastUsed: "2026-01-06" },
    { storeName: "갤러리 데모", qrId: "demo_gallery_001", usage: 12, lastUsed: "2026-01-05" },
    { storeName: "브런치 데모", qrId: "demo_brunch_001", usage: 8, lastUsed: "2026-01-04" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">데모 사용 현황을 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">데모 사용 현황을 불러오는데 실패했습니다.</div>;
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <div className="flex items-center space-x-3">
          <BarChart3 className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">데모 사용 현황</h1>
            <p className="text-gray-600 mt-1">데모 시스템의 사용 통계와 현황을 확인합니다</p>
          </div>
        </div>
      </div>

      {/* 기간 선택 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <Calendar className="h-5 w-5 text-gray-600" />
          <span className="font-medium text-gray-900">조회 기간:</span>
          <input type="date" value={dateRange.startDate} onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })} className="border border-gray-300 rounded px-3 py-1 text-sm" />
          <span className="text-gray-500">~</span>
          <input type="date" value={dateRange.endDate} onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })} className="border border-gray-300 rounded px-3 py-1 text-sm" />
        </div>
      </div>

      {/* 전체 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">총 데모 사용</p>
              <p className="text-2xl font-bold text-blue-900">{demoStats?.demoUsageCount || 0}</p>
              <p className="text-xs text-gray-500 mt-1">전체 기간</p>
            </div>
            <Activity className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">활성 데모 매장</p>
              <p className="text-2xl font-bold text-orange-900">{demoStats?.activeDemoStores || 0}</p>
              <p className="text-xs text-gray-500 mt-1">현재 활성화</p>
            </div>
            <TestTube className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">평균 일일 사용</p>
              <p className="text-2xl font-bold text-green-900">{sampleUsageData.length > 0 ? Math.round(sampleUsageData.reduce((sum, day) => sum + day.usage, 0) / sampleUsageData.length) : 0}</p>
              <p className="text-xs text-gray-500 mt-1">최근 7일</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">마지막 사용</p>
              <p className="text-lg font-bold text-gray-900">{demoStats?.lastUsed ? new Date(demoStats.lastUsed).toLocaleDateString("ko-KR") : "없음"}</p>
              <p className="text-xs text-gray-500 mt-1">최근 접근</p>
            </div>
            <Calendar className="h-8 w-8 text-gray-600" />
          </div>
        </div>
      </div>

      {/* 일별 사용 현황 차트 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">일별 데모 사용 현황</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {sampleUsageData.map((day, index) => (
              <div key={day.date} className="flex items-center space-x-4">
                <div className="w-20 text-sm text-gray-600">{new Date(day.date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}</div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(day.usage / 20) * 100}%` }}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8">{day.usage}</span>
                  </div>
                </div>
                <div className="text-sm text-gray-500 w-16">{day.stores}개 매장</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 매장별 사용 현황 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">데모 매장별 사용 현황</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">매장명</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">QR 코드 ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사용 횟수</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">마지막 사용</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sampleStoreUsage.map((store, index) => (
                <tr key={store.qrId} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <TestTube className="h-4 w-4 text-orange-600 mr-2" />
                      <span className="text-sm font-medium text-gray-900">{store.storeName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">{store.qrId}</code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">{store.usage}</span>
                      <span className="ml-2 text-xs text-gray-500">회</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(store.lastUsed).toLocaleDateString("ko-KR")}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">활성</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 데모 사용 안내 */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <TestTube className="h-5 w-5 text-orange-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-orange-800">데모 사용 현황 안내</h4>
            <div className="mt-2 text-sm text-orange-700 space-y-1">
              <p>• 데모 사용 통계는 업주 소개 목적으로만 수집됩니다</p>
              <p>• 실제 사용자 데이터는 포함되지 않으며, 실제 서비스 통계와 별도로 관리됩니다</p>
              <p>• 데모 사용 기록은 관리 목적으로만 활용되며, 개인정보는 수집하지 않습니다</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

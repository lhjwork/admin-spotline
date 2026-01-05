import { useQuery } from 'react-query'
import { dashboardAPI } from '../services/api'
import { 
  Store, 
  QrCode, 
  TrendingUp, 
  Users,
  Activity,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { ChartCard, MetricCard, PieChartComponent, AreaChartComponent } from '../components/Chart'

export default function Dashboard() {
  const { data: stats, isLoading, error } = useQuery(
    'dashboard-stats',
    () => dashboardAPI.getStats(),
    {
      select: (response) => response.data,
      refetchInterval: 30000, // 30초마다 새로고침
    }
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        데이터를 불러오는데 실패했습니다.
      </div>
    )
  }

  const { overview, storesByCategory, recentActivity } = stats

  // 차트 데이터 변환
  const categoryData = storesByCategory.map(item => ({
    name: item._id,
    value: item.count
  }))

  // 샘플 트렌드 데이터 (실제로는 API에서 받아와야 함)
  const trendData = [
    { name: '월', scans: 2400, clicks: 240 },
    { name: '화', scans: 1398, clicks: 139 },
    { name: '수', scans: 9800, clicks: 980 },
    { name: '목', scans: 3908, clicks: 390 },
    { name: '금', scans: 4800, clicks: 480 },
    { name: '토', scans: 3800, clicks: 380 },
    { name: '일', scans: 4300, clicks: 430 }
  ]

  const formatNumber = (num) => {
    return new Intl.NumberFormat('ko-KR').format(num)
  }

  const getChangeType = (change) => {
    if (change > 0) return 'positive'
    if (change < 0) return 'negative'
    return 'neutral'
  }

  const getChangeIcon = (change) => {
    if (change > 0) return ArrowUpRight
    if (change < 0) return ArrowDownRight
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="text-gray-600">Spotline 서비스 현황을 한눈에 확인하세요</p>
      </div>

      {/* 주요 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="총 매장 수"
          value={formatNumber(overview.totalStores)}
          icon={Store}
        />
        <MetricCard
          title="오늘 QR 스캔"
          value={formatNumber(overview.todayScans)}
          change={`${overview.scanGrowth}%`}
          changeType={getChangeType(parseFloat(overview.scanGrowth))}
          icon={QrCode}
        />
        <MetricCard
          title="주간 스캔"
          value={formatNumber(overview.weeklyScans)}
          icon={TrendingUp}
        />
        <MetricCard
          title="클릭률"
          value={`${overview.clickThroughRate}%`}
          icon={Activity}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 카테고리별 매장 분포 */}
        <ChartCard
          title="카테고리별 매장 분포"
          subtitle="등록된 매장의 카테고리별 분포"
        >
          <PieChartComponent
            data={categoryData}
            dataKey="value"
            nameKey="name"
            height={300}
            formatter={(value) => `${value}개`}
          />
        </ChartCard>

        {/* 주간 트렌드 */}
        <ChartCard
          title="주간 활동 트렌드"
          subtitle="최근 7일간 QR 스캔 및 클릭 현황"
        >
          <AreaChartComponent
            data={trendData}
            xKey="name"
            areas={[
              { key: 'scans', name: 'QR 스캔', color: '#3B82F6' },
              { key: 'clicks', name: '추천 클릭', color: '#10B981' }
            ]}
            height={300}
            formatter={(value) => formatNumber(value)}
          />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 최근 활동 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 활동</h3>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{activity.store}</span>
                      {activity.type === 'qr_scan' && (
                        <span className="text-blue-600"> QR 코드 스캔</span>
                      )}
                      {activity.type === 'recommendation_click' && (
                        <span className="text-green-600"> → {activity.targetStore} 추천 클릭</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(activity.timestamp).toLocaleString('ko-KR')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                최근 활동이 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* 추가 통계 */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">월간 스캔</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {formatNumber(overview.monthlyScans)}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">비활성 매장</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {formatNumber(overview.totalInactiveStores)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    전체 매장의 {((overview.totalInactiveStores / overview.totalStores) * 100).toFixed(1)}%
                  </p>
                </div>
                <Store className="h-8 w-8 text-red-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">활성 매장</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {formatNumber(overview.totalStores - overview.totalInactiveStores)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    전체 매장의 {(((overview.totalStores - overview.totalInactiveStores) / overview.totalStores) * 100).toFixed(1)}%
                  </p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 성과 요약 */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-blue-100 text-sm">총 매장</p>
            <p className="text-2xl font-bold">{formatNumber(overview.totalStores)}</p>
          </div>
          <div className="text-center">
            <p className="text-blue-100 text-sm">오늘 스캔</p>
            <p className="text-2xl font-bold">{formatNumber(overview.todayScans)}</p>
          </div>
          <div className="text-center">
            <p className="text-blue-100 text-sm">월간 스캔</p>
            <p className="text-2xl font-bold">{formatNumber(overview.monthlyScans)}</p>
          </div>
          <div className="text-center">
            <p className="text-blue-100 text-sm">평균 클릭률</p>
            <p className="text-2xl font-bold">{overview.clickThroughRate}%</p>
          </div>
        </div>
      </div>
    </div>
  )
}
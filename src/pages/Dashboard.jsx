import { useQuery } from 'react-query'
import { dashboardAPI } from '../services/api'
import { 
  Store, 
  QrCode, 
  TrendingUp, 
  Users,
  Activity,
  Calendar
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

function StatCard({ title, value, change, icon: Icon, color = 'blue' }) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500'
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {change !== undefined && (
            <p className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '+' : ''}{change}%
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="text-gray-600">Spotline 서비스 현황을 한눈에 확인하세요</p>
      </div>

      {/* 주요 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="총 매장 수"
          value={overview.totalStores}
          icon={Store}
          color="blue"
        />
        <StatCard
          title="오늘 QR 스캔"
          value={overview.todayScans}
          change={parseFloat(overview.scanGrowth)}
          icon={QrCode}
          color="green"
        />
        <StatCard
          title="주간 스캔"
          value={overview.weeklyScans}
          icon={TrendingUp}
          color="yellow"
        />
        <StatCard
          title="클릭률"
          value={`${overview.clickThroughRate}%`}
          icon={Activity}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 카테고리별 매장 분포 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">카테고리별 매장 분포</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={storesByCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ _id, count, percent }) => `${_id} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {storesByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 최근 활동 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 활동</h3>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <Activity className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.store}</span>
                    {activity.type === 'qr_scan' && ' QR 스캔'}
                    {activity.type === 'recommendation_click' && ` → ${activity.targetStore} 추천 클릭`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleString('ko-KR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 추가 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">월간 스캔</p>
              <p className="text-2xl font-semibold text-gray-900">{overview.monthlyScans}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Store className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">비활성 매장</p>
              <p className="text-2xl font-semibold text-gray-900">{overview.totalInactiveStores}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">활성 매장</p>
              <p className="text-2xl font-semibold text-gray-900">{overview.totalStores}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
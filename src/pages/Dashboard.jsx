import { useQuery } from 'react-query'
import { dashboardAPI, systemAPI } from '../services/api'
import { 
  Store, 
  QrCode, 
  TrendingUp, 
  Users,
  Activity,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Monitor,
  Database,
  Shield
} from 'lucide-react'

export default function Dashboard() {
  const { data: systemStats, isLoading: statsLoading, error: statsError } = useQuery(
    'system-stats',
    () => systemAPI.getSystemStats(),
    {
      select: (response) => response.data,
      refetchInterval: 30000, // 30초마다 새로고침
    }
  )

  const { data: systemHealth, isLoading: healthLoading, error: healthError } = useQuery(
    'system-health',
    () => systemAPI.getSystemHealth(),
    {
      select: (response) => response.data,
      refetchInterval: 10000, // 10초마다 새로고침
    }
  )

  if (statsLoading || healthLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (statsError || healthError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        데이터를 불러오는데 실패했습니다.
      </div>
    )
  }

  const stats = systemStats?.data || {}
  const health = systemHealth?.data || {}

  const formatNumber = (num) => {
    return new Intl.NumberFormat('ko-KR').format(num || 0)
  }

  const getStatusIcon = (status) => {
    return status === 'active' ? CheckCircle : XCircle
  }

  const getStatusColor = (status) => {
    return status === 'active' ? 'text-green-500' : 'text-red-500'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">SpotLine 통합 관리자 대시보드</h1>
        <p className="text-gray-600">통합된 Admin API 기반 시스템 관리 현황</p>
      </div>

      {/* 시스템 상태 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">시스템 상태</h2>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Monitor className="h-4 w-4" />
            <span>실시간 모니터링</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            {React.createElement(getStatusIcon(health.systems?.demo), { 
              className: `h-5 w-5 ${getStatusColor(health.systems?.demo)}` 
            })}
            <div>
              <span className="text-sm font-medium">데모 시스템</span>
              <p className="text-xs text-gray-500">업주 소개용 데모</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            {React.createElement(getStatusIcon(health.systems?.live), { 
              className: `h-5 w-5 ${getStatusColor(health.systems?.live)}` 
            })}
            <div>
              <span className="text-sm font-medium">라이브 시스템</span>
              <p className="text-xs text-gray-500">실제 서비스 운영</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            {React.createElement(getStatusIcon(health.systems?.admin), { 
              className: `h-5 w-5 ${getStatusColor(health.systems?.admin)}` 
            })}
            <div>
              <span className="text-sm font-medium">관리자 시스템</span>
              <p className="text-xs text-gray-500">Admin API 통합</p>
            </div>
          </div>
        </div>
      </div>

      {/* 전체 시스템 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">데모 매장</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatNumber(stats.demo?.stores)}
              </p>
              <p className="text-xs text-gray-500 mt-1">업주 소개용</p>
            </div>
            <Store className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">라이브 매장</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatNumber(stats.live?.stores)}
              </p>
              <p className="text-xs text-gray-500 mt-1">활성: {formatNumber(stats.live?.activeStores)}</p>
            </div>
            <QrCode className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">총 조회수</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatNumber(stats.live?.totalViews)}
              </p>
              <p className="text-xs text-gray-500 mt-1">라이브 시스템</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">QR 스캔</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatNumber(stats.live?.totalQRScans)}
              </p>
              <p className="text-xs text-gray-500 mt-1">실제 방문</p>
            </div>
            <Activity className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* 관리자 정보 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">관리자 현황</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-indigo-500" />
            <div>
              <p className="text-sm font-medium text-gray-600">총 관리자</p>
              <p className="text-xl font-bold text-gray-900">{formatNumber(stats.admin?.totalAdmins)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-cyan-500" />
            <div>
              <p className="text-sm font-medium text-gray-600">현재 관리자</p>
              <p className="text-sm text-gray-900">{stats.admin?.currentAdmin || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Calendar className="h-8 w-8 text-pink-500" />
            <div>
              <p className="text-sm font-medium text-gray-600">마지막 로그인</p>
              <p className="text-sm text-gray-900">
                {stats.admin?.lastLogin ? new Date(stats.admin.lastLogin).toLocaleString('ko-KR') : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SpotLine 정체성 알림 */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-6 w-6 mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold mb-2">SpotLine 통합 Admin API</h3>
            <div className="text-sm space-y-1 opacity-90">
              <p>• 모든 관리 기능이 /api/admin/* 경로로 통합되었습니다</p>
              <p>• 데모 시스템과 라이브 시스템이 명확히 분리되어 관리됩니다</p>
              <p>• 실시간 시스템 모니터링과 분석 데이터를 제공합니다</p>
            </div>
          </div>
        </div>
      </div>

      {/* 빠른 액션 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <Store className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">매장 관리</h3>
          <p className="text-sm text-gray-600 mb-4">기존 매장 시스템 관리</p>
          <button 
            onClick={() => window.location.href = '/stores'}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            매장 관리하기
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 text-center">
          <Database className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">데모 시스템</h3>
          <p className="text-sm text-gray-600 mb-4">업주 소개용 데모 관리</p>
          <button 
            onClick={() => window.location.href = '/demo-system'}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            데모 관리하기
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 text-center">
          <TrendingUp className="h-12 w-12 text-purple-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">라이브 시스템</h3>
          <p className="text-sm text-gray-600 mb-4">실제 서비스 운영 관리</p>
          <button 
            onClick={() => window.location.href = '/live-system'}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            라이브 관리하기
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 text-center">
          <Monitor className="h-12 w-12 text-indigo-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">시스템 설정</h3>
          <p className="text-sm text-gray-600 mb-4">통합 시스템 설정 관리</p>
          <button 
            onClick={() => window.location.href = '/system-settings'}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            설정 관리하기
          </button>
        </div>
      </div>
    </div>
  )
}
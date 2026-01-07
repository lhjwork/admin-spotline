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
  ArrowDownRight,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'

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

  const { operationalStores, activeQRCodes, monthlyStarts, monthlyScans, systemStatus, recentActivity } = stats

  const formatNumber = (num) => {
    return new Intl.NumberFormat('ko-KR').format(num)
  }

  const getStatusIcon = (status) => {
    return status ? CheckCircle : XCircle
  }

  const getStatusColor = (status) => {
    return status ? 'text-green-500' : 'text-red-500'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">SpotLine Admin 대시보드</h1>
        <p className="text-gray-600">VERSION003-FINAL - 운영 시스템 관리 현황</p>
      </div>

      {/* 시스템 상태 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">시스템 상태</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            {React.createElement(getStatusIcon(systemStatus.demoSystem), { 
              className: `h-5 w-5 ${getStatusColor(systemStatus.demoSystem)}` 
            })}
            <span className="text-sm font-medium">데모 시스템</span>
            <span className="text-xs text-gray-500">(읽기 전용)</span>
          </div>
          <div className="flex items-center space-x-3">
            {React.createElement(getStatusIcon(systemStatus.operationalSystem), { 
              className: `h-5 w-5 ${getStatusColor(systemStatus.operationalSystem)}` 
            })}
            <span className="text-sm font-medium">운영 시스템</span>
            <span className="text-xs text-gray-500">(Admin 관리)</span>
          </div>
          <div className="flex items-center space-x-3">
            {React.createElement(getStatusIcon(systemStatus.spotlineStart), { 
              className: `h-5 w-5 ${getStatusColor(systemStatus.spotlineStart)}` 
            })}
            <span className="text-sm font-medium">SpotLine 시작</span>
            <span className="text-xs text-gray-500">(사용자 기능)</span>
          </div>
        </div>
      </div>

      {/* 주요 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">운영 매장 수</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatNumber(operationalStores)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Admin 관리 대상</p>
            </div>
            <Store className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">활성 QR 코드</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatNumber(activeQRCodes)}
              </p>
              <p className="text-xs text-gray-500 mt-1">real_* 접두사</p>
            </div>
            <QrCode className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">월간 SpotLine 시작</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatNumber(monthlyStarts)}
              </p>
              <p className="text-xs text-gray-500 mt-1">사용자 시작 횟수</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">월간 QR 스캔</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatNumber(monthlyScans)}
              </p>
              <p className="text-xs text-gray-500 mt-1">실제 매장 방문</p>
            </div>
            <Activity className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* 최근 활동 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 활동</h3>
        <div className="space-y-4">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'spotline_start' ? 'bg-purple-500' : 'bg-blue-500'
                  }`}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.store}</span>
                    {activity.type === 'spotline_start' && (
                      <span className="text-purple-600"> SpotLine 시작</span>
                    )}
                    {activity.type === 'qr_scan' && (
                      <span className="text-blue-600"> QR 코드 스캔</span>
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

      {/* SpotLine 정체성 알림 */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-6 w-6 mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold mb-2">SpotLine 정체성 (중요)</h3>
            <div className="text-sm space-y-1 opacity-90">
              <p>• SpotLine은 광고 플랫폼이나 리뷰 서비스가 아닙니다</p>
              <p>• 현재 장소를 기준으로 다음 경험을 자연스럽게 제안합니다</p>
              <p>• 사용자 이동 흐름을 관찰하고 큐레이션의 신뢰를 축적합니다</p>
            </div>
          </div>
        </div>
      </div>

      {/* 빠른 액션 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <Store className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">운영 매장 관리</h3>
          <p className="text-sm text-gray-600 mb-4">실제 서비스에 사용될 매장을 등록하고 관리하세요</p>
          <button 
            onClick={() => window.location.href = '/operational-stores'}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            매장 관리하기
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 text-center">
          <TrendingUp className="h-12 w-12 text-purple-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">SpotLine 시작 설정</h3>
          <p className="text-sm text-gray-600 mb-4">사용자가 SpotLine을 시작할 때의 설정을 관리하세요</p>
          <button 
            onClick={() => window.location.href = '/spotline-start'}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            시작 설정하기
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 text-center">
          <Activity className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">데모 시스템</h3>
          <p className="text-sm text-gray-600 mb-4">업주 소개용 데모 데이터를 확인하세요 (읽기 전용)</p>
          <button 
            onClick={() => window.location.href = '/demo-system'}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            데모 확인하기
          </button>
        </div>
      </div>
    </div>
  )
}
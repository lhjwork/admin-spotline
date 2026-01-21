import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { liveAPI } from '../services/api'
import { 
  Store, 
  TrendingUp,
  Eye,
  CheckCircle,
  Clock,
  BarChart3,
  Settings,
  Search
} from 'lucide-react'

interface LiveStore {
  storeId: string;
  name: string;
  category: string;
  status: string;
  owner: string;
  createdAt: string;
  totalViews: number;
  totalScans: number;
  conversionRate: number;
}

interface StatusOption {
  value: string;
  label: string;
}

interface LiveStore {
  storeId: string;
  name: string;
  category: string;
  status: string;
  ownerId: string;
  createdAt: string;
  analytics: {
    totalViews: number;
    qrScans: number;
    recommendations: number;
  };
}

interface StoreApprovalModalProps {
  store: LiveStore;
  onApprove: (note: string) => void;
  onSuspend: (reason: string) => void;
  onClose: () => void;
  loading: boolean;
}

const STATUS_OPTIONS: StatusOption[] = [
  { value: '', label: '전체 상태' },
  { value: 'active', label: '활성' },
  { value: 'pending', label: '승인 대기' },
  { value: 'suspended', label: '정지' }
]

const CATEGORY_OPTIONS: StatusOption[] = [
  { value: '', label: '전체 카테고리' },
  { value: 'cafe', label: '카페' },
  { value: 'restaurant', label: '레스토랑' },
  { value: 'bakery', label: '베이커리' },
  { value: 'retail', label: '소매' },
  { value: 'culture', label: '문화' },
  { value: 'other', label: '기타' }
]

function StoreApprovalModal({ store, onApprove, onSuspend, onClose, loading }: StoreApprovalModalProps) {
  const [approvalNote, setApprovalNote] = useState('')
  const [suspensionReason, setSuspensionReason] = useState('')

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            매장 승인 관리: {store.name}
          </h3>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">매장 정보:</p>
              <div className="bg-gray-50 p-3 rounded text-sm">
                <p><strong>카테고리:</strong> {store.category}</p>
                <p><strong>소유자:</strong> {store.ownerId}</p>
                <p><strong>신청일:</strong> {new Date(store.createdAt).toLocaleDateString('ko-KR')}</p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                승인 메모 (선택사항)
              </label>
              <textarea
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                rows={3}
                placeholder="승인 사유나 메모를 입력하세요..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                정지 사유
              </label>
              <textarea
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                rows={3}
                placeholder="정지 사유를 입력하세요..."
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              disabled={loading}
            >
              취소
            </button>
            <button
              onClick={() => onSuspend(suspensionReason)}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              disabled={loading || !suspensionReason.trim()}
            >
              정지
            </button>
            <button
              onClick={() => onApprove(approvalNote)}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
              disabled={loading}
            >
              승인
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LiveSystem() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('stores')
  const [selectedStore, setSelectedStore] = useState<LiveStore | null>(null)
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: '',
    category: '',
    search: ''
  })

  // 라이브 매장 데이터
  const { data: liveStores, isLoading: storesLoading, error: storesError } = useQuery(
    ['live-stores', filters],
    () => liveAPI.getLiveStores(filters),
    {
      select: (response) => response.data.data,
      keepPreviousData: true
    }
  )

  // 라이브 분석 데이터
  const { data: liveAnalytics } = useQuery(
    'live-analytics',
    () => liveAPI.getLiveAnalytics(),
    {
      select: (response) => response.data.data,
      refetchInterval: 30000 // 30초마다 새로고침
    }
  )

  // 라이브 설정 데이터
  const { data: liveSettings } = useQuery(
    'live-settings',
    () => liveAPI.getLiveSettings(),
    {
      select: (response) => response.data.data,
    }
  )

  // 매장 승인 뮤테이션
  const approveMutation = useMutation(
    ({ storeId, note }: { storeId: string; note: string }) => liveAPI.approveStore(storeId, note),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('live-stores')
        queryClient.invalidateQueries('live-analytics')
        setSelectedStore(null)
        alert('매장이 승인되었습니다.')
      },
      onError: (error: any) => {
        alert('매장 승인에 실패했습니다: ' + error.message)
      }
    }
  )

  // 매장 정지 뮤테이션
  const suspendMutation = useMutation(
    ({ storeId, reason }: { storeId: string; reason: string }) => liveAPI.suspendStore(storeId, reason),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('live-stores')
        queryClient.invalidateQueries('live-analytics')
        setSelectedStore(null)
        alert('매장이 정지되었습니다.')
      },
      onError: (error: any) => {
        alert('매장 정지에 실패했습니다: ' + error.message)
      }
    }
  )

  const handleApprove = (note: string) => {
    if (selectedStore) {
      approveMutation.mutate({ storeId: selectedStore.storeId, note })
    }
  }

  const handleSuspend = (reason: string) => {
    if (selectedStore) {
      suspendMutation.mutate({ storeId: selectedStore.storeId, reason })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      active: { color: 'bg-green-100 text-green-800', label: '활성' },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: '승인 대기' },
      suspended: { color: 'bg-red-100 text-red-800', label: '정지' }
    }
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num || 0)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">라이브 시스템 관리</h1>
          <p className="text-gray-600">실제 서비스 운영 매장 관리 및 분석</p>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-green-600">
          <TrendingUp className="h-4 w-4" />
          <span>라이브 시스템</span>
        </div>
      </div>

      {/* 분석 개요 */}
      {liveAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <Store className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">총 매장</p>
                <p className="text-lg font-bold text-gray-900">{formatNumber(liveAnalytics.overview.totalStores)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">활성 매장</p>
                <p className="text-lg font-bold text-gray-900">{formatNumber(liveAnalytics.overview.activeStores)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">승인 대기</p>
                <p className="text-lg font-bold text-gray-900">{formatNumber(liveAnalytics.overview.pendingStores)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-purple-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">총 조회수</p>
                <p className="text-lg font-bold text-gray-900">{formatNumber(liveAnalytics.overview.totalViews)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-orange-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">QR 스캔</p>
                <p className="text-lg font-bold text-gray-900">{formatNumber(liveAnalytics.overview.totalQRScans)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('stores')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'stores'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            매장 관리
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            분석 대시보드
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'settings'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            시스템 설정
          </button>
        </nav>
      </div>

      {/* 매장 관리 탭 */}
      {activeTab === 'stores' && (
        <div className="space-y-6">
          {/* 필터 */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="매장명 검색"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  {STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value, page: 1 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  {CATEGORY_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">페이지 크기</label>
                <select
                  value={filters.limit}
                  onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  <option value={10}>10개</option>
                  <option value={20}>20개</option>
                  <option value={50}>50개</option>
                </select>
              </div>
            </div>
          </div>

          {/* 매장 목록 */}
          {storesLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : storesError ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              라이브 매장 데이터를 불러오는데 실패했습니다.
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        매장 정보
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        카테고리
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        분석 데이터
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        신청일
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {liveStores?.stores?.map((store) => (
                      <tr key={store.storeId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{store.name}</div>
                            <div className="text-sm text-gray-500">{store.description}</div>
                            <div className="text-xs text-gray-400">소유자: {store.ownerId}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {store.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(store.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="space-y-1">
                            <div>조회수: {formatNumber(store.analytics?.totalViews)}</div>
                            <div>QR 스캔: {formatNumber(store.analytics?.qrScans)}</div>
                            <div>추천: {formatNumber(store.analytics?.recommendations)}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(store.createdAt).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => setSelectedStore(store)}
                            className="text-green-600 hover:text-green-900 mr-3"
                            title="승인/정지 관리"
                          >
                            <Settings className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 페이지네이션 */}
              {liveStores?.pagination && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        총 <span className="font-medium">{liveStores.pagination.total}</span>개 중{' '}
                        <span className="font-medium">{(filters.page - 1) * filters.limit + 1}</span>-
                        <span className="font-medium">{Math.min(filters.page * filters.limit, liveStores.pagination.total)}</span>개 표시
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                          disabled={filters.page === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          이전
                        </button>
                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          {filters.page} / {liveStores.pagination.pages}
                        </span>
                        <button
                          onClick={() => setFilters(prev => ({ ...prev, page: Math.min(liveStores.pagination.pages, prev.page + 1) }))}
                          disabled={filters.page === liveStores.pagination.pages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          다음
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 분석 대시보드 탭 */}
      {activeTab === 'analytics' && liveAnalytics && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">라이브 시스템 분석</h2>
          
          {/* 성과 지표 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">평균 조회수/매장</h3>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(liveAnalytics.performance.averageViewsPerStore)}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">평균 스캔/매장</h3>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(liveAnalytics.performance.averageScansPerStore)}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">전환율</h3>
              <p className="text-2xl font-bold text-gray-900">{liveAnalytics.performance.conversionRate}%</p>
            </div>
          </div>

          {/* 트렌드 차트 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 7일 조회수</h3>
              <div className="flex items-end space-x-2 h-32">
                {liveAnalytics.trends.dailyViews.map((views, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-blue-500 rounded-t"
                      style={{ height: `${Math.max(views / Math.max(...liveAnalytics.trends.dailyViews) * 100, 5)}%` }}
                    ></div>
                    <span className="text-xs text-gray-500 mt-1">{views}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 7일 스캔수</h3>
              <div className="flex items-end space-x-2 h-32">
                {liveAnalytics.trends.dailyScans.map((scans, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-green-500 rounded-t"
                      style={{ height: `${Math.max(scans / Math.max(...liveAnalytics.trends.dailyScans) * 100, 5)}%` }}
                    ></div>
                    <span className="text-xs text-gray-500 mt-1">{scans}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 카테고리별 통계 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">카테고리별 매장 분포</h3>
            <div className="space-y-3">
              {liveAnalytics.trends.topCategories.map((category) => (
                <div key={category.category} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{category.category}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${category.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{category.count}개 ({category.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 시스템 설정 탭 */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">라이브 시스템 설정</h2>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">라이브 시스템 활성화</h3>
                  <p className="text-sm text-gray-500">실제 서비스 운영 시스템 사용 여부</p>
                </div>
                <div className="text-sm">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    liveSettings?.isEnabled 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {liveSettings?.isEnabled ? '활성화' : '비활성화'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">승인 필요</h3>
                  <p className="text-sm text-gray-500">새 매장 등록 시 관리자 승인 필요 여부</p>
                </div>
                <div className="text-sm">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    liveSettings?.requireApproval 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {liveSettings?.requireApproval ? '승인 필요' : '자동 승인'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">소유자당 최대 매장 수</h3>
                  <p className="text-sm text-gray-500">한 소유자가 등록할 수 있는 최대 매장 수</p>
                </div>
                <div className="text-sm text-gray-900">
                  {liveSettings?.maxStoresPerOwner}개
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">분석 데이터 보관 기간</h3>
                  <p className="text-sm text-gray-500">분석 데이터 보관 일수</p>
                </div>
                <div className="text-sm text-gray-900">
                  {liveSettings?.analyticsRetentionDays}일
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 매장 승인 모달 */}
      {selectedStore && (
        <StoreApprovalModal
          store={selectedStore}
          onApprove={handleApprove}
          onSuspend={handleSuspend}
          onClose={() => setSelectedStore(null)}
          loading={approveMutation.isLoading || suspendMutation.isLoading}
        />
      )}
    </div>
  )
}
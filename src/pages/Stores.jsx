import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { storeAPI } from '../services/api'
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2,
  ToggleLeft,
  ToggleRight,
  Plus
} from 'lucide-react'
import StoreFormModal from '../components/StoreFormModal'

const CATEGORIES = [
  { value: '', label: '전체 카테고리' },
  { value: 'cafe', label: '카페' },
  { value: 'restaurant', label: '레스토랑' },
  { value: 'exhibition', label: '전시' },
  { value: 'hotel', label: '호텔' },
  { value: 'retail', label: '리테일' },
  { value: 'culture', label: '문화' },
  { value: 'other', label: '기타' }
]

const STATUS_OPTIONS = [
  { value: '', label: '전체 상태' },
  { value: 'active', label: '활성' },
  { value: 'inactive', label: '비활성' }
]

export default function Stores() {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    category: '',
    status: ''
  })
  
  const [showModal, setShowModal] = useState(false)
  const [selectedStore, setSelectedStore] = useState(null)
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery(
    ['stores', filters],
    () => storeAPI.getStores(filters),
    {
      select: (response) => response.data,
      keepPreviousData: true
    }
  )

  const createMutation = useMutation(
    (data) => storeAPI.createStore(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['stores'])
        setShowModal(false)
        setSelectedStore(null)
      }
    }
  )

  const updateMutation = useMutation(
    ({ id, data }) => storeAPI.updateStore(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['stores'])
        setShowModal(false)
        setSelectedStore(null)
      }
    }
  )

  const toggleStatusMutation = useMutation(
    ({ id, isActive }) => storeAPI.toggleStatus(id, isActive),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['stores'])
      }
    }
  )

  const deleteStoreMutation = useMutation(
    (id) => storeAPI.deleteStore(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['stores'])
      }
    }
  )

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // 필터 변경 시 첫 페이지로
    }))
  }

  const handleCreateStore = () => {
    setSelectedStore(null)
    setShowModal(true)
  }

  const handleEditStore = (store) => {
    setSelectedStore(store)
    setShowModal(true)
  }

  const handleSubmitStore = (data) => {
    if (selectedStore) {
      updateMutation.mutate({ id: selectedStore._id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleToggleStatus = (store) => {
    if (confirm(`${store.name} 매장을 ${store.isActive ? '비활성화' : '활성화'}하시겠습니까?`)) {
      toggleStatusMutation.mutate({
        id: store._id,
        isActive: !store.isActive
      })
    }
  }

  const handleDelete = (store) => {
    if (confirm(`${store.name} 매장을 완전히 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      deleteStoreMutation.mutate(store._id)
    }
  }

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

  const { stores, pagination } = data

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">매장 관리</h1>
          <p className="text-gray-600">등록된 매장을 관리하고 모니터링하세요</p>
        </div>
        
        <button
          onClick={handleCreateStore}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          <span>새 매장 등록</span>
        </button>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="매장명, 주소, QR코드 검색"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              {STATUS_OPTIONS.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">페이지 크기</label>
            <select
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value={10}>10개</option>
              <option value={20}>20개</option>
              <option value={50}>50개</option>
            </select>
          </div>
        </div>
      </div>

      {/* 매장 목록 */}
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
                  QR 코드
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  월간 스캔
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  등록일
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stores.map((store) => (
                <tr key={store._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{store.name}</div>
                      <div className="text-sm text-gray-500">{store.location.address}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {store.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {store.qrCode.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {store.stats?.monthlyScans || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      store.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {store.isActive ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(store.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEditStore(store)}
                        className="text-blue-600 hover:text-blue-900"
                        title="수정"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(store)}
                        className="text-blue-600 hover:text-blue-900"
                        title={store.isActive ? '비활성화' : '활성화'}
                      >
                        {store.isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(store)}
                        className="text-red-600 hover:text-red-900"
                        title="삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {pagination && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handleFilterChange('page', Math.max(1, filters.page - 1))}
                disabled={filters.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                이전
              </button>
              <button
                onClick={() => handleFilterChange('page', Math.min(pagination.total, filters.page + 1))}
                disabled={filters.page === pagination.total}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                다음
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  총 <span className="font-medium">{pagination.count}</span>개 중{' '}
                  <span className="font-medium">{(filters.page - 1) * filters.limit + 1}</span>-
                  <span className="font-medium">{Math.min(filters.page * filters.limit, pagination.count)}</span>개 표시
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => handleFilterChange('page', Math.max(1, filters.page - 1))}
                    disabled={filters.page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    이전
                  </button>
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    {filters.page} / {pagination.total}
                  </span>
                  <button
                    onClick={() => handleFilterChange('page', Math.min(pagination.total, filters.page + 1))}
                    disabled={filters.page === pagination.total}
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

      <StoreFormModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setSelectedStore(null)
        }}
        onSubmit={handleSubmitStore}
        store={selectedStore}
        loading={createMutation.isLoading || updateMutation.isLoading}
      />
    </div>
  )
}
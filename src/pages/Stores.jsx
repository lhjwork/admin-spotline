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
import { useForm } from 'react-hook-form'

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

function CreateStoreModal({ isOpen, onClose, onSuccess }) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm()
  
  const createMutation = useMutation(
    (data) => storeAPI.createStore(data),
    {
      onSuccess: () => {
        onSuccess()
        onClose()
        reset()
      }
    }
  )

  const onSubmit = (data) => {
    // 좌표 변환
    if (data.coordinates) {
      const [lng, lat] = data.coordinates.split(',').map(coord => parseFloat(coord.trim()))
      data.location = {
        ...data.location,
        coordinates: {
          type: 'Point',
          coordinates: [lng, lat]
        }
      }
      delete data.coordinates
    }
    
    createMutation.mutate(data)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-screen overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">새 매장 등록</h3>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  매장명 *
                </label>
                <input
                  {...register('name', { required: '매장명을 입력하세요' })}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  카테고리 *
                </label>
                <select
                  {...register('category', { required: '카테고리를 선택하세요' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">카테고리 선택</option>
                  {CATEGORIES.slice(1).map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                주소 *
              </label>
              <input
                {...register('location.address', { required: '주소를 입력하세요' })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
              {errors.location?.address && (
                <p className="mt-1 text-sm text-red-600">{errors.location.address.message}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  좌표 (경도,위도)
                </label>
                <input
                  {...register('coordinates')}
                  type="text"
                  placeholder="127.123456, 37.123456"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  지역/상권
                </label>
                <input
                  {...register('location.area')}
                  type="text"
                  placeholder="홍대, 강남 등"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                설명
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                연락처
              </label>
              <input
                {...register('contact.phone')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={createMutation.isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {createMutation.isLoading ? '등록 중...' : '등록'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function Stores() {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    category: '',
    status: ''
  })
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery(
    ['stores', filters],
    () => storeAPI.getStores(filters),
    {
      select: (response) => response.data,
      keepPreviousData: true
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

  const handleCreateSuccess = () => {
    queryClient.invalidateQueries(['stores'])
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
          onClick={() => setShowCreateModal(true)}
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

      <CreateStoreModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  )
}
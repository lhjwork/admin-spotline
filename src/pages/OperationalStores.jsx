import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { operationalStoreAPI } from '../services/api'
import { 
  Search, 
  Plus,
  Edit, 
  Trash2,
  ToggleLeft,
  ToggleRight,
  QrCode,
  AlertTriangle,
  Store
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

function StoreForm({ store, onSubmit, onCancel, loading }) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: store || {
      name: '',
      category: '',
      location: {
        address: '',
        coordinates: [0, 0],
        area: ''
      },
      qrCode: {
        id: '',
        isActive: true
      },
      shortDescription: '',
      representativeImage: '',
      spotlineStory: '',
      externalLinks: {
        instagram: '',
        website: '',
        blog: '',
        notion: ''
      },
      isActive: true
    }
  })

  useEffect(() => {
    if (store) {
      reset(store)
    }
  }, [store, reset])

  const onFormSubmit = (data) => {
    // QR 코드 ID 자동 생성 (real_ 접두사)
    if (!data.qrCode.id) {
      data.qrCode.id = `real_${Date.now().toString().slice(-8)}`
    }
    
    onSubmit(data)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {store ? '운영 매장 수정' : '새 운영 매장 등록'}
        </h2>
        <div className="flex items-center space-x-2 text-sm text-purple-600">
          <AlertTriangle className="h-4 w-4" />
          <span>운영 시스템 전용 (real_ 접두사)</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* 기본 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              매장명 *
            </label>
            <input
              {...register('name', { required: '매장명을 입력하세요' })}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              placeholder="실제 매장명을 입력하세요"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              카테고리 *
            </label>
            <select
              {...register('category', { required: '카테고리를 선택하세요' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
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

        {/* 위치 정보 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">위치 정보</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              주소 *
            </label>
            <input
              {...register('location.address', { required: '주소를 입력하세요' })}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              placeholder="서울시 강남구 테헤란로 123"
            />
            {errors.location?.address && (
              <p className="mt-1 text-sm text-red-600">{errors.location.address.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                경도 *
              </label>
              <input
                {...register('location.coordinates.0', { 
                  required: '경도를 입력하세요',
                  valueAsNumber: true 
                })}
                type="number"
                step="any"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="127.0276"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                위도 *
              </label>
              <input
                {...register('location.coordinates.1', { 
                  required: '위도를 입력하세요',
                  valueAsNumber: true 
                })}
                type="number"
                step="any"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="37.4979"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                지역 *
              </label>
              <input
                {...register('location.area', { required: '지역을 입력하세요' })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="강남역"
              />
            </div>
          </div>
        </div>

        {/* QR 코드 정보 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">QR 코드 정보</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              QR 코드 ID
            </label>
            <input
              {...register('qrCode.id')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              placeholder="비워두면 자동 생성됩니다 (real_ 접두사)"
            />
            <p className="mt-1 text-xs text-gray-500">
              운영 시스템용 QR 코드는 real_ 접두사를 사용합니다
            </p>
          </div>
        </div>

        {/* SpotLine 정보 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">SpotLine 정보</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              한 문장 설명 * (최대 100자)
            </label>
            <input
              {...register('shortDescription', { 
                required: '한 문장 설명을 입력하세요',
                maxLength: { value: 100, message: '100자 이내로 입력하세요' }
              })}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              placeholder="조용한 분위기의 프리미엄 카페"
            />
            {errors.shortDescription && (
              <p className="mt-1 text-sm text-red-600">{errors.shortDescription.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              대표 이미지 URL *
            </label>
            <input
              {...register('representativeImage', { required: '대표 이미지 URL을 입력하세요' })}
              type="url"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              placeholder="https://example.com/image.jpg"
            />
            {errors.representativeImage && (
              <p className="mt-1 text-sm text-red-600">{errors.representativeImage.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SpotLine 스토리 (최대 500자)
            </label>
            <textarea
              {...register('spotlineStory', {
                maxLength: { value: 500, message: '500자 이내로 입력하세요' }
              })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              placeholder="이 매장만의 특별한 이야기를 들려주세요..."
            />
            {errors.spotlineStory && (
              <p className="mt-1 text-sm text-red-600">{errors.spotlineStory.message}</p>
            )}
          </div>
        </div>

        {/* 외부 링크 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">외부 링크</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instagram
              </label>
              <input
                {...register('externalLinks.instagram')}
                type="url"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="https://instagram.com/store_name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                웹사이트
              </label>
              <input
                {...register('externalLinks.website')}
                type="url"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="https://store-website.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                블로그
              </label>
              <input
                {...register('externalLinks.blog')}
                type="url"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="https://blog.naver.com/store_name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notion
              </label>
              <input
                {...register('externalLinks.notion')}
                type="url"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="https://notion.so/store_page"
              />
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? '저장 중...' : (store ? '수정' : '등록')}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function OperationalStores() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEditing = Boolean(id)
  const isCreating = window.location.pathname.includes('/new')
  
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    category: '',
    status: ''
  })

  const { data, isLoading, error } = useQuery(
    ['operational-stores', filters],
    () => operationalStoreAPI.getStores(filters),
    {
      select: (response) => {
        // Handle backend response format
        const responseData = response.data
        if (responseData.success) {
          return responseData.data
        }
        return responseData
      },
      keepPreviousData: true,
      enabled: !isCreating && !isEditing
    }
  )

  const { data: editStore } = useQuery(
    ['operational-store', id],
    () => operationalStoreAPI.getStore(id),
    {
      enabled: isEditing,
      select: (response) => {
        const responseData = response.data
        if (responseData.success) {
          return responseData.data
        }
        return responseData
      }
    }
  )

  const createMutation = useMutation(
    (data) => operationalStoreAPI.createStore(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['operational-stores'])
        navigate('/operational-stores')
        alert('운영 매장이 등록되었습니다.')
      },
      onError: (error) => {
        alert('매장 등록에 실패했습니다: ' + error.message)
      }
    }
  )

  const updateMutation = useMutation(
    ({ id, data }) => operationalStoreAPI.updateStore(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['operational-stores'])
        navigate('/operational-stores')
        alert('운영 매장이 수정되었습니다.')
      }
    }
  )

  const toggleStatusMutation = useMutation(
    ({ id, isActive }) => operationalStoreAPI.toggleStatus(id, isActive),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['operational-stores'])
      }
    }
  )

  const deleteMutation = useMutation(
    (id) => operationalStoreAPI.deleteStore(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['operational-stores'])
      }
    }
  )

  const handleSubmitStore = (data) => {
    if (isEditing) {
      updateMutation.mutate({ id, data })
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
    if (confirm(`${store.name} 매장을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      deleteMutation.mutate(store._id)
    }
  }

  // 폼 화면
  if (isCreating || isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? '운영 매장 수정' : '새 운영 매장 등록'}
            </h1>
            <p className="text-gray-600">실제 SpotLine 서비스에 사용될 매장을 관리합니다</p>
          </div>
        </div>

        <StoreForm
          store={editStore}
          onSubmit={handleSubmitStore}
          onCancel={() => navigate('/operational-stores')}
          loading={createMutation.isLoading || updateMutation.isLoading}
        />
      </div>
    )
  }

  // 목록 화면
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">운영 매장 관리</h1>
          <p className="text-gray-600">실제 SpotLine 서비스에 사용될 매장을 관리합니다 (real_ 접두사)</p>
        </div>
        
        <button
          onClick={() => navigate('/operational-stores/new')}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
        >
          <Plus className="h-4 w-4" />
          <span>새 운영 매장 등록</span>
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
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value, page: 1 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
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
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">전체 상태</option>
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">페이지 크기</label>
            <select
              value={filters.limit}
              onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            >
              <option value={10}>10개</option>
              <option value={20}>20개</option>
              <option value={50}>50개</option>
            </select>
          </div>
        </div>
      </div>

      {/* 매장 목록 */}
      {stores.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">등록된 운영 매장이 없습니다</h3>
          <p className="text-gray-600 mb-6">SpotLine 서비스를 시작하려면 첫 매장을 등록해주세요.</p>
          <button
            onClick={() => navigate('/operational-stores/new')}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            첫 매장 등록하기
          </button>
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
                    QR 코드 ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    총 스캔 수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    마지막 스캔
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
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
                        <div className="text-sm text-gray-500">{store.location?.address}</div>
                        <div className="text-xs text-purple-600">{store.location?.area}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {store.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <QrCode className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900 font-mono">{store.qrCodeId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {store.totalScans?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {store.lastScanned ? new Date(store.lastScanned).toLocaleDateString('ko-KR') : '-'}
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
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => navigate(`/operational-stores/${store._id}/edit`)}
                          className="text-purple-600 hover:text-purple-900"
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
                      onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                      disabled={filters.page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      이전
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      {filters.page} / {pagination.total}
                    </span>
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, page: Math.min(pagination.total, prev.page + 1) }))}
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
      )}
    </div>
  )
}
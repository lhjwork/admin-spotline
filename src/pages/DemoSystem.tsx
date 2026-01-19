import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { demoAPI } from '../services/api'
import { 
  Store, 
  Plus,
  Edit, 
  Trash2,
  Settings,
  Eye,
  Image,
  MapPin,
  Clock,
  Star
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import ImageUpload from '../components/ImageUpload'

const CATEGORIES = [
  { value: 'cafe', label: '카페' },
  { value: 'restaurant', label: '레스토랑' },
  { value: 'bakery', label: '베이커리' },
  { value: 'retail', label: '소매' },
  { value: 'culture', label: '문화' },
  { value: 'other', label: '기타' }
]

function DemoStoreForm({ store, onSubmit, onCancel, loading }) {
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    defaultValues: store || {
      name: '',
      shortDescription: '',
      representativeImage: '',
      category: 'cafe',
      location: {
        address: '',
        coordinates: [127.0276, 37.4979]
      }
    }
  })

  // 이미지 업로드 상태 관리
  const [uploadedImages, setUploadedImages] = useState<any[]>([])
  const [representativeImageId, setRepresentativeImageId] = useState<string | null>(null)

  useEffect(() => {
    if (store) {
      reset(store)
      
      // 기존 이미지가 있으면 업로드 컴포넌트 형식으로 변환
      if (store.representativeImage) {
        const existingImage = {
          id: 'existing-1',
          url: store.representativeImage,
          filename: 'representative-image.jpg',
          size: 0,
          isUploading: false
        }
        setUploadedImages([existingImage])
        setRepresentativeImageId(existingImage.id)
      }
    }
  }, [store, reset])

  // 이미지 업로드 변경 처리
  const handleImagesChange = (images: any[]) => {
    setUploadedImages(images)
    
    // 대표 이미지 URL 업데이트
    const representativeImage = images.find(img => img.id === representativeImageId && !img.isUploading)
    if (representativeImage) {
      setValue('representativeImage', representativeImage.url)
    } else if (images.length > 0 && !images[0].isUploading) {
      setValue('representativeImage', images[0].url)
    }
  }

  // 대표 이미지 변경 처리
  const handleRepresentativeChange = (imageId: string | null) => {
    setRepresentativeImageId(imageId)
    
    if (imageId) {
      const representativeImage = uploadedImages.find(img => img.id === imageId)
      if (representativeImage && !representativeImage.isUploading) {
        setValue('representativeImage', representativeImage.url)
      }
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {store ? '데모 매장 수정' : '새 데모 매장 생성'}
        </h2>
        <div className="flex items-center space-x-2 text-sm text-blue-600">
          <Eye className="h-4 w-4" />
          <span>업주 소개용 데모</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 기본 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              매장명 *
            </label>
            <input
              {...register('name', { required: '매장명을 입력하세요' })}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="데모 매장명을 입력하세요"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
            )}
          </div>
        </div>

        {/* 설명 */}
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="매장을 한 문장으로 소개해주세요"
          />
          {errors.shortDescription && (
            <p className="mt-1 text-sm text-red-600">{errors.shortDescription.message}</p>
          )}
        </div>

        {/* 대표 이미지 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            대표 이미지 *
          </label>
          <ImageUpload
            onImagesChange={handleImagesChange}
            maxImages={1}
            maxSizeInMB={5}
            acceptedFormats={['image/jpeg', 'image/png', 'image/webp']}
            representativeImageId={representativeImageId}
            onRepresentativeChange={handleRepresentativeChange}
            initialImages={uploadedImages}
          />
          {errors.representativeImage && (
            <p className="mt-1 text-sm text-red-600">{errors.representativeImage.message}</p>
          )}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="서울시 강남구 테헤란로 123"
            />
            {errors.location?.address && (
              <p className="mt-1 text-sm text-red-600">{errors.location.address.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="37.4979"
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
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '저장 중...' : (store ? '수정' : '생성')}
          </button>
        </div>
      </form>
    </div>
  )
}

function DemoRecommendationForm({ recommendation, onSubmit, onCancel, loading }) {
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    defaultValues: recommendation || {
      name: '',
      shortDescription: '',
      category: 'bakery',
      distance: 100,
      walkingTime: 2,
      representativeImage: ''
    }
  })

  // 이미지 업로드 상태 관리
  const [uploadedImages, setUploadedImages] = useState<any[]>([])
  const [representativeImageId, setRepresentativeImageId] = useState<string | null>(null)

  useEffect(() => {
    if (recommendation) {
      reset(recommendation)
      
      // 기존 이미지가 있으면 업로드 컴포넌트 형식으로 변환
      if (recommendation.representativeImage) {
        const existingImage = {
          id: 'existing-1',
          url: recommendation.representativeImage,
          filename: 'recommendation-image.jpg',
          size: 0,
          isUploading: false
        }
        setUploadedImages([existingImage])
        setRepresentativeImageId(existingImage.id)
      }
    }
  }, [recommendation, reset])

  // 이미지 업로드 변경 처리
  const handleImagesChange = (images: any[]) => {
    setUploadedImages(images)
    
    // 대표 이미지 URL 업데이트
    const representativeImage = images.find(img => img.id === representativeImageId && !img.isUploading)
    if (representativeImage) {
      setValue('representativeImage', representativeImage.url)
    } else if (images.length > 0 && !images[0].isUploading) {
      setValue('representativeImage', images[0].url)
    }
  }

  // 대표 이미지 변경 처리
  const handleRepresentativeChange = (imageId: string | null) => {
    setRepresentativeImageId(imageId)
    
    if (imageId) {
      const representativeImage = uploadedImages.find(img => img.id === imageId)
      if (representativeImage && !representativeImage.isUploading) {
        setValue('representativeImage', representativeImage.url)
      }
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {recommendation ? '데모 추천 수정' : '새 데모 추천 생성'}
        </h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              추천 장소명 *
            </label>
            <input
              {...register('name', { required: '추천 장소명을 입력하세요' })}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="추천할 장소명"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            설명 *
          </label>
          <input
            {...register('shortDescription', { required: '설명을 입력하세요' })}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="추천 장소에 대한 설명"
          />
          {errors.shortDescription && (
            <p className="mt-1 text-sm text-red-600">{errors.shortDescription.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              거리 (미터) *
            </label>
            <input
              {...register('distance', { 
                required: '거리를 입력하세요',
                valueAsNumber: true,
                min: { value: 1, message: '1 이상의 값을 입력하세요' }
              })}
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="150"
            />
            {errors.distance && (
              <p className="mt-1 text-sm text-red-600">{errors.distance.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              도보 시간 (분) *
            </label>
            <input
              {...register('walkingTime', { 
                required: '도보 시간을 입력하세요',
                valueAsNumber: true,
                min: { value: 1, message: '1 이상의 값을 입력하세요' }
              })}
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="2"
            />
            {errors.walkingTime && (
              <p className="mt-1 text-sm text-red-600">{errors.walkingTime.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            대표 이미지 *
          </label>
          <ImageUpload
            onImagesChange={handleImagesChange}
            maxImages={1}
            maxSizeInMB={5}
            acceptedFormats={['image/jpeg', 'image/png', 'image/webp']}
            representativeImageId={representativeImageId}
            onRepresentativeChange={handleRepresentativeChange}
            initialImages={uploadedImages}
          />
          {errors.representativeImage && (
            <p className="mt-1 text-sm text-red-600">{errors.representativeImage.message}</p>
          )}
        </div>

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
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '저장 중...' : (recommendation ? '수정' : '생성')}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function DemoSystem() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('stores')
  const [showStoreForm, setShowStoreForm] = useState(false)
  const [showRecommendationForm, setShowRecommendationForm] = useState(false)
  const [editingStore, setEditingStore] = useState(null)
  const [editingRecommendation, setEditingRecommendation] = useState(null)

  // 데모 매장 데이터
  const { data: demoStores, isLoading: storesLoading, error: storesError } = useQuery(
    'demo-stores',
    () => demoAPI.getDemoStores(),
    {
      select: (response) => response.data.data,
    }
  )

  // 데모 추천 데이터
  const { data: demoRecommendations, isLoading: recommendationsLoading } = useQuery(
    'demo-recommendations',
    () => demoAPI.getDemoRecommendations(),
    {
      select: (response) => response.data.data,
    }
  )

  // 데모 설정 데이터
  const { data: demoSettings } = useQuery(
    'demo-settings',
    () => demoAPI.getDemoSettings(),
    {
      select: (response) => response.data.data,
    }
  )

  // 매장 생성 뮤테이션
  const createStoreMutation = useMutation(
    (data) => demoAPI.createDemoStore(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('demo-stores')
        setShowStoreForm(false)
        alert('데모 매장이 생성되었습니다.')
      },
      onError: (error) => {
        alert('매장 생성에 실패했습니다: ' + error.message)
      }
    }
  )

  // 매장 수정 뮤테이션
  const updateStoreMutation = useMutation(
    ({ id, data }) => demoAPI.updateDemoStore(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('demo-stores')
        setEditingStore(null)
        alert('데모 매장이 수정되었습니다.')
      }
    }
  )

  // 매장 삭제 뮤테이션
  const deleteStoreMutation = useMutation(
    (id) => demoAPI.deleteDemoStore(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('demo-stores')
      }
    }
  )

  // 추천 생성 뮤테이션
  const createRecommendationMutation = useMutation(
    (data) => demoAPI.createDemoRecommendation(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('demo-recommendations')
        setShowRecommendationForm(false)
        alert('데모 추천이 생성되었습니다.')
      }
    }
  )

  // 추천 수정 뮤테이션
  const updateRecommendationMutation = useMutation(
    ({ id, data }) => demoAPI.updateDemoRecommendation(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('demo-recommendations')
        setEditingRecommendation(null)
        alert('데모 추천이 수정되었습니다.')
      }
    }
  )

  // 추천 삭제 뮤테이션
  const deleteRecommendationMutation = useMutation(
    (id) => demoAPI.deleteDemoRecommendation(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('demo-recommendations')
      }
    }
  )

  const handleSubmitStore = (data) => {
    if (editingStore) {
      updateStoreMutation.mutate({ id: editingStore.id, data })
    } else {
      createStoreMutation.mutate(data)
    }
  }

  const handleSubmitRecommendation = (data) => {
    if (editingRecommendation) {
      updateRecommendationMutation.mutate({ id: editingRecommendation.id, data })
    } else {
      createRecommendationMutation.mutate(data)
    }
  }

  const handleDeleteStore = (store) => {
    if (confirm(`${store.name} 데모 매장을 삭제하시겠습니까?`)) {
      deleteStoreMutation.mutate(store.id)
    }
  }

  const handleDeleteRecommendation = (recommendation) => {
    if (confirm(`${recommendation.name} 데모 추천을 삭제하시겠습니까?`)) {
      deleteRecommendationMutation.mutate(recommendation.id)
    }
  }

  // 폼 화면
  if (showStoreForm || editingStore) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">데모 시스템 관리</h1>
            <p className="text-gray-600">업주 소개용 데모 매장 관리</p>
          </div>
        </div>

        <DemoStoreForm
          store={editingStore}
          onSubmit={handleSubmitStore}
          onCancel={() => {
            setShowStoreForm(false)
            setEditingStore(null)
          }}
          loading={createStoreMutation.isLoading || updateStoreMutation.isLoading}
        />
      </div>
    )
  }

  if (showRecommendationForm || editingRecommendation) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">데모 시스템 관리</h1>
            <p className="text-gray-600">업주 소개용 데모 추천 관리</p>
          </div>
        </div>

        <DemoRecommendationForm
          recommendation={editingRecommendation}
          onSubmit={handleSubmitRecommendation}
          onCancel={() => {
            setShowRecommendationForm(false)
            setEditingRecommendation(null)
          }}
          loading={createRecommendationMutation.isLoading || updateRecommendationMutation.isLoading}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">데모 시스템 관리</h1>
          <p className="text-gray-600">업주 소개용 데모 데이터 관리 (읽기 전용 시스템)</p>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-blue-600">
          <Eye className="h-4 w-4" />
          <span>데모 시스템</span>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('stores')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'stores'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            데모 매장
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'recommendations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            데모 추천
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            설정
          </button>
        </nav>
      </div>

      {/* 데모 매장 탭 */}
      {activeTab === 'stores' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              데모 매장 ({demoStores?.stores?.length || 0}개)
            </h2>
            <button
              onClick={() => setShowStoreForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>새 데모 매장 추가</span>
            </button>
          </div>

          {storesLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : storesError ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              데모 매장 데이터를 불러오는데 실패했습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {demoStores?.stores?.map((store) => (
                <div key={store.id} className="bg-white rounded-lg shadow overflow-hidden">
                  <img 
                    src={store.representativeImage} 
                    alt={store.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{store.name}</h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {store.category}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{store.shortDescription}</p>
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{store.location?.address}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        QR: {store.qrCode?.id}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingStore(store)}
                          className="text-blue-600 hover:text-blue-900"
                          title="수정"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteStore(store)}
                          className="text-red-600 hover:text-red-900"
                          title="삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 데모 추천 탭 */}
      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              데모 추천 ({demoRecommendations?.recommendations?.length || 0}개)
            </h2>
            <button
              onClick={() => setShowRecommendationForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>새 데모 추천 추가</span>
            </button>
          </div>

          {recommendationsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {demoRecommendations?.recommendations?.map((rec) => (
                <div key={rec.id} className="bg-white rounded-lg shadow overflow-hidden">
                  <img 
                    src={rec.representativeImage} 
                    alt={rec.name}
                    className="w-full h-32 object-cover"
                  />
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-900 mb-1">{rec.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{rec.shortDescription}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span>{rec.distance}m</span>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{rec.walkingTime}분</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {rec.category}
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingRecommendation(rec)}
                          className="text-blue-600 hover:text-blue-900"
                          title="수정"
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteRecommendation(rec)}
                          className="text-red-600 hover:text-red-900"
                          title="삭제"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 설정 탭 */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">데모 시스템 설정</h2>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">데모 시스템 활성화</h3>
                  <p className="text-sm text-gray-500">업주 소개용 데모 시스템 사용 여부</p>
                </div>
                <div className="text-sm">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    demoSettings?.isEnabled 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {demoSettings?.isEnabled ? '활성화' : '비활성화'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">로딩 시뮬레이션</h3>
                  <p className="text-sm text-gray-500">데모용 로딩 시간 (밀리초)</p>
                </div>
                <div className="text-sm text-gray-900">
                  {demoSettings?.loadingSimulationMs}ms
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">버전</h3>
                  <p className="text-sm text-gray-500">현재 데모 시스템 버전</p>
                </div>
                <div className="text-sm text-gray-900">
                  v{demoSettings?.version}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">마지막 업데이트</h3>
                  <p className="text-sm text-gray-500">설정 마지막 변경 시간</p>
                </div>
                <div className="text-sm text-gray-900">
                  {demoSettings?.lastUpdated ? new Date(demoSettings.lastUpdated).toLocaleString('ko-KR') : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
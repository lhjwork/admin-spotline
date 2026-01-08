import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { spotlineStartAPI } from '../services/api'
import { 
  Settings,
  Play,
  Pause,
  Plus,
  Edit,
  Trash2,
  Store,
  TrendingUp,
  Users,
  AlertTriangle
} from 'lucide-react'
import { useForm } from 'react-hook-form'

const CONFIG_TYPES = [
  { value: 'random', label: '랜덤 선택', description: '대상 매장 중에서 무작위로 선택' },
  { value: 'sequential', label: '순차 선택', description: '대상 매장을 순서대로 선택' },
  { value: 'fixed', label: '고정 선택', description: '항상 첫 번째 매장 선택' }
]

function ConfigForm({ config, availableStores, onSubmit, onCancel, loading }) {
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    defaultValues: config || {
      name: '',
      type: 'random',
      targetStores: [],
      isActive: true
    }
  })

  const selectedStores = watch('targetStores') || []

  const handleStoreToggle = (storeId) => {
    const current = selectedStores
    const updated = current.includes(storeId)
      ? current.filter(id => id !== storeId)
      : [...current, storeId]
    setValue('targetStores', updated)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {config ? 'SpotLine 시작 설정 수정' : '새 SpotLine 시작 설정'}
        </h2>
        <div className="flex items-center space-x-2 text-sm text-purple-600">
          <Play className="h-4 w-4" />
          <span>사용자 시작 기능</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              설정명 *
            </label>
            <input
              {...register('name', { required: '설정명을 입력하세요' })}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              placeholder="기본 시작 설정"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              선택 방식 *
            </label>
            <select
              {...register('type', { required: '선택 방식을 선택하세요' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            >
              {CONFIG_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            선택 방식 설명
          </label>
          <div className="bg-gray-50 p-3 rounded-md">
            {CONFIG_TYPES.map(type => (
              <div key={type.value} className={`text-sm ${watch('type') === type.value ? 'text-purple-600 font-medium' : 'text-gray-500'}`}>
                <span className="font-medium">{type.label}:</span> {type.description}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            대상 매장 선택 * ({selectedStores.length}개 선택됨)
          </label>
          
          {availableStores.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">운영 매장을 먼저 등록해주세요</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    SpotLine 시작 기능을 사용하려면 최소 1개 이상의 운영 매장이 필요합니다.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto">
              {availableStores.map((store) => (
                <div key={store._id} className="flex items-center p-3 border-b border-gray-200 last:border-b-0">
                  <input
                    type="checkbox"
                    checked={selectedStores.includes(store._id)}
                    onChange={() => handleStoreToggle(store._id)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <div className="ml-3 flex-1">
                    <div className="text-sm font-medium text-gray-900">{store.name}</div>
                    <div className="text-sm text-gray-500">{store.category} • {store.location?.area}</div>
                    <div className="text-xs text-purple-600 font-mono">{store.qrCodeId}</div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {store.totalScans?.toLocaleString() || 0} 스캔
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {selectedStores.length === 0 && availableStores.length > 0 && (
            <p className="mt-1 text-sm text-red-600">최소 1개 이상의 매장을 선택하세요</p>
          )}
        </div>

        <div className="flex items-center">
          <input
            {...register('isActive')}
            type="checkbox"
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
          />
          <label className="ml-2 text-sm text-gray-700">
            설정 활성화 (사용자가 SpotLine을 시작할 수 있습니다)
          </label>
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
            disabled={loading || selectedStores.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? '저장 중...' : (config ? '수정' : '생성')}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function SpotlineStartSettings() {
  const [showForm, setShowForm] = useState(false)
  const [editingConfig, setEditingConfig] = useState(null)
  const queryClient = useQueryClient()

  const { data: configsData, isLoading: configsLoading } = useQuery(
    'spotline-start-configs',
    () => spotlineStartAPI.getConfigs(),
    {
      select: (response) => response.data
    }
  )

  const { data: storesData, isLoading: storesLoading } = useQuery(
    'available-stores',
    () => spotlineStartAPI.getAvailableStores(),
    {
      select: (response) => response.data.stores || []
    }
  )

  const createMutation = useMutation(
    (data) => spotlineStartAPI.createConfig(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['spotline-start-configs'])
        setShowForm(false)
        setEditingConfig(null)
        alert('SpotLine 시작 설정이 생성되었습니다.')
      }
    }
  )

  const updateMutation = useMutation(
    ({ id, data }) => spotlineStartAPI.updateConfig(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['spotline-start-configs'])
        setShowForm(false)
        setEditingConfig(null)
        alert('SpotLine 시작 설정이 수정되었습니다.')
      }
    }
  )

  const deleteMutation = useMutation(
    (id) => spotlineStartAPI.deleteConfig(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['spotline-start-configs'])
      }
    }
  )

  const handleSubmit = (data) => {
    if (editingConfig) {
      updateMutation.mutate({ id: editingConfig.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleEdit = (config) => {
    setEditingConfig(config)
    setShowForm(true)
  }

  const handleDelete = (config) => {
    if (confirm(`"${config.name}" 설정을 삭제하시겠습니까?`)) {
      deleteMutation.mutate(config.id)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingConfig(null)
  }

  if (configsLoading || storesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  const configs = configsData?.configs || []
  const availableStores = storesData || []

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {editingConfig ? 'SpotLine 시작 설정 수정' : '새 SpotLine 시작 설정'}
            </h1>
            <p className="text-gray-600">사용자가 SpotLine을 시작할 때의 매장 선택 방식을 설정합니다</p>
          </div>
        </div>

        <ConfigForm
          config={editingConfig}
          availableStores={availableStores}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={createMutation.isLoading || updateMutation.isLoading}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SpotLine 시작 설정</h1>
          <p className="text-gray-600">사용자가 "SpotLine 시작" 버튼을 클릭했을 때의 동작을 설정합니다</p>
        </div>
        
        <button
          onClick={() => setShowForm(true)}
          disabled={availableStores.length === 0}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          <span>새 설정 추가</span>
        </button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">사용 가능한 매장</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {availableStores.length}
              </p>
              <p className="text-xs text-gray-500 mt-1">운영 매장 수</p>
            </div>
            <Store className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">활성 설정</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {configs.filter(c => c.isActive).length}
              </p>
              <p className="text-xs text-gray-500 mt-1">전체 {configs.length}개 중</p>
            </div>
            <Settings className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">이번 달 시작</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">125</p>
              <p className="text-xs text-gray-500 mt-1">사용자 시작 횟수</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* 설정 목록 */}
      {availableStores.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">운영 매장을 먼저 등록해주세요</h3>
          <p className="text-gray-600 mb-6">SpotLine 시작 기능을 사용하려면 최소 1개 이상의 운영 매장이 필요합니다.</p>
          <button
            onClick={() => window.location.href = '/operational-stores/new'}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            운영 매장 등록하기
          </button>
        </div>
      ) : configs.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">SpotLine 시작 설정이 없습니다</h3>
          <p className="text-gray-600 mb-6">사용자가 SpotLine을 시작할 수 있도록 첫 설정을 만들어주세요.</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            첫 설정 만들기
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">설정 목록</h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {configs.map((config) => (
              <div key={config.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-lg font-medium text-gray-900">{config.name}</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        config.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {config.isActive ? '활성' : '비활성'}
                      </span>
                    </div>
                    
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">선택 방식:</span> {CONFIG_TYPES.find(t => t.value === config.type)?.label}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">대상 매장:</span> {config.targetStores?.length || 0}개
                      </p>
                      <p className="text-xs text-gray-500">
                        생성일: {new Date(config.createdAt).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(config)}
                      className="text-purple-600 hover:text-purple-900"
                      title="수정"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(config)}
                      className="text-red-600 hover:text-red-900"
                      title="삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {/* 대상 매장 목록 */}
                {config.targetStores && config.targetStores.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">대상 매장</h5>
                    <div className="flex flex-wrap gap-2">
                      {config.targetStores.slice(0, 5).map((storeId) => {
                        const store = availableStores.find(s => s._id === storeId)
                        return store ? (
                          <span key={storeId} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {store.name}
                          </span>
                        ) : null
                      })}
                      {config.targetStores.length > 5 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          +{config.targetStores.length - 5}개 더
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
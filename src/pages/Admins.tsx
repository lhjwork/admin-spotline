import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { adminAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { 
  Plus,
  Edit,
  Shield,
  User,
  Mail,
  Calendar
} from 'lucide-react'
import { useForm } from 'react-hook-form'

const ROLES = [
  { value: 'admin', label: '관리자' },
  { value: 'moderator', label: '모더레이터' }
]

function CreateAdminModal({ isOpen, onClose, onSuccess }) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm()
  
  const createMutation = useMutation(
    (data) => adminAPI.createAdmin(data),
    {
      onSuccess: () => {
        onSuccess()
        onClose()
        reset()
      }
    }
  )

  const onSubmit = (data) => {
    createMutation.mutate(data)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">새 어드민 생성</h3>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                사용자명
              </label>
              <input
                {...register('username', { required: '사용자명을 입력하세요' })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <input
                {...register('email', { 
                  required: '이메일을 입력하세요',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: '올바른 이메일 형식이 아닙니다'
                  }
                })}
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호
              </label>
              <input
                {...register('password', { 
                  required: '비밀번호를 입력하세요',
                  minLength: {
                    value: 6,
                    message: '비밀번호는 최소 6자 이상이어야 합니다'
                  }
                })}
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                역할
              </label>
              <select
                {...register('role', { required: '역할을 선택하세요' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">역할 선택</option>
                {ROLES.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
              )}
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
                {createMutation.isLoading ? '생성 중...' : '생성'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function Admins() {
  const { admin: currentAdmin } = useAuth()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const queryClient = useQueryClient()

  const { data: admins, isLoading, error } = useQuery(
    'admins',
    () => adminAPI.getAdmins(),
    {
      select: (response) => response.data
    }
  )

  const updatePermissionsMutation = useMutation(
    ({ id, permissions }) => adminAPI.updatePermissions(id, permissions),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admins')
      }
    }
  )

  const handleCreateSuccess = () => {
    queryClient.invalidateQueries('admins')
  }

  const getRoleLabel = (role) => {
    switch (role) {
      case 'super_admin': return '슈퍼 관리자'
      case 'admin': return '관리자'
      case 'moderator': return '모더레이터'
      default: return role
    }
  }

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800'
      case 'admin': return 'bg-blue-100 text-blue-800'
      case 'moderator': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (currentAdmin?.role !== 'super_admin') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
        이 페이지에 접근할 권한이 없습니다.
      </div>
    )
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">어드민 관리</h1>
          <p className="text-gray-600">관리자 계정을 생성하고 권한을 관리하세요</p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          <span>새 어드민 생성</span>
        </button>
      </div>

      {/* 어드민 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  사용자 정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  역할
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  권한
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  마지막 로그인
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  생성일
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {admins?.map((admin) => (
                <tr key={admin._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{admin.username}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {admin.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(admin.role)}`}>
                      <Shield className="h-3 w-3 mr-1" />
                      {getRoleLabel(admin.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {admin.role === 'super_admin' ? (
                        <span className="text-purple-600 font-medium">모든 권한</span>
                      ) : (
                        <div className="space-y-1">
                          {admin.permissions.stores.read && (
                            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1">
                              매장 조회
                            </span>
                          )}
                          {admin.permissions.stores.write && (
                            <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mr-1">
                              매장 수정
                            </span>
                          )}
                          {admin.permissions.analytics.read && (
                            <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded mr-1">
                              분석 조회
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {admin.lastLogin ? (
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(admin.lastLogin).toLocaleString('ko-KR')}
                      </div>
                    ) : (
                      <span className="text-gray-400">로그인 기록 없음</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(admin.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CreateAdminModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  )
}
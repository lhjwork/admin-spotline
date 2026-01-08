import { useState } from 'react'
import { useQuery } from 'react-query'
import { adminAPI } from '../services/api'
import { 
  Settings,
  Users,
  Shield,
  Server,
  Database,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Edit,
  Trash2
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function SystemSettings() {
  const { admin } = useAuth()
  const [activeTab, setActiveTab] = useState('admins')

  const { data: admins, isLoading: adminsLoading } = useQuery(
    'admin-list',
    () => adminAPI.getAdmins(),
    {
      select: (response) => response.data
    }
  )

  const tabs = [
    { id: 'admins', name: '관리자 계정', icon: Users },
    { id: 'system', name: '시스템 상태', icon: Server },
    { id: 'security', name: '보안 설정', icon: Shield },
  ]

  const systemStatus = {
    demoSystem: true,
    operationalSystem: true,
    spotlineStart: true,
    database: true,
    apiServer: true
  }

  const getStatusIcon = (status) => {
    return status ? CheckCircle : XCircle
  }

  const getStatusColor = (status) => {
    return status ? 'text-green-500' : 'text-red-500'
  }

  const getStatusText = (status) => {
    return status ? '정상' : '오류'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">시스템 설정</h1>
          <p className="text-gray-600">SpotLine Admin 시스템 관리 및 설정</p>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* 관리자 계정 탭 */}
          {activeTab === 'admins' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">관리자 계정 관리</h3>
                <button className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
                  <Plus className="h-4 w-4" />
                  <span>새 관리자 추가</span>
                </button>
              </div>

              {adminsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          관리자 정보
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          역할
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          마지막 로그인
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          생성일
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          작업
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {admins?.map((adminUser) => (
                        <tr key={adminUser._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{adminUser.username}</div>
                              <div className="text-sm text-gray-500">{adminUser.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              adminUser.role === 'super_admin' 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {adminUser.role === 'super_admin' ? '슈퍼 관리자' : '관리자'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {adminUser.lastLogin ? new Date(adminUser.lastLogin).toLocaleDateString('ko-KR') : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(adminUser.createdAt).toLocaleDateString('ko-KR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              {adminUser._id !== admin?.id && (
                                <>
                                  <button className="text-purple-600 hover:text-purple-900" title="수정">
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button className="text-red-600 hover:text-red-900" title="삭제">
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                              {adminUser._id === admin?.id && (
                                <span className="text-xs text-gray-500">현재 사용자</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 시스템 상태 탭 */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">시스템 상태 확인</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">SpotLine 시스템</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {React.createElement(getStatusIcon(systemStatus.demoSystem), { 
                          className: `h-5 w-5 ${getStatusColor(systemStatus.demoSystem)}` 
                        })}
                        <span className="text-sm font-medium">데모 시스템</span>
                      </div>
                      <span className={`text-sm ${getStatusColor(systemStatus.demoSystem)}`}>
                        {getStatusText(systemStatus.demoSystem)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {React.createElement(getStatusIcon(systemStatus.operationalSystem), { 
                          className: `h-5 w-5 ${getStatusColor(systemStatus.operationalSystem)}` 
                        })}
                        <span className="text-sm font-medium">운영 시스템</span>
                      </div>
                      <span className={`text-sm ${getStatusColor(systemStatus.operationalSystem)}`}>
                        {getStatusText(systemStatus.operationalSystem)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {React.createElement(getStatusIcon(systemStatus.spotlineStart), { 
                          className: `h-5 w-5 ${getStatusColor(systemStatus.spotlineStart)}` 
                        })}
                        <span className="text-sm font-medium">SpotLine 시작</span>
                      </div>
                      <span className={`text-sm ${getStatusColor(systemStatus.spotlineStart)}`}>
                        {getStatusText(systemStatus.spotlineStart)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">인프라 상태</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {React.createElement(getStatusIcon(systemStatus.database), { 
                          className: `h-5 w-5 ${getStatusColor(systemStatus.database)}` 
                        })}
                        <span className="text-sm font-medium">데이터베이스</span>
                      </div>
                      <span className={`text-sm ${getStatusColor(systemStatus.database)}`}>
                        {getStatusText(systemStatus.database)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {React.createElement(getStatusIcon(systemStatus.apiServer), { 
                          className: `h-5 w-5 ${getStatusColor(systemStatus.apiServer)}` 
                        })}
                        <span className="text-sm font-medium">API 서버</span>
                      </div>
                      <span className={`text-sm ${getStatusColor(systemStatus.apiServer)}`}>
                        {getStatusText(systemStatus.apiServer)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 시스템 정보 */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">시스템 정보</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                  <div>
                    <span className="text-gray-600">버전:</span>
                    <span className="ml-2 font-medium">VERSION003-FINAL</span>
                  </div>
                  <div>
                    <span className="text-gray-600">환경:</span>
                    <span className="ml-2 font-medium">Development</span>
                  </div>
                  <div>
                    <span className="text-gray-600">마지막 업데이트:</span>
                    <span className="ml-2 font-medium">{new Date().toLocaleDateString('ko-KR')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 보안 설정 탭 */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">보안 설정</h3>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-md font-semibold text-yellow-800 mb-2">보안 권장사항</h4>
                    <div className="text-sm text-yellow-700 space-y-1">
                      <p>• 관리자 비밀번호를 정기적으로 변경하세요</p>
                      <p>• 불필요한 관리자 계정은 삭제하세요</p>
                      <p>• 데모 시스템 데이터를 수정하지 마세요</p>
                      <p>• 운영 시스템과 데모 시스템을 명확히 구분하세요</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">접근 제어</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">JWT 토큰 만료:</span>
                      <span className="font-medium">24시간</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">세션 타임아웃:</span>
                      <span className="font-medium">자동 로그아웃</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">CORS 설정:</span>
                      <span className="font-medium">활성화</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">데이터 보호</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">데모 데이터:</span>
                      <span className="font-medium text-green-600">읽기 전용</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">운영 데이터:</span>
                      <span className="font-medium text-purple-600">Admin 관리</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">백업:</span>
                      <span className="font-medium">자동 백업</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SpotLine 정체성 알림 */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white">
        <div className="flex items-start space-x-3">
          <Settings className="h-6 w-6 mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold mb-2">VERSION003-FINAL 시스템 구조</h3>
            <div className="text-sm space-y-1 opacity-90">
              <p>• <strong>데모 시스템:</strong> "이런 서비스입니다" (업주 소개용) → "데모보기" 버튼</p>
              <p>• <strong>운영 시스템:</strong> "실제로 사용하세요" (정식 서비스) → "SpotLine 시작" 버튼</p>
              <p>• <strong>Admin 관리:</strong> 운영 시스템만 관리, 데모 시스템은 읽기 전용</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
import { useQuery } from 'react-query'
import { demoSystemAPI } from '../services/api'
import { 
  Eye,
  ExternalLink,
  AlertTriangle,
  Lock,
  QrCode,
  Store,
  MapPin
} from 'lucide-react'

export default function DemoSystem() {
  const { data, isLoading, error } = useQuery(
    'demo-system-data',
    () => demoSystemAPI.getDemoStores(),
    {
      select: (response) => response.data
    }
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
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

  const { stores, demoLinks } = data

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">데모 시스템</h1>
          <p className="text-gray-600">업주 소개용 데모 데이터 (읽기 전용)</p>
        </div>
      </div>

      {/* 경고 배너 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ 중요 주의사항</h3>
            <div className="text-sm text-yellow-700 space-y-1">
              <p>• 이 데이터들은 <strong>업주 소개용 데모 데이터</strong>입니다</p>
              <p>• <strong>수정하거나 삭제하지 마세요</strong> - 읽기 전용입니다</p>
              <p>• 데모 시스템은 "이런 서비스입니다"를 보여주는 용도입니다</p>
              <p>• 실제 서비스 운영은 "운영 매장 관리"에서 하세요</p>
            </div>
          </div>
        </div>
      </div>

      {/* 시스템 구분 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Eye className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold text-green-800">데모 시스템</h3>
          </div>
          <div className="text-sm text-green-700 space-y-2">
            <p><strong>목적:</strong> "이런 서비스입니다" - 업주 소개</p>
            <p><strong>데이터:</strong> DemoStore 스키마 (demo_ 접두사)</p>
            <p><strong>통계:</strong> 수집하지 않음</p>
            <p><strong>관리:</strong> 읽기 전용</p>
            <p><strong>버튼:</strong> "데모보기"</p>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Store className="h-6 w-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-purple-800">운영 시스템</h3>
          </div>
          <div className="text-sm text-purple-700 space-y-2">
            <p><strong>목적:</strong> "실제로 사용하세요" - 정식 서비스</p>
            <p><strong>데이터:</strong> Store 스키마 (real_ 접두사)</p>
            <p><strong>통계:</strong> 완전한 수집 및 분석</p>
            <p><strong>관리:</strong> Admin에서 완전 관리</p>
            <p><strong>버튼:</strong> "SpotLine 시작"</p>
          </div>
        </div>
      </div>

      {/* 데모 링크 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">데모 링크</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">데모 체험 링크</h4>
              <p className="text-sm text-gray-600">업주에게 서비스를 소개할 때 사용</p>
              <code className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded mt-1 inline-block">
                {window.location.origin}{demoLinks?.experience}
              </code>
            </div>
            <button
              onClick={() => window.open(demoLinks?.experience, '_blank')}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Eye className="h-4 w-4" />
              <span>데모보기</span>
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">데모 매장 목록 API</h4>
              <p className="text-sm text-gray-600">개발자용 데모 데이터 확인</p>
              <code className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded mt-1 inline-block">
                {window.location.origin}{demoLinks?.stores}
              </code>
            </div>
            <button
              onClick={() => window.open(demoLinks?.stores, '_blank')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <ExternalLink className="h-4 w-4" />
              <span>API 확인</span>
            </button>
          </div>
        </div>
      </div>

      {/* 데모 매장 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">데모 매장 목록</h3>
            <div className="flex items-center space-x-2 text-sm text-red-600">
              <Lock className="h-4 w-4" />
              <span>읽기 전용</span>
            </div>
          </div>
        </div>

        {stores.length === 0 ? (
          <div className="p-12 text-center">
            <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">데모 매장이 없습니다</h4>
            <p className="text-gray-600">서버에서 데모 데이터를 확인해주세요.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {stores.map((store) => (
              <div key={store.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-medium text-gray-900">{store.name}</h4>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        데모 전용
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{store.shortDescription}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <QrCode className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">QR ID:</span>
                        <code className="text-purple-600 font-mono">{store.qrCodeId}</code>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">지역:</span>
                        <span className="text-gray-900">{store.area}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Store className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">ID:</span>
                        <code className="text-gray-500 font-mono text-xs">{store.id}</code>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-4 flex-shrink-0">
                    <button
                      onClick={() => window.open(`/api/demo/stores/${store.qrCodeId}`, '_blank')}
                      className="flex items-center space-x-2 px-3 py-2 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                    >
                      <Eye className="h-4 w-4" />
                      <span>미리보기</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 사용법 안내 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-4">데모 시스템 사용법</h3>
        <div className="text-sm text-blue-700 space-y-3">
          <div>
            <h4 className="font-medium mb-1">1. 업주 소개 시</h4>
            <p>"데모보기" 버튼을 클릭하여 SpotLine 서비스가 어떻게 작동하는지 보여주세요.</p>
          </div>
          
          <div>
            <h4 className="font-medium mb-1">2. 개발자 확인</h4>
            <p>API 링크를 통해 데모 데이터 구조와 응답 형식을 확인할 수 있습니다.</p>
          </div>
          
          <div>
            <h4 className="font-medium mb-1">3. 주의사항</h4>
            <p>데모 데이터는 절대 수정하지 마세요. 실제 서비스 운영은 "운영 매장 관리"에서 하세요.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
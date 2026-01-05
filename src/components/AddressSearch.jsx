import { useState, useEffect } from 'react'
import { Search, MapPin } from 'lucide-react'

export default function AddressSearch({ 
  onAddressSelect, 
  initialAddress = '', 
  initialCoordinates = null 
}) {
  const [address, setAddress] = useState(initialAddress)
  const [coordinates, setCoordinates] = useState(initialCoordinates)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setAddress(initialAddress)
    setCoordinates(initialCoordinates)
  }, [initialAddress, initialCoordinates])

  // Kakao API를 사용하여 주소를 좌표로 변환
  const getCoordinatesFromAddress = async (address) => {
    const KAKAO_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY
    
    if (!KAKAO_API_KEY) {
      console.error('Kakao API key not found')
      return null
    }

    try {
      const response = await fetch(
        `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,
        {
          headers: {
            'Authorization': `KakaoAK ${KAKAO_API_KEY}`
          }
        }
      )

      const data = await response.json()
      
      if (data.documents && data.documents.length > 0) {
        const { x: lng, y: lat } = data.documents[0]
        return { 
          lat: parseFloat(lat), 
          lng: parseFloat(lng) 
        }
      }
      return null
    } catch (error) {
      console.error('좌표 변환 오류:', error)
      return null
    }
  }

  // Daum 주소 검색 팝업 열기
  const openAddressSearch = () => {
    if (typeof window.daum === 'undefined') {
      setError('주소 검색 서비스를 불러올 수 없습니다.')
      return
    }

    setError('')
    
    new window.daum.Postcode({
      oncomplete: async function(data) {
        setLoading(true)
        
        // 선택된 주소 정보
        const fullAddress = data.roadAddress || data.jibunAddress
        const addressData = {
          zonecode: data.zonecode,
          roadAddress: data.roadAddress,
          jibunAddress: data.jibunAddress,
          buildingName: data.buildingName,
          sido: data.sido,
          sigungu: data.sigungu,
          bname: data.bname
        }

        setAddress(fullAddress)

        // 좌표 변환
        const coords = await getCoordinatesFromAddress(fullAddress)
        setCoordinates(coords)

        // 부모 컴포넌트에 결과 전달
        if (onAddressSelect) {
          onAddressSelect({
            address: fullAddress,
            coordinates: coords,
            addressData: addressData
          })
        }

        setLoading(false)
      },
      onclose: function() {
        // 팝업 닫힐 때 실행할 코드 (필요시)
      },
      width: '100%',
      height: '100%'
    }).open()
  }

  return (
    <div className="space-y-3">
      <div className="flex space-x-2">
        <input
          type="text"
          value={address}
          readOnly
          placeholder="주소를 검색해주세요"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
        />
        <button
          type="button"
          onClick={openAddressSearch}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <Search className="h-4 w-4" />
          <span>{loading ? '검색 중...' : '주소 검색'}</span>
        </button>
      </div>

      {/* 좌표 정보 표시 */}
      {coordinates && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <div className="flex items-center space-x-2 text-green-800">
            <MapPin className="h-4 w-4" />
            <span className="text-sm font-medium">좌표 정보</span>
          </div>
          <div className="mt-1 text-sm text-green-700">
            위도: {coordinates.lat}, 경도: {coordinates.lng}
          </div>
        </div>
      )}

      {/* 좌표 변환 실패 경고 */}
      {address && !coordinates && !loading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <div className="text-yellow-800 text-sm">
            ⚠️ 좌표 변환에 실패했습니다. 수동으로 입력해주세요.
          </div>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="text-red-800 text-sm">
            {error}
          </div>
        </div>
      )}
    </div>
  )
}
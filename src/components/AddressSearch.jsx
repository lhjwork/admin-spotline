import { useState, useEffect } from 'react'
import { Search, MapPin, AlertTriangle, RefreshCw, Target } from 'lucide-react'
import { 
  normalizeAddress, 
  isValidKoreanCoordinates, 
  extractAddressKeywords,
  formatCoordinates 
} from '../utils/geocoding'

export default function AddressSearch({ 
  onAddressSelect, 
  initialAddress = '', 
  initialCoordinates = null 
}) {
  const [address, setAddress] = useState(initialAddress)
  const [coordinates, setCoordinates] = useState(initialCoordinates)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const [coordinateSource, setCoordinateSource] = useState('')

  useEffect(() => {
    setAddress(initialAddress)
    setCoordinates(initialCoordinates)
  }, [initialAddress, initialCoordinates])

  // 1. Kakao API를 사용한 좌표 변환 (개선된 버전)
  const getCoordinatesFromKakao = async (address) => {
    const KAKAO_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY
    
    if (!KAKAO_API_KEY) {
      console.error('Kakao API key not found')
      return null
    }

    try {
      // 정확한 주소 검색
      const exactResponse = await fetch(
        `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,
        {
          headers: {
            'Authorization': `KakaoAK ${KAKAO_API_KEY}`
          }
        }
      )

      if (exactResponse.ok) {
        const exactData = await exactResponse.json()
        if (exactData.documents && exactData.documents.length > 0) {
          const { x: lng, y: lat } = exactData.documents[0]
          const coords = formatCoordinates(parseFloat(lat), parseFloat(lng))
          
          if (isValidKoreanCoordinates(coords.lat, coords.lng)) {
            return { ...coords, source: 'kakao-exact' }
          }
        }
      }

      // 키워드 검색으로 재시도
      const keywordResponse = await fetch(
        `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(address)}`,
        {
          headers: {
            'Authorization': `KakaoAK ${KAKAO_API_KEY}`
          }
        }
      )

      if (keywordResponse.ok) {
        const keywordData = await keywordResponse.json()
        if (keywordData.documents && keywordData.documents.length > 0) {
          const { x: lng, y: lat } = keywordData.documents[0]
          const coords = formatCoordinates(parseFloat(lat), parseFloat(lng))
          
          if (isValidKoreanCoordinates(coords.lat, coords.lng)) {
            return { ...coords, source: 'kakao-keyword' }
          }
        }
      }

      return null
    } catch (error) {
      console.error('Kakao 좌표 변환 오류:', error)
      return null
    }
  }

  // 2. 네이버 API (백엔드 통해 호출)
  const getCoordinatesFromNaver = async (address) => {
    try {
      const response = await fetch(`/api/geocoding/naver?address=${encodeURIComponent(address)}`)
      if (response.ok) {
        const data = await response.json()
        if (data.coordinates && isValidKoreanCoordinates(data.coordinates.lat, data.coordinates.lng)) {
          return { ...data.coordinates, source: 'naver' }
        }
      }
    } catch (error) {
      console.error('Naver 좌표 변환 오류:', error)
    }
    return null
  }

  // 3. 구글 API (백엔드 통해 호출)
  const getCoordinatesFromGoogle = async (address) => {
    try {
      const response = await fetch(`/api/geocoding/google?address=${encodeURIComponent(address)}`)
      if (response.ok) {
        const data = await response.json()
        if (data.coordinates && isValidKoreanCoordinates(data.coordinates.lat, data.coordinates.lng)) {
          return { ...data.coordinates, source: 'google' }
        }
      }
    } catch (error) {
      console.error('Google 좌표 변환 오류:', error)
    }
    return null
  }

  // 다중 API 시도 함수 (개선된 버전)
  const getCoordinatesWithFallback = async (address) => {
    const normalizedAddress = normalizeAddress(address)
    const keywords = extractAddressKeywords(address)
    
    // 시도할 주소 변형들
    const addressVariations = [
      normalizedAddress,
      address, // 원본 주소
      ...keywords.map(keyword => `${normalizedAddress} ${keyword}`)
    ].filter((addr, index, arr) => arr.indexOf(addr) === index) // 중복 제거

    console.log('주소 변형들:', addressVariations)

    for (const addressVariation of addressVariations) {
      // 1차 시도: Kakao API
      let coords = await getCoordinatesFromKakao(addressVariation)
      if (coords) {
        console.log(`Kakao API 성공: ${addressVariation}`)
        return coords
      }

      // 2차 시도: 네이버 API (백엔드 구현 필요)
      coords = await getCoordinatesFromNaver(addressVariation)
      if (coords) {
        console.log(`Naver API 성공: ${addressVariation}`)
        return coords
      }

      // 3차 시도: 구글 API (백엔드 구현 필요)
      coords = await getCoordinatesFromGoogle(addressVariation)
      if (coords) {
        console.log(`Google API 성공: ${addressVariation}`)
        return coords
      }
    }

    return null
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
        setRetryCount(0)
        
        // 선택된 주소 정보
        const fullAddress = data.roadAddress || data.jibunAddress
        const addressData = {
          zonecode: data.zonecode,
          roadAddress: data.roadAddress,
          jibunAddress: data.jibunAddress,
          buildingName: data.buildingName,
          sido: data.sido,
          sigungu: data.sigungu,
          bname: data.bname,
          roadAddressEnglish: data.roadAddressEnglish,
          jibunAddressEnglish: data.jibunAddressEnglish
        }

        setAddress(fullAddress)

        // 좌표 변환 시도
        const coords = await getCoordinatesWithFallback(fullAddress)
        setCoordinates(coords)
        setCoordinateSource(coords?.source || '')

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

  // 좌표 재시도 함수
  const retryCoordinateConversion = async () => {
    if (!address || retryCount >= 3) return
    
    setLoading(true)
    setError('')
    setRetryCount(prev => prev + 1)
    
    const coords = await getCoordinatesWithFallback(address)
    setCoordinates(coords)
    setCoordinateSource(coords?.source || '')
    
    if (onAddressSelect && coords) {
      onAddressSelect({
        address,
        coordinates: coords,
        addressData: null
      })
    }
    
    setLoading(false)
  }

  // 현재 위치 사용
  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('위치 서비스를 지원하지 않는 브라우저입니다.')
      return
    }

    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = formatCoordinates(
          position.coords.latitude,
          position.coords.longitude
        )
        
        if (isValidKoreanCoordinates(coords.lat, coords.lng)) {
          setCoordinates({ ...coords, source: 'gps' })
          setCoordinateSource('gps')
          
          if (onAddressSelect) {
            onAddressSelect({
              address,
              coordinates: { ...coords, source: 'gps' },
              addressData: null
            })
          }
        } else {
          setError('현재 위치가 한국 영역을 벗어났습니다.')
        }
        
        setLoading(false)
      },
      (error) => {
        setError('위치 정보를 가져올 수 없습니다.')
        setLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    )
  }

  // 수동 좌표 입력 모달
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualLat, setManualLat] = useState('')
  const [manualLng, setManualLng] = useState('')

  const handleManualCoordinates = () => {
    const lat = parseFloat(manualLat)
    const lng = parseFloat(manualLng)
    
    if (isNaN(lat) || isNaN(lng)) {
      alert('올바른 좌표를 입력해주세요.')
      return
    }
    
    if (!isValidKoreanCoordinates(lat, lng)) {
      alert('한국 영역 내의 좌표를 입력해주세요.')
      return
    }
    
    const coords = formatCoordinates(lat, lng)
    const finalCoords = { ...coords, source: 'manual' }
    setCoordinates(finalCoords)
    setCoordinateSource('manual')
    
    if (onAddressSelect) {
      onAddressSelect({
        address,
        coordinates: finalCoords,
        addressData: null
      })
    }
    
    setShowManualInput(false)
    setManualLat('')
    setManualLng('')
  }

  const getSourceLabel = (source) => {
    const labels = {
      'kakao-exact': 'Kakao 정확',
      'kakao-keyword': 'Kakao 키워드',
      'naver': 'Naver',
      'google': 'Google',
      'gps': 'GPS',
      'manual': '수동입력'
    }
    return labels[source] || source
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-green-800">
              <MapPin className="h-4 w-4" />
              <span className="text-sm font-medium">좌표 정보</span>
              {coordinateSource && (
                <span className="text-xs bg-green-200 px-2 py-1 rounded">
                  {getSourceLabel(coordinateSource)}
                </span>
              )}
            </div>
          </div>
          <div className="mt-1 text-sm text-green-700">
            위도: {coordinates.lat}, 경도: {coordinates.lng}
          </div>
        </div>
      )}

      {/* 좌표 변환 실패 경고 및 대안 옵션 */}
      {address && !coordinates && !loading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <div className="text-yellow-800 text-sm font-medium">
                좌표 변환에 실패했습니다
              </div>
              <div className="text-yellow-700 text-xs mt-1">
                다른 방법으로 좌표를 입력할 수 있습니다.
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {retryCount < 3 && (
                  <button
                    onClick={retryCoordinateConversion}
                    className="flex items-center space-x-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-xs hover:bg-yellow-200"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>재시도 ({retryCount}/3)</span>
                  </button>
                )}
                <button
                  onClick={useCurrentLocation}
                  className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-800 rounded text-xs hover:bg-blue-200"
                >
                  <Target className="h-3 w-3" />
                  <span>현재 위치</span>
                </button>
                <button
                  onClick={() => setShowManualInput(true)}
                  className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-xs hover:bg-gray-200"
                >
                  수동 입력
                </button>
              </div>
            </div>
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

      {/* 수동 좌표 입력 모달 */}
      {showManualInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">수동 좌표 입력</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  위도 (Latitude)
                </label>
                <input
                  type="number"
                  step="any"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  placeholder="37.5665"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  경도 (Longitude)
                </label>
                <input
                  type="number"
                  step="any"
                  value={manualLng}
                  onChange={(e) => setManualLng(e.target.value)}
                  placeholder="126.9780"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                <p className="font-medium mb-1">참고 좌표:</p>
                <p>• 서울 시청: 37.5665, 126.9780</p>
                <p>• 부산 시청: 35.1796, 129.0756</p>
                <p>• 네이버 지도나 구글 지도에서 좌표를 확인할 수 있습니다.</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowManualInput(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleManualCoordinates}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
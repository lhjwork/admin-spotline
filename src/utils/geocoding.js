// 지오코딩 관련 유틸리티 함수들

// 한국 영역 내 좌표인지 확인
export const isValidKoreanCoordinates = (lat, lng) => {
  // 한국의 대략적인 경계
  const KOREA_BOUNDS = {
    north: 38.6,
    south: 33.0,
    east: 131.9,
    west: 124.5
  }
  
  return lat >= KOREA_BOUNDS.south && 
         lat <= KOREA_BOUNDS.north && 
         lng >= KOREA_BOUNDS.west && 
         lng <= KOREA_BOUNDS.east
}

// 주소 정규화 함수
export const normalizeAddress = (address) => {
  if (!address) return ''
  
  let normalized = address.trim().replace(/\s+/g, ' ')
  
  // 시/도 이름 정규화
  const cityReplacements = {
    '서울시': '서울특별시',
    '서울': '서울특별시',
    '부산시': '부산광역시',
    '부산': '부산광역시',
    '대구시': '대구광역시',
    '대구': '대구광역시',
    '인천시': '인천광역시',
    '인천': '인천광역시',
    '광주시': '광주광역시',
    '광주': '광주광역시',
    '대전시': '대전광역시',
    '대전': '대전광역시',
    '울산시': '울산광역시',
    '울산': '울산광역시',
    '세종시': '세종특별자치시',
    '세종': '세종특별자치시'
  }
  
  // 도 이름 정규화
  const provinceReplacements = {
    '경기': '경기도',
    '강원': '강원도',
    '충북': '충청북도',
    '충남': '충청남도',
    '전북': '전라북도',
    '전남': '전라남도',
    '경북': '경상북도',
    '경남': '경상남도',
    '제주': '제주특별자치도'
  }
  
  // 시/도 이름 교체
  Object.entries(cityReplacements).forEach(([old, new_]) => {
    const regex = new RegExp(`^${old}\\s`, 'g')
    normalized = normalized.replace(regex, `${new_} `)
  })
  
  Object.entries(provinceReplacements).forEach(([old, new_]) => {
    const regex = new RegExp(`^${old}\\s`, 'g')
    normalized = normalized.replace(regex, `${new_} `)
  })
  
  return normalized
}

// 주소에서 키워드 추출 (검색 정확도 향상)
export const extractAddressKeywords = (address) => {
  const keywords = []
  
  // 도로명 주소 패턴
  const roadPattern = /(\S+로\d*|\S+길\d*)/g
  const roadMatches = address.match(roadPattern)
  if (roadMatches) {
    keywords.push(...roadMatches)
  }
  
  // 건물명 패턴
  const buildingPattern = /(\S+빌딩|\S+타워|\S+센터|\S+플라자|\S+몰)/g
  const buildingMatches = address.match(buildingPattern)
  if (buildingMatches) {
    keywords.push(...buildingMatches)
  }
  
  // 지번 주소 패턴
  const jibunPattern = /(\d+-\d+|\d+번지)/g
  const jibunMatches = address.match(jibunPattern)
  if (jibunMatches) {
    keywords.push(...jibunMatches)
  }
  
  return keywords
}

// 좌표 정확도 검증 (여러 API 결과 비교)
export const validateCoordinateAccuracy = (coordinates) => {
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    return { isAccurate: false, confidence: 0 }
  }
  
  // 좌표들 간의 거리 계산
  const distances = []
  for (let i = 0; i < coordinates.length - 1; i++) {
    for (let j = i + 1; j < coordinates.length; j++) {
      const distance = calculateDistance(
        coordinates[i].lat, coordinates[i].lng,
        coordinates[j].lat, coordinates[j].lng
      )
      distances.push(distance)
    }
  }
  
  // 평균 거리 계산
  const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length
  
  // 신뢰도 계산 (거리가 가까울수록 높은 신뢰도)
  let confidence = 1
  if (avgDistance > 1000) confidence = 0.3      // 1km 이상 차이
  else if (avgDistance > 500) confidence = 0.5  // 500m 이상 차이
  else if (avgDistance > 100) confidence = 0.7  // 100m 이상 차이
  else if (avgDistance > 50) confidence = 0.8   // 50m 이상 차이
  else confidence = 0.9                         // 50m 미만 차이
  
  return {
    isAccurate: avgDistance < 500, // 500m 미만이면 정확하다고 판단
    confidence,
    averageDistance: avgDistance,
    coordinates: coordinates
  }
}

// 두 좌표 간의 거리 계산 (Haversine formula)
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000 // 지구 반지름 (미터)
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // 미터 단위
}

const toRadians = (degrees) => {
  return degrees * (Math.PI / 180)
}

// 좌표 보정 함수 (여러 결과의 평균값 계산)
export const correctCoordinates = (coordinates) => {
  if (!Array.isArray(coordinates) || coordinates.length === 0) {
    return null
  }
  
  if (coordinates.length === 1) {
    return coordinates[0]
  }
  
  // 이상치 제거 (다른 좌표들과 너무 멀리 떨어진 좌표)
  const filtered = coordinates.filter(coord => {
    const distances = coordinates
      .filter(c => c !== coord)
      .map(c => calculateDistance(coord.lat, coord.lng, c.lat, c.lng))
    
    const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length
    return avgDistance < 2000 // 2km 이상 떨어진 좌표는 제외
  })
  
  if (filtered.length === 0) {
    return coordinates[0] // 모든 좌표가 이상치라면 첫 번째 반환
  }
  
  // 평균 좌표 계산
  const avgLat = filtered.reduce((sum, coord) => sum + coord.lat, 0) / filtered.length
  const avgLng = filtered.reduce((sum, coord) => sum + coord.lng, 0) / filtered.length
  
  return {
    lat: avgLat,
    lng: avgLng,
    source: 'corrected',
    originalCount: coordinates.length,
    usedCount: filtered.length
  }
}

// 주소 유형 판별
export const getAddressType = (address) => {
  if (!address) return 'unknown'
  
  if (address.includes('로') || address.includes('길')) {
    return 'road' // 도로명 주소
  }
  
  if (address.match(/\d+-\d+/) || address.includes('번지')) {
    return 'jibun' // 지번 주소
  }
  
  return 'mixed'
}

// 좌표 포맷팅
export const formatCoordinates = (lat, lng, precision = 6) => {
  return {
    lat: parseFloat(lat.toFixed(precision)),
    lng: parseFloat(lng.toFixed(precision))
  }
}

// 좌표를 주소로 변환 (역지오코딩)
export const reverseGeocode = async (lat, lng) => {
  const KAKAO_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY
  
  if (!KAKAO_API_KEY) {
    throw new Error('Kakao API key not found')
  }
  
  try {
    const response = await fetch(
      `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}`,
      {
        headers: {
          'Authorization': `KakaoAK ${KAKAO_API_KEY}`
        }
      }
    )
    
    const data = await response.json()
    
    if (data.documents && data.documents.length > 0) {
      const doc = data.documents[0]
      return {
        roadAddress: doc.road_address?.address_name,
        jibunAddress: doc.address?.address_name,
        region: doc.address?.region_1depth_name,
        district: doc.address?.region_2depth_name
      }
    }
    
    return null
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return null
  }
}
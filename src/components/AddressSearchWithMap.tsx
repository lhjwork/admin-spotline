import { useState, useEffect, useRef } from 'react';
import { Search, X, Map, CheckCircle, AlertCircle } from 'lucide-react';

interface AddressData {
  zonecode: string;
  roadAddress: string;
  jibunAddress: string;
  buildingName: string;
  sido: string;
  sigungu: string;
  bname: string;
  addressEnglish: string;
  jibunAddressEnglish: string;
}

interface Coordinates {
  lat: number;
  lng: number;
  source?: string;
}

interface AddressSelectData {
  address: string;
  coordinates: Coordinates | null;
  addressData: AddressData;
}

interface AddressSearchWithMapProps {
  onAddressSelect: (data: AddressSelectData) => void;
  initialAddress?: string;
  initialCoordinates?: Coordinates | null;
}

// 전역 타입 선언
declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: any) => void;
        width: string;
        height: string;
      }) => {
        embed: (container: HTMLElement) => void;
      };
    };
    kakao: {
      maps: {
        load: (callback: () => void) => void;
        Map: new (container: HTMLElement, options: any) => any;
        LatLng: new (lat: number, lng: number) => any;
        Marker: new (options: any) => any;
        InfoWindow: new (options: any) => any;
        services: {
          Geocoder: new () => any;
          Status: {
            OK: any;
          };
        };
      };
    };
  }
}

export default function AddressSearchWithMap({ 
  onAddressSelect, 
  initialAddress = '', 
  initialCoordinates = null 
}: AddressSearchWithMapProps) {
  const [address, setAddress] = useState<string>(initialAddress);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(initialCoordinates);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [showMap, setShowMap] = useState<boolean>(false);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);

  useEffect(() => {
    setAddress(initialAddress);
    setCoordinates(initialCoordinates);
  }, [initialAddress, initialCoordinates]);

  // 카카오 지도 초기화
  const initializeKakaoMap = () => {
    if (typeof window !== 'undefined' && window.kakao && window.kakao.maps) {
      window.kakao.maps.load(() => {
        setMapLoaded(true);
      });
    }
  };

  useEffect(() => {
    initializeKakaoMap();
  }, []);

  // 카카오 지오코딩 함수 (REST API 사용)
  const getCoordinatesFromAddress = async (address: string): Promise<Coordinates | null> => {
    const KAKAO_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY;
    
    console.log('=== 카카오 지오코딩 API 호출 ===');
    console.log('입력 주소:', address);
    console.log('API 키 상태:', KAKAO_API_KEY && KAKAO_API_KEY !== 'YOUR_KAKAO_REST_API_KEY' ? '설정됨' : '미설정');
    
    if (!KAKAO_API_KEY || KAKAO_API_KEY === 'YOUR_KAKAO_REST_API_KEY') {
      console.warn('Kakao REST API key not configured - 좌표 변환 건너뜀');
      return null;
    }

    try {
      const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`;
      console.log('요청 URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `KakaoAK ${KAKAO_API_KEY}`
        }
      });

      console.log('응답 상태:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('=== 카카오 지오코딩 API 응답 ===');
        console.log('전체 응답 데이터:', data);
        
        if (data.documents && data.documents.length > 0) {
          console.log('검색된 문서 수:', data.documents.length);
          console.log('첫 번째 결과:', data.documents[0]);
          
          const { x: lng, y: lat } = data.documents[0];
          console.log('추출된 좌표 - 경도(x):', lng, '위도(y):', lat);
          
          const coordinates = {
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            source: 'kakao-rest'
          };
          
          console.log('최종 좌표 객체:', coordinates);
          console.log('=====================================');
          
          return coordinates;
        } else {
          console.log('검색 결과 없음 - documents 배열이 비어있음');
        }
      } else {
        console.error('API 요청 실패:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('에러 응답:', errorText);
      }
    } catch (error: any) {
      console.error('=== 카카오 지오코딩 에러 ===');
      console.error('에러 타입:', error?.constructor?.name || 'Unknown');
      console.error('에러 메시지:', error?.message || 'Unknown error');
      console.error('전체 에러 객체:', error);
      console.error('=====================================');
    }
    
    console.log('좌표 변환 실패 - JavaScript SDK로 재시도');
    return await getCoordinatesFromJavaScriptSDK(address);
  };

  // 카카오 JavaScript SDK를 사용한 지오코딩 (백업)
  const getCoordinatesFromJavaScriptSDK = async (address: string): Promise<Coordinates | null> => {
    return new Promise((resolve) => {
      if (!mapLoaded || !window.kakao || !window.kakao.maps) {
        console.warn('Kakao JavaScript SDK not loaded');
        resolve(null);
        return;
      }

      const geocoder = new window.kakao.maps.services.Geocoder();
      
      geocoder.addressSearch(address, (result: any[], status: any) => {
        console.log('=== 카카오 JavaScript SDK 지오코딩 ===');
        console.log('검색 상태:', status);
        console.log('검색 결과:', result);
        
        if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
          const coords = result[0];
          const coordinates = {
            lat: parseFloat(coords.y),
            lng: parseFloat(coords.x),
            source: 'kakao-js'
          };
          
          console.log('JavaScript SDK 좌표:', coordinates);
          console.log('=====================================');
          resolve(coordinates);
        } else {
          console.log('JavaScript SDK 지오코딩 실패');
          resolve(null);
        }
      });
    });
  };

  // 지도에 마커 표시
  const displayMapWithMarker = (coords: Coordinates, address: string) => {
    if (!mapLoaded || !mapRef.current || !window.kakao || !window.kakao.maps) {
      console.warn('지도를 표시할 수 없습니다 - Kakao Maps SDK가 로드되지 않음');
      return;
    }

    const container = mapRef.current;
    const options = {
      center: new window.kakao.maps.LatLng(coords.lat, coords.lng),
      level: 3
    };

    // 기존 지도 인스턴스 제거
    if (mapInstance.current) {
      mapInstance.current = null;
    }

    // 새 지도 생성
    mapInstance.current = new window.kakao.maps.Map(container, options);

    // 마커 생성
    const markerPosition = new window.kakao.maps.LatLng(coords.lat, coords.lng);
    
    if (markerInstance.current) {
      markerInstance.current.setMap(null);
    }
    
    markerInstance.current = new window.kakao.maps.Marker({
      position: markerPosition
    });

    markerInstance.current.setMap(mapInstance.current);

    // 정보창 생성
    const infoWindow = new window.kakao.maps.InfoWindow({
      content: `
        <div style="padding:10px; min-width:200px;">
          <div style="font-weight:bold; margin-bottom:5px;">${address}</div>
          <div style="font-size:12px; color:#666;">
            위도: ${coords.lat}<br>
            경도: ${coords.lng}<br>
            출처: ${coords.source}
          </div>
        </div>
      `
    });

    infoWindow.open(mapInstance.current, markerInstance.current);

    console.log('지도 표시 완료:', { coords, address });
  };

  // 다음 우편번호 서비스 임베드 초기화
  useEffect(() => {
    if (showModal) {
      console.log('=== 다음 우편번호 서비스 로드 확인 ===');
      console.log('window.daum:', typeof window.daum);
      console.log('window.daum.Postcode:', typeof window.daum?.Postcode);
      
      // 약간의 지연을 두고 스크립트 로드 확인
      const checkAndInitialize = () => {
        if (typeof window !== 'undefined' && window.daum && window.daum.Postcode) {
          const container = document.getElementById('daum-postcode-container');
          if (container) {
            console.log('다음 우편번호 서비스 초기화 시작...');
            container.innerHTML = '';
            
            try {
              new window.daum.Postcode({
                oncomplete: async function(data: any) {
                  console.log('=== 다음 우편번호 API 원본 데이터 ===');
                  console.log('전체 데이터:', data);
                  
                  setLoading(true);
                  
                  const fullAddress = data.roadAddress || data.jibunAddress;
                  const addressData: AddressData = {
                    zonecode: data.zonecode,
                    roadAddress: data.roadAddress,
                    jibunAddress: data.jibunAddress,
                    buildingName: data.buildingName,
                    sido: data.sido,
                    sigungu: data.sigungu,
                    bname: data.bname,
                    addressEnglish: data.roadAddressEnglish || data.jibunAddressEnglish,
                    jibunAddressEnglish: data.jibunAddressEnglish
                  };

                  setAddress(fullAddress);

                  // 좌표 변환 시도
                  const coords = await getCoordinatesFromAddress(fullAddress);
                  setCoordinates(coords);

                  // 좌표가 있으면 지도 표시
                  if (coords) {
                    setShowMap(true);
                    setTimeout(() => {
                      displayMapWithMarker(coords, fullAddress);
                    }, 100);
                  }

                  // 부모 컴포넌트에 결과 전달
                  const finalResult = {
                    address: fullAddress,
                    coordinates: coords,
                    addressData: addressData
                  };
                  
                  onAddressSelect(finalResult);
                  setShowModal(false);
                  setLoading(false);
                },
                width: '100%',
                height: '400px'
              }).embed(container);
              
              console.log('다음 우편번호 서비스 초기화 완료');
            } catch (error) {
              console.error('다음 우편번호 서비스 초기화 실패:', error);
              if (container) {
                container.innerHTML = `
                  <div style="padding: 20px; text-align: center; color: #666;">
                    <p>주소 검색 서비스를 불러오는데 실패했습니다.</p>
                    <button onclick="window.location.reload()" style="margin-top: 10px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                      페이지 새로고침
                    </button>
                  </div>
                `;
              }
            }
          }
        } else {
          console.error('다음 우편번호 서비스가 로드되지 않았습니다.');
          const container = document.getElementById('daum-postcode-container');
          if (container) {
            container.innerHTML = `
              <div style="padding: 20px; text-align: center; color: #666;">
                <p>주소 검색 서비스를 불러오는 중...</p>
                <div style="margin: 20px 0;">
                  <div style="display: inline-block; width: 20px; height: 20px; border: 2px solid #f3f3f3; border-top: 2px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                </div>
                <button onclick="window.location.reload()" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                  페이지 새로고침
                </button>
                <style>
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                </style>
              </div>
            `;
          }
          
          // 3초 후 다시 시도
          setTimeout(checkAndInitialize, 3000);
        }
      };
      
      // 즉시 시도하고, 실패하면 1초 후 다시 시도
      checkAndInitialize();
      setTimeout(checkAndInitialize, 1000);
    }
  }, [showModal, onAddressSelect]);

  const openAddressModal = () => {
    console.log('주소 검색 모달 열기 시도...');
    console.log('window.daum 상태:', typeof window.daum);
    
    if (typeof window === 'undefined' || !window.daum || !window.daum.Postcode) {
      console.warn('다음 우편번호 서비스가 아직 로드되지 않았습니다.');
      alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setShowMap(false);
  };

  return (
    <>
      <div className="space-y-3">
        <div className="flex space-x-2">
          <input
            type="text"
            value={address}
            readOnly
            placeholder="주소를 검색해주세요"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-pointer"
            onClick={openAddressModal}
          />
          <button
            type="button"
            onClick={openAddressModal}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 min-w-[120px] justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>처리 중...</span>
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                <span>주소 검색</span>
              </>
            )}
          </button>
        </div>

        {/* 좌표 정보 표시 */}
        {coordinates && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">좌표 정보</span>
                {coordinates.source && (
                  <span className="text-xs bg-green-200 px-2 py-1 rounded">
                    {coordinates.source === 'kakao-rest' ? 'REST API' : 
                     coordinates.source === 'kakao-js' ? 'JavaScript SDK' : coordinates.source}
                  </span>
                )}
              </div>
              {mapLoaded && (
                <button
                  onClick={() => {
                    setShowMap(!showMap);
                    if (!showMap && coordinates) {
                      setTimeout(() => displayMapWithMarker(coordinates, address), 100);
                    }
                  }}
                  className="flex items-center space-x-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200"
                >
                  <Map className="h-3 w-3" />
                  <span>{showMap ? '지도 숨기기' : '지도 보기'}</span>
                </button>
              )}
            </div>
            <div className="mt-1 text-sm text-green-700">
              위도: {coordinates.lat}, 경도: {coordinates.lng}
            </div>
          </div>
        )}

        {/* 좌표 변환 실패 경고 */}
        {address && !coordinates && !loading && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <div className="flex items-center space-x-2 text-yellow-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">좌표 변환 실패</span>
            </div>
            <div className="mt-1 text-sm text-yellow-700">
              카카오 API 키를 설정하면 자동으로 좌표를 가져올 수 있습니다.
            </div>
          </div>
        )}

        {/* 지도 표시 */}
        {showMap && coordinates && (
          <div className="border border-gray-300 rounded-md overflow-hidden">
            <div className="bg-gray-100 px-3 py-2 border-b border-gray-300">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">위치 확인</span>
                <button
                  onClick={() => setShowMap(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div 
              ref={mapRef}
              style={{ width: '100%', height: '300px' }}
              className="bg-gray-100"
            >
              {!mapLoaded && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500 text-sm">지도를 로드하는 중...</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 주소 검색 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div 
              className="fixed inset-0 bg-gray-600 bg-opacity-75" 
              onClick={closeModal} 
            />
            
            <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">주소 검색</h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-4">
                <div 
                  id="daum-postcode-container" 
                  style={{ width: '100%', height: '400px' }}
                >
                  <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    주소 검색 기능을 로드하는 중...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Map, Edit3, Check, RotateCcw } from 'lucide-react';

interface AddressData {
  zonecode: string;
  roadAddress: string;
  jibunAddress: string;
  buildingName: string;
  sido: string;
  sigungu: string;
  bname: string;
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

interface DaumAddressEmbedProps {
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
        event: {
          addListener: (target: any, type: string, handler: (event: any) => void) => void;
        };
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

export default function DaumAddressEmbed({ 
  onAddressSelect, 
  initialAddress = '', 
  initialCoordinates = null 
}: DaumAddressEmbedProps) {
  const [address, setAddress] = useState<string>(initialAddress);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(initialCoordinates);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [showMap, setShowMap] = useState<boolean>(false);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [isEditingLocation, setIsEditingLocation] = useState<boolean>(false);
  const [originalCoordinates, setOriginalCoordinates] = useState<Coordinates | null>(null);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);

  useEffect(() => {
    setAddress(initialAddress);
    setCoordinates(initialCoordinates);
  }, [initialAddress, initialCoordinates]);

  // 카카오 지도 SDK 동적 로드
  const loadKakaoMapSDK = () => {
    return new Promise<void>((resolve, reject) => {
      // 이미 로드되어 있는지 확인
      if (window.kakao && window.kakao.maps) {
        resolve();
        return;
      }

      // 기존 스크립트 태그가 있는지 확인
      const existingScript = document.querySelector('script[src*="dapi.kakao.com"]');
      if (existingScript) {
        // 최대 10초 대기
        let attempts = 0;
        const checkInterval = setInterval(() => {
          attempts++;
          if (window.kakao && window.kakao.maps) {
            clearInterval(checkInterval);
            resolve();
          } else if (attempts >= 20) { // 10초 후 타임아웃
            clearInterval(checkInterval);
            reject(new Error('Kakao Maps SDK load timeout'));
          }
        }, 500);
        return;
      }

      // 새로운 스크립트 태그 생성
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://dapi.kakao.com/v2/maps/sdk.js?appkey=31cd8fd259bf2fd36efa05275dafaee3&libraries=services&autoload=false';
      
      script.onload = () => {
        // kakao.maps.load 호출
        if (window.kakao && window.kakao.maps && window.kakao.maps.load) {
          window.kakao.maps.load(() => {
            resolve();
          });
        } else {
          reject(new Error('Kakao Maps load function not found'));
        }
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Kakao Maps SDK'));
      };
      
      document.head.appendChild(script);
    });
  };

  // 카카오 지도 초기화
  const initializeKakaoMap = async () => {
    try {
      await loadKakaoMapSDK();
      setMapLoaded(true);
    } catch (error) {
      // 3초 후 재시도
      setTimeout(() => {
        initializeKakaoMap();
      }, 3000);
    }
  };

  useEffect(() => {
    initializeKakaoMap();
  }, []);

  // 카카오 지오코딩 함수
  const getCoordinatesFromAddress = async (address: string): Promise<Coordinates | null> => {
    const KAKAO_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY;
    
    if (!KAKAO_API_KEY || KAKAO_API_KEY === 'YOUR_KAKAO_REST_API_KEY') {
      return null;
    }

    try {
      const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `KakaoAK ${KAKAO_API_KEY}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.documents && data.documents.length > 0) {
          const { x: lng, y: lat } = data.documents[0];
          
          const coordinates = {
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            source: 'kakao'
          };
          
          return coordinates;
        }
      }
    } catch (error: any) {
      // 에러 발생 시 조용히 null 반환
    }
    
    return null;
  };

  // 지도에 마커 표시 및 클릭 이벤트 추가
  const displayMapWithMarker = (coords: Coordinates, isEditable: boolean = false) => {
    if (!mapLoaded || !mapRef.current || !window.kakao || !window.kakao.maps) {
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
      position: markerPosition,
      draggable: isEditable // 편집 모드일 때만 드래그 가능
    });

    markerInstance.current.setMap(mapInstance.current);

    // 정보창 생성
    const infoWindow = new window.kakao.maps.InfoWindow({
      content: `
        <div style="padding:10px; min-width:200px;">
          <div style="font-weight:bold; margin-bottom:5px;">${address}</div>
          <div style="font-size:12px; color:#666;">
            위도: ${coords.lat.toFixed(6)}<br>
            경도: ${coords.lng.toFixed(6)}<br>
            출처: ${coords.source || 'manual'}
          </div>
          ${isEditable ? '<div style="font-size:11px; color:#007bff; margin-top:5px;">📍 마커를 드래그하거나 지도를 클릭해서 위치를 조정하세요</div>' : ''}
        </div>
      `
    });

    infoWindow.open(mapInstance.current, markerInstance.current);

    // 편집 모드일 때 마커 드래그 이벤트 추가
    if (isEditable) {
      window.kakao.maps.event.addListener(markerInstance.current, 'dragend', function() {
        const markerPosition = markerInstance.current.getPosition();
        const newCoords = {
          lat: markerPosition.getLat(),
          lng: markerPosition.getLng(),
          source: 'manual'
        };
        
        setCoordinates(newCoords);
        
        // 정보창 업데이트
        infoWindow.setContent(`
          <div style="padding:10px; min-width:200px;">
            <div style="font-weight:bold; margin-bottom:5px;">${address}</div>
            <div style="font-size:12px; color:#666;">
              위도: ${newCoords.lat.toFixed(6)}<br>
              경도: ${newCoords.lng.toFixed(6)}<br>
              출처: 수동 조정
            </div>
            <div style="font-size:11px; color:#007bff; margin-top:5px;">📍 마커를 드래그하거나 지도를 클릭해서 위치를 조정하세요</div>
          </div>
        `);
      });

      // 지도 클릭 시 마커 이동
      window.kakao.maps.event.addListener(mapInstance.current, 'click', function(mouseEvent: any) {
        const latlng = mouseEvent.latLng;
        const newCoords = {
          lat: latlng.getLat(),
          lng: latlng.getLng(),
          source: 'manual'
        };
        
        setCoordinates(newCoords);
        
        // 마커 위치 업데이트
        markerInstance.current.setPosition(latlng);
        
        // 정보창 업데이트
        infoWindow.setContent(`
          <div style="padding:10px; min-width:200px;">
            <div style="font-weight:bold; margin-bottom:5px;">${address}</div>
            <div style="font-size:12px; color:#666;">
              위도: ${newCoords.lat.toFixed(6)}<br>
              경도: ${newCoords.lng.toFixed(6)}<br>
              출처: 수동 조정
            </div>
            <div style="font-size:11px; color:#007bff; margin-top:5px;">📍 마커를 드래그하거나 지도를 클릭해서 위치를 조정하세요</div>
          </div>
        `);
      });
    }
  };

  // 위치 편집 시작
  const startLocationEdit = () => {
    if (coordinates) {
      setOriginalCoordinates({ ...coordinates });
      setIsEditingLocation(true);
      setTimeout(() => {
        if (coordinates) {
          displayMapWithMarker(coordinates, true);
        }
      }, 100);
    }
  };

  // 위치 편집 완료
  const finishLocationEdit = () => {
    setIsEditingLocation(false);
    if (coordinates) {
      // 부모 컴포넌트에 업데이트된 좌표 전달
      const addressData: AddressData = {
        zonecode: '',
        roadAddress: address,
        jibunAddress: '',
        buildingName: '',
        sido: '',
        sigungu: '',
        bname: ''
      };
      
      onAddressSelect({
        address,
        coordinates,
        addressData
      });
      
      // 편집 모드가 아닌 일반 지도로 다시 표시
      setTimeout(() => {
        if (coordinates) {
          displayMapWithMarker(coordinates, false);
        }
      }, 100);
    }
  };

  // 위치 편집 취소
  const cancelLocationEdit = () => {
    if (originalCoordinates) {
      setCoordinates(originalCoordinates);
      setIsEditingLocation(false);
      setTimeout(() => {
        if (originalCoordinates) {
          displayMapWithMarker(originalCoordinates, false);
        }
      }, 100);
    }
  };

  // 다음 우편번호 서비스 임베드 초기화
  useEffect(() => {
    if (showModal && typeof window !== 'undefined' && window.daum && window.daum.Postcode) {
      const container = document.getElementById('daum-postcode-container');
      if (container) {
        // 기존 내용 클리어
        container.innerHTML = '';
        
        new window.daum.Postcode({
          oncomplete: async function(data: any) {
            setLoading(true);
            
            const fullAddress = data.roadAddress || data.jibunAddress;
            const addressData: AddressData = {
              zonecode: data.zonecode,
              roadAddress: data.roadAddress,
              jibunAddress: data.jibunAddress,
              buildingName: data.buildingName,
              sido: data.sido,
              sigungu: data.sigungu,
              bname: data.bname
            };

            setAddress(fullAddress);

            // 좌표 변환 시도
            const coords = await getCoordinatesFromAddress(fullAddress);
            setCoordinates(coords);

            // 지도는 사용자가 원할 때만 표시 (자동 표시 안 함)

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
      }
    }
  }, [showModal, onAddressSelect]);

  const openAddressModal = () => {
    if (typeof window === 'undefined' || !window.daum || !window.daum.Postcode) {
      alert('주소 검색 서비스를 불러올 수 없습니다. 페이지를 새로고침해주세요.');
      return;
    }
    setShowModal(true);
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
                <MapPin className="h-4 w-4" />
                <span className="text-sm font-medium">좌표 정보</span>
                {coordinates.source && (
                  <span className="text-xs bg-green-200 px-2 py-1 rounded">
                    {coordinates.source === 'manual' ? '수동 조정' : coordinates.source}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    if (!mapLoaded) {
                      initializeKakaoMap();
                    } else {
                      setShowMap(!showMap);
                      if (!showMap && coordinates) {
                        setTimeout(() => displayMapWithMarker(coordinates, false), 100);
                      }
                    }
                  }}
                  className="flex items-center space-x-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200"
                >
                  <Map className="h-3 w-3" />
                  <span>
                    {!mapLoaded ? '지도 로드' : showMap ? '지도 숨기기' : '지도 보기'}
                  </span>
                </button>
                <a
                  href={`https://map.kakao.com/link/map/${encodeURIComponent(address)},${coordinates.lat},${coordinates.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200"
                >
                  <MapPin className="h-3 w-3" />
                  <span>카카오맵에서 보기</span>
                </a>
                {showMap && mapLoaded && !isEditingLocation && (
                  <button
                    onClick={startLocationEdit}
                    className="flex items-center space-x-1 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded hover:bg-orange-200"
                  >
                    <Edit3 className="h-3 w-3" />
                    <span>위치 수정</span>
                  </button>
                )}
              </div>
            </div>
            <div className="mt-1 text-sm text-green-700">
              위도: {coordinates.lat.toFixed(6)}, 경도: {coordinates.lng.toFixed(6)}
            </div>
            {!mapLoaded && (
              <div className="mt-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                💡 "지도 로드" 버튼을 클릭하거나 "카카오맵에서 보기"로 위치를 확인할 수 있습니다
              </div>
            )}
            {isEditingLocation && (
              <div className="mt-2 flex items-center space-x-2">
                <div className="flex-1 text-xs text-orange-700 bg-orange-50 px-2 py-1 rounded">
                  💡 지도를 클릭하거나 마커를 드래그해서 정확한 위치로 조정하세요
                </div>
                <button
                  onClick={finishLocationEdit}
                  className="flex items-center space-x-1 text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                >
                  <Check className="h-3 w-3" />
                  <span>완료</span>
                </button>
                <button
                  onClick={cancelLocationEdit}
                  className="flex items-center space-x-1 text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>취소</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* 지도 표시 */}
        {showMap && (
          <div className="border border-gray-300 rounded-md overflow-hidden">
            <div className="bg-gray-100 px-3 py-2 border-b border-gray-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">위치 확인</span>
                  {isEditingLocation && (
                    <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded">
                      편집 모드
                    </span>
                  )}
                </div>
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
              style={{ width: '100%', height: '400px' }}
              className="bg-gray-100"
            >
              {!mapLoaded ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <div className="text-gray-500 text-sm">카카오 지도 SDK를 로드하는 중...</div>
                  <div className="text-xs text-gray-400 text-center px-4">
                    네트워크 상태에 따라 시간이 걸릴 수 있습니다
                  </div>
                </div>
              ) : coordinates ? (
                // 지도가 로드되면 displayMapWithMarker가 호출됨
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500 text-sm">지도를 초기화하는 중...</div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500 text-sm">좌표 정보가 없습니다</div>
                </div>
              )}
            </div>
            {isEditingLocation && (
              <div className="bg-orange-50 px-3 py-2 border-t border-orange-200">
                <div className="text-xs text-orange-700">
                  <strong>사용법:</strong> 지도를 클릭하거나 📍 마커를 드래그해서 정확한 위치로 조정한 후 "완료" 버튼을 눌러주세요.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 주소 검색 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div 
              className="fixed inset-0 bg-gray-600 bg-opacity-75" 
              onClick={() => setShowModal(false)} 
            />
            
            <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">주소 검색</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-4">
                <div 
                  id="daum-postcode-container" 
                  style={{ width: '100%', height: '400px' }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
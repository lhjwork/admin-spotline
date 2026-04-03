declare global {
  interface DaumPostcodeData {
    zonecode: string;
    roadAddress: string;
    jibunAddress: string;
    buildingName: string;
    sido: string;
    sigungu: string;
    bname: string;
    roadAddressEnglish?: string;
    jibunAddressEnglish?: string;
  }

  interface DaumPostcode {
    embed: (container: HTMLElement) => void;
  }

  interface DaumPostcodeConstructor {
    new (options: {
      oncomplete: (data: DaumPostcodeData) => void;
      width: string;
      height: string;
    }): DaumPostcode;
  }

  interface KakaoLatLng {
    getLat(): number;
    getLng(): number;
  }

  interface KakaoMarker {
    setMap(map: KakaoMap | null): void;
    setPosition(position: KakaoLatLng): void;
    getPosition(): KakaoLatLng;
  }

  interface KakaoInfoWindow {
    open(map: KakaoMap, marker: KakaoMarker): void;
    setContent(content: string): void;
  }

  interface KakaoMap {
    setCenter(latlng: KakaoLatLng): void;
  }

  interface KakaoGeocoder {
    addressSearch(
      address: string,
      callback: (result: Array<{ x: string; y: string }>, status: string) => void
    ): void;
  }

  interface KakaoMaps {
    load: (callback: () => void) => void;
    Map: new (container: HTMLElement, options: { center: KakaoLatLng; level: number }) => KakaoMap;
    LatLng: new (lat: number, lng: number) => KakaoLatLng;
    Marker: new (options: { position: KakaoLatLng; draggable?: boolean }) => KakaoMarker;
    InfoWindow: new (options: { content: string }) => KakaoInfoWindow;
    event: {
      addListener: (
        target: KakaoMap | KakaoMarker,
        type: string,
        handler: (event?: { latLng: KakaoLatLng }) => void
      ) => void;
    };
    services: {
      Geocoder: new () => KakaoGeocoder;
      Status: {
        OK: string;
      };
    };
  }

  interface Window {
    daum: {
      Postcode: DaumPostcodeConstructor;
    };
    kakao: {
      maps: KakaoMaps;
    };
  }
}

export {};

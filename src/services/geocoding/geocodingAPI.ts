import axios from 'axios';

// 🗺️ 지오코딩 API (주소 검색)
export const geocodingAPI = {
  searchAddress: async (query: string) => {
    const KAKAO_API_KEY = import.meta.env['VITE_KAKAO_REST_API_KEY'];
    
    if (!KAKAO_API_KEY || KAKAO_API_KEY === 'YOUR_KAKAO_REST_API_KEY') {
      console.warn('Kakao API key not configured, using mock data');
      return {
        data: {
          documents: [
            {
              address_name: `${query} 검색 결과 (목 데이터)`,
              x: "126.9780",
              y: "37.5665"
            }
          ]
        }
      };
    }
    
    try {
      const response = await axios.get(
        'https://dapi.kakao.com/v2/local/search/address.json',
        {
          params: { query },
          headers: {
            Authorization: `KakaoAK ${KAKAO_API_KEY}`
          }
        }
      );
      return response;
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  }
};
import { storeAPI } from '../stores/storeAPI';
import { ApiResponseType } from '../base/types';
import type { Store } from '../../types';

// 🎪 데모 시스템 관리 API
export const demoAPI = {
  // 데모 매장 관리 - demo_ 접두사 필터링
  getDemoStores: (): ApiResponseType<{ stores: Store[]; total: number; system: string }> => 
    storeAPI.getStores({ limit: 1000 }).then(response => {
      const allStores = response.data.data?.stores || [];
      const demoStores = allStores.filter(store => 
        store.qrCode?.id?.startsWith('demo_')
      );
      
      return {
        ...response,
        data: {
          ...response.data,
          data: {
            stores: demoStores,
            total: demoStores.length,
            system: 'demo'
          }
        }
      };
    }),
  
  getDemoStore: (storeId: string): ApiResponseType<Store> => 
    storeAPI.getStore(storeId),
  
  createDemoStore: (data: {
    name: string;
    shortDescription: string;
    representativeImage: string;
    category: string;
    location: {
      address: string;
      coordinates: [number, number];
    };
  }): ApiResponseType<Store> => {
    // QR 코드에 demo_ 접두사 자동 추가
    const storeData = {
      ...data,
      location: {
        address: data.location.address,
        coordinates: {
          type: "Point" as const,
          coordinates: data.location.coordinates
        },
        area: "데모"
      },
      description: data.shortDescription,
      qrCode: {
        id: `demo_${Date.now().toString().slice(-8)}`,
        isActive: true
      },
      isActive: true
    };
    return storeAPI.createStore(storeData as any);
  },
  
  updateDemoStore: (storeId: string, data: Partial<Store>): ApiResponseType<Store> => 
    storeAPI.updateStore(storeId, data),
  
  deleteDemoStore: (storeId: string): ApiResponseType<void> => 
    storeAPI.deleteStore(storeId),
  
  // 데모 추천 관리 - 임시 목 데이터
  getDemoRecommendations: (): ApiResponseType<{ recommendations: any[] }> => 
    Promise.resolve({
      data: {
        success: true,
        message: "데모 추천 목록을 성공적으로 가져왔습니다.",
        data: {
          recommendations: [
            {
              id: "demo-rec-1",
              name: "달콤한 디저트 카페",
              shortDescription: "커피 후 달콤한 디저트는 어떠세요?",
              category: "dessert",
              distance: 150,
              walkingTime: 2,
              representativeImage: "https://images.unsplash.com/photo-1551024506-0bccd828d307"
            },
            {
              id: "demo-rec-2",
              name: "조용한 독서 공간",
              shortDescription: "책과 함께하는 여유로운 시간",
              category: "culture",
              distance: 200,
              walkingTime: 3,
              representativeImage: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570"
            },
            {
              id: "demo-rec-3",
              name: "아트 갤러리",
              shortDescription: "예술 작품을 감상하며 영감을 얻어보세요",
              category: "culture",
              distance: 300,
              walkingTime: 4,
              representativeImage: "https://images.unsplash.com/photo-1541961017774-22349e4a1262"
            },
            {
              id: "demo-rec-4",
              name: "루프탑 카페",
              shortDescription: "도시 전망을 즐기며 커피 한 잔",
              category: "cafe",
              distance: 250,
              walkingTime: 3,
              representativeImage: "https://images.unsplash.com/photo-1554118811-1e0d58224f24"
            }
          ]
        }
      }
    } as any),
  
  createDemoRecommendation: (data: {
    name: string;
    shortDescription: string;
    category: string;
    distance: number;
    walkingTime: number;
    representativeImage: string;
  }): ApiResponseType<any> => 
    Promise.resolve({
      data: {
        success: true,
        message: "데모 추천이 생성되었습니다.",
        data: { id: `demo-rec-${Date.now()}`, ...data }
      }
    } as any),
  
  updateDemoRecommendation: (_recommendationId: string, data: any): ApiResponseType<any> => 
    Promise.resolve({
      data: {
        success: true,
        message: "데모 추천이 수정되었습니다.",
        data: { id: `demo-rec-${Date.now()}`, ...data }
      }
    } as any),
  
  deleteDemoRecommendation: (_recommendationId: string): ApiResponseType<void> => 
    Promise.resolve({
      data: {
        success: true,
        message: "데모 추천이 삭제되었습니다."
      }
    } as any),
  
  // 데모 설정 관리
  getDemoSettings: (): ApiResponseType<{
    isEnabled: boolean;
    loadingSimulationMs: number;
    version: string;
    lastUpdated: string;
  }> => 
    Promise.resolve({
      data: {
        success: true,
        message: "데모 시스템 설정을 성공적으로 가져왔습니다.",
        data: {
          isEnabled: true,
          loadingSimulationMs: 500,
          version: "2.0",
          lastUpdated: new Date().toISOString()
        }
      }
    } as any),
  
  updateDemoSettings: (settings: {
    isEnabled?: boolean;
    loadingSimulationMs?: number;
  }): ApiResponseType<any> => 
    Promise.resolve({
      data: {
        success: true,
        message: "데모 시스템 설정이 업데이트되었습니다.",
        data: settings
      }
    } as any)
};
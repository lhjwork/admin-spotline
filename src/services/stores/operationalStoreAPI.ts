import { storeAPI } from './storeAPI';
import { ApiResponseType, BaseFilters } from '../base/types';
import type { Store } from '../../types';

// 🏪 운영 매장 API (real_ 접두사 필터링)
export const operationalStoreAPI = {
  getStores: (params: BaseFilters & { 
    area?: string; 
    active?: boolean;
    status?: string;
  } = {}): ApiResponseType<{ stores: Store[]; pagination: any }> => 
    storeAPI.getStores({ ...params, limit: 1000 }).then(response => {
      const allStores = response.data.data?.stores || [];
      const operationalStores = allStores.filter(store => 
        store.qrCode?.id?.startsWith('real_')
      );
      
      // 페이지네이션 재계산
      const page = params.page || 1;
      const limit = params.limit || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedStores = operationalStores.slice(startIndex, endIndex);
      
      return {
        ...response,
        data: {
          ...response.data,
          data: {
            stores: paginatedStores,
            pagination: {
              page,
              limit,
              count: operationalStores.length,
              total: Math.ceil(operationalStores.length / limit)
            }
          }
        }
      };
    }),
  
  getStore: (id: string): ApiResponseType<Store> => 
    storeAPI.getStore(id),
  
  createStore: (data: Omit<Store, "_id" | "createdAt" | "updatedAt">): ApiResponseType<Store> => {
    // QR 코드에 real_ 접두사 자동 추가
    const storeData = {
      ...data,
      qrCode: {
        ...data.qrCode,
        id: data.qrCode?.id || `real_${Date.now().toString().slice(-8)}`,
        isActive: data.qrCode?.isActive !== false
      }
    };
    return storeAPI.createStore(storeData);
  },
  
  updateStore: (id: string, data: Partial<Store>): ApiResponseType<Store> => 
    storeAPI.updateStore(id, data),
  
  deleteStore: (id: string): ApiResponseType<void> => 
    storeAPI.deleteStore(id),
  
  toggleStatus: (id: string, isActive: boolean): ApiResponseType<Store> => 
    storeAPI.toggleStatus(id, isActive)
};
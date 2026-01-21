import { apiClient } from '../base/apiClient';
import { storeAPI } from '../stores/storeAPI';
import { ApiResponseType } from '../base/types';
import type { ExperienceResult, ExperienceConfig, SpotlineStore } from '../../types';

// 🚀 SpotLine 시작 설정 API
export const spotlineStartAPI = {
  getConfigs: (): ApiResponseType<ExperienceConfig[]> => {
    // 임시 목 데이터 - 실제 API 구현 시 교체
    return Promise.resolve({
      data: {
        success: true,
        data: [
          {
            id: "config1",
            name: "기본 시작 설정",
            type: "random",
            targetStores: ["store1", "store2", "store3"],
            isActive: true,
            createdAt: new Date().toISOString()
          }
        ]
      }
    } as any);
  },
  
  createConfig: (data: Omit<ExperienceConfig, "_id" | "createdAt" | "updatedAt" | "usageCount">): ApiResponseType<ExperienceConfig> => {
    return apiClient.post("/api/admin/experience-configs", data);
  },
  
  updateConfig: (id: string, data: Partial<ExperienceConfig>): ApiResponseType<ExperienceConfig> => 
    apiClient.put(`/api/admin/experience-configs/${id}`, data),
  
  deleteConfig: (id: string): ApiResponseType<void> => 
    apiClient.delete(`/api/admin/experience-configs/${id}`),
  
  getAvailableStores: (): ApiResponseType<{ stores: any[]; pagination: any }> => 
    storeAPI.getStores({ limit: 1000 })
};

// SpotLine 체험 API (VERSION002 호환성 유지)
export const experienceAPI = {
  getExperience: (): ApiResponseType<ExperienceResult> => 
    apiClient.get("/api/experience"),
  
  getSpotlineStore: (qrId: string): ApiResponseType<SpotlineStore> => 
    apiClient.get(`/api/stores/spotline/${qrId}`)
};

// 체험 설정 관리 API (관리자용)
export const experienceConfigAPI = {
  getConfigs: (): ApiResponseType<ExperienceConfig[]> => 
    apiClient.get("/api/admin/experience-configs"),
  
  getDefaultConfig: (): ApiResponseType<ExperienceConfig> => 
    apiClient.get("/api/admin/experience-configs/default"),
  
  createConfig: (data: Omit<ExperienceConfig, "_id" | "createdAt" | "updatedAt" | "usageCount">): ApiResponseType<ExperienceConfig> =>
    apiClient.post("/api/admin/experience-configs", data),
  
  updateConfig: (id: string, data: Partial<ExperienceConfig>): ApiResponseType<ExperienceConfig> => 
    apiClient.put(`/api/admin/experience-configs/${id}`, data),
  
  deleteConfig: (id: string): ApiResponseType<void> => 
    apiClient.delete(`/api/admin/experience-configs/${id}`),
  
  previewConfig: (id: string, testCount: number = 10): ApiResponseType<{ results: ExperienceResult[] }> =>
    apiClient.get(`/api/admin/experience-configs/${id}/preview?testCount=${testCount}`),
  
  setAsDefault: (id: string): ApiResponseType<ExperienceConfig> => 
    apiClient.patch(`/api/admin/experience-configs/${id}/set-default`)
};
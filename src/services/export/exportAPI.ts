import { apiClient } from '../base/apiClient';

// 📤 데이터 내보내기 API
export const exportAPI = {
  exportData: (type: string, format: string, params: Record<string, any> = {}) =>
    apiClient.get("/api/admin/export", {
      params: { type, format, ...params },
      responseType: "blob",
    })
};
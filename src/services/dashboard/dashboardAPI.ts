import { systemAPI } from '../system/systemAPI';
import { ApiResponseType } from '../base/types';

// 📊 대시보드 API (통합 통계)
export const dashboardAPI = {
  getStats: async (): ApiResponseType<any> => {
    try {
      const [systemStats, systemHealth] = await Promise.all([
        systemAPI.getSystemStats(),
        systemAPI.getSystemHealth()
      ]);
      
      return {
        data: {
          success: true,
          data: {
            ...systemStats.data.data,
            health: systemHealth.data.data
          }
        }
      } as any;
    } catch (error) {
      console.error('Dashboard stats error:', error);
      throw error;
    }
  }
};
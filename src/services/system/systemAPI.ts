import { ApiResponseType } from '../base/types';

// 🖥️ 시스템 관리 API
export const systemAPI = {
  getSystemHealth: (): ApiResponseType<{
    status: string;
    timestamp: string;
    systems: {
      demo: string;
      live: string;
      admin: string;
    };
    admin: {
      adminId: string;
      type: string;
    };
  }> => 
    Promise.resolve({
      data: {
        success: true,
        message: "시스템 상태를 성공적으로 가져왔습니다.",
        data: {
          status: "healthy",
          timestamp: new Date().toISOString(),
          systems: {
            demo: "active",
            live: "preparing",
            admin: "active"
          },
          admin: {
            adminId: localStorage.getItem('admin_data') ? 
              JSON.parse(localStorage.getItem('admin_data') || '{}').id || 'unknown' : 'unknown',
            type: "super_admin"
          }
        }
      }
    } as any),
  
  getSystemStats: (): ApiResponseType<{
    demo: {
      stores: number;
      recommendations: number;
      lastUpdated: string;
    };
    live: {
      stores: number;
      activeStores: number;
      pendingStores: number;
      totalViews: number;
      totalQRScans: number;
      lastUpdated: string;
    };
    admin: {
      totalAdmins: number;
      lastLogin: string;
      currentAdmin: string;
    };
  }> => 
    Promise.resolve({
      data: {
        success: true,
        message: "시스템 통계를 성공적으로 가져왔습니다.",
        data: {
          demo: {
            stores: 4,
            recommendations: 4,
            lastUpdated: new Date().toISOString()
          },
          live: {
            stores: 0,
            activeStores: 0,
            pendingStores: 0,
            totalViews: 0,
            totalQRScans: 0,
            lastUpdated: new Date().toISOString()
          },
          admin: {
            totalAdmins: 1,
            lastLogin: new Date().toISOString(),
            currentAdmin: localStorage.getItem('admin_data') ? 
              JSON.parse(localStorage.getItem('admin_data') || '{}').username || 'spotline-admin' : 'spotline-admin'
          }
        }
      }
    } as any)
};
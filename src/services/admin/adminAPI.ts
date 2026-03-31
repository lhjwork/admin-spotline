import { legacyApiClient as apiClient } from '../base/apiClient';
import { ApiResponseType, PaginationParams } from '../base/types';
import type { Admin } from '../../types';

// 로컬 관리자 데이터 (백엔드 미연결 시 폴백)
function getLocalAdmins(): Admin[] {
  const stored = localStorage.getItem("admin_data");
  if (!stored) return [];
  try {
    const current = JSON.parse(stored) as Admin;
    return [
      {
        ...current,
        createdAt: current.createdAt || "2024-01-01T00:00:00Z",
        lastLogin: new Date().toISOString(),
      },
    ];
  } catch {
    return [];
  }
}

// 🏢 Admin 관리 API
export const adminAPI = {
  getProfile: (): ApiResponseType<Admin> =>
    apiClient.get("/api/admin/profile"),

  getAdminList: async (params: PaginationParams & {
    role?: string;
    isActive?: boolean;
  } = {}): ApiResponseType<{ admins: Admin[]; pagination: any }> => {
    try {
      const queryParams = {
        page: params.page || 1,
        limit: params.limit || 20,
        ...(params.role && { role: params.role }),
        ...(params.isActive !== undefined && { isActive: params.isActive })
      };
      return await apiClient.get("/api/admin/list", { params: queryParams });
    } catch {
      // 백엔드 미연결 시 로컬 데이터 폴백
      const admins = getLocalAdmins();
      return {
        data: {
          success: true,
          message: "로컬 데이터",
          data: {
            admins,
            pagination: { page: 1, limit: 20, total: admins.length, count: admins.length },
          },
        },
        status: 200,
        statusText: "OK",
        headers: {},
        config: {} as any,
      } as any;
    }
  },

  updatePermissions: (adminId: string, permissions: { role: string; isActive: boolean }): ApiResponseType<Admin> =>
    apiClient.patch(`/api/admin/${adminId}/permissions`, permissions),

  createAdmin: (adminData: Partial<Admin> & { password: string }): ApiResponseType<Admin> =>
    apiClient.post("/api/admin/create", adminData)
};

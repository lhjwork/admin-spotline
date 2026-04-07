import { apiClient } from "../base/apiClient";
import type { UserAdminItem, SpringPage } from "../../types/v2";

export interface UserListParams {
  page?: number; // 1-indexed (UI 기준)
  size?: number;
  status?: string;
  keyword?: string;
}

export const userAPI = {
  getList: (params: UserListParams = {}) => {
    const { page = 1, size = 20, ...rest } = params;
    return apiClient.get<SpringPage<UserAdminItem>>("/api/v2/admin/users", {
      params: { page: page - 1, size, ...rest },
    });
  },

  suspend: (userId: string, reason: string) =>
    apiClient.patch<UserAdminItem>(`/api/v2/admin/users/${userId}/suspend`, { reason }),

  unsuspend: (userId: string) =>
    apiClient.patch<UserAdminItem>(`/api/v2/admin/users/${userId}/unsuspend`),
};

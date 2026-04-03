import { apiClient } from "../base/apiClient";
import type { SpringPage } from "../../types/v2";

export interface ReportResponse {
  id: string;
  reporterUserId: string;
  targetType: string;
  targetId: string;
  targetContent: string | null;
  targetUserName: string | null;
  reason: "SPAM" | "INAPPROPRIATE" | "HARASSMENT" | "OTHER";
  description: string | null;
  status: "PENDING" | "RESOLVED" | "DISMISSED";
  action: "HIDE_CONTENT" | "DISMISS" | null;
  moderatorNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export const reportAPI = {
  getList: (params: { status?: string; page?: number; size?: number } = {}) => {
    const { page = 1, size = 20, ...rest } = params;
    return apiClient.get<SpringPage<ReportResponse>>("/api/v2/admin/reports", {
      params: { page: page - 1, size, ...rest },
    });
  },

  getPendingCount: () =>
    apiClient.get<{ count: number }>("/api/v2/admin/reports/pending-count"),

  resolve: (id: string, data: { action: "HIDE_CONTENT" | "DISMISS"; moderatorNote?: string }) =>
    apiClient.put<ReportResponse>(`/api/v2/admin/reports/${id}/resolve`, data),
};

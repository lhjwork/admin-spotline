import { apiClient } from "../base/apiClient";
import type {
  PartnerDetailResponse,
  CreatePartnerRequest,
  UpdatePartnerRequest,
  PartnerQRCodeResponse,
  PartnerAnalyticsResponse,
  PartnerStatus,
  SpringPage,
} from "../../types/v2";

export interface PartnerListParams {
  page?: number; // 1-indexed (UI 기준)
  size?: number;
  status?: PartnerStatus;
  search?: string;
}

export const partnerAPI = {
  getList: (params: PartnerListParams = {}) => {
    const { page = 1, size = 20, ...rest } = params;
    return apiClient.get<SpringPage<PartnerDetailResponse>>("/api/v2/admin/partners", {
      params: { page: page - 1, size, ...rest },
    });
  },

  getById: (id: string) =>
    apiClient.get<PartnerDetailResponse>(`/api/v2/admin/partners/${id}`),

  create: (data: CreatePartnerRequest) =>
    apiClient.post<PartnerDetailResponse>("/api/v2/admin/partners", data),

  update: (id: string, data: UpdatePartnerRequest) =>
    apiClient.patch<PartnerDetailResponse>(`/api/v2/admin/partners/${id}`, data),

  terminate: (id: string) =>
    apiClient.delete(`/api/v2/admin/partners/${id}`),

  // QR 코드
  createQRCode: (partnerId: string, label: string) =>
    apiClient.post<PartnerQRCodeResponse>(`/api/v2/admin/partners/${partnerId}/qr-codes`, { label }),

  getQRCodes: (partnerId: string) =>
    apiClient.get<PartnerQRCodeResponse[]>(`/api/v2/admin/partners/${partnerId}/qr-codes`),

  deactivateQRCode: (partnerId: string, qrCodeId: string) =>
    apiClient.patch(`/api/v2/admin/partners/${partnerId}/qr-codes/${qrCodeId}`, { isActive: false }),

  deleteQRCode: (partnerId: string, qrCodeId: string) =>
    apiClient.delete(`/api/v2/admin/partners/${partnerId}/qr-codes/${qrCodeId}`),

  // 분석
  getAnalytics: (partnerId: string, period: string = "30d") =>
    apiClient.get<PartnerAnalyticsResponse>(`/api/v2/admin/partners/${partnerId}/analytics`, {
      params: { period },
    }),
};

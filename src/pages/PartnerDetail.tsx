import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Store, Edit2, Pause, Trash2 } from "lucide-react";
import { partnerAPI } from "../services/v2/partnerAPI";
import type { PartnerStatus } from "../types/v2";
import QRCodeManager from "../components/QRCodeManager";
import PartnerAnalytics from "../components/PartnerAnalytics";

const statusLabels: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "활성", color: "bg-green-100 text-green-700" },
  PAUSED: { label: "일시정지", color: "bg-yellow-100 text-yellow-700" },
  TERMINATED: { label: "해지", color: "bg-red-100 text-red-700" },
};

const tabs = ["정보", "QR 코드", "분석"] as const;
type Tab = (typeof tabs)[number];

export default function PartnerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("정보");

  const { data: partner, isLoading } = useQuery({
    queryKey: ["partner", id],
    queryFn: () => partnerAPI.getById(id!),
    select: (res) => res.data,
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (status: PartnerStatus) => partnerAPI.update(id!, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["partner", id] }),
  });

  const terminateMutation = useMutation({
    mutationFn: () => partnerAPI.terminate(id!),
    onSuccess: () => navigate("/partners"),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-64 animate-pulse rounded-lg bg-gray-100" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">파트너를 찾을 수 없습니다.</p>
        <button onClick={() => navigate("/partners")} className="mt-2 text-sm text-primary-600">
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  const status = statusLabels[partner.status] ?? { label: "활성", color: "bg-green-100 text-green-700" };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/partners")}
          className="mb-2 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          파트너 관리
        </button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: partner.brandColor }}
            >
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{partner.spotTitle}</h1>
              <p className="text-sm text-gray-500">{partner.spotArea}</p>
            </div>
            <span className={`ml-2 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}>
              {status.label}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/partners/${id}/edit`)}
              className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Edit2 className="h-3.5 w-3.5" />
              수정
            </button>
            {partner.status === "ACTIVE" && (
              <button
                onClick={() => updateMutation.mutate("PAUSED")}
                className="flex items-center gap-1 rounded-lg border border-yellow-300 px-3 py-1.5 text-sm text-yellow-700 hover:bg-yellow-50"
              >
                <Pause className="h-3.5 w-3.5" />
                일시정지
              </button>
            )}
            {partner.status === "PAUSED" && (
              <button
                onClick={() => updateMutation.mutate("ACTIVE")}
                className="flex items-center gap-1 rounded-lg border border-green-300 px-3 py-1.5 text-sm text-green-700 hover:bg-green-50"
              >
                재활성화
              </button>
            )}
            {partner.status !== "TERMINATED" && (
              <button
                onClick={() => {
                  if (window.confirm("파트너를 해지하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
                    terminateMutation.mutate();
                  }
                }}
                className="flex items-center gap-1 rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                해지
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 pb-3 text-sm font-medium ${
                activeTab === tab
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
              {tab === "QR 코드" && ` (${partner.qrCodes.length})`}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === "정보" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-500">계약 정보</h3>
            <dl className="space-y-2">
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">등급</dt>
                <dd className="font-medium text-gray-900">{partner.tier}</dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">계약 시작</dt>
                <dd className="font-medium text-gray-900">{partner.contractStartDate}</dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">계약 종료</dt>
                <dd className="font-medium text-gray-900">{partner.contractEndDate || "무기한"}</dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">총 스캔</dt>
                <dd className="font-medium text-gray-900">{partner.totalScans.toLocaleString()}회</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-500">브랜딩</h3>
            <dl className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <dt className="text-gray-500">브랜딩 컬러</dt>
                <dd className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded" style={{ backgroundColor: partner.brandColor }} />
                  <span className="font-mono text-gray-900">{partner.brandColor}</span>
                </dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">혜택</dt>
                <dd className="font-medium text-gray-900">{partner.benefitText || "없음"}</dd>
              </div>
              {partner.note && (
                <div className="text-sm">
                  <dt className="text-gray-500">메모</dt>
                  <dd className="mt-1 text-gray-700">{partner.note}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      )}

      {activeTab === "QR 코드" && (
        <QRCodeManager partnerId={partner.id} qrCodes={partner.qrCodes} />
      )}

      {activeTab === "분석" && (
        <PartnerAnalytics partnerId={partner.id} />
      )}
    </div>
  );
}

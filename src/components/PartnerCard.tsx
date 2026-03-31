import { Store, QrCode, BarChart3 } from "lucide-react";
import type { PartnerDetailResponse } from "../types/v2";

const statusLabels: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "활성", color: "bg-green-100 text-green-700" },
  PAUSED: { label: "일시정지", color: "bg-yellow-100 text-yellow-700" },
  TERMINATED: { label: "해지", color: "bg-red-100 text-red-700" },
};

const tierLabels: Record<string, string> = {
  BASIC: "Basic",
  PREMIUM: "Premium",
};

interface PartnerCardProps {
  partner: PartnerDetailResponse;
  onClick: () => void;
}

export default function PartnerCard({ partner, onClick }: PartnerCardProps) {
  const status = statusLabels[partner.status] || statusLabels.ACTIVE;
  const activeQrCount = partner.qrCodes.filter((qr) => qr.isActive).length;

  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: partner.brandColor }}
          >
            <Store className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{partner.spotTitle}</h3>
            <p className="text-sm text-gray-500">{partner.spotArea}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            {tierLabels[partner.tier] || partner.tier}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <QrCode className="h-3.5 w-3.5" />
          QR {activeQrCount}개
        </span>
        <span className="flex items-center gap-1">
          <BarChart3 className="h-3.5 w-3.5" />
          스캔 {partner.totalScans.toLocaleString()}회
        </span>
        <span>계약: {partner.contractStartDate} ~</span>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Store, Gift } from "lucide-react";
import { partnerAPI } from "../services/v2/partnerAPI";
import type { CreatePartnerRequest } from "../types/v2";
import PartnerForm from "../components/PartnerForm";

export default function PartnerRegistration() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (data: CreatePartnerRequest) => partnerAPI.create(data),
    onSuccess: (res) => {
      navigate(`/partners/${res.data.id}`);
    },
    onError: (err: { message?: string }) => {
      setError(err.message || "파트너 등록에 실패했습니다.");
    },
  });

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => navigate("/partners")}
          className="mb-2 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          파트너 관리
        </button>
        <h1 className="text-2xl font-bold text-gray-900">파트너 등록</h1>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left: Form */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <PartnerForm
            onSubmit={(data) => mutation.mutate(data as CreatePartnerRequest)}
            isSubmitting={mutation.isPending}
            error={error}
          />
        </div>

        {/* Right: Preview */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">미리보기</h2>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Store className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-500">파트너 Spot 상세 화면</span>
            </div>
            <div className="mt-3 rounded-lg border p-3" style={{ borderColor: "#6366F130", backgroundColor: "#6366F108" }}>
              <div className="flex items-center gap-2 mb-1">
                <Gift className="h-4 w-4 text-indigo-500" />
                <span className="text-sm font-bold text-gray-900">QR 스캔 고객 혜택</span>
              </div>
              <p className="text-sm text-gray-600">혜택 텍스트가 여기에 표시됩니다</p>
              <p className="mt-2 text-xs text-gray-400">SpotLine 파트너 · since 2026</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

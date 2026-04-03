import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { partnerAPI } from "../services/v2/partnerAPI";
import type { UpdatePartnerRequest } from "../types/v2";
import PartnerForm from "../components/PartnerForm";

export default function PartnerEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: partner, isLoading } = useQuery({
    queryKey: ["partner", id],
    queryFn: () => partnerAPI.getById(id!),
    select: (res) => res.data,
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdatePartnerRequest) => partnerAPI.update(id!, data),
    onSuccess: () => navigate(`/partners/${id}`),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="py-20 text-center text-gray-500">
        파트너를 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <button
        onClick={() => navigate(`/partners/${id}`)}
        className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        {partner.spotTitle}
      </button>

      <h1 className="mb-6 text-2xl font-bold text-gray-900">파트너 정보 수정</h1>

      <PartnerForm
        mode="edit"
        initialData={partner}
        onSubmit={(data) => updateMutation.mutate(data as UpdatePartnerRequest)}
        isSubmitting={updateMutation.isPending}
        error={updateMutation.isError ? "수정에 실패했습니다." : null}
      />
    </div>
  );
}

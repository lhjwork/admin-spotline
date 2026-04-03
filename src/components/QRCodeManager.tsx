import { useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import { Plus, QrCode } from "lucide-react";
import { partnerAPI } from "../services/v2/partnerAPI";
import type { PartnerQRCodeResponse } from "../types/v2";
import QRCodePreview from "./QRCodePreview";

interface QRCodeManagerProps {
  partnerId: string;
  qrCodes: PartnerQRCodeResponse[];
}

export default function QRCodeManager({ partnerId, qrCodes }: QRCodeManagerProps) {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newLabel, setNewLabel] = useState("");

  const createMutation = useMutation({
    mutationFn: (label: string) => partnerAPI.createQRCode(partnerId, label),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner", partnerId] });
      setShowCreate(false);
      setNewLabel("");
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (qrCodeId: string) => partnerAPI.deactivateQRCode(partnerId, qrCodeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner", partnerId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (qrCodeId: string) => partnerAPI.deleteQRCode(partnerId, qrCodeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner", partnerId] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    createMutation.mutate(newLabel.trim());
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <QrCode className="h-5 w-5" />
          QR 코드 관리
        </h3>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          새 QR 생성
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <form onSubmit={handleCreate} className="mb-4 rounded-lg border border-primary-200 bg-primary-50 p-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">QR 코드 라벨</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder='예: "정문", "카운터"'
              autoFocus
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={createMutation.isPending || !newLabel.trim()}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {createMutation.isPending ? "생성 중..." : "생성"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreate(false);
                setNewLabel("");
              }}
              className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100"
            >
              취소
            </button>
          </div>
          {createMutation.isError && (
            <p className="mt-2 text-sm text-red-600">QR 코드 생성에 실패했습니다.</p>
          )}
        </form>
      )}

      {/* QR list */}
      {qrCodes.length > 0 ? (
        <div className="space-y-3">
          {qrCodes.map((qr) => (
            <QRCodePreview
              key={qr.id}
              qrCode={qr}
              onDeactivate={(id) => deactivateMutation.mutate(id)}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 py-8 text-center">
          <QrCode className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-2 text-sm text-gray-500">아직 QR 코드가 없습니다</p>
        </div>
      )}
    </div>
  );
}

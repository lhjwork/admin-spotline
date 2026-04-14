import { X, CheckCircle2, XCircle, Loader2, Clock, RotateCcw } from "lucide-react";
import type { BatchStatus } from "../../types/v2";

interface BulkProgressModalProps {
  isOpen: boolean;
  batches: BatchStatus[];
  onRetry: (batchIndex: number) => void;
  onClose: () => void;
}

export default function BulkProgressModal({ isOpen, batches, onRetry, onClose }: BulkProgressModalProps) {
  if (!isOpen || batches.length === 0) return null;

  const totalItems = batches.reduce((sum, b) => sum + b.items.length, 0);
  const successItems = batches
    .filter((b) => b.status === "success")
    .reduce((sum, b) => sum + (b.successCount ?? b.items.length), 0);
  const failedItems = batches
    .filter((b) => b.status === "failed")
    .reduce((sum, b) => sum + b.items.length, 0);
  const processedItems = successItems + failedItems;

  const isProcessing = batches.some((b) => b.status === "processing");
  const hasFailed = batches.some((b) => b.status === "failed");
  const isComplete = batches.every((b) => b.status === "success" || b.status === "failed");

  const progressPercent = totalItems > 0 ? Math.round((processedItems / totalItems) * 100) : 0;

  const statusIcon = (status: BatchStatus["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "processing":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const statusLabel = (status: BatchStatus["status"]) => {
    switch (status) {
      case "success":
        return "성공";
      case "failed":
        return "실패";
      case "processing":
        return "처리 중...";
      default:
        return "대기";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={isProcessing ? undefined : onClose}
      />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">
            {isComplete ? "일괄 등록 완료" : "일괄 등록 진행 중"}
          </h3>
          {!isProcessing && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* 본문 */}
        <div className="px-5 py-4">
          {/* 진행률 바 */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>전체 진행률</span>
              <span>
                {processedItems}/{totalItems} ({progressPercent}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  hasFailed ? "bg-yellow-500" : "bg-blue-500"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* 배치 목록 */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {batches.map((batch) => (
              <div
                key={batch.batchIndex}
                className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md"
              >
                <div className="flex items-center gap-2">
                  {statusIcon(batch.status)}
                  <span className="text-sm text-gray-700">
                    배치 {batch.batchIndex + 1} ({batch.items.length}개)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{statusLabel(batch.status)}</span>
                  {batch.status === "failed" && (
                    <button
                      onClick={() => onRetry(batch.batchIndex)}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      <RotateCcw className="h-3 w-3" />
                      재시도
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 에러 메시지 */}
          {hasFailed && (
            <div className="mt-3 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-md">
              일부 배치가 실패했습니다. 재시도 버튼을 눌러주세요.
            </div>
          )}
        </div>

        {/* 푸터 */}
        {isComplete && (
          <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-600">
              성공 {successItems}개{failedItems > 0 && `, 실패 ${failedItems}개`}
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700"
            >
              닫기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

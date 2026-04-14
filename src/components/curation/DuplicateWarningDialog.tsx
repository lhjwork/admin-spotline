import { AlertTriangle, X } from "lucide-react";

interface DuplicateWarningDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  duplicatePlace: {
    name: string;
    existingSpotTitle: string;
    existingSpotSlug: string;
  } | null;
}

export default function DuplicateWarningDialog({
  open,
  onClose,
  onConfirm,
  duplicatePlace,
}: DuplicateWarningDialogProps) {
  if (!open || !duplicatePlace) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-5">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              이미 등록된 장소입니다
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              &ldquo;{duplicatePlace.name}&rdquo;은 이미 &ldquo;{duplicatePlace.existingSpotTitle}&rdquo;으로 등록되어 있습니다.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-amber-500 rounded-md hover:bg-amber-600"
          >
            그래도 등록
          </button>
        </div>
      </div>
    </div>
  );
}

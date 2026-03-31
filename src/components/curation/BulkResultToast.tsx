import { useEffect } from "react";
import { CheckCircle, AlertTriangle, XCircle, X } from "lucide-react";

interface BulkResultToastProps {
  total: number;
  success: number;
  onClose: () => void;
}

export default function BulkResultToast({ total, success, onClose }: BulkResultToastProps) {
  const failed = total - success;

  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isAllSuccess = success === total;
  const isAllFailed = success === 0;

  let bgClass: string;
  let Icon: typeof CheckCircle;
  let message: string;

  if (isAllSuccess) {
    bgClass = "bg-green-50 border-green-200 text-green-700";
    Icon = CheckCircle;
    message = `${success}개 Spot이 등록되었습니다`;
  } else if (isAllFailed) {
    bgClass = "bg-red-50 border-red-200 text-red-700";
    Icon = XCircle;
    message = "등록에 실패했습니다";
  } else {
    bgClass = "bg-yellow-50 border-yellow-200 text-yellow-700";
    Icon = AlertTriangle;
    message = `${success}개 성공, ${failed}개 실패`;
  }

  return (
    <div className={`mt-3 flex items-center justify-between border rounded-md px-4 py-3 text-sm ${bgClass}`}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span>{message}</span>
      </div>
      <button onClick={onClose} className="hover:opacity-70">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

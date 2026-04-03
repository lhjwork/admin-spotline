import { useRef, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download } from "lucide-react";
import type { PartnerQRCodeResponse } from "../types/v2";

const QR_BASE_URL = "https://spotline.kr/qr";

interface QRCodePreviewProps {
  qrCode: PartnerQRCodeResponse;
  onDeactivate?: (qrCodeId: string) => void;
  onDelete?: (qrCodeId: string) => void;
}

export default function QRCodePreview({ qrCode, onDeactivate, onDelete }: QRCodePreviewProps) {
  const svgRef = useRef<HTMLDivElement>(null);
  const qrUrl = `${QR_BASE_URL}/${qrCode.qrId}`;

  const downloadSVG = useCallback(() => {
    const svgEl = svgRef.current?.querySelector("svg");
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${qrCode.qrId}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }, [qrCode.qrId]);

  const downloadPNG = useCallback(() => {
    const svgEl = svgRef.current?.querySelector("svg");
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 512, 512);
      ctx.drawImage(img, 0, 0, 512, 512);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `qr-${qrCode.qrId}.png`;
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }, [qrCode.qrId]);

  return (
    <div className="flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-4">
      <div ref={svgRef} className="shrink-0">
        <QRCodeSVG value={qrUrl} size={96} level="M" />
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-gray-900">{qrCode.label}</h4>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              qrCode.isActive
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {qrCode.isActive ? "활성" : "비활성"}
          </span>
        </div>
        <p className="mt-0.5 text-xs font-mono text-gray-400">{qrCode.qrId}</p>
        <p className="mt-1 text-sm text-gray-500">
          스캔 {qrCode.scansCount.toLocaleString()}회 · {qrCode.createdAt.split("T")[0]}
        </p>

        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={downloadSVG}
            className="flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200"
          >
            <Download className="h-3 w-3" />
            SVG
          </button>
          <button
            onClick={downloadPNG}
            className="flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200"
          >
            <Download className="h-3 w-3" />
            PNG
          </button>
          {qrCode.isActive && onDeactivate && (
            <button
              onClick={() => onDeactivate(qrCode.id)}
              className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
            >
              비활성화
            </button>
          )}
          {!qrCode.isActive && onDelete && (
            <button
              onClick={() => {
                if (window.confirm("QR 코드를 삭제하시겠습니까?")) {
                  onDelete(qrCode.id);
                }
              }}
              className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
            >
              삭제
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

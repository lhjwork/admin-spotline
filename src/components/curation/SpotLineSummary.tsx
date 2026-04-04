interface SpotLineSummaryProps {
  spotCount: number;
  totalDistanceM: number;
  totalWalkingMin: number;
  totalStayMin: number;
}

function formatDist(m: number): string {
  if (m === 0) return "0m";
  return m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${m}m`;
}

function formatTime(min: number): string {
  if (min === 0) return "0분";
  if (min < 60) return `${min}분`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
}

export default function SpotLineSummary({
  spotCount,
  totalDistanceM,
  totalWalkingMin,
  totalStayMin,
}: SpotLineSummaryProps) {
  const totalMin = totalWalkingMin + totalStayMin;

  if (spotCount === 0) return null;

  return (
    <div className="bg-blue-50 rounded-lg p-4">
      <h4 className="text-sm font-semibold text-blue-900 mb-2">SpotLine 요약</h4>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-blue-800">
        <span>Spot {spotCount}개</span>
        <span>· 총 {formatDist(totalDistanceM)}</span>
        <span>· 도보 {formatTime(totalWalkingMin)}</span>
        <span>· 체류 {formatTime(totalStayMin)}</span>
      </div>
      <p className="text-xs text-blue-700 mt-1">
        예상 총 소요시간: {formatTime(totalMin)}
      </p>
    </div>
  );
}

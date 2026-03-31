import { AREAS } from "../../constants";

interface AreaHeatmapProps {
  areaCounts: { area: string; count: number }[];
}

function getHeatColor(count: number): string {
  if (count === 0) return "bg-gray-100 text-gray-400";
  if (count <= 5) return "bg-blue-100 text-blue-700";
  if (count <= 20) return "bg-blue-300 text-blue-800";
  return "bg-blue-500 text-white";
}

export default function AreaHeatmap({ areaCounts }: AreaHeatmapProps) {
  const countMap = new Map(areaCounts.map((a) => [a.area, a.count]));

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">지역별 Spot 분포</h3>
      <div className="grid grid-cols-4 gap-2">
        {AREAS.map((area) => {
          const count = countMap.get(area) ?? 0;
          return (
            <div
              key={area}
              className={`rounded-lg p-2 text-center ${getHeatColor(count)}`}
            >
              <p className="text-xs font-medium truncate">{area}</p>
              <p className="text-lg font-bold">{count}</p>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-gray-100" /> 0
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-100" /> 1-5
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-300" /> 6-20
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-500" /> 21+
        </div>
      </div>
    </div>
  );
}

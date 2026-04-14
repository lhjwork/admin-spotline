import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { analyticsAPI, type CreatorProductivity } from "../../services/v2/analyticsAPI";
import { ChevronDown } from "lucide-react";

interface CreatorProductivityTableProps {
  from: Date;
  to: Date;
}

type SortKey = keyof Pick<CreatorProductivity, "spotCount" | "spotLineCount" | "totalViews" | "totalLikes" | "avgViewsPerContent">;

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "spotCount", label: "Spot" },
  { key: "spotLineCount", label: "SpotLine" },
  { key: "totalViews", label: "총 조회수" },
  { key: "totalLikes", label: "총 좋아요" },
  { key: "avgViewsPerContent", label: "평균 조회수" },
];

export default function CreatorProductivityTable({ from, to }: CreatorProductivityTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("totalViews");
  const [sortAsc, setSortAsc] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["creator-productivity", toDateStr(from), toDateStr(to)],
    queryFn: () => analyticsAPI.getCreatorProductivity(toDateStr(from), toDateStr(to)),
  });

  const sorted = data
    ? [...data].sort((a, b) => {
        const diff = (a[sortKey] as number) - (b[sortKey] as number);
        return sortAsc ? diff : -diff;
      })
    : [];

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">크리에이터</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">타입</th>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700"
                onClick={() => handleSort(col.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {sortKey === col.key && <ChevronDown className={`h-3 w-3 ${sortAsc ? "rotate-180" : ""}`} />}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <tr key={i}>
                {[...Array(7)].map((_, j) => (
                  <td key={j} className="px-4 py-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))
          ) : sorted.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                데이터가 없습니다
              </td>
            </tr>
          ) : (
            sorted.map((item) => (
              <tr key={item.creatorId} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.creatorName}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                    item.creatorType === "crew" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                  }`}>
                    {item.creatorType}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{item.spotCount.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{item.spotLineCount.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{item.totalViews.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{item.totalLikes.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{item.avgViewsPerContent.toFixed(1)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function getCreatorProductivityData(data: CreatorProductivity[] | undefined) {
  return data ?? [];
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { analyticsAPI, type ContentPerformance } from "../../services/v2/analyticsAPI";
import { ChevronUp, ChevronDown } from "lucide-react";

interface ContentPerformanceTableProps {
  from: Date;
  to: Date;
}

type SortKey = "views" | "likes" | "saves" | "comments";

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "views", label: "조회수" },
  { key: "likes", label: "좋아요" },
  { key: "saves", label: "저장" },
  { key: "comments", label: "댓글" },
];

export default function ContentPerformanceTable({ from, to }: ContentPerformanceTableProps) {
  const [type, setType] = useState<"spot" | "spotline">("spot");
  const [sort, setSort] = useState<SortKey>("views");

  const { data, isLoading } = useQuery({
    queryKey: ["content-performance", toDateStr(from), toDateStr(to), type, sort],
    queryFn: () => analyticsAPI.getContentPerformance(toDateStr(from), toDateStr(to), type, sort),
  });

  const handleSort = (key: SortKey) => {
    setSort(key);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setType("spot")}
          className={`px-3 py-1.5 text-sm font-medium rounded-md ${
            type === "spot" ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Spot
        </button>
        <button
          onClick={() => setType("spotline")}
          className={`px-3 py-1.5 text-sm font-medium rounded-md ${
            type === "spotline" ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          SpotLine
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">제목</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">지역</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">크리에이터</th>
              {SORT_OPTIONS.map((opt) => (
                <th
                  key={opt.key}
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort(opt.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {opt.label}
                    {sort === opt.key ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronUp className="h-3 w-3 text-gray-300" />
                    )}
                  </span>
                </th>
              ))}
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">생성일</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  {[...Array(8)].map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : !data || data.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">
                  데이터가 없습니다
                </td>
              </tr>
            ) : (
              data.map((item: ContentPerformance) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-[200px] truncate">
                    {item.title}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.area}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.creatorName}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">{item.viewsCount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">{item.likesCount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">{item.savesCount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">{item.commentsCount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-500">
                    {new Date(item.createdAt).toLocaleDateString("ko-KR")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function getContentPerformanceData(data: ContentPerformance[] | undefined) {
  return data ?? [];
}

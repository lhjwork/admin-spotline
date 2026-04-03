import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Users, Percent } from "lucide-react";
import { partnerAPI } from "../services/v2/partnerAPI";

interface PartnerAnalyticsProps {
  partnerId: string;
}

const periods = [
  { value: "7d", label: "7일" },
  { value: "30d", label: "30일" },
  { value: "90d", label: "90일" },
];

export default function PartnerAnalytics({ partnerId }: PartnerAnalyticsProps) {
  const [period, setPeriod] = useState("30d");

  const { data, isLoading } = useQuery({
    queryKey: ["partner-analytics", partnerId, period],
    queryFn: () => partnerAPI.getAnalytics(partnerId, period),
    select: (res) => res.data,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm text-gray-500">분석 데이터를 불러올 수 없습니다.</p>;
  }

  const maxScans = Math.max(...data.dailyTrend.map((d) => d.scans), 1);

  return (
    <div>
      {/* Period selector */}
      <div className="mb-4 flex gap-2">
        {periods.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              period === p.value
                ? "bg-primary-100 text-primary-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <BarChart3 className="h-4 w-4" />
            총 스캔
          </div>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {data.totalScans.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users className="h-4 w-4" />
            방문자
          </div>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {data.uniqueVisitors.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Percent className="h-4 w-4" />
            전환율
          </div>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {(data.conversionRate * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Daily trend chart */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h4 className="mb-3 text-sm font-medium text-gray-700">일별 스캔 추이</h4>
        <div className="flex items-end gap-1" style={{ height: 120 }}>
          {data.dailyTrend.map((d) => (
            <div key={d.date} className="group relative flex-1">
              <div
                className="w-full rounded-t bg-primary-400 transition-colors group-hover:bg-primary-600"
                style={{ height: `${(d.scans / maxScans) * 100}%`, minHeight: d.scans > 0 ? 2 : 0 }}
              />
              <div className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 rounded bg-gray-800 px-2 py-1 text-xs text-white group-hover:block">
                {d.scans}
              </div>
            </div>
          ))}
        </div>
        {data.dailyTrend.length > 0 && (
          <div className="mt-1 flex justify-between text-xs text-gray-400">
            <span>{data.dailyTrend[0]?.date.slice(5)}</span>
            <span>{data.dailyTrend[data.dailyTrend.length - 1]?.date.slice(5)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

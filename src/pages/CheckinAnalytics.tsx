import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Users, MapPin, ShieldCheck } from "lucide-react";
import { analyticsAPI } from "../services/v2/analyticsAPI";
import type { CheckinStats, TopSpotCheckin, CheckinPatternItem } from "../services/v2/analyticsAPI";
import DateRangePicker from "../components/analytics/DateRangePicker";

const DAY_ORDER = ["월", "화", "수", "목", "금", "토", "일"];

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function CheckinAnalytics() {
  const [dateRange, setDateRange] = useState(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);
    return { from, to };
  });

  const fromStr = toDateStr(dateRange.from);
  const toStr = toDateStr(dateRange.to);

  const { data: stats, isLoading: statsLoading } = useQuery<CheckinStats>({
    queryKey: ["checkin-stats", fromStr, toStr],
    queryFn: () => analyticsAPI.getCheckinStats(fromStr, toStr),
  });

  const { data: topSpots, isLoading: topsLoading } = useQuery<TopSpotCheckin[]>({
    queryKey: ["checkin-top-spots"],
    queryFn: () => analyticsAPI.getTopCheckinSpots(10),
  });

  const { data: pattern, isLoading: patternLoading } = useQuery<CheckinPatternItem[]>({
    queryKey: ["checkin-pattern", fromStr, toStr],
    queryFn: () => analyticsAPI.getCheckinPattern(fromStr, toStr),
  });

  const sortedPattern = useMemo(() => {
    if (!pattern) return [];
    return [...pattern].sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day));
  }, [pattern]);

  const maxPatternCount = useMemo(() => {
    return Math.max(...(sortedPattern.map((p) => p.count) || [1]), 1);
  }, [sortedPattern]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">체크인 분석</h1>
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
        />
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          icon={<CheckCircle className="h-5 w-5 text-blue-600" />}
          label="총 체크인"
          value={stats?.totalCheckins ?? 0}
          loading={statsLoading}
        />
        <MetricCard
          icon={<ShieldCheck className="h-5 w-5 text-green-600" />}
          label="GPS 인증률"
          value={stats ? `${stats.verificationRate.toFixed(1)}%` : "0%"}
          sub={stats ? `${stats.verifiedCheckins}건 인증` : undefined}
          loading={statsLoading}
        />
        <MetricCard
          icon={<Users className="h-5 w-5 text-purple-600" />}
          label="활성 유저"
          value={stats?.uniqueUsers ?? 0}
          loading={statsLoading}
        />
        <MetricCard
          icon={<MapPin className="h-5 w-5 text-amber-600" />}
          label="방문 Spot"
          value={stats?.uniqueSpots ?? 0}
          loading={statsLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Spots Table */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">인기 체크인 Spot</h2>
          {topsLoading ? (
            <LoadingSkeleton rows={5} />
          ) : topSpots && topSpots.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-gray-500">
                  <th className="pb-2 font-medium">#</th>
                  <th className="pb-2 font-medium">Spot</th>
                  <th className="pb-2 text-right font-medium">체크인</th>
                  <th className="pb-2 text-right font-medium">인증</th>
                </tr>
              </thead>
              <tbody>
                {topSpots.map((spot, i) => (
                  <tr key={spot.spotId} className="border-b border-gray-50 last:border-0">
                    <td className="py-2.5 text-sm text-gray-400">{i + 1}</td>
                    <td className="py-2.5 text-sm font-medium text-gray-900">{spot.spotTitle}</td>
                    <td className="py-2.5 text-right text-sm text-gray-700">{spot.checkinCount}</td>
                    <td className="py-2.5 text-right text-sm text-green-600">{spot.verifiedCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">데이터가 없습니다</p>
          )}
        </div>

        {/* Day Pattern Chart */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">요일별 체크인 패턴</h2>
          {patternLoading ? (
            <LoadingSkeleton rows={7} />
          ) : sortedPattern.length > 0 ? (
            <div className="space-y-3">
              {sortedPattern.map((item) => (
                <div key={item.day} className="flex items-center gap-3">
                  <span className="w-6 text-center text-sm font-medium text-gray-600">{item.day}</span>
                  <div className="flex-1">
                    <div
                      className="h-7 rounded bg-blue-100 transition-all"
                      style={{ width: `${(item.count / maxPatternCount) * 100}%`, minWidth: item.count > 0 ? "4px" : "0" }}
                    >
                      <span className="flex h-full items-center px-2 text-xs font-medium text-blue-700">
                        {item.count > 0 ? item.count : ""}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">데이터가 없습니다</p>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, sub, loading }: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  loading: boolean;
}) {
  return (
    <div className="rounded-lg bg-white p-5 shadow">
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      {loading ? (
        <div className="h-8 w-20 animate-pulse rounded bg-gray-100" />
      ) : (
        <>
          <p className="text-2xl font-bold text-gray-900">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
        </>
      )}
    </div>
  );
}

function LoadingSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-6 animate-pulse rounded bg-gray-100" />
      ))}
    </div>
  );
}

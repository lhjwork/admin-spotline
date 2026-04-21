import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { shareAPI } from "../services/v2/shareAPI";
import { TopSharedContent } from "../components/analytics/TopSharedContent";

const PERIOD_OPTIONS = [
  { value: "7d", label: "최근 7일" },
  { value: "30d", label: "최근 30일" },
  { value: "90d", label: "최근 90일" },
];

const CHANNEL_COLORS: Record<string, string> = {
  LINK: "#3B82F6",
  KAKAO: "#FEE500",
  QR: "#10B981",
  NATIVE: "#8B5CF6",
};

const CHANNEL_LABELS: Record<string, string> = {
  LINK: "링크 복사",
  KAKAO: "카카오톡",
  QR: "QR 코드",
  NATIVE: "네이티브",
};

export default function ShareAnalyticsPage() {
  const [period, setPeriod] = useState("30d");

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["shareStats", period],
    queryFn: () => shareAPI.getStats(period).then((r) => r.data),
  });

  const { data: topContent, isLoading: topLoading } = useQuery({
    queryKey: ["shareTop", period],
    queryFn: () => shareAPI.getTopShared(period).then((r) => r.data),
  });

  const channelData = stats
    ? Object.entries(stats.channelBreakdown).map(([channel, count]) => ({
        name: CHANNEL_LABELS[channel] || channel,
        value: count,
        color: CHANNEL_COLORS[channel] || "#6B7280",
      }))
    : [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">공유 분석</h1>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="rounded-md border px-3 py-1.5 text-sm"
        >
          {PERIOD_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="총 공유"
          value={stats?.totalShares ?? 0}
          loading={statsLoading}
        />
        <StatCard
          title="링크 복사"
          value={stats?.channelBreakdown?.LINK ?? 0}
          loading={statsLoading}
        />
        <StatCard
          title="카카오톡"
          value={stats?.channelBreakdown?.KAKAO ?? 0}
          loading={statsLoading}
        />
        <StatCard
          title="QR/네이티브"
          value={
            (stats?.channelBreakdown?.QR ?? 0) +
            (stats?.channelBreakdown?.NATIVE ?? 0)
          }
          loading={statsLoading}
        />
      </div>

      {/* 차트 */}
      <div className="grid grid-cols-2 gap-6">
        {/* 채널별 파이차트 */}
        <div className="rounded-lg border bg-white p-4">
          <h3 className="mb-4 font-semibold">채널별 분포</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={channelData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {channelData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 일별 트렌드 */}
        <div className="rounded-lg border bg-white p-4">
          <h3 className="mb-4 font-semibold">일별 공유 트렌드</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={stats?.dailyTrend ?? []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => v.slice(5)}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 탑 공유 콘텐츠 */}
      {topLoading ? (
        <p className="text-sm text-gray-500">로딩 중...</p>
      ) : (
        <TopSharedContent data={topContent ?? []} />
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  loading,
}: {
  title: string;
  value: number;
  loading: boolean;
}) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">
        {loading ? "—" : value.toLocaleString()}
      </p>
    </div>
  );
}

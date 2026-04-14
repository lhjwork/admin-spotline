import { useQuery } from "@tanstack/react-query";
import { analyticsAPI, type AreaPerformance } from "../../services/v2/analyticsAPI";
import { ChartCard, BarChartComponent } from "../Chart";

interface AreaPerformanceChartProps {
  from: Date;
  to: Date;
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function AreaPerformanceChart({ from, to }: AreaPerformanceChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["area-performance", toDateStr(from), toDateStr(to)],
    queryFn: () => analyticsAPI.getAreaPerformance(toDateStr(from), toDateStr(to)),
  });

  if (isLoading) {
    return (
      <ChartCard title="지역별 성과">
        <div className="h-[400px] flex items-center justify-center">
          <div className="animate-pulse text-gray-400">로딩 중...</div>
        </div>
      </ChartCard>
    );
  }

  if (!data || data.length === 0) {
    return (
      <ChartCard title="지역별 성과">
        <div className="h-[200px] flex items-center justify-center text-sm text-gray-500">
          데이터가 없습니다
        </div>
      </ChartCard>
    );
  }

  const chartData = data.map((item) => ({
    area: item.area,
    조회수: item.totalViews,
    좋아요: item.totalLikes,
    Spot: item.spotCount,
    SpotLine: item.spotLineCount,
  }));

  return (
    <ChartCard title="지역별 성과" subtitle="총 조회수 기준">
      <BarChartComponent
        data={chartData}
        xKey="area"
        bars={[
          { dataKey: "조회수", name: "조회수", color: "#3B82F6" },
          { dataKey: "좋아요", name: "좋아요", color: "#EF4444" },
        ]}
        height={Math.max(300, data.length * 40)}
        layout="vertical"
        formatter={(v: number) => v.toLocaleString()}
      />
    </ChartCard>
  );
}

export function getAreaPerformanceData(data: AreaPerformance[] | undefined) {
  return data ?? [];
}

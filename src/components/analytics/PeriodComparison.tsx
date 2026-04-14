import { useQuery } from "@tanstack/react-query";
import { analyticsAPI } from "../../services/v2/analyticsAPI";
import { MetricCard } from "../Chart";
import { MapPin, Route, Eye, Heart } from "lucide-react";

interface PeriodComparisonProps {
  from: Date;
  to: Date;
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatChangeRate(rate: number): { change: string; changeType: "positive" | "negative" | "neutral" } {
  if (rate > 0) return { change: `+${rate}%`, changeType: "positive" };
  if (rate < 0) return { change: `${rate}%`, changeType: "negative" };
  return { change: "0%", changeType: "neutral" };
}

export default function PeriodComparison({ from, to }: PeriodComparisonProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["period-comparison", toDateStr(from), toDateStr(to)],
    queryFn: () => analyticsAPI.getPeriodComparison(toDateStr(from), toDateStr(to)),
  });

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-20 mb-3" />
            <div className="h-8 bg-gray-200 rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  const spots = formatChangeRate(data.spotsChangeRate);
  const spotLines = formatChangeRate(data.spotLinesChangeRate);
  const views = formatChangeRate(data.viewsChangeRate);
  const likes = formatChangeRate(data.likesChangeRate);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Spot"
        value={data.currentSpots.toLocaleString()}
        change={spots.change}
        changeType={spots.changeType}
        icon={MapPin}
      />
      <MetricCard
        title="SpotLine"
        value={data.currentSpotLines.toLocaleString()}
        change={spotLines.change}
        changeType={spotLines.changeType}
        icon={Route}
      />
      <MetricCard
        title="총 조회수"
        value={data.currentViews.toLocaleString()}
        change={views.change}
        changeType={views.changeType}
        icon={Eye}
      />
      <MetricCard
        title="총 좋아요"
        value={data.currentLikes.toLocaleString()}
        change={likes.change}
        changeType={likes.changeType}
        icon={Heart}
      />
    </div>
  );
}

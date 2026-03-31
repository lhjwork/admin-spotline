interface GoalItem {
  area: string;
  target: number;
  current: number;
}

interface CurationGoalDetailProps {
  goals: GoalItem[];
  totalTarget: number;
  totalCurrent: number;
}

export default function CurationGoalDetail({ goals, totalTarget, totalCurrent }: CurationGoalDetailProps) {
  const totalPct = totalTarget > 0 ? Math.min((totalCurrent / totalTarget) * 100, 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">목표 달성률</h3>
        <span className="text-sm font-bold text-primary-600">
          {totalCurrent}/{totalTarget} ({Math.round(totalPct)}%)
        </span>
      </div>

      {/* 전체 프로그레스 */}
      <div className="mb-4">
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className="bg-primary-500 h-3 rounded-full transition-all"
            style={{ width: `${totalPct}%` }}
          />
        </div>
      </div>

      {/* 지역별 상세 */}
      <div className="space-y-2">
        {goals.map(({ area, target, current }) => {
          const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
          return (
            <div key={area} className="flex items-center gap-3">
              <span className="text-xs text-gray-600 w-14 flex-shrink-0">{area}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    pct >= 100 ? "bg-green-500" : "bg-primary-400"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 w-16 text-right flex-shrink-0">
                {current}/{target}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

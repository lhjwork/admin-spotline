interface CurationProgressProps {
  todayCount: number;
  goal?: number;
}

export default function CurationProgress({ todayCount, goal = 30 }: CurationProgressProps) {
  const pct = Math.min((todayCount / goal) * 100, 100);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">오늘 큐레이션 진행률</span>
        <span className="text-sm font-semibold text-primary-600">
          {todayCount} / {goal}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

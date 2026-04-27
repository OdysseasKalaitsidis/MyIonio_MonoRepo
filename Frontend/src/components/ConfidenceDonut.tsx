import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface ConfidenceDonutProps {
  value: number;
  label?: string;
  description?: string;
}

const PRIMARY_COLOR = "#a855f7";
const BACKGROUND_COLOR = "#2a2a3b";

export function ConfidenceDonut({
  value,
  label = "Confidence",
  description,
}: ConfidenceDonutProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));
  const chartData = [
    { name: "Confidence", value: clamped },
    { name: "Gap", value: 100 - clamped },
  ];

  return (
    <div className="w-full max-w-md mx-auto text-center space-y-4">
      <h3 className="text-2xl font-semibold">Confidence Level</h3>
      <div className="h-64 relative">
        <ResponsiveContainer width="100%" height="100%" minHeight={250}>
          <PieChart>
            <Pie
              data={chartData}
              innerRadius="70%"
              outerRadius="90%"
              startAngle={90}
              endAngle={-270}
              paddingAngle={2}
              dataKey="value"
            >
              <Cell key="confidence" fill={PRIMARY_COLOR} />
              <Cell key="gap" fill={BACKGROUND_COLOR} />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-4xl font-bold text-white">{clamped}%</p>
          <p className="text-text-muted uppercase tracking-wide text-sm">
            {label}
          </p>
        </div>
      </div>
      {description && (
        <p className="text-text-muted text-sm max-w-sm mx-auto">
          {description}
        </p>
      )}
    </div>
  );
}


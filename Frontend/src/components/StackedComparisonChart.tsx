import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

interface ComparisonDatum {
  name: string;
  score: number;
}

interface StackedComparisonChartProps {
  data: ComparisonDatum[];
  title: string;
  highlightName?: string;
}

const PRIMARY_BAR = "#38bdf8";
const GAP_BAR = "#1f2937";

export function StackedComparisonChart({
  data,
  title,
  highlightName,
}: StackedComparisonChartProps) {
  const prepared = data.map((item) => ({
    ...item,
    gap: Math.max(0, 100 - item.score),
  }));

  return (
    <div className="w-full max-w-3xl mx-auto my-8">
      <h3 className="text-2xl font-semibold mb-4 text-center">{title}</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={prepared}
          layout="vertical"
          margin={{ top: 10, right: 40, left: 40, bottom: 10 }}
        >
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: "white", fontSize: 14 }}
            width={160}
          />
          <Tooltip
            formatter={(value: number, name: string) =>
              name === "gap" ? [`Gap: ${value}%`, "Gap"] : [`${value}%`, "Score"]
            }
            contentStyle={{
              backgroundColor: "#1C1C25",
              border: "none",
              color: "white",
            }}
          />
          <Bar
            dataKey="score"
            stackId="stack"
            radius={[0, 12, 12, 0]}
            background={{ fill: "#1f1f2b" }}
          >
            {prepared.map((entry, index) => (
              <Cell
                key={`${entry.name}-${index}`}
                fill={
                  highlightName && entry.name === highlightName
                    ? PRIMARY_BAR
                    : "#4ade80"
                }
              />
            ))}
          </Bar>
          <Bar
            dataKey="gap"
            stackId="stack"
            radius={[12, 0, 0, 12]}
            fill={GAP_BAR}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}






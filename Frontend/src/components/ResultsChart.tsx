import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface ResultsChartprops {
  data: { name: string; accuracy: number }[];
  title: string;
}

export function ResultsChart({ data, title }: ResultsChartprops) {
  // Optional: dynamic bar color based on accuracy
  const getColor = (accuracy: number) => {
    if (accuracy >= 80) return "#4ade80"; // green
    if (accuracy >= 50) return "#facc15"; // yellow
    return "#f87171"; // red
  };

  return (
    <div className="w-full max-w-3xl mx-auto my-8">
      <h3 className="text-2xl font-semibold mb-4 text-center">{title}</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
        >
          <XAxis
            dataKey="name"
            tick={{ fill: "white", fontSize: 14 }}
            interval={0}
            angle={-15}
            textAnchor="end"
          />
          <YAxis tick={{ fill: "white", fontSize: 14 }} unit="%" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1C1C25",
              border: "none",
              color: "white",
            }}
            formatter={(value: number) => `${value}%`}
          />
          <Bar dataKey="accuracy" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={getColor(entry.accuracy)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

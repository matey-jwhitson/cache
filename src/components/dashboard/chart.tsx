"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

interface BaseChartProps {
  data: Record<string, unknown>[];
  height?: number;
  className?: string;
}

interface LineChartProps extends BaseChartProps {
  xKey: string;
  lines: { key: string; label: string; color?: string }[];
}

export function AppLineChart({ data, xKey, lines, height = 300, className }: LineChartProps) {
  if (data.length === 0) {
    return <ChartEmpty height={height} className={className} />;
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey={xKey} stroke="#71717a" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
          <YAxis stroke="#71717a" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: "8px",
              color: "#fff",
            }}
          />
          <Legend wrapperStyle={{ color: "#a1a1aa" }} />
          {lines.map((line, i) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.label}
              stroke={line.color ?? COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface BarChartProps extends BaseChartProps {
  xKey: string;
  bars: { key: string; label: string; color?: string }[];
  stacked?: boolean;
}

export function AppBarChart({ data, xKey, bars, stacked, height = 300, className }: BarChartProps) {
  if (data.length === 0) {
    return <ChartEmpty height={height} className={className} />;
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey={xKey} stroke="#71717a" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
          <YAxis stroke="#71717a" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: "8px",
              color: "#fff",
            }}
          />
          <Legend wrapperStyle={{ color: "#a1a1aa" }} />
          {bars.map((bar, i) => (
            <Bar
              key={bar.key}
              dataKey={bar.key}
              name={bar.label}
              fill={bar.color ?? COLORS[i % COLORS.length]}
              stackId={stacked ? "stack" : undefined}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface PieChartProps extends BaseChartProps {
  dataKey: string;
  nameKey: string;
}

export function AppPieChart({ data, dataKey, nameKey, height = 300, className }: PieChartProps) {
  if (data.length === 0) {
    return <ChartEmpty height={height} className={className} />;
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey={dataKey}
            nameKey={nameKey}
            label={({ name, percent }: { name?: string; percent?: number }) =>
              `${name ?? ""}: ${((percent ?? 0) * 100).toFixed(0)}%`
            }
            labelLine={{ stroke: "#71717a" }}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: "8px",
              color: "#fff",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartEmpty({ height, className }: { height: number; className?: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-sm text-zinc-500 ${className ?? ""}`}
      style={{ height }}
    >
      No chart data available
    </div>
  );
}

"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface TrendPoint {
  label: string;
  score: number;
  grade: string;
}

interface CategoryCount {
  category: string;
  count: number;
}

const GRADE_COLORS: Record<string, string> = {
  A: "#4ade80",
  B: "#60a5fa",
  C: "#facc15",
  D: "#fb923c",
  F: "#f87171",
};

const CATEGORY_COLORS = [
  "#f87171",
  "#fb923c",
  "#facc15",
  "#60a5fa",
  "#a78bfa",
  "#34d399",
  "#f472b6",
  "#94a3b8",
];

function GradeDot({ cx, cy, payload }: { cx?: number; cy?: number; payload?: TrendPoint }) {
  if (!payload || cx === undefined || cy === undefined) return null;
  const color = GRADE_COLORS[payload.grade] ?? "#71717a";
  return <circle cx={cx} cy={cy} r={5} fill={color} stroke="var(--background)" strokeWidth={2} />;
}

function ScoreTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: TrendPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const color = GRADE_COLORS[d.grade] ?? "#71717a";
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-foreground font-medium truncate max-w-[140px]">{d.label}</p>
      <p className="mt-0.5 text-muted-foreground">
        Score: <span className="font-bold text-foreground">{Math.round(d.score)}</span>{" "}
        <span className="font-bold" style={{ color }}>
          {d.grade}
        </span>
      </p>
    </div>
  );
}

function CategoryTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-muted-foreground font-medium capitalize">{payload[0].name}</p>
      <p className="text-foreground font-bold">{payload[0].value} findings</p>
    </div>
  );
}

export default function DashboardCharts({
  trendData,
  categoryData,
}: {
  trendData: TrendPoint[];
  categoryData: CategoryCount[];
}) {
  const hasTrend = trendData.length >= 2;
  const hasCategories = categoryData.length > 0;

  if (!hasTrend && !hasCategories) return null;

  return (
    <div className="grid md:grid-cols-2 gap-6 mb-8">
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-sm font-medium text-foreground mb-4">Risk score trend</p>
        {hasTrend ? (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={trendData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickCount={5}
              />
              <Tooltip content={<ScoreTooltip />} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#ef4444"
                strokeWidth={2}
                dot={<GradeDot />}
                activeDot={{ r: 6, fill: "#ef4444" }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-44 text-muted-foreground text-sm">
            Run at least 2 scans to see the trend
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-sm font-medium text-foreground mb-4">Top vulnerability categories</p>
        {hasCategories ? (
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="count"
                nameKey="category"
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={2}
              >
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CategoryTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value: string) => (
                  <span className="text-muted-foreground text-xs capitalize">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-44 text-muted-foreground text-sm">
            No findings yet
          </div>
        )}
      </div>
    </div>
  );
}

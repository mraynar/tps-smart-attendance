"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface TrendPoint {
  date: string;
  attendance: number;
  plates: number;
}

interface TrendChartProps {
  data: TrendPoint[];
  loading?: boolean;
}

// Custom tooltip
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #E5E7EB",
      borderRadius: 12,
      padding: "12px 16px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
    }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)", marginBottom: 8 }}>
        {label}
      </p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: entry.color }} />
          <span style={{ fontSize: 13, color: "var(--color-text-dark)" }}>
            <strong>{entry.value}</strong> {entry.name}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function TrendChart({ data, loading = false }: TrendChartProps) {
  if (loading) {
    return (
      <div className="skeleton" style={{ width: "100%", height: 280, borderRadius: 12 }} />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="gradAttendance" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#0B5FA0" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#0B5FA0" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradPlates" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#4FA8DC" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#4FA8DC" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: "#6B7280" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "#6B7280" }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 13, paddingTop: 16 }}
        />
        <Area
          type="monotone"
          dataKey="attendance"
          name="Absensi"
          stroke="#0B5FA0"
          strokeWidth={2.5}
          fill="url(#gradAttendance)"
          dot={{ r: 3, fill: "#0B5FA0" }}
          activeDot={{ r: 5 }}
        />
        <Area
          type="monotone"
          dataKey="plates"
          name="Deteksi Plat"
          stroke="#4FA8DC"
          strokeWidth={2.5}
          fill="url(#gradPlates)"
          dot={{ r: 3, fill: "#4FA8DC" }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from "recharts";

interface PeriodStat {
  name: string;
  submitted: number;
  total: number;
  avg_score: number;
}

function shorten(s: string, max = 14) {
  return s.length > max ? s.slice(0, max) + "…" : s;
}

export default function DashboardCharts({ data }: { data: PeriodStat[] }) {
  // Reverse so oldest period is on the left (trend direction makes sense)
  const chartData = [...data].reverse().map((d) => ({
    name: shorten(d.name),
    ส่งแล้ว: d.submitted,
    ทั้งหมด: d.total,
    คะแนนเฉลี่ย: Number(d.avg_score) || 0,
  }));

  if (chartData.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-8 text-center text-sm text-gray-400">
        ยังไม่มีข้อมูลสำหรับแสดงกราฟ
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Bar chart — submission count per period */}
      <div className="rounded-2xl border border-[#E5E3DC] bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-[#1A1A2E]">📊 จำนวนการส่งรายรอบ</h3>
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0EFE8" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E3DC" }}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="ทั้งหมด" fill="#E5E3DC" radius={[4, 4, 0, 0]} />
            <Bar dataKey="ส่งแล้ว" fill="#F5C400" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Line chart — avg score trend */}
      <div className="rounded-2xl border border-[#E5E3DC] bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-[#1A1A2E]">📈 แนวโน้มคะแนนเฉลี่ยรายรอบ</h3>
        <ResponsiveContainer width="100%" height={210}>
          <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0EFE8" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E3DC" }}
              formatter={(v) => [`${typeof v === "number" ? v.toFixed(2) : (v ?? "-")} คะแนน`, "คะแนนเฉลี่ย"]}
            />
            <Line
              type="monotone"
              dataKey="คะแนนเฉลี่ย"
              stroke="#1A1A2E"
              strokeWidth={2.5}
              dot={{ fill: "#F5C400", r: 5, strokeWidth: 0 }}
              activeDot={{ r: 7, fill: "#F5C400" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

"use client";

import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";

export default function RevenueChart({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  const maxIndex = data.reduce(
    (best, d, i) => (d.value > data[best].value ? i : best),
    0
  );

  return (
    <div className="h-[110px] -mx-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barCategoryGap={8}>
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "var(--text-muted)" }}
          />
          <Tooltip
            cursor={{ fill: "transparent" }}
            formatter={(value: number) => [`${value.toLocaleString("fr-FR")} F`, "CA"]}
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--surface-2)",
            }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === maxIndex ? "#185FA5" : "#B5D4F4"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

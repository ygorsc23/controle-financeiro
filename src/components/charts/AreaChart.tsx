"use client";

import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface AreaData {
  month: string;
  income: number;
  expense: number;
}

interface AreaChartProps {
  data: AreaData[];
}

export function AreaChart({ data }: AreaChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Nenhum dado no período
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RechartsAreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) =>
            new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
              notation: "compact",
            }).format(v)
          }
        />
        <Tooltip
          formatter={(value: unknown) =>
            new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(Number(value))
          }
        />
        <Area
          type="monotone"
          dataKey="income"
          stroke="#22c55e"
          fill="#22c55e"
          fillOpacity={0.1}
          name="Receitas"
        />
        <Area
          type="monotone"
          dataKey="expense"
          stroke="#ef4444"
          fill="#ef4444"
          fillOpacity={0.1}
          name="Despesas"
        />
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}

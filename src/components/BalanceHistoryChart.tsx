import React, { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, subMonths, endOfMonth, isSameMonth } from "date-fns";
import { Transaction } from "../types";
import { formatCurrency, cn } from "../lib/utils";

type TimeRange = "1W" | "1M" | "1Y";

interface BalanceHistoryChartProps {
  transactions: Transaction[];
  initialBalance: number;
}

export default function BalanceHistoryChart({
  transactions,
  initialBalance,
}: BalanceHistoryChartProps) {
  const [range, setRange] = useState<TimeRange>("1M");

  const data = useMemo(() => {
    const now = new Date();
    let points: { date: Date; label: string; balance: number }[] = [];

    if (range === "1W") {
      for (let i = 6; i >= 0; i--) {
        const date = subDays(now, i);
        points.push({
          date,
          label: format(date, "EEE"),
          balance: 0,
        });
      }
    } else if (range === "1M") {
      for (let i = 29; i >= 0; i--) {
        const date = subDays(now, i);
        points.push({
          date,
          label: format(date, "MMM d"),
          balance: 0,
        });
      }
    } else if (range === "1Y") {
      for (let i = 11; i >= 0; i--) {
        const date = subMonths(now, i);
        const pointDate = isSameMonth(date, now) ? now : endOfMonth(date);
        points.push({
          date: pointDate,
          label: format(pointDate, "MMM"),
          balance: 0,
        });
      }
    }

    // 1. Calculate daily net changes
    const dailyChange: Record<string, number> = {};
    transactions.forEach((tx) => {
      const dateKey = tx.date.includes("T") ? tx.date.split("T")[0] : tx.date;
      const rawAmount = Number(tx.amount) || 0;
      const amount = tx.type === "income" ? rawAmount : -rawAmount;
      dailyChange[dateKey] = (dailyChange[dateKey] || 0) + amount;
    });

    // 2. Sort dates with changes
    const changeDates = Object.keys(dailyChange).sort();

    // 3. Calculate initial balance before the first point
    const firstPointDate = format(points[0].date, "yyyy-MM-dd");
    let running = Number(initialBalance) || 0;
    let changeIdx = 0;

    // Advance to first point (sum all changes BEFORE the first point)
    while (
      changeIdx < changeDates.length &&
      changeDates[changeIdx] < firstPointDate
    ) {
      running += dailyChange[changeDates[changeIdx]];
      changeIdx++;
    }

    // 4. Iterate points and update balance
    return points.map((point) => {
      const pointIso = format(point.date, "yyyy-MM-dd");

      // Add all changes up to and including this point's date
      while (
        changeIdx < changeDates.length &&
        changeDates[changeIdx] <= pointIso
      ) {
        running += dailyChange[changeDates[changeIdx]];
        changeIdx++;
      }

      return {
        ...point,
        balance: running,
      };
    });
  }, [range, transactions, initialBalance]);

  return (
    <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-zinc-200">Balance History</h3>
        <div className="flex bg-zinc-950 rounded-lg p-1 border border-zinc-800">
          {(["1W", "1M", "1Y"] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                range === r
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-500 hover:text-zinc-300",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#27272a"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              stroke="#52525b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              minTickGap={30}
            />
            <YAxis
              stroke="#52525b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `₹${value}`}
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                borderColor: "#27272a",
                color: "#fff",
              }}
              formatter={(value: number) => [formatCurrency(value), "Balance"]}
              labelStyle={{ color: "#a1a1aa" }}
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorBalance)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

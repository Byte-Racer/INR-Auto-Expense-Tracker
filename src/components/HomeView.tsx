import React, { useMemo, useState } from "react";
import { AppSettings, Transaction } from "../types";
import { formatCurrency, cn } from "../lib/utils";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import BalanceHistoryChart from "./BalanceHistoryChart";
import { format, subDays, isSameDay, isSameWeek, isSameMonth, isSameYear } from "date-fns";
import { View } from "../App";

interface HomeViewProps {
  settings: AppSettings;
  transactions: Transaction[];
  currentBalance: number;
  onNavigate: (view: View) => void;
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#6366f1"];

type ChartTab = "daily" | "category";
type CategoryTimeRange = "1D" | "1W" | "1M" | "1Y";

export default function HomeView({ settings, transactions, currentBalance, onNavigate }: HomeViewProps) {
  const [chartTab, setChartTab] = useState<ChartTab>("daily");
  const [categoryTimeRange, setCategoryTimeRange] = useState<CategoryTimeRange>("1M");

  const isWarning = useMemo(() => {
    if (settings.warningThresholdType === "percentage") {
      return currentBalance <= (settings.initialBalance * settings.warningThresholdValue) / 100;
    }
    return currentBalance <= settings.warningThresholdValue;
  }, [currentBalance, settings]);

  const isLocked = currentBalance <= settings.lockThresholdValue;

  const alertStats = useMemo(() => {
    const warnings = transactions.filter(t => t.isWarning).length;
    const locks = transactions.filter(t => t.isLocked).length;
    return { warnings, locks };
  }, [transactions]);

  const categoryData = useMemo(() => {
    const now = new Date();
    const filteredTransactions = transactions.filter((t) => {
      if (t.type !== "expense") return false;
      
      let txDate: Date;
      if (t.date.includes('T')) {
        txDate = new Date(t.date);
      } else {
        txDate = new Date(t.date + "T00:00:00");
      }

      switch (categoryTimeRange) {
        case "1D":
          return isSameDay(txDate, now);
        case "1W":
          return isSameWeek(txDate, now, { weekStartsOn: 1 });
        case "1M":
          return isSameMonth(txDate, now);
        case "1Y":
          return isSameYear(txDate, now);
        default:
          return true;
      }
    });

    const grouped = filteredTransactions.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [transactions, categoryTimeRange]);

  const dailyData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), i);
      return {
        date: format(date, "MMM dd"),
        fullDate: date,
        amount: 0,
      };
    }).reverse();

    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        let txDate: Date;
        if (t.date.includes('T')) {
          txDate = new Date(t.date);
        } else {
          txDate = new Date(t.date + "T00:00:00");
        }
        
        const day = last30Days.find((d) => isSameDay(d.fullDate, txDate));
        if (day) {
          day.amount += t.amount;
        }
      });

    return last30Days;
  }, [transactions]);

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <div 
        onClick={() => onNavigate("activity")}
        className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-xl relative overflow-hidden cursor-pointer hover:bg-zinc-800/80 transition-colors group"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <span className="text-9xl font-bold text-white">₹</span>
        </div>
        <div className="flex justify-between items-start">
            <div>
                <p className="text-zinc-400 font-medium group-hover:text-zinc-300 transition-colors">Current Balance</p>
                <h2 className="text-4xl font-bold mt-2 text-white tracking-tight">
                {formatCurrency(currentBalance)}
                </h2>
            </div>
            <div className="text-zinc-500 group-hover:text-white transition-colors self-center">
                →
            </div>
        </div>
        
        {isWarning && (
          <div className="mt-4 flex items-center gap-2 text-amber-500 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">
              Warning: Balance is low!
            </p>
          </div>
        )}
        {isLocked && (
          <div className="mt-2 flex items-center gap-2 text-rose-500 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">
              Locked: Spending limit reached.
            </p>
          </div>
        )}
      </div>

      {/* Alerts Summary Section */}
      <button 
        onClick={() => onNavigate("alerts")}
        className="w-full bg-zinc-900 rounded-2xl p-4 border border-zinc-800 shadow-lg flex items-center justify-between hover:bg-zinc-800/80 transition-colors group"
      >
        <div className="flex items-center gap-4">
          <div className="bg-amber-500/10 p-3 rounded-full">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-white">Alerts & Warnings</h3>
            <p className="text-sm text-zinc-400">
              {alertStats.warnings} Warnings • {alertStats.locks} Locks
            </p>
          </div>
        </div>
        <div className="text-zinc-500 group-hover:text-white transition-colors">
          →
        </div>
      </button>

      {/* Balance History Chart */}
      <BalanceHistoryChart 
        transactions={transactions} 
        initialBalance={settings.initialBalance} 
      />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex bg-zinc-950 rounded-lg p-1 border border-zinc-800 w-full sm:w-auto overflow-x-auto">
              <button
                onClick={() => setChartTab("daily")}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
                  chartTab === "daily"
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                Daily Spending
              </button>
              <button
                onClick={() => setChartTab("category")}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
                  chartTab === "category"
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                Spending by Category
              </button>
            </div>

            {chartTab === "category" && (
              <div className="flex bg-zinc-950 rounded-lg p-1 border border-zinc-800 w-full sm:w-auto justify-between sm:justify-start">
                {(["1D", "1W", "1M", "1Y"] as CategoryTimeRange[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setCategoryTimeRange(r)}
                    className={cn(
                      "flex-1 sm:flex-none px-2 py-1 text-xs font-medium rounded-md transition-colors text-center",
                      categoryTimeRange === r
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartTab === "daily" ? (
                <BarChart data={dailyData}>
                  <XAxis
                    dataKey="date"
                    stroke="#52525b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#52525b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip
                    cursor={{ fill: "#27272a" }}
                    contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", color: "#fff" }}
                    formatter={(value: number) => [formatCurrency(value), "Spent"]}
                  />
                  <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                categoryData.length > 0 ? (
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", color: "#fff" }}
                      itemStyle={{ color: "#fff" }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend />
                  </PieChart>
                ) : (
                  <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
                    No expenses for this period
                  </div>
                )
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

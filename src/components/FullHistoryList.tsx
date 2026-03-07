import { useMemo, useState, useEffect } from "react";
import { Transaction } from "../types";
import TransactionItem from "./TransactionItem";
import { format, isToday, isYesterday, parseISO, isSameWeek, isSameMonth, isSameYear } from "date-fns";
import { formatCurrency, cn } from "../lib/utils";
import { Filter } from "lucide-react";

interface FullHistoryListProps {
  transactions: Transaction[];
}

type TimeRange = "ALL" | "1W" | "1M" | "1Y";

export default function FullHistoryList({ transactions }: FullHistoryListProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set(transactions.map(t => t.category));
    return ["All", ...Array.from(cats)];
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter(tx => {
        const date = tx.date.includes('T') ? parseISO(tx.date) : new Date(tx.date);
        
        // Time filter
        let matchesTime = true;
        switch (timeRange) {
            case "1W": matchesTime = isSameWeek(date, now, { weekStartsOn: 1 }); break;
            case "1M": matchesTime = isSameMonth(date, now); break;
            case "1Y": matchesTime = isSameYear(date, now); break;
            default: matchesTime = true;
        }

        // Category filter
        let matchesCategory = true;
        if (selectedCategory !== "All") {
            matchesCategory = tx.category === selectedCategory;
        }

        return matchesTime && matchesCategory;
    });
  }, [transactions, timeRange, selectedCategory]);

  const summary = useMemo(() => {
      const income = filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
      return { income, expense, total: income - expense };
  }, [filteredTransactions]);

  const [visibleDays, setVisibleDays] = useState(10);

  // Reset visible days when filters change
  useEffect(() => {
    setVisibleDays(10);
  }, [timeRange, selectedCategory]);

  // ... existing useMemo for filteredTransactions ...

  // ... existing useMemo for summary ...

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500">
        <p>No history available.</p>
      </div>
    );
  }

  // Group by date (YYYY-MM-DD)
  const grouped = useMemo(() => {
    return filteredTransactions.reduce((acc, tx) => {
      const date = tx.date.includes('T') ? parseISO(tx.date) : new Date(tx.date);
      const dateKey = format(date, 'yyyy-MM-dd');
      
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(tx);
      return acc;
    }, {} as Record<string, Transaction[]>);
  }, [filteredTransactions]);

  const sortedDates = useMemo(() => {
    return Object.keys(grouped).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );
  }, [grouped]);

  const visibleDates = sortedDates.slice(0, visibleDays);
  const hasMore = visibleDays < sortedDates.length;

  return (
    <div className="space-y-6">
      {/* Filters */}
      {/* ... existing filters code ... */}
      <div className="flex flex-col gap-4 bg-zinc-950/50 p-4 rounded-xl border border-zinc-800">
        <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                <Filter className="w-4 h-4" /> Filters
            </h3>
            <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                {(["ALL", "1W", "1M", "1Y"] as TimeRange[]).map((r) => (
                <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    className={cn(
                    "px-2 py-1 text-[10px] font-medium rounded-md transition-colors",
                    timeRange === r
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-500 hover:text-zinc-300"
                    )}
                >
                    {r}
                </button>
                ))}
            </div>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(cat => (
                <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-full border whitespace-nowrap transition-colors",
                        selectedCategory === cat
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/50"
                            : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                    )}
                >
                    {cat}
                </button>
            ))}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800/50">
            <div className="text-center">
                <p className="text-[10px] text-zinc-500">Income</p>
                <p className="text-xs font-semibold text-emerald-500">+{formatCurrency(summary.income)}</p>
            </div>
            <div className="text-center">
                <p className="text-[10px] text-zinc-500">Expense</p>
                <p className="text-xs font-semibold text-rose-500">-{formatCurrency(summary.expense)}</p>
            </div>
            <div className="text-center">
                <p className="text-[10px] text-zinc-500">Net</p>
                <p className={cn("text-xs font-semibold", summary.total >= 0 ? "text-white" : "text-rose-400")}>
                    {summary.total > 0 ? "+" : ""}{formatCurrency(summary.total)}
                </p>
            </div>
        </div>
      </div>

      <div className="space-y-8">
        {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-sm">
                No transactions found for the selected filters.
            </div>
        ) : (
            <>
            {visibleDates.map((dateKey) => {
            const dayTxs = grouped[dateKey];
            const dateObj = parseISO(dateKey);
            
            let title = format(dateObj, "MMMM d, yyyy");
            if (isToday(dateObj)) title = "Today";
            if (isYesterday(dateObj)) title = "Yesterday";

            const dailyTotal = dayTxs.reduce((sum, tx) => {
                return sum + (tx.type === 'income' ? tx.amount : -tx.amount);
            }, 0);

            return (
                <div key={dateKey} className="relative animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur-sm py-3 mb-2 border-b border-zinc-800/50 flex justify-between items-center">
                    <h4 className="text-sm font-semibold text-zinc-400">
                    {title}
                    </h4>
                    <span className={`text-xs font-medium ${dailyTotal >= 0 ? 'text-emerald-500' : 'text-zinc-500'}`}>
                    {dailyTotal > 0 ? '+' : ''}{formatCurrency(dailyTotal)}
                    </span>
                </div>
                <div className="space-y-3">
                    {dayTxs.map((tx) => (
                    <TransactionItem key={tx.id} tx={tx} />
                    ))}
                </div>
                </div>
            );
            })}
            
            {hasMore && (
              <button
                onClick={() => setVisibleDays(prev => prev + 10)}
                className="w-full py-4 text-sm font-medium text-zinc-400 hover:text-white bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 rounded-xl transition-all"
              >
                Load More History
              </button>
            )}
            </>
        )}
      </div>
    </div>
  );
}

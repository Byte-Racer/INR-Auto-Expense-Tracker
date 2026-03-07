import { useMemo, useState } from "react";
import { AppSettings, Transaction } from "../types";
import { AlertTriangle, Lock, Calendar, ChevronDown } from "lucide-react";
import TransactionItem from "./TransactionItem";
import { formatCurrency, cn } from "../lib/utils";
import { format, parseISO, getYear, getMonth } from "date-fns";

interface AlertsViewProps {
  transactions: Transaction[];
  settings: AppSettings;
}

export default function AlertsView({ transactions, settings }: AlertsViewProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth()));
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));

  // Calculate all-time stats
  const allTimeStats = useMemo(() => {
    const warningCount = transactions.filter(t => t.isWarning).length;
    const lockCount = transactions.filter(t => t.isLocked).length;
    return { warningCount, lockCount };
  }, [transactions]);

  // Get available years from transactions
  const availableYears = useMemo(() => {
    const years = new Set(transactions.map(t => {
      const date = t.date.includes('T') ? parseISO(t.date) : new Date(t.date);
      return getYear(date);
    }));
    const currentYear = new Date().getFullYear();
    years.add(currentYear);
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  // Filter transactions for the selected month/year
  const periodStats = useMemo(() => {
    const filtered = transactions.filter(tx => {
      if (!tx.isWarning && !tx.isLocked) return false;
      
      const date = tx.date.includes('T') ? parseISO(tx.date) : new Date(tx.date);
      const txMonth = getMonth(date);
      const txYear = getYear(date);

      return String(txMonth) === selectedMonth && String(txYear) === selectedYear;
    });

    const warningCount = filtered.filter(t => t.isWarning).length;
    const lockCount = filtered.filter(t => t.isLocked).length;

    // Sort by date descending
    const sortedTxs = filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { 
      transactions: sortedTxs, 
      warningCount, 
      lockCount 
    };
  }, [transactions, selectedMonth, selectedYear]);

  const justifiedTransactions = transactions.filter((t) => t.justification);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Alerts & Warnings</h2>
      </div>

      {/* All Time Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex flex-col items-center justify-center text-center">
          <AlertTriangle className="w-8 h-8 text-amber-500 mb-2" />
          <h4 className="text-2xl font-bold text-white">{allTimeStats.warningCount}</h4>
          <p className="text-xs text-amber-500 font-medium">Total Warnings</p>
          <p className="text-[10px] text-zinc-500 mt-1">All time</p>
        </div>
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex flex-col items-center justify-center text-center">
          <Lock className="w-8 h-8 text-rose-500 mb-2" />
          <h4 className="text-2xl font-bold text-white">{allTimeStats.lockCount}</h4>
          <p className="text-xs text-rose-500 font-medium">Total Lock Overrides</p>
          <p className="text-[10px] text-zinc-500 mt-1">All time</p>
        </div>
      </div>

      {/* Breakdown Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-zinc-200 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-zinc-400" />
                History Breakdown
            </h3>
            
            <div className="flex gap-2">
                {/* Month Dropdown */}
                <div className="relative">
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="appearance-none bg-zinc-900 border border-zinc-800 text-white text-sm rounded-lg pl-3 pr-8 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                    >
                        {months.map((m, i) => (
                            <option key={m} value={i}>{m}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                </div>

                {/* Year Dropdown */}
                <div className="relative">
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="appearance-none bg-zinc-900 border border-zinc-800 text-white text-sm rounded-lg pl-3 pr-8 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                    >
                        {availableYears.map((y) => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                </div>
            </div>
        </div>
        
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
            {/* Summary Header for Selection */}
            <div className="p-4 border-b border-zinc-800 bg-zinc-950/30 flex justify-between items-center">
                <div>
                    <h4 className="text-sm font-medium text-white">
                        {months[parseInt(selectedMonth)]} {selectedYear}
                    </h4>
                    <p className="text-xs text-zinc-500 mt-1">
                        {periodStats.transactions.length} alert events
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="flex flex-col items-end">
                        <span className="text-lg font-bold text-amber-500">{periodStats.warningCount}</span>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Warnings</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-lg font-bold text-rose-500">{periodStats.lockCount}</span>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Locks</span>
                    </div>
                </div>
            </div>

            {/* Transaction List */}
            <div className="divide-y divide-zinc-800/50">
                {periodStats.transactions.length > 0 ? (
                    <div className="p-4 space-y-3">
                        {periodStats.transactions.map(tx => (
                            <TransactionItem key={tx.id} tx={tx} />
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center text-zinc-500 text-sm">
                        No alerts recorded for {months[parseInt(selectedMonth)]} {selectedYear}.
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Justified Expenses List */}
      <div className="space-y-4 pt-4 border-t border-zinc-800">
        <h3 className="text-lg font-semibold text-zinc-200">
          Justified Expenses
        </h3>
        {justifiedTransactions.length > 0 ? (
          <div className="space-y-3">
            {justifiedTransactions.map((tx) => (
              <TransactionItem key={tx.id} tx={tx} />
            ))}
          </div>
        ) : (
          <p className="text-zinc-500 text-sm">
            No expenses have required justification yet.
          </p>
        )}
      </div>
      
      <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
          <h4 className="text-sm font-medium text-zinc-300 mb-2">Current Thresholds</h4>
          <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                  <span className="text-zinc-500">Warning Level</span>
                  <span className="text-amber-500">
                      {settings.warningThresholdType === 'percentage' 
                        ? `${settings.warningThresholdValue}% (${formatCurrency(settings.initialBalance * settings.warningThresholdValue / 100)})`
                        : formatCurrency(settings.warningThresholdValue)
                      }
                  </span>
              </div>
              <div className="flex justify-between">
                  <span className="text-zinc-500">Lock Level</span>
                  <span className="text-rose-500">{formatCurrency(settings.lockThresholdValue)}</span>
              </div>
          </div>
      </div>
    </div>
  );
}

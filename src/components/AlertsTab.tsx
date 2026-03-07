import { useMemo } from "react";
import { AppSettings, Transaction } from "../types";
import { AlertTriangle, Lock } from "lucide-react";
import TransactionItem from "./TransactionItem";
import { formatCurrency } from "../lib/utils";

interface AlertsTabProps {
  transactions: Transaction[];
  settings: AppSettings;
}

export default function AlertsTab({ transactions, settings }: AlertsTabProps) {
  const stats = useMemo(() => {
    let warningCount = 0;
    let lockCount = 0;
    let currentBal = settings.initialBalance;

    // Sort chronologically (oldest first) to replay history
    // We reverse first to ensure that for same-day transactions, we process them in the order they were added (oldest to newest)
    // assuming the input 'transactions' has newest first (which is how handleAddTransaction works)
    const chronologicalTxs = [...transactions].reverse().sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    chronologicalTxs.forEach((tx) => {
      const warningThreshold =
        settings.warningThresholdType === "percentage"
          ? settings.initialBalance * (settings.warningThresholdValue / 100)
          : settings.warningThresholdValue;

      // Check state BEFORE transaction
      if (currentBal <= settings.lockThresholdValue && tx.type === "expense") {
        lockCount++;
      } else if (currentBal <= warningThreshold && tx.type === "expense") {
        warningCount++;
      }

      if (tx.type === "income") currentBal += tx.amount;
      else currentBal -= tx.amount;
    });

    return { warningCount, lockCount };
  }, [transactions, settings]);

  const justifiedTransactions = transactions.filter((t) => t.justification);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex flex-col items-center justify-center text-center">
          <AlertTriangle className="w-8 h-8 text-amber-500 mb-2" />
          <h4 className="text-2xl font-bold text-white">{stats.warningCount}</h4>
          <p className="text-xs text-amber-500 font-medium">Warning Triggers</p>
          <p className="text-[10px] text-zinc-500 mt-1">
            Expenses made while balance was low
          </p>
        </div>
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex flex-col items-center justify-center text-center">
          <Lock className="w-8 h-8 text-rose-500 mb-2" />
          <h4 className="text-2xl font-bold text-white">{stats.lockCount}</h4>
          <p className="text-xs text-rose-500 font-medium">Lock Overrides</p>
          <p className="text-[10px] text-zinc-500 mt-1">
            Expenses made while balance was locked
          </p>
        </div>
      </div>

      <div className="space-y-4">
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

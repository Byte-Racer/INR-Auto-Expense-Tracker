import React from "react";
import { Transaction } from "../types";
import { formatCurrency, cn } from "../lib/utils";
import { format } from "date-fns";
import {
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  Wallet,
  Landmark,
} from "lucide-react";

interface TransactionItemProps {
  tx: Transaction;
}

const TransactionItem: React.FC<TransactionItemProps> = React.memo(({ tx }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-xl hover:bg-zinc-900 transition-colors">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "p-2 rounded-full",
            tx.isBlocked
              ? "bg-rose-500/20 text-rose-500"
              : tx.type === "income"
                ? "bg-emerald-500/10 text-emerald-500"
                : "bg-rose-500/10 text-rose-500",
          )}
        >
          {tx.type === "income" ? (
            <ArrowUpRight className="w-5 h-5" />
          ) : (
            <ArrowDownLeft className="w-5 h-5" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p
              className={cn(
                "font-medium",
                tx.isBlocked ? "text-rose-500 line-through" : "text-zinc-200",
              )}
            >
              {tx.category}
            </p>
            {tx.isBlocked && (
              <span className="flex items-center gap-1 text-[10px] bg-rose-500/20 text-rose-500 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                Blocked
              </span>
            )}
            {tx.wallet === "cash" ? (
              <span className="flex items-center gap-1 text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded uppercase tracking-wider">
                <Wallet className="w-3 h-3" /> Cash
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded uppercase tracking-wider">
                <Landmark className="w-3 h-3" /> Bank
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500">
            {format(new Date(tx.date), "MMM d, yyyy")}
            {tx.note && ` • ${tx.note}`}
          </p>
          {tx.justification && (
            <div className="flex items-center gap-1 mt-1 text-xs text-amber-500">
              <AlertTriangle className="w-3 h-3" />
              <span>{tx.justification}</span>
            </div>
          )}
        </div>
      </div>
      <div className="text-right">
        <p
          className={cn(
            "font-semibold",
            tx.isBlocked
              ? "text-rose-500/50 line-through"
              : tx.type === "income"
                ? "text-emerald-500"
                : "text-rose-500",
          )}
        >
          {tx.type === "income" ? "+" : "-"}
          {formatCurrency(tx.amount)}
        </p>
      </div>
    </div>
  );
});

export default TransactionItem;

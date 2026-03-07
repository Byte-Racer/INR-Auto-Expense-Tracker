import { useState, useMemo } from "react";
import { Transaction } from "../types";
import TransactionList from "./TransactionList";
import FullHistoryList from "./FullHistoryList";
import { cn } from "../lib/utils";

interface ActivityViewProps {
  transactions: Transaction[];
}

type Tab = "recent" | "history";

export default function ActivityView({ transactions }: ActivityViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>("recent");

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Activity</h2>
      
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 shadow-lg overflow-hidden">
        <div className="flex border-b border-zinc-800">
          <button
            onClick={() => setActiveTab("recent")}
            className={cn(
              "flex-1 py-4 text-sm font-medium text-center transition-colors",
              activeTab === "recent"
                ? "text-emerald-500 border-b-2 border-emerald-500 bg-zinc-800/50"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30"
            )}
          >
            Recent Activity
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={cn(
              "flex-1 py-4 text-sm font-medium text-center transition-colors",
              activeTab === "history"
                ? "text-emerald-500 border-b-2 border-emerald-500 bg-zinc-800/50"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30"
            )}
          >
            Full History
          </button>
        </div>
        
        <div className="p-6">
          {activeTab === "recent" && (
            <TransactionList transactions={transactions.slice(0, 5)} />
          )}
          {activeTab === "history" && (
            <FullHistoryList transactions={transactions} />
          )}
        </div>
      </div>
    </div>
  );
}

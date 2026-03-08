import React, { useState } from "react";
import { AppSettings, Transaction } from "../types";
import { formatCurrency, cn } from "../lib/utils";
import { Wallet, Landmark, Pencil, Check, X } from "lucide-react";
import TransactionItem from "./TransactionItem";

interface WalletsViewProps {
  settings: AppSettings;
  transactions: Transaction[];
  currentCashBalance: number;
  currentBankBalance: number;
  onUpdateSettings: (settings: AppSettings) => void;
}

export default function WalletsView({
  settings,
  transactions,
  currentCashBalance,
  currentBankBalance,
  onUpdateSettings,
}: WalletsViewProps) {
  const [editingWallet, setEditingWallet] = useState<"cash" | "bank" | null>(
    null,
  );
  const [editValue, setEditValue] = useState("");

  const recentCashTxs = transactions
    .filter((t) => t.wallet === "cash")
    .slice(0, 5);
  const recentBankTxs = transactions
    .filter((t) => t.wallet === "bank" || !t.wallet)
    .slice(0, 5);

  const handleStartEdit = (wallet: "cash" | "bank") => {
    setEditingWallet(wallet);
    setEditValue(
      wallet === "cash"
        ? currentCashBalance.toString()
        : currentBankBalance.toString(),
    );
  };

  const handleSaveEdit = () => {
    let newValue = parseFloat(editValue);
    if (!isNaN(newValue)) {
      newValue = Math.max(0, newValue);
      const dbDiff =
        newValue -
        (editingWallet === "cash" ? currentCashBalance : currentBankBalance);

      onUpdateSettings({
        ...settings,
        ...(editingWallet === "cash"
          ? { initialCashBalance: settings.initialCashBalance + dbDiff }
          : { initialBankBalance: settings.initialBankBalance + dbDiff }),
      });
    }
    setEditingWallet(null);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">Wallets</h2>

      {/* Cash Wallet */}
      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Wallet className="w-24 h-24 text-white" />
        </div>

        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 text-zinc-400 font-medium mb-2">
              <Wallet className="w-5 h-5" />
              <span>Cash Balance</span>
            </div>

            {editingWallet === "cash" ? (
              <div className="flex items-center gap-2 mt-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="bg-zinc-950 border border-zinc-700 rounded-lg pl-8 pr-4 py-2 text-2xl font-bold text-white w-48 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleSaveEdit}
                  className="p-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition-colors"
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setEditingWallet(null)}
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h2 className="text-4xl font-bold text-white tracking-tight">
                  {formatCurrency(currentCashBalance)}
                </h2>
                <button
                  onClick={() => handleStartEdit("cash")}
                  className="p-2 bg-zinc-800/50 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            Recent Cash Activity
          </h3>
          {recentCashTxs.length > 0 ? (
            <div className="space-y-2">
              {recentCashTxs.map((tx) => (
                <TransactionItem key={tx.id} tx={tx} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500 italic">
              No recent cash transactions
            </p>
          )}
        </div>
      </div>

      {/* Bank Wallet */}
      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Landmark className="w-24 h-24 text-white" />
        </div>

        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 text-zinc-400 font-medium mb-2">
              <Landmark className="w-5 h-5" />
              <span>Bank Balance</span>
            </div>

            {editingWallet === "bank" ? (
              <div className="flex items-center gap-2 mt-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="bg-zinc-950 border border-zinc-700 rounded-lg pl-8 pr-4 py-2 text-2xl font-bold text-white w-48 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleSaveEdit}
                  className="p-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition-colors"
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setEditingWallet(null)}
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h2 className="text-4xl font-bold text-white tracking-tight">
                  {formatCurrency(currentBankBalance)}
                </h2>
                <button
                  onClick={() => handleStartEdit("bank")}
                  className="p-2 bg-zinc-800/50 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            Recent Bank Activity
          </h3>
          {recentBankTxs.length > 0 ? (
            <div className="space-y-2">
              {recentBankTxs.map((tx) => (
                <TransactionItem key={tx.id} tx={tx} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500 italic">
              No recent bank transactions
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

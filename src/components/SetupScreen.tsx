import React, { useState } from "react";
import { AppSettings } from "../types";
import { cn } from "../lib/utils";

interface SetupScreenProps {
  onComplete: (settings: AppSettings) => void;
}

export default function SetupScreen({ onComplete }: SetupScreenProps) {
  const [initialBalance, setInitialBalance] = useState<string>("");
  const [warningType, setWarningType] = useState<"percentage" | "amount">("percentage");
  const [warningValue, setWarningValue] = useState<string>("");
  const [lockValue, setLockValue] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialBalance || !warningValue || !lockValue) return;

    onComplete({
      initialBalance: parseFloat(initialBalance),
      warningThresholdType: warningType,
      warningThresholdValue: parseFloat(warningValue),
      lockThresholdValue: parseFloat(lockValue),
      isSetupComplete: true,
      username: "User", // Default username
      incomeCategories: ["Monthly", "Savings", "Repayments", "Other"],
      expenseCategories: ["Food", "Transport", "Shopping", "Entertainment", "Bills", "Health", "Subscriptions", "Other"],
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">Welcome</h1>
          <p className="mt-2 text-zinc-400">Let's set up your expense tracker.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-xl">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Current Bank Balance (₹)</label>
            <input
              type="number"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              placeholder="e.g. 50000"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              required
            />
          </div>

          <div className="space-y-4">
            <label className="text-sm font-medium text-zinc-300">Warning Threshold</label>
            <div className="flex gap-2 p-1 bg-zinc-950 rounded-lg border border-zinc-800">
              <button
                type="button"
                onClick={() => setWarningType("percentage")}
                className={cn(
                  "flex-1 py-2 text-sm font-medium rounded-md transition-colors",
                  warningType === "percentage" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                Percentage (%)
              </button>
              <button
                type="button"
                onClick={() => setWarningType("amount")}
                className={cn(
                  "flex-1 py-2 text-sm font-medium rounded-md transition-colors",
                  warningType === "amount" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                Amount (₹)
              </button>
            </div>
            <input
              type="number"
              value={warningValue}
              onChange={(e) => setWarningValue(e.target.value)}
              placeholder={warningType === "percentage" ? "e.g. 20 (for 20%)" : "e.g. 5000"}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              required
            />
            <p className="text-xs text-zinc-500">
              We'll warn you when your balance drops below this level.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Lock Threshold (₹)</label>
            <input
              type="number"
              value={lockValue}
              onChange={(e) => setLockValue(e.target.value)}
              placeholder="e.g. 500"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              required
            />
            <p className="text-xs text-zinc-500">
              If your balance drops below this, you'll need to justify every expense.
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-lg shadow-emerald-900/20"
          >
            Start Tracking
          </button>
        </form>
      </div>
    </div>
  );
}

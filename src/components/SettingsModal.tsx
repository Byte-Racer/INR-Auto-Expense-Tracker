import React, { useState } from "react";
import { AppSettings, Transaction } from "../types";
import { cn } from "../lib/utils";
import { X, Trash2, Plus, Download } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdate: (settings: AppSettings) => void;
  transactions?: Transaction[];
}

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdate,
  transactions = [],
}: SettingsModalProps) {
  const [warningType, setWarningType] = useState<"percentage" | "amount">(
    settings.warningThresholdType
  );
  const [warningValue, setWarningValue] = useState(
    settings.warningThresholdValue.toString()
  );
  const [lockValue, setLockValue] = useState(
    settings.lockThresholdValue.toString()
  );
  const [username, setUsername] = useState(settings.username || "User");
  const [incomeCategories, setIncomeCategories] = useState<string[]>(settings.incomeCategories || []);
  const [expenseCategories, setExpenseCategories] = useState<string[]>(settings.expenseCategories || []);
  const [newCategory, setNewCategory] = useState("");
  const [activeCategoryTab, setActiveCategoryTab] = useState<"income" | "expense">("expense");

  if (!isOpen) return null;

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      const cat = newCategory.trim();
      if (activeCategoryTab === "income") {
        if (!incomeCategories.includes(cat)) {
          setIncomeCategories([...incomeCategories, cat]);
        }
      } else {
        if (!expenseCategories.includes(cat)) {
          setExpenseCategories([...expenseCategories, cat]);
        }
      }
      setNewCategory("");
    }
  };

  const handleDeleteCategory = (cat: string, type: "income" | "expense") => {
    if (type === "income") {
      setIncomeCategories(incomeCategories.filter((c) => c !== cat));
    } else {
      setExpenseCategories(expenseCategories.filter((c) => c !== cat));
    }
  };

  const handleBackup = () => {
    const data = {
      settings,
      transactions,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expense-tracker-backup-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!warningValue || !lockValue) return;

    onUpdate({
      ...settings,
      warningThresholdType: warningType,
      warningThresholdValue: parseFloat(warningValue),
      lockThresholdValue: parseFloat(lockValue),
      username,
      incomeCategories,
      expenseCategories,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-zinc-900 rounded-2xl w-full max-w-md p-6 border border-zinc-800 shadow-2xl relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-xl font-bold text-white mb-6">Settings</h2>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* User Profile */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-zinc-200 border-b border-zinc-800 pb-2">
              User Profile
            </h3>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Thresholds */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-zinc-200 border-b border-zinc-800 pb-2">
              Thresholds
            </h3>
            <div className="space-y-4">
              <label className="text-sm font-medium text-zinc-300">
                Warning Threshold
              </label>
              <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setWarningType("percentage")}
                  className={cn(
                    "flex-1 py-2 text-sm font-medium rounded-md transition-colors",
                    warningType === "percentage"
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  Percentage (%)
                </button>
                <button
                  type="button"
                  onClick={() => setWarningType("amount")}
                  className={cn(
                    "flex-1 py-2 text-sm font-medium rounded-md transition-colors",
                    warningType === "amount"
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  Amount (₹)
                </button>
              </div>
              <input
                type="number"
                value={warningValue}
                onChange={(e) => setWarningValue(e.target.value)}
                placeholder={
                  warningType === "percentage"
                    ? "e.g. 20 (for 20%)"
                    : "e.g. 5000"
                }
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">
                Lock Threshold (₹)
              </label>
              <input
                type="number"
                value={lockValue}
                onChange={(e) => setLockValue(e.target.value)}
                placeholder="e.g. 500"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                required
              />
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-zinc-200 border-b border-zinc-800 pb-2">
              Categories
            </h3>
            
            {/* Category Type Tabs */}
            <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
              <button
                type="button"
                onClick={() => setActiveCategoryTab("expense")}
                className={cn(
                  "flex-1 py-2 text-sm font-medium rounded-md transition-colors",
                  activeCategoryTab === "expense"
                    ? "bg-rose-500/20 text-rose-500 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setActiveCategoryTab("income")}
                className={cn(
                  "flex-1 py-2 text-sm font-medium rounded-md transition-colors",
                  activeCategoryTab === "income"
                    ? "bg-emerald-500/20 text-emerald-500 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                Income
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder={`New ${activeCategoryTab} category...`}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {(activeCategoryTab === "income" ? incomeCategories : expenseCategories).map((cat) => (
                  <div
                    key={cat}
                    className="flex items-center gap-1 bg-zinc-800 text-zinc-200 px-3 py-1 rounded-full text-sm border border-zinc-700"
                  >
                    <span>{cat}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat, activeCategoryTab)}
                      className="text-zinc-500 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-zinc-200 border-b border-zinc-800 pb-2">
              Data Management
            </h3>
            <button
              type="button"
              onClick={handleBackup}
              className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 px-4 rounded-lg transition-colors border border-zinc-700"
            >
              <Download className="w-4 h-4" />
              Download Backup (JSON)
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-lg shadow-emerald-900/20"
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}

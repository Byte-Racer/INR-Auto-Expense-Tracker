import React, { useState } from "react";
import { Transaction, TransactionType, Category } from "../types";
import { cn } from "../lib/utils";
import { X } from "lucide-react";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (tx: Transaction) => void;
  isLocked: boolean;
  incomeCategories: string[];
  expenseCategories: string[];
}

export default function AddTransactionModal({
  isOpen,
  onClose,
  onAdd,
  isLocked,
  incomeCategories,
  expenseCategories,
}: AddTransactionModalProps) {
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  
  const currentCategories = type === "income" ? incomeCategories : expenseCategories;
  const safeCategories = currentCategories || [];
  
  const [category, setCategory] = useState<Category>(safeCategories[0] || "Other");
  
  // Reset category when type changes
  React.useEffect(() => {
    const newCats = type === "income" ? incomeCategories : expenseCategories;
    setCategory(newCats[0] || "Other");
  }, [type, incomeCategories, expenseCategories]);

  const [note, setNote] = useState("");
  // Use local date string (YYYY-MM-DD) instead of UTC
  const [date, setDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [justification, setJustification] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !date) return;

    if (isLocked && type === "expense" && !justification) {
      alert("Please provide a justification for this expense.");
      return;
    }

    onAdd({
      id: crypto.randomUUID(),
      type,
      amount: parseFloat(amount),
      category: category,
      note,
      date,
      justification: isLocked && type === "expense" ? justification : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-zinc-900 rounded-2xl w-full max-w-md p-6 border border-zinc-800 shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-xl font-bold text-white mb-6">Add Transaction</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Toggle */}
          <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                type === "expense"
                  ? "bg-rose-500/20 text-rose-500 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                type === "income"
                  ? "bg-emerald-500/20 text-emerald-500 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              Income
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Amount (₹)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
              placeholder="0.00"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all appearance-none"
            >
              {safeCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
              required
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Note (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
              placeholder="e.g. Lunch with friends"
            />
          </div>

          {/* Lock Justification */}
          {isLocked && type === "expense" && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-lg animate-in fade-in slide-in-from-top-2">
              <label className="block text-sm font-medium text-rose-500 mb-1">
                Spending Limit Reached! Justification Required:
              </label>
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                className="w-full bg-zinc-950 border border-rose-500/30 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all"
                placeholder="Why is this expense necessary?"
                rows={3}
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-lg shadow-emerald-900/20 mt-4"
          >
            Add Transaction
          </button>
        </form>
      </div>
    </div>
  );
}

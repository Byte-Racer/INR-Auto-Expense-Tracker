import { useState, useEffect, useMemo } from "react";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { AppSettings, Transaction } from "./types";
import SetupScreen from "./components/SetupScreen";
import HomeView from "./components/HomeView";
import ActivityView from "./components/ActivityView";
import AlertsView from "./components/AlertsView";
import WalletsView from "./components/WalletsView";
import Navigation from "./components/Navigation";
import AddTransactionModal from "./components/AddTransactionModal";
import SettingsModal from "./components/SettingsModal";
import { Plus, Settings } from "lucide-react";
import {
  requestNotificationPermission,
  sendNotification,
} from "./lib/notifications";
import { formatCurrency } from "./lib/utils";

const DEFAULT_SETTINGS: AppSettings = {
  initialCashBalance: 0,
  initialBankBalance: 0,
  warningThresholdType: "percentage",
  warningThresholdValue: 20,
  lockThresholdValue: 500,
  isSetupComplete: false,
  username: "User",
  incomeCategories: ["Monthly", "Savings", "Repayments", "Other"],
  expenseCategories: [
    "Food",
    "Transport",
    "Shopping",
    "Entertainment",
    "Bills",
    "Subscriptions",
    "Other",
  ],
};

export type View = "home" | "activity" | "wallets" | "alerts";

export default function App() {
  // Use 'any' temporarily to handle migration from old settings shape
  const [storedSettings, setSettings] = useLocalStorage<any>(
    "expense-tracker-settings",
    DEFAULT_SETTINGS,
  );
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>(
    "expense-tracker-transactions",
    [],
  );
  const [currentView, setCurrentView] = useState<View>("home");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default");
  const [warningNotificationSent, setWarningNotificationSent] = useState(false);
  const [lockNotificationSent, setLockNotificationSent] = useState(false);
  const [blockedTxError, setBlockedTxError] = useState<{
    show: boolean;
    msg: string;
    amount: number;
  } | null>(null);

  // Merge with defaults to ensure new fields exist
  const settings: AppSettings = useMemo(
    () => ({
      ...DEFAULT_SETTINGS,
      ...storedSettings,
      // Ensure arrays are present if storedSettings has them (or if they are missing in stored, use default)
      incomeCategories:
        storedSettings.incomeCategories || DEFAULT_SETTINGS.incomeCategories,
      expenseCategories:
        storedSettings.expenseCategories ||
        (storedSettings.categories
          ? storedSettings.categories
          : DEFAULT_SETTINGS.expenseCategories),
    }),
    [storedSettings],
  );

  // Migration: Remove old 'categories' key if present and ensure new keys are saved
  useEffect(() => {
    let migrated = false;
    const newSettings = { ...storedSettings };

    if (storedSettings.categories && !storedSettings.expenseCategories) {
      newSettings.incomeCategories = DEFAULT_SETTINGS.incomeCategories;
      newSettings.expenseCategories = storedSettings.categories; // Map old categories to expense
      delete newSettings.categories;
      migrated = true;
    }

    if (storedSettings.initialBalance !== undefined) {
      newSettings.initialBankBalance = storedSettings.initialBalance;
      newSettings.initialCashBalance = 0;
      delete newSettings.initialBalance;
      migrated = true;
    }

    if (migrated) {
      setSettings(newSettings);
    }
  }, [storedSettings, setSettings]);

  // Request notification permission on mount and check status
  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Calculate current balances
  const currentCashBalance = useMemo(() => {
    const cashTransactions = transactions.filter(
      (t) => t.wallet === "cash" && !t.isBlocked,
    );
    const totalIncome = cashTransactions
      .filter((t) => t.type === "income")
      .reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = cashTransactions
      .filter((t) => t.type === "expense")
      .reduce((acc, curr) => acc + curr.amount, 0);
    return Math.max(
      0,
      settings.initialCashBalance + totalIncome - totalExpense,
    );
  }, [transactions, settings.initialCashBalance]);

  const currentBankBalance = useMemo(() => {
    // Treat undefined wallet as bank for backward compatibility
    const bankTransactions = transactions.filter(
      (t) => (t.wallet === "bank" || !t.wallet) && !t.isBlocked,
    );
    const totalIncome = bankTransactions
      .filter((t) => t.type === "income")
      .reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = bankTransactions
      .filter((t) => t.type === "expense")
      .reduce((acc, curr) => acc + curr.amount, 0);
    return Math.max(
      0,
      settings.initialBankBalance + totalIncome - totalExpense,
    );
  }, [transactions, settings.initialBankBalance]);

  const currentBalance = currentCashBalance + currentBankBalance;

  const isLocked = currentBalance <= settings.lockThresholdValue;

  // Migration: Backfill isWarning/isLocked for existing transactions if missing
  // Default wallet to bank if missing
  useEffect(() => {
    const hasUnmigrated =
      transactions.some(
        (t) =>
          t.type === "expense" &&
          (t.isWarning === undefined || t.isLocked === undefined),
      ) || transactions.some((t) => !t.wallet);

    if (hasUnmigrated) {
      let runningCashBalance = settings.initialCashBalance || 0;
      let runningBankBalance =
        settings.initialBankBalance || (settings as any).initialBalance || 0;
      let runningBalance = runningCashBalance + runningBankBalance;
      // Sort chronologically for replay
      const sortedTxs = [...transactions].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      const migratedTxs = sortedTxs.map((tx) => {
        const wallet = tx.wallet || "bank"; // Default backward compatibility

        if (tx.type === "income") {
          if (wallet === "cash") runningCashBalance += tx.amount;
          else runningBankBalance += tx.amount;

          runningBalance = runningCashBalance + runningBankBalance;
          return { ...tx, wallet };
        } else {
          // Check thresholds BEFORE deduction
          const warningThreshold =
            settings.warningThresholdType === "percentage"
              ? (settings.initialCashBalance + settings.initialBankBalance) *
                (settings.warningThresholdValue / 100)
              : settings.warningThresholdValue;

          const isLockedState = runningBalance <= settings.lockThresholdValue;
          const isWarningState = runningBalance <= warningThreshold;

          if (wallet === "cash") runningCashBalance -= tx.amount;
          else runningBankBalance -= tx.amount;

          runningBalance = runningCashBalance + runningBankBalance;

          return {
            ...tx,
            wallet,
            isLocked: tx.isLocked ?? isLockedState,
            isWarning: tx.isWarning ?? (isWarningState && !isLockedState),
          };
        }
      });

      migratedTxs.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

      setTransactions(migratedTxs);
    }
  }, []); // Run once on mount

  const handleSetupComplete = (newSettings: AppSettings) => {
    setSettings(newSettings);
  };

  const handleAddTransaction = (tx: Transaction, isAutoDetected = false) => {
    const initialTotal =
      settings.initialCashBalance + settings.initialBankBalance;
    const warningThreshold =
      settings.warningThresholdType === "percentage"
        ? initialTotal * (settings.warningThresholdValue / 100)
        : settings.warningThresholdValue;

    if (tx.type === "expense" && tx.amount > currentBalance) {
      if (!isAutoDetected) {
        setBlockedTxError({
          show: true,
          msg: `Insufficient balance. Your current balance is ₹${currentBalance} but the expense is ₹${tx.amount}. Transaction has not been recorded.`,
          amount: tx.amount,
        });
        sendNotification("❌ Transaction Blocked", {
          body: `₹${tx.amount} expense blocked — insufficient balance (₹${currentBalance} remaining).`,
        });
        return; // Block transaction
      } else {
        tx.isBlocked = true;
        tx.note = "FLAGGED — insufficient balance";
        sendNotification("❌ Transaction Blocked", {
          body: `₹${tx.amount} auto-expense blocked — insufficient balance (₹${currentBalance} remaining).`,
        });
      }
    }

    let nextBalance = currentBalance;
    if (!tx.isBlocked) {
      nextBalance =
        currentBalance + (tx.type === "income" ? tx.amount : -tx.amount);
      nextBalance = Math.max(0, nextBalance); // Hard floor
    }

    const isLockedState = nextBalance <= settings.lockThresholdValue;
    const isWarningState = nextBalance <= warningThreshold;

    const newTx = {
      ...tx,
      wallet: tx.wallet || "cash",
      isLocked: tx.type === "expense" && !tx.isBlocked ? isLockedState : false,
      isWarning:
        tx.type === "expense" && !tx.isBlocked
          ? isWarningState && !isLockedState
          : false,
    };

    if (tx.type === "income") {
      if (nextBalance > warningThreshold) setWarningNotificationSent(false);
      if (nextBalance > settings.lockThresholdValue)
        setLockNotificationSent(false);
    } else if (tx.type === "expense" && !tx.isBlocked) {
      if (isLockedState && !lockNotificationSent) {
        sendNotification("🔴 Spending Lock Active", {
          body: `Your balance is ₹${nextBalance}. You must justify all further expenses.`,
        });
        setLockNotificationSent(true);
      } else if (isWarningState && !isLockedState && !warningNotificationSent) {
        let warningPct = settings.warningThresholdValue;
        if (settings.warningThresholdType === "amount") {
          warningPct = parseFloat(
            ((warningThreshold / Math.max(1, initialTotal)) * 100).toFixed(1),
          );
        }
        sendNotification("⚠️ Low Balance Warning", {
          body: `Your balance is ₹${nextBalance}. You have ${warningPct}% or less remaining.`,
        });
        setWarningNotificationSent(true);
      }
    }

    setTransactions((prev) => [newTx, ...prev]);
  };

  // Add native transaction listener
  useEffect(() => {
    (window as any).onNativeTransaction = (
      type: string,
      amount: string,
      last4: string,
    ) => {
      console.log(`[App JS] Native Transaction: ${type}, ${amount}, ${last4}`);

      const parsedAmount = parseFloat(amount.replace(/,/g, ""));
      if (isNaN(parsedAmount)) return;

      const tx: Transaction = {
        id: crypto.randomUUID(),
        type: type === "debit" ? "expense" : "income",
        amount: parsedAmount,
        category: "Other",
        note: `Auto-detected ending in ${last4}`,
        date: new Date().toISOString(),
        wallet: "bank", // Always bank
      };

      handleAddTransaction(tx, true);
    };
  }, [handleAddTransaction]);

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
  };

  if (!settings.isSetupComplete) {
    return <SetupScreen onComplete={handleSetupComplete} />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24 font-sans">
      {/* Fallback Notification Banner */}
      {notificationPermission !== "granted" && (
        <div className="bg-rose-600/90 text-white px-4 py-3 text-center text-sm font-medium sticky top-0 z-50 shadow-md">
          ⚠️ Enable notifications in your browser settings to receive balance
          alerts
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-20 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Expense Tracker</h1>
          <p className="text-xs text-zinc-400">
            Hello, {settings.username || "User"}
          </p>
        </div>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 rounded-full hover:bg-zinc-800 transition-colors"
        >
          <Settings className="w-6 h-6 text-zinc-400" />
        </button>
      </header>

      <main className="p-6 max-w-4xl mx-auto">
        {currentView === "home" && (
          <HomeView
            settings={settings}
            transactions={transactions}
            currentBalance={currentBalance}
            onNavigate={setCurrentView}
          />
        )}
        {currentView === "activity" && (
          <ActivityView transactions={transactions} />
        )}
        {currentView === "alerts" && (
          <AlertsView transactions={transactions} settings={settings} />
        )}
        {currentView === "wallets" && (
          <WalletsView
            settings={settings}
            transactions={transactions}
            currentCashBalance={currentCashBalance}
            currentBankBalance={currentBankBalance}
            onUpdateSettings={handleUpdateSettings}
          />
        )}
      </main>

      <Navigation currentView={currentView} onViewChange={setCurrentView} />

      {/* Floating Action Button */}
      <button
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-24 right-6 bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-full shadow-lg shadow-emerald-900/40 transition-all hover:scale-105 active:scale-95 z-50"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modals */}
      {blockedTxError?.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-zinc-900 rounded-2xl w-full max-w-sm p-6 border border-rose-500/50 shadow-2xl relative animate-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-rose-500 mb-2 flex items-center gap-2">
              <span className="text-2xl">❌</span> Transaction Blocked
            </h2>
            <p className="text-zinc-300 text-sm mb-6 leading-relaxed">
              {blockedTxError.msg}
            </p>
            <button
              onClick={() => setBlockedTxError(null)}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 px-4 rounded-lg transition-colors border border-zinc-700"
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <AddTransactionModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddTransaction}
          isLocked={isLocked}
          incomeCategories={settings.incomeCategories}
          expenseCategories={settings.expenseCategories}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onUpdate={handleUpdateSettings}
          transactions={transactions}
        />
      )}
    </div>
  );
}

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

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Calculate current balances
  const currentCashBalance = useMemo(() => {
    const cashTransactions = transactions.filter((t) => t.wallet === "cash");
    const totalIncome = cashTransactions
      .filter((t) => t.type === "income")
      .reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = cashTransactions
      .filter((t) => t.type === "expense")
      .reduce((acc, curr) => acc + curr.amount, 0);
    return settings.initialCashBalance + totalIncome - totalExpense;
  }, [transactions, settings.initialCashBalance]);

  const currentBankBalance = useMemo(() => {
    // Treat undefined wallet as bank for backward compatibility
    const bankTransactions = transactions.filter(
      (t) => t.wallet === "bank" || !t.wallet,
    );
    const totalIncome = bankTransactions
      .filter((t) => t.type === "income")
      .reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = bankTransactions
      .filter((t) => t.type === "expense")
      .reduce((acc, curr) => acc + curr.amount, 0);
    return settings.initialBankBalance + totalIncome - totalExpense;
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

  const handleAddTransaction = (tx: Transaction) => {
    // Calculate flags for the new transaction
    const initialTotal =
      settings.initialCashBalance + settings.initialBankBalance;
    const warningThreshold =
      settings.warningThresholdType === "percentage"
        ? initialTotal * (settings.warningThresholdValue / 100)
        : settings.warningThresholdValue;

    const isLockedState = currentBalance <= settings.lockThresholdValue;
    const isWarningState = currentBalance <= warningThreshold;

    const newTx = {
      ...tx,
      wallet: tx.wallet || "cash", // Default new additions to cash if not provided
      isLocked: tx.type === "expense" ? isLockedState : false,
      isWarning:
        tx.type === "expense" ? isWarningState && !isLockedState : false,
    };

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

      handleAddTransaction(tx);
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

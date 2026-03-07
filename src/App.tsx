import { useState, useEffect, useMemo } from "react";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { AppSettings, Transaction } from "./types";
import SetupScreen from "./components/SetupScreen";
import HomeView from "./components/HomeView";
import ActivityView from "./components/ActivityView";
import AlertsView from "./components/AlertsView";
import Navigation from "./components/Navigation";
import AddTransactionModal from "./components/AddTransactionModal";
import SettingsModal from "./components/SettingsModal";
import { Plus, Settings } from "lucide-react";

const DEFAULT_SETTINGS: AppSettings = {
  initialBalance: 0,
  warningThresholdType: "percentage",
  warningThresholdValue: 20,
  lockThresholdValue: 500,
  isSetupComplete: false,
  username: "User",
  incomeCategories: ["Monthly", "Savings", "Repayments", "Other"],
  expenseCategories: ["Food", "Transport", "Shopping", "Entertainment", "Bills", "Subscriptions", "Other"],
};

export type View = "home" | "activity" | "alerts";

export default function App() {
  // Use 'any' temporarily to handle migration from old settings shape
  const [storedSettings, setSettings] = useLocalStorage<any>(
    "expense-tracker-settings",
    DEFAULT_SETTINGS
  );
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>(
    "expense-tracker-transactions",
    []
  );
  const [currentView, setCurrentView] = useState<View>("home");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Merge with defaults to ensure new fields exist
  const settings: AppSettings = useMemo(() => ({
    ...DEFAULT_SETTINGS,
    ...storedSettings,
    // Ensure arrays are present if storedSettings has them (or if they are missing in stored, use default)
    incomeCategories: storedSettings.incomeCategories || DEFAULT_SETTINGS.incomeCategories,
    expenseCategories: storedSettings.expenseCategories || (storedSettings.categories ? storedSettings.categories : DEFAULT_SETTINGS.expenseCategories),
  }), [storedSettings]);

  // Migration: Remove old 'categories' key if present and ensure new keys are saved
  useEffect(() => {
    if (storedSettings.categories && !storedSettings.expenseCategories) {
      const newSettings = {
        ...storedSettings,
        incomeCategories: DEFAULT_SETTINGS.incomeCategories,
        expenseCategories: storedSettings.categories, // Map old categories to expense
      };
      delete newSettings.categories;
      setSettings(newSettings);
    }
  }, [storedSettings, setSettings]);

  // Calculate current balance
  const currentBalance = useMemo(() => {
    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = transactions
      .filter((t) => t.type === "expense")
      .reduce((acc, curr) => acc + curr.amount, 0);
    return settings.initialBalance + totalIncome - totalExpense;
  }, [transactions, settings.initialBalance]);

  const isLocked = currentBalance <= settings.lockThresholdValue;

  // Migration: Backfill isWarning/isLocked for existing transactions if missing
  useEffect(() => {
    const hasUnmigrated = transactions.some(t => t.type === 'expense' && (t.isWarning === undefined || t.isLocked === undefined));
    
    if (hasUnmigrated) {
      let runningBalance = settings.initialBalance;
      // Sort chronologically for replay
      const sortedTxs = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      const migratedTxs = sortedTxs.map(tx => {
        if (tx.type === 'income') {
          runningBalance += tx.amount;
          return tx;
        } else {
          // Check thresholds BEFORE deduction (or after? Usually warnings trigger if balance IS low)
          // Based on previous logic: "Check state BEFORE transaction"
          const warningThreshold = settings.warningThresholdType === "percentage"
            ? settings.initialBalance * (settings.warningThresholdValue / 100)
            : settings.warningThresholdValue;
            
          const isLockedState = runningBalance <= settings.lockThresholdValue;
          const isWarningState = runningBalance <= warningThreshold;
          
          runningBalance -= tx.amount;

          return {
            ...tx,
            isLocked: tx.isLocked ?? isLockedState,
            isWarning: tx.isWarning ?? (isWarningState && !isLockedState) // Warning only if not locked? Or both? Usually distinct.
            // Previous logic: if locked count++, else if warning count++. So mutually exclusive in count, but state-wise...
            // Let's keep them as flags.
          };
        }
      });

      // Restore original order (newest first) if needed, but useLocalStorage usually just takes the array.
      // My useLocalStorage might not handle re-sorting. The app usually expects newest first.
      // Let's re-sort by date descending to be safe.
      migratedTxs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setTransactions(migratedTxs);
    }
  }, []); // Run once on mount (or when transactions/settings change? No, only if unmigrated)


  const handleSetupComplete = (newSettings: AppSettings) => {
    setSettings(newSettings); 
  };

  const handleAddTransaction = (tx: Transaction) => {
    // Calculate flags for the new transaction
    const warningThreshold = settings.warningThresholdType === "percentage"
      ? settings.initialBalance * (settings.warningThresholdValue / 100)
      : settings.warningThresholdValue;

    const isLockedState = currentBalance <= settings.lockThresholdValue;
    const isWarningState = currentBalance <= warningThreshold;

    const newTx = {
      ...tx,
      isLocked: tx.type === 'expense' ? isLockedState : false,
      isWarning: tx.type === 'expense' ? (isWarningState && !isLockedState) : false // Prioritize lock over warning
    };

    setTransactions((prev) => [newTx, ...prev]);
  };

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
          <p className="text-xs text-zinc-400">Hello, {settings.username || "User"}</p>
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

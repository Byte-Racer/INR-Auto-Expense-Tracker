export type TransactionType = "expense" | "income";

export type Category = string;

export type WalletType = "cash" | "bank";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: Category;
  note?: string;
  date: string; // ISO string
  wallet?: WalletType; // Optional for backward compatibility, defaults to bank
  justification?: string; // For lock threshold override
  isWarning?: boolean; // Persisted warning state
  isLocked?: boolean; // Persisted lock state
}

export interface AppSettings {
  initialCashBalance: number;
  initialBankBalance: number;
  warningThresholdType: "percentage" | "amount";
  warningThresholdValue: number;
  lockThresholdValue: number;
  isSetupComplete: boolean;
  username: string;
  incomeCategories: string[];
  expenseCategories: string[];
}

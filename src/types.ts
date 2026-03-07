export type TransactionType = "expense" | "income";

export type Category = string;

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: Category;
  note?: string;
  date: string; // ISO string
  justification?: string; // For lock threshold override
  isWarning?: boolean; // Persisted warning state
  isLocked?: boolean; // Persisted lock state
}

export interface AppSettings {
  initialBalance: number;
  warningThresholdType: "percentage" | "amount";
  warningThresholdValue: number;
  lockThresholdValue: number;
  isSetupComplete: boolean;
  username: string;
  incomeCategories: string[];
  expenseCategories: string[];
}

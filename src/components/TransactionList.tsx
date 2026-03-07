import { Transaction } from "../types";
import TransactionItem from "./TransactionItem";

interface TransactionListProps {
  transactions: Transaction[];
}

export default function TransactionList({ transactions }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500">
        <p>No transactions yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((tx) => (
        <TransactionItem key={tx.id} tx={tx} />
      ))}
    </div>
  );
}

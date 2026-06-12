import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

interface BalanceCardProps {
  balance: number;
  income: number;
  expense: number;
}

export function BalanceCard({ balance, income, expense }: BalanceCardProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Wallet className="h-4 w-4" />
          Saldo total
        </div>
        <p className={`mt-2 text-2xl font-bold ${
          balance < 0 ? "text-destructive" : ""
        }`}>
          {formatCurrency(balance)}
        </p>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="h-4 w-4 text-green-600" />
          Receitas do mês
        </div>
        <p className="mt-2 text-2xl font-bold text-green-600">
          {formatCurrency(income)}
        </p>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingDown className="h-4 w-4 text-destructive" />
          Despesas do mês
        </div>
        <p className="mt-2 text-2xl font-bold text-destructive">
          {formatCurrency(expense)}
        </p>
      </div>
    </div>
  );
}

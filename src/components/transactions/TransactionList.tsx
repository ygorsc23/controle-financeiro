"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteTransaction, quickUpdateTransactionStatus } from "@/lib/actions/transactions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { showSuccess, showError } from "@/lib/toast";
import { Pencil, Trash2, Repeat, CreditCard, Clock, CheckCircle, XCircle, Hand, Undo2 } from "lucide-react";
import type { Transaction, Account, Category } from "@/types";

interface TransactionRowProps {
  transaction: Transaction & {
    account?: Account;
    category?: Category;
  };
}

function TransactionRow({ transaction }: TransactionRowProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);

  async function handleDelete() {
    if (!confirm("Excluir esta transação?")) return;
    setDeleting(true);
    const result = await deleteTransaction(transaction.id);
    if (result?.error) {
      showError(result.error);
    } else {
      showSuccess("Transação excluída");
    }
    router.refresh();
  }

  async function handleQuickStatus(newStatus: "pending" | "paid" | "received") {
    setUpdating(true);
    const result = await quickUpdateTransactionStatus(transaction.id, newStatus);
    if (result?.error) {
      showError(result.error);
    } else {
      showSuccess(
        newStatus === "paid"
          ? "Marcado como pago"
          : newStatus === "received"
          ? "Marcado como recebido"
          : "Revertido para pendente"
      );
    }
    setUpdating(false);
    router.refresh();
  }

  const isExpense = transaction.type === "expense";

  return (
    <div className="flex items-center justify-between rounded-lg border px-4 py-3 transition-colors hover:bg-accent/50">
      <div className="flex items-center gap-3 min-w-0">
        {transaction.category && (
          <div
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: transaction.category.color }}
          />
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium">
              {transaction.description || "Sem descrição"}
            </p>
            {transaction.is_recurring && (
              <Repeat className="h-3 w-3 shrink-0 text-muted-foreground" />
            )}
            {transaction.status === "pending" && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-yellow-500 text-yellow-600">
                <Clock className="mr-1 h-2.5 w-2.5" />
                Pendente
              </Badge>
            )}
            {transaction.status === "paid" && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-destructive text-destructive">
                <CheckCircle className="mr-1 h-2.5 w-2.5" />
                Pago
              </Badge>
            )}
            {transaction.status === "received" && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-green-600 text-green-600">
                <CheckCircle className="mr-1 h-2.5 w-2.5" />
                Recebido
              </Badge>
            )}
            {transaction.installment_group_id && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                <CreditCard className="mr-1 h-2.5 w-2.5" />
                {transaction.installment_number}/{transaction.installment_total}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatDate(transaction.date)}</span>
            {transaction.account && (
              <>
                <span>·</span>
                <span>{transaction.account.name}</span>
              </>
            )}
            {transaction.category && (
              <>
                <span>·</span>
                <span>{transaction.category.name}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`text-sm font-semibold tabular-nums ${
            isExpense ? "text-destructive" : "text-green-600"
          }`}
        >
          {isExpense ? "-" : "+"}
          {formatCurrency(transaction.amount)}
        </span>

        {transaction.status === "pending" ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-green-600"
            onClick={() => handleQuickStatus(transaction.type === "income" ? "received" : "paid")}
            disabled={updating}
            title={transaction.type === "income" ? "Marcar como recebido" : "Marcar como pago"}
          >
            <Hand className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-yellow-600"
            onClick={() => handleQuickStatus("pending")}
            disabled={updating}
            title="Reverter para pendente"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </Button>
        )}

        <Link href={`/transactions/${transaction.id}/edit`}>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Pencil className="h-3 w-3" />
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive"
          onClick={handleDelete}
          disabled={deleting}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

interface TransactionListProps {
  transactions: (Transaction & {
    account?: Account;
    category?: Category;
  })[];
}

export function TransactionList({ transactions }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nenhuma transação encontrada
      </p>
    );
  }

  const total = transactions.reduce((sum, t) => {
    return sum + (t.type === "income" ? t.amount : -t.amount);
  }, 0);

  return (
    <div className="space-y-1">
      {transactions.map((t) => (
        <TransactionRow key={t.id} transaction={t} />
      ))}

      <div className="flex items-center justify-between rounded-lg border border-dashed px-4 py-3">
        <span className="text-sm font-medium">Total</span>
        <span
          className={`text-sm font-bold tabular-nums ${
            total >= 0 ? "text-green-600" : "text-destructive"
          }`}
        >
          {total >= 0 ? "+" : ""}
          {formatCurrency(total)}
        </span>
      </div>
    </div>
  );
}

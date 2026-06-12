"use client";

import Link from "next/link";
import { useState } from "react";
import { deleteAccount } from "@/lib/actions/accounts";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { showSuccess, showError } from "@/lib/toast";
import { CreditCard, Landmark, PiggyBank, Pencil, Trash2 } from "lucide-react";
import type { Account } from "@/types";

const accountIcons: Record<string, typeof CreditCard> = {
  checking: Landmark,
  savings: PiggyBank,
  credit: CreditCard,
};

const accountLabels: Record<string, string> = {
  checking: "Corrente",
  savings: "Poupança",
  credit: "Crédito",
};

interface AccountCardProps {
  account: Account;
}

export function AccountCard({ account }: AccountCardProps) {
  const [deleting, setDeleting] = useState(false);
  const Icon = accountIcons[account.type] ?? Landmark;

  async function handleDelete() {
    if (!confirm(`Excluir a conta "${account.name}"?`)) return;
    setDeleting(true);
    const result = await deleteAccount(account.id);
    if (result?.error) {
      showError(result.error);
    } else {
      showSuccess("Conta excluída");
    }
  }

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${account.color}20` }}
          >
            <Icon className="h-5 w-5" style={{ color: account.color }} />
          </div>
          <div>
            <p className="font-medium">{account.name}</p>
            <p className="text-xs text-muted-foreground">
              {accountLabels[account.type]}
              {account.type === "credit" && account.due_day &&
                ` · Vencimento dia ${account.due_day}`}
            </p>
          </div>
        </div>
      </div>

      <p className={`mt-4 text-2xl font-bold ${
        account.balance < 0 ? "text-destructive" : ""
      }`}>
        {formatCurrency(account.balance)}
      </p>

      <div className="mt-4 flex gap-2">
        <Link href={`/accounts/${account.id}/edit`}>
          <Button variant="outline" size="sm">
            <Pencil className="mr-1 h-3 w-3" />
            Editar
          </Button>
        </Link>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={deleting}
        >
          <Trash2 className="mr-1 h-3 w-3" />
          {deleting ? "..." : "Excluir"}
        </Button>
      </div>
    </div>
  );
}

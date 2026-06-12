"use client";

import Link from "next/link";
import { useState } from "react";
import { deleteBudget } from "@/lib/actions/budgets";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { showSuccess, showError } from "@/lib/toast";
import { Pencil, Trash2, AlertTriangle, AlertCircle } from "lucide-react";
import type { Budget, Category } from "@/types";

interface BudgetCardProps {
  budget: Budget & { category?: Category };
  spent: number;
}

export function BudgetCard({ budget, spent }: BudgetCardProps) {
  const [deleting, setDeleting] = useState(false);
  const limit = budget.limit_amount;
  const percentage = Math.min((spent / limit) * 100, 100);
  const isOver = spent > limit;

  async function handleDelete() {
    if (!confirm(`Excluir orçamento de ${budget.category?.name ?? "sem categoria"}?`)) return;
    setDeleting(true);
    const result = await deleteBudget(budget.id);
    if (result?.error) {
      showError(result.error);
    } else {
      showSuccess("Orçamento excluído");
    }
  }

  const monthLabel = new Date(budget.month + "T00:00:00").toLocaleString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const isNear = !isOver && percentage >= 80;

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {budget.category && (
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: budget.category.color }}
            />
          )}
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">
                {budget.category?.name ?? "Sem categoria"}
              </p>
              {isNear && (
                <span title="Próximo do limite">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                </span>
              )}
              {isOver && (
                <span title="Limite estourado">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground capitalize">
              {monthLabel}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Gasto</span>
          <span className={isOver ? "font-semibold text-destructive" : ""}>
            {formatCurrency(spent)} / {formatCurrency(limit)}
          </span>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={`h-full rounded-full transition-all ${
              isOver
                ? "bg-destructive"
                : percentage > 80
                ? "bg-yellow-500"
                : "bg-green-500"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <p className={`text-xs ${isOver ? "text-destructive" : "text-muted-foreground"}`}>
          {isOver
            ? `Ultrapassou em ${formatCurrency(spent - limit)}`
            : `Restam ${formatCurrency(limit - spent)}`}
        </p>
      </div>

      <div className="mt-4 flex gap-2">
        <Link href={`/budgets/${budget.id}/edit`}>
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

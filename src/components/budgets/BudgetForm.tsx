"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createBudget,
  updateBudget,
  type BudgetState,
} from "@/lib/actions/budgets";
import type { Budget, Category } from "@/types";

interface BudgetFormProps {
  categories: Category[];
  budget?: Budget & { category?: Category };
}

export function BudgetForm({ categories, budget }: BudgetFormProps) {
  const router = useRouter();
  const action = (budget ? updateBudget : createBudget) as (
    prevState: BudgetState,
    formData: FormData
  ) => Promise<BudgetState>;
  const [state, formAction, pending] = useActionState(action, undefined);

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return (
    <form action={formAction} className="space-y-6">
      {budget && <input type="hidden" name="id" value={budget.id} />}

      {state?.error && (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </p>
      )}

      {!budget && (
        <div className="space-y-2">
          <Label htmlFor="category_id">Categoria</Label>
          <select
            id="category_id"
            name="category_id"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            required
          >
            <option value="" disabled>Selecione</option>
            {categories
              .filter((c) => c.type === "expense")
              .map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
          </select>
        </div>
      )}

      {budget && (
        <div className="space-y-2">
          <Label>Categoria</Label>
          <p className="text-sm font-medium">
            {budget.category?.name ?? "Sem categoria"}
          </p>
        </div>
      )}

      {!budget && (
        <div className="space-y-2">
          <Label htmlFor="month">Mês</Label>
          <Input
            id="month"
            name="month"
            type="month"
            defaultValue={currentMonth}
            required
          />
        </div>
      )}

      {budget && (
        <div className="space-y-2">
          <Label>Mês</Label>
          <p className="text-sm font-medium capitalize">
            {new Date(budget.month + "T00:00:00").toLocaleString("pt-BR", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="limit_amount">Limite (R$)</Label>
        <Input
          id="limit_amount"
          name="limit_amount"
          type="number"
          step="0.01"
          required
          defaultValue={budget?.limit_amount}
          placeholder="0,00"
        />
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : budget ? "Atualizar" : "Criar orçamento"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

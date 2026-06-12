"use client";

import { useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createTransaction,
  updateTransaction,
  type TransactionState,
} from "@/lib/actions/transactions";
import type { Transaction, Account, Category, Subcategory } from "@/types";

interface TransactionFormProps {
  accounts: Account[];
  categories: Category[];
  subcategories: Subcategory[];
  transaction?: Transaction & {
    account?: Account;
    category?: Category;
    subcategory?: Subcategory;
  };
}

export function TransactionForm({
  accounts,
  categories,
  subcategories,
  transaction,
}: TransactionFormProps) {
  const router = useRouter();
  const isEditing = !!transaction;
  const action = (transaction ? updateTransaction : createTransaction) as (
    prevState: TransactionState,
    formData: FormData
  ) => Promise<TransactionState>;
  const [state, formAction, pending] = useActionState(action, undefined);

  const [type, setType] = useState<"income" | "expense">(
    transaction?.type ?? "expense"
  );
  const [selectedAccount, setSelectedAccount] = useState(
    transaction?.account_id ?? ""
  );
  const [selectedCategory, setSelectedCategory] = useState(
    transaction?.category_id ?? ""
  );
  const [status, setStatus] = useState<"pending" | "paid" | "received">(
    transaction?.status ?? "pending"
  );
  const [isInstallment, setIsInstallment] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);

  const filteredCategories = categories.filter((c) => c.type === type);
  const filteredSubcategories = subcategories.filter(
    (s) => s.category_id === selectedCategory
  );
  const selectedAccountData = accounts.find((a) => a.id === selectedAccount);

  function handleTypeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newType = e.target.value as "income" | "expense";
    setType(newType);
    setSelectedCategory("");
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <form action={formAction} className="space-y-6">
      {transaction && <input type="hidden" name="id" value={transaction.id} />}

      {state?.error && (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="type">Tipo</Label>
        <select
          id="type"
          name="type"
          value={type}
          onChange={handleTypeChange}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          required
        >
          <option value="expense">Despesa</option>
          <option value="income">Receita</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="account_id">Conta</Label>
        <select
          id="account_id"
          name="account_id"
          value={selectedAccount}
          onChange={(e) => setSelectedAccount(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          required
        >
          <option value="" disabled>
            Selecione uma conta
          </option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name} ({acc.type === "credit" ? "Crédito" : acc.type === "checking" ? "Corrente" : "Poupança"})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Valor</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            required
            defaultValue={transaction?.amount}
            placeholder="0,00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Data</Label>
          <Input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={transaction?.date ?? today}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as "pending" | "paid" | "received")}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value="pending">Pendente</option>
          {type === "income" ? (
            <option value="received">Recebido</option>
          ) : (
            <option value="paid">Pago</option>
          )}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Input
          id="description"
          name="description"
          defaultValue={transaction?.description ?? ""}
          placeholder="Ex: Salário do mês, Supermercado..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category_id">Categoria</Label>
        <select
          id="category_id"
          name="category_id"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value="">Sem categoria</option>
          {filteredCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {selectedCategory && filteredSubcategories.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="subcategory_id">Subcategoria</Label>
          <select
            id="subcategory_id"
            name="subcategory_id"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          >
            <option value="">Nenhuma</option>
            {filteredSubcategories.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {!isEditing && selectedAccountData?.type === "credit" && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isInstallment}
            onChange={(e) => setIsInstallment(e.target.checked)}
            className="rounded border-input"
          />
          É parcelado?
        </label>
      )}

      {isInstallment && (
        <div className="rounded-lg border p-4 space-y-4">
          <p className="text-sm font-medium">Parcelamento</p>
          <input type="hidden" name="is_installment" value="true" />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="installment_total">Número de parcelas</Label>
              <Input
                id="installment_total"
                name="installment_total"
                type="number"
                min="2"
                max="60"
                required
              />
            </div>
          </div>
        </div>
      )}

      {!isEditing && !isInstallment && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="rounded border-input"
          />
          É recorrente?
        </label>
      )}

      {isRecurring && (
        <div className="rounded-lg border p-4 space-y-4">
          <p className="text-sm font-medium">Transação recorrente</p>
          <input type="hidden" name="is_recurring" value="true" />

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequência</Label>
              <select
                id="frequency"
                name="frequency"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                required
              >
                <option value="daily">Diário</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
                <option value="yearly">Anual</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interval_value">A cada</Label>
              <Input
                id="interval_value"
                name="interval_value"
                type="number"
                min="1"
                defaultValue="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_occurrences">Total de ocorrências</Label>
              <Input
                id="total_occurrences"
                name="total_occurrences"
                type="number"
                min="1"
                required
                placeholder="Ex: 12"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Salvando..."
            : isEditing
            ? "Atualizar"
            : "Criar transação"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

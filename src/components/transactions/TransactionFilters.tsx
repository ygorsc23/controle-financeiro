"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import type { Account, Category } from "@/types";

interface TransactionFiltersProps {
  accounts: Account[];
  categories: Category[];
}

export function TransactionFilters({ accounts, categories }: TransactionFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentType = searchParams.get("type") ?? "";
  const currentStatus = searchParams.get("status") ?? "";
  const currentCategory = searchParams.get("category_id") ?? "";
  const currentAccount = searchParams.get("account_id") ?? "";
  const currentSearch = searchParams.get("search") ?? "";
  const currentStart = searchParams.get("start") ?? "";
  const currentEnd = searchParams.get("end") ?? "";
  const currentMonth = searchParams.get("month") ?? new Date().toISOString().slice(0, 7);

  function applyFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/transactions?${params.toString()}`);
  }

  function clearFilters() {
    const month = new Date().toISOString().slice(0, 7);
    const start = `${month}-01`;
    const lastDay = new Date(parseInt(month.split("-")[0]), parseInt(month.split("-")[1]), 0).getDate();
    const end = `${month}-${String(lastDay).padStart(2, "0")}`;
    router.push(`/transactions?month=${month}&start=${start}&end=${end}`);
  }

  const hasFilters = currentType || currentStatus || currentCategory || currentAccount || currentSearch;

  function handleStatusToggle(value: string) {
    const selected = currentStatus ? currentStatus.split(",") : [];
    const idx = selected.indexOf(value);
    if (idx >= 0) {
      selected.splice(idx, 1);
    } else {
      selected.push(value);
    }
    applyFilter("status", selected.join(","));
  }

  function handleMonthChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    if (!value) return;
    const [year, month] = value.split("-");
    const start = `${value}-01`;
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    const end = `${value}-${String(lastDay).padStart(2, "0")}`;
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", value);
    params.set("start", start);
    params.set("end", end);
    router.push(`/transactions?${params.toString()}`);
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Search className="h-4 w-4" />
          Filtros
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-3 w-3" />
            Limpar
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="search">Buscar</Label>
          <Input
            id="search"
            placeholder="Descrição..."
            defaultValue={currentSearch}
            onBlur={(e) => applyFilter("search", e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyFilter("search", (e.target as HTMLInputElement).value);
            }}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="type">Tipo</Label>
          <select
            id="type"
            value={currentType}
            onChange={(e) => applyFilter("type", e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          >
            <option value="">Todos</option>
            <option value="income">Receitas</option>
            <option value="expense">Despesas</option>
          </select>
        </div>

        <div className="space-y-1">
          <Label>Status</Label>
          <div className="flex flex-wrap gap-3 pt-1">
            {(["pending", "paid", "received"] as const).map((s) => {
              const checked = currentStatus.split(",").includes(s);
              return (
                <label key={s} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleStatusToggle(s)}
                    className="rounded border-input"
                  />
                  {s === "pending" ? "Pendente" : s === "paid" ? "Pago" : "Recebido"}
                </label>
              );
            })}
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="category_id">Categoria</Label>
          <select
            id="category_id"
            value={currentCategory}
            onChange={(e) => applyFilter("category_id", e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          >
            <option value="">Todas</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="account_id">Conta</Label>
          <select
            id="account_id"
            value={currentAccount}
            onChange={(e) => applyFilter("account_id", e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          >
            <option value="">Todas</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.type === "credit" ? "Crédito" : acc.type === "checking" ? "Corrente" : "Poupança"})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="month">Competência</Label>
          <Input
            id="month"
            type="month"
            value={currentMonth}
            onChange={handleMonthChange}
            className="flex h-9"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="start">Data início</Label>
          <Input
            id="start"
            type="date"
            defaultValue={currentStart}
            onChange={(e) => applyFilter("start", e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="end">Data fim</Label>
          <Input
            id="end"
            type="date"
            defaultValue={currentEnd}
            onChange={(e) => applyFilter("end", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import type { Category } from "@/types";

interface RecurringFiltersProps {
  categories: Category[];
}

export function RecurringFilters({ categories }: RecurringFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentType = searchParams.get("type") ?? "";
  const currentCategory = searchParams.get("category_id") ?? "";

  function applyFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/recurring?${params.toString()}`);
  }

  const hasFilters = currentType || currentCategory;

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="space-y-1">
        <Label htmlFor="type">Tipo</Label>
        <select
          id="type"
          value={currentType}
          onChange={(e) => applyFilter("type", e.target.value)}
          className="flex h-9 w-40 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value="">Todos</option>
          <option value="income">Receitas</option>
          <option value="expense">Despesas</option>
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="category_id">Categoria</Label>
        <select
          id="category_id"
          value={currentCategory}
          onChange={(e) => applyFilter("category_id", e.target.value)}
          className="flex h-9 w-48 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value="">Todas</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {hasFilters && (
        <button
          onClick={() => router.push("/recurring")}
          className="flex h-9 items-center rounded-md px-3 text-sm text-muted-foreground hover:text-foreground"
        >
          Limpar
        </button>
      )}
    </div>
  );
}

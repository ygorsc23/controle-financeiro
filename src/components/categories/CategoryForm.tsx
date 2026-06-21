"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCategory, updateCategory, type CategoryState } from "@/lib/actions/categories";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, ICON_MAP } from "@/lib/constants";
import type { Category } from "@/types";

interface CategoryFormProps {
  category?: Category;
}

const COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#3b82f6", "#6366f1", "#a855f7", "#ec4899",
  "#14b8a6", "#6b7280",
];

const ICONS = [
  "home", "utensils", "car", "heart", "book", "gamepad-2",
  "repeat", "shopping-cart", "briefcase", "laptop", "trending-up",
  "shopping-bag", "more-horizontal", "plus", "dollar-sign",
  "credit-card", "gift", "phone", "zap", "sun",
];

export function CategoryForm({ category }: CategoryFormProps) {
  const router = useRouter();
  const action = (category ? updateCategory : createCategory) as (
    prevState: CategoryState,
    formData: FormData
  ) => Promise<CategoryState>;
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-6">
      {category && <input type="hidden" name="id" value={category.id} />}

      {state?.error && (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={category?.name}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Tipo</Label>
        <select
          id="type"
          name="type"
          defaultValue={category?.type ?? "expense"}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          required
        >
          <option value="expense">Despesa</option>
          <option value="income">Receita</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label>Cor</Label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((color) => (
            <label key={color} className="cursor-pointer">
              <input
                type="radio"
                name="color"
                value={color}
                defaultChecked={category?.color === color || (!category && color === "#6366f1")}
                className="sr-only"
              />
              <div
                className="h-8 w-8 rounded-full border-2 transition-transform peer-checked:scale-110 peer-checked:border-foreground"
                style={{ backgroundColor: color }}
              />
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="icon">Ícone</Label>
        <div className="flex flex-wrap gap-2">
          {ICONS.map((icon) => (
            <label key={icon} className="cursor-pointer">
              <input
                type="radio"
                name="icon"
                value={icon}
                defaultChecked={category?.icon === icon}
                className="sr-only peer"
              />
              <div className="flex h-9 w-9 items-center justify-center rounded-md border text-sm transition-colors peer-checked:bg-primary peer-checked:text-primary-foreground">
                {ICON_MAP[icon] ?? "📂"}
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : category ? "Atualizar" : "Criar"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { deleteCategory } from "@/lib/actions/categories";
import { Button } from "@/components/ui/button";
import { showSuccess, showError } from "@/lib/toast";
import { ICON_MAP } from "@/lib/constants";
import type { Category } from "@/types";

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Excluir esta categoria? As subcategorias também serão removidas.")) return;
    setDeleting(true);
    const result = await deleteCategory(category.id);
    if (result?.error) {
      showError(result.error);
    } else {
      showSuccess("Categoria excluída");
    }
  }

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <Link href={`/categories/${category.id}`} className="block">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg text-lg"
              style={{ backgroundColor: `${category.color}20` }}
            >
              {ICON_MAP[category.icon ?? ""] ?? "📂"}
            </div>
            <div>
              <p className="font-medium">{category.name}</p>
              <p className="text-xs text-muted-foreground">
                {category.type === "income" ? "Receita" : "Despesa"}
              </p>
            </div>
          </div>
        </div>
      </Link>

      <div className="mt-3 flex gap-2">
        <Link href={`/categories/${category.id}/edit`}>
          <Button variant="outline" size="sm">Editar</Button>
        </Link>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? "..." : "Excluir"}
        </Button>
      </div>
    </div>
  );
}

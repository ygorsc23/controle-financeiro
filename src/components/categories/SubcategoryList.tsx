"use client";

import { useState } from "react";
import { deleteSubcategory } from "@/lib/actions/subcategories";
import { SubcategoryForm } from "./SubcategoryForm";
import { Button } from "@/components/ui/button";
import { showSuccess, showError } from "@/lib/toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Subcategory } from "@/types";

interface SubcategoryListProps {
  categoryId: string;
  subcategories: Subcategory[];
}

export function SubcategoryList({ categoryId, subcategories }: SubcategoryListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta subcategoria?")) return;
    const result = await deleteSubcategory(id, categoryId);
    if (result?.error) {
      showError(result.error);
    } else {
      showSuccess("Subcategoria excluída");
    }
  }

  return (
    <div className="space-y-2">
      {subcategories.map((sub) => (
        <div key={sub.id}>
          {editingId === sub.id ? (
            <SubcategoryForm
              categoryId={categoryId}
              subcategory={sub}
              onDone={() => setEditingId(null)}
            />
          ) : (
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <span className="text-sm">{sub.name}</span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setEditingId(sub.id)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => handleDelete(sub.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}

      {showForm ? (
        <SubcategoryForm categoryId={categoryId} onDone={() => setShowForm(false)} />
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setShowForm(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Adicionar subcategoria
        </Button>
      )}

      {subcategories.length === 0 && !showForm && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Nenhuma subcategoria ainda
        </p>
      )}
    </div>
  );
}

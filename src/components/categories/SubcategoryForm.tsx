"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createSubcategory,
  updateSubcategory,
  type SubcategoryState,
} from "@/lib/actions/subcategories";
import type { Subcategory } from "@/types";

interface SubcategoryFormProps {
  categoryId: string;
  subcategory?: Subcategory;
  onDone?: () => void;
}

export function SubcategoryForm({ categoryId, subcategory, onDone }: SubcategoryFormProps) {
  const action = (subcategory ? updateSubcategory : createSubcategory) as (
    prevState: SubcategoryState,
    formData: FormData
  ) => Promise<SubcategoryState>;
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex items-end gap-2">
      <input type="hidden" name="category_id" value={categoryId} />
      {subcategory && <input type="hidden" name="id" value={subcategory.id} />}

      <div className="flex-1 space-y-1">
        <Label htmlFor="sub-name">Nome</Label>
        <Input
          id="sub-name"
          name="name"
          required
          defaultValue={subcategory?.name}
          placeholder="Ex: Supermercado"
        />
      </div>

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "..." : subcategory ? "Atualizar" : "Adicionar"}
      </Button>

      {onDone && (
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
      )}

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
    </form>
  );
}

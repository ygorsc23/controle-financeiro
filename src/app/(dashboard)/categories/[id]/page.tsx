import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Plus, Pencil } from "lucide-react";
import { SubcategoryList } from "@/components/categories/SubcategoryList";

export default async function CategoryDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .single();

  if (!category) notFound();

  const { data: subcategories } = await supabase
    .from("subcategories")
    .select("*")
    .eq("category_id", id)
    .order("name");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="h-4 w-4 rounded-full"
            style={{ backgroundColor: category.color }}
          />
          <div>
            <h2 className="text-lg font-semibold">{category.name}</h2>
            <p className="text-sm text-muted-foreground">
              {category.type === "income" ? "Receita" : "Despesa"}
            </p>
          </div>
        </div>
        <Link href={`/categories/${category.id}/edit`}>
          <Button variant="outline" size="sm">
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Subcategorias ({subcategories?.length ?? 0})
          </h3>
        </div>

        <SubcategoryList
          categoryId={category.id}
          subcategories={subcategories ?? []}
        />
      </div>
    </div>
  );
}

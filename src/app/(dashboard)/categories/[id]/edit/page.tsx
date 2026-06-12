import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CategoryForm } from "@/components/categories/CategoryForm";

export default async function EditCategoryPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .single();

  if (!category) notFound();

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Editar categoria</h2>
        <p className="text-sm text-muted-foreground">{category.name}</p>
      </div>
      <CategoryForm category={category} />
    </div>
  );
}

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BudgetForm } from "@/components/budgets/BudgetForm";

export default async function EditBudgetPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = await createClient();

  const [{ data: budget }, { data: categories }] = await Promise.all([
    supabase
      .from("budgets")
      .select("*, category:categories(*)")
      .eq("id", id)
      .single(),
    supabase.from("categories").select("*").order("name"),
  ]);

  if (!budget) notFound();

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Editar orçamento</h2>
        <p className="text-sm text-muted-foreground">
          {budget.category?.name}
        </p>
      </div>
      <BudgetForm categories={categories ?? []} budget={budget} />
    </div>
  );
}

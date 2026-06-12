import { createClient } from "@/lib/supabase/server";
import { BudgetForm } from "@/components/budgets/BudgetForm";

export default async function NewBudgetPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Novo orçamento</h2>
        <p className="text-sm text-muted-foreground">
          Defina um limite de gastos para uma categoria
        </p>
      </div>
      <BudgetForm categories={categories ?? []} />
    </div>
  );
}

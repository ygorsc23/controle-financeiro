import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { BudgetCard } from "@/components/budgets/BudgetCard";
import { Plus } from "lucide-react";

export default async function BudgetsPage() {
  const supabase = await createClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString().split("T")[0];
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString().split("T")[0];

  const { data: budgets } = await supabase
    .from("budgets")
    .select("*, category:categories(*)")
    .eq("month", monthStart)
    .order("category_id");

  // Calculate spent for each budget
  const budgetSpent = new Map<string, number>();

  if (budgets) {
    const categoryIds = budgets.map((b) => b.category_id);

    const { data: transactions } = await supabase
      .from("transactions")
      .select("category_id, amount")
      .in("category_id", categoryIds)
      .gte("date", monthStart)
      .lte("date", monthEnd);

    transactions?.forEach((t) => {
      const current = budgetSpent.get(t.category_id) ?? 0;
      budgetSpent.set(
        t.category_id,
        current + parseFloat(String(t.amount))
      );
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {budgets?.length ?? 0} orçamentos este mês
        </p>
        <Link href="/budgets/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo orçamento
          </Button>
        </Link>
      </div>

      {budgets && budgets.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              spent={budgetSpent.get(budget.category_id) ?? 0}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-muted-foreground">
            Nenhum orçamento para este mês
          </p>
          <Link href="/budgets/new">
            <Button variant="outline">Criar orçamento</Button>
          </Link>
        </div>
      )}
    </div>
  );
}

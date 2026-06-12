import { createClient } from "@/lib/supabase/server";
import { TransactionForm } from "@/components/transactions/TransactionForm";

export default async function NewTransactionPage() {
  const supabase = await createClient();

  const [{ data: accounts }, { data: categories }, { data: subcategories }] =
    await Promise.all([
      supabase.from("accounts").select("*").order("name"),
      supabase.from("categories").select("*").order("name"),
      supabase.from("subcategories").select("*").order("name"),
    ]);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Nova transação</h2>
        <p className="text-sm text-muted-foreground">
          Registre uma receita ou despesa
        </p>
      </div>
      <TransactionForm
        accounts={accounts ?? []}
        categories={categories ?? []}
        subcategories={subcategories ?? []}
      />
    </div>
  );
}

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TransactionForm } from "@/components/transactions/TransactionForm";

export default async function EditTransactionPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = await createClient();

  const [
    { data: transaction },
    { data: accounts },
    { data: categories },
    { data: subcategories },
  ] = await Promise.all([
    supabase
      .from("transactions")
      .select("*, account:accounts(*), category:categories(*), subcategory:subcategories(*)")
      .eq("id", id)
      .single(),
    supabase.from("accounts").select("*").order("name"),
    supabase.from("categories").select("*").order("name"),
    supabase.from("subcategories").select("*").order("name"),
  ]);

  if (!transaction) notFound();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Editar transação</h2>
        <p className="text-sm text-muted-foreground">
          {transaction.description || "Sem descrição"}
        </p>
      </div>
      <TransactionForm
        accounts={accounts ?? []}
        categories={categories ?? []}
        subcategories={subcategories ?? []}
        transaction={transaction}
      />
    </div>
  );
}

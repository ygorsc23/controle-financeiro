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
      .select("*, account:accounts!transactions_account_id_fkey(*), category:categories(*), subcategory:subcategories(*), destination_account:accounts!transactions_destination_account_id_fkey(*)")
      .eq("id", id)
      .single(),
    supabase.from("accounts").select("*").order("name"),
    supabase.from("categories").select("*").order("name"),
    supabase.from("subcategories").select("*").order("name"),
  ]);

  if (!transaction) notFound();

  // Count linked transactions (installment group or recurring)
  let linkedCount = 0;
  if (transaction.recurring_id || transaction.installment_group_id) {
    const field = transaction.recurring_id ? "recurring_id" : "installment_group_id";
    const value = transaction.recurring_id ?? transaction.installment_group_id;
    const { count } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq(field, value!);
    linkedCount = count ?? 0;
  }

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
        linkedCount={linkedCount}
      />
    </div>
  );
}

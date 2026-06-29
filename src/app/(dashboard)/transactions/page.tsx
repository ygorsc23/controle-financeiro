import { createClient } from "@/lib/supabase/server";
import { TransactionList } from "@/components/transactions/TransactionList";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { BalanceCard } from "@/components/dashboard/BalanceCard";

export default async function TransactionsPage(props: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  // Fetch accounts and categories for filters
  const [{ data: accounts }, { data: categories }] = await Promise.all([
    supabase.from("accounts").select("*").order("name"),
    supabase.from("categories").select("*").order("name"),
  ]);

  // Build query
  let query = supabase
    .from("transactions")
    .select("*, account:accounts!transactions_account_id_fkey(*), category:categories(*), subcategory:subcategories(*), destination_account:accounts!transactions_destination_account_id_fkey(*)");

  // Apply filters from search params
  if (searchParams.type) {
    query = query.eq("type", searchParams.type);
  }

  if (searchParams.status) {
    const statusList = searchParams.status.split(",");
    query = query.in("status", statusList);
  }

  if (searchParams.category_id) {
    query = query.eq("category_id", searchParams.category_id);
  }

  if (searchParams.account_id) {
    query = query.eq("account_id", searchParams.account_id);
  }

  if (searchParams.search) {
    query = query.ilike("description", `%${searchParams.search}%`);
  }

  if (searchParams.start) {
    query = query.gte("date", searchParams.start);
  } else {
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString().split("T")[0];
    query = query.gte("date", defaultStart);
  }

  if (searchParams.end) {
    query = query.lte("date", searchParams.end);
  } else {
    const now = new Date();
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString().split("T")[0];
    query = query.lte("date", defaultEnd);
  }

  query = query.order("date", { ascending: true }).limit(100);

  const { data: transactions } = await query;

  const filteredIncome = transactions
    ?.filter((t) => t.type === "income")
    .reduce((sum, t) => sum + parseFloat(String(t.amount)), 0) ?? 0;

  const filteredExpense = transactions
    ?.filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + parseFloat(String(t.amount)), 0) ?? 0;

  const filteredBalance = filteredIncome - filteredExpense;

  return (
    <div className="space-y-4">
      <TransactionFilters accounts={accounts ?? []} categories={categories ?? []} />

      <BalanceCard
        balance={filteredBalance}
        income={filteredIncome}
        expense={filteredExpense}
      />

      <p className="text-sm text-muted-foreground">
        {transactions?.length ?? 0} transações encontradas
      </p>

      <TransactionList transactions={transactions ?? []} />
    </div>
  );
}

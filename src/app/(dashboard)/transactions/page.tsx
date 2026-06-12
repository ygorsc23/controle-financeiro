import { createClient } from "@/lib/supabase/server";
import { TransactionList } from "@/components/transactions/TransactionList";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";

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
    .select("*, account:accounts(*), category:categories(*), subcategory:subcategories(*)");

  // Apply filters from search params
  if (searchParams.type) {
    query = query.eq("type", searchParams.type);
  }

  if (searchParams.status) {
    query = query.eq("status", searchParams.status);
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
  }

  if (searchParams.end) {
    query = query.lte("date", searchParams.end);
  }

  query = query.order("date", { ascending: false }).limit(100);

  const { data: transactions } = await query;

  return (
    <div className="space-y-4">
      <TransactionFilters accounts={accounts ?? []} categories={categories ?? []} />

      <p className="text-sm text-muted-foreground">
        {transactions?.length ?? 0} transações encontradas
      </p>

      <TransactionList transactions={transactions ?? []} />
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { TransactionList } from "@/components/transactions/TransactionList";
import { PieChart } from "@/components/charts/PieChart";
import { AreaChart } from "@/components/charts/AreaChart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Accounts
  const { data: accounts } = await supabase
    .from("accounts")
    .select("*");

  const totalBalance = accounts?.reduce(
    (sum, a) => sum + parseFloat(String(a.balance)),
    0
  ) ?? 0;

  // Current month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString().split("T")[0];
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString().split("T")[0];

  const { data: monthTransactions } = await supabase
    .from("transactions")
    .select("*, account:accounts(*), category:categories(*), subcategory:subcategories(*)")
    .gte("date", monthStart)
    .lte("date", monthEnd)
    .order("date", { ascending: false });

  const monthIncome = monthTransactions
    ?.filter((t) => t.type === "income")
    .reduce((sum, t) => sum + parseFloat(String(t.amount)), 0) ?? 0;

  const monthExpense = monthTransactions
    ?.filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + parseFloat(String(t.amount)), 0) ?? 0;

  // Pie chart data - expenses by category
  const expenseByCategory = new Map<string, { name: string; value: number; color: string }>();
  monthTransactions
    ?.filter((t) => t.type === "expense")
    .forEach((t) => {
      const key = t.category?.name ?? "Sem categoria";
      const existing = expenseByCategory.get(key);
      if (existing) {
        existing.value += parseFloat(String(t.amount));
      } else {
        expenseByCategory.set(key, {
          name: key,
          value: parseFloat(String(t.amount)),
          color: t.category?.color ?? "#6b7280",
        });
      }
    });

  // Area chart - last 6 months
  const monthlyData: { month: string; income: number; expense: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = d.toISOString().split("T")[0];
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
      .toISOString().split("T")[0];
    const label = d.toLocaleString("pt-BR", { month: "short" });

    const { data: txns } = await supabase
      .from("transactions")
      .select("type, amount")
      .gte("date", start)
      .lte("date", end);

    const inc = txns?.filter((t) => t.type === "income")
      .reduce((s, t) => s + parseFloat(String(t.amount)), 0) ?? 0;
    const exp = txns?.filter((t) => t.type === "expense")
      .reduce((s, t) => s + parseFloat(String(t.amount)), 0) ?? 0;

    monthlyData.push({ month: label, income: inc, expense: exp });
  }

  // Recent transactions
  const { data: recentTransactions } = await supabase
    .from("transactions")
    .select("*, account:accounts(*), category:categories(*), subcategory:subcategories(*)")
    .order("date", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Bem-vindo, {user?.user_metadata?.name ?? "usuário"}!
      </p>

      <BalanceCard
        balance={totalBalance}
        income={monthIncome}
        expense={monthExpense}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Gastos por categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart data={Array.from(expenseByCategory.values())} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Evolução mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AreaChart data={monthlyData} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Últimas transações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionList transactions={recentTransactions ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}

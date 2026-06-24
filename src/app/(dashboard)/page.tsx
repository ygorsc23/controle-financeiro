import { createClient } from "@/lib/supabase/server";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { TransactionList } from "@/components/transactions/TransactionList";
import { PieChart } from "@/components/charts/PieChart";
import { AreaChart } from "@/components/charts/AreaChart";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { AlertTriangle, AlertCircle } from "lucide-react";

export default async function DashboardPage(props: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  const includePending = searchParams.includePending === "true";

  function isEffective(t: { status: string }) {
    return includePending || t.status !== "pending";
  }

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
    ?.filter((t) => t.type === "income" && isEffective(t))
    .reduce((sum, t) => sum + parseFloat(String(t.amount)), 0) ?? 0;

  const monthExpense = monthTransactions
    ?.filter((t) => t.type === "expense" && isEffective(t))
    .reduce((sum, t) => sum + parseFloat(String(t.amount)), 0) ?? 0;

  // Pie chart data - expenses by category
  const expenseByCategory = new Map<string, { name: string; value: number; color: string }>();
  monthTransactions
    ?.filter((t) => t.type === "expense" && isEffective(t))
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

  // Pie chart data - income by category
  const incomeByCategory = new Map<string, { name: string; value: number; color: string }>();
  monthTransactions
    ?.filter((t) => t.type === "income" && isEffective(t))
    .forEach((t) => {
      const key = t.category?.name ?? "Sem categoria";
      const existing = incomeByCategory.get(key);
      if (existing) {
        existing.value += parseFloat(String(t.amount));
      } else {
        incomeByCategory.set(key, {
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
      .select("type, amount, status")
      .gte("date", start)
      .lte("date", end);

    const inc = txns?.filter((t) => t.type === "income" && (includePending || t.status !== "pending"))
      .reduce((s, t) => s + parseFloat(String(t.amount)), 0) ?? 0;
    const exp = txns?.filter((t) => t.type === "expense" && (includePending || t.status !== "pending"))
      .reduce((s, t) => s + parseFloat(String(t.amount)), 0) ?? 0;

    monthlyData.push({ month: label, income: inc, expense: exp });
  }

  // Next transactions (pending from today onwards)
  const today = new Date().toISOString().split("T")[0];

  const { data: nextTransactions } = await supabase
    .from("transactions")
    .select("*, account:accounts(*), category:categories(*), subcategory:subcategories(*)")
    .gte("date", today)
    .eq("status", "pending")
    .order("date", { ascending: true })
    .limit(5);

  // Overdue transactions (pending before today)
  const { data: overdueTransactions } = await supabase
    .from("transactions")
    .select("*, account:accounts(*), category:categories(*), subcategory:subcategories(*)")
    .lt("date", today)
    .eq("status", "pending")
    .order("date", { ascending: true })
    .limit(5);

  // Budget alerts
  const { data: budgets } = await supabase
    .from("budgets")
    .select("*, category:categories(*)")
    .eq("month", monthStart);

  const budgetAlerts: { name: string; spent: number; limit: number; color: string; isOver: boolean }[] = [];

  if (budgets) {
    const categoryIds = budgets.map((b) => b.category_id);
    const { data: budgetTransactions } = await supabase
      .from("transactions")
      .select("category_id, amount, status")
      .in("category_id", categoryIds)
      .gte("date", monthStart)
      .lte("date", monthEnd);

    const spentByCategory = new Map<string, number>();
    budgetTransactions?.filter((t) => includePending || t.status !== "pending").forEach((t) => {
      const current = spentByCategory.get(t.category_id) ?? 0;
      spentByCategory.set(t.category_id, current + parseFloat(String(t.amount)));
    });

    for (const b of budgets) {
      const spent = spentByCategory.get(b.category_id) ?? 0;
      const percentage = (spent / b.limit_amount) * 100;
      if (percentage >= 80) {
        budgetAlerts.push({
          name: b.category?.name ?? "Sem categoria",
          spent,
          limit: b.limit_amount,
          color: b.category?.color ?? "#6b7280",
          isOver: spent > b.limit_amount,
        });
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          Bem-vindo, {user?.user_metadata?.name ?? "usuário"}!
        </p>
        <DashboardFilters />
      </div>

      {budgetAlerts.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Alertas de orçamento
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {budgetAlerts.map((alert) => (
              <div
                key={alert.name}
                className={`flex items-center gap-3 rounded-lg border p-3 ${
                  alert.isOver
                    ? "border-destructive bg-destructive/5"
                    : "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"
                }`}
              >
                {alert.isOver ? (
                  <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
                ) : (
                  <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-500" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: alert.color }}
                    />
                    <p className="truncate text-sm font-medium">{alert.name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(alert.spent)} / {formatCurrency(alert.limit)}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    alert.isOver
                      ? "border-destructive text-destructive"
                      : "border-yellow-500 text-yellow-600"
                  }
                >
                  {alert.isOver ? "Estourado" : `${Math.round((alert.spent / alert.limit) * 100)}%`}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      <BalanceCard
        balance={totalBalance}
        income={monthIncome}
        expense={monthExpense}
      />

      <div className="grid gap-6 lg:grid-cols-3">
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
              Receitas por categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart data={Array.from(incomeByCategory.values())} />
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

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Transações vencidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionList transactions={overdueTransactions ?? []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Próximas transações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionList transactions={nextTransactions ?? []} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

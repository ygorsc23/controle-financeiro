import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PieChart } from "@/components/charts/PieChart";
import { AreaChart } from "@/components/charts/AreaChart";
import { ReportExport } from "@/components/reports/ReportExport";

export default async function ReportsPage() {
  const supabase = await createClient();
  const now = new Date();

  // Last 12 months
  const monthlyData: { month: string; income: number; expense: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = d.toISOString().split("T")[0];
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
      .toISOString().split("T")[0];
    const label = d.toLocaleString("pt-BR", { month: "short", year: "2-digit" });

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

  const totalIncome = monthlyData.reduce((s, m) => s + m.income, 0);
  const totalExpense = monthlyData.reduce((s, m) => s + m.expense, 0);
  const totalBalance12 = totalIncome - totalExpense;

  // Full year expenses by category
  const yearStart = new Date(now.getFullYear(), 0, 1)
    .toISOString().split("T")[0];
  const yearEnd = new Date(now.getFullYear(), 11, 31)
    .toISOString().split("T")[0];

  const { data: yearTransactions } = await supabase
    .from("transactions")
    .select("type, amount, category:categories(name, color)")
    .gte("date", yearStart)
    .lte("date", yearEnd);

  const expenseByCategory = new Map<
    string,
    { name: string; value: number; color: string }
  >();

  yearTransactions
    ?.filter((t) => t.type === "expense")
    .forEach((t) => {
      const name = (t.category as unknown as { name?: string })?.name ?? "Sem categoria";
      const color = (t.category as unknown as { color?: string })?.color ?? "#6b7280";
      const existing = expenseByCategory.get(name);
      const amount = parseFloat(String(t.amount));
      if (existing) {
        existing.value += amount;
      } else {
        expenseByCategory.set(name, { name, value: amount, color });
      }
    });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Receitas (12 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totalIncome)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Despesas (12 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totalExpense)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Saldo (12 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${totalBalance12 < 0 ? "text-destructive" : "text-green-600"}`}>
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totalBalance12)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <ReportExport
          monthlyData={monthlyData}
          categoryData={Array.from(expenseByCategory.values())}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Evolução mensal (12 meses)</CardTitle>
        </CardHeader>
        <CardContent>
          <AreaChart data={monthlyData} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gastos por categoria (ano)</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart data={Array.from(expenseByCategory.values())} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top categorias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from(expenseByCategory.values())
                .sort((a, b) => b.value - a.value)
                .slice(0, 10)
                .map((cat, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="flex-1 text-sm">{cat.name}</span>
                    <span className="text-sm font-medium tabular-nums">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(cat.value)}
                    </span>
                  </div>
                ))}
              {expenseByCategory.size === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhuma despesa no ano
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

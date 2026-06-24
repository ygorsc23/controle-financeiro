import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { RecurringFilters } from "@/components/transactions/RecurringFilters";
import { Repeat, ChevronRight } from "lucide-react";

const frequencyLabels: Record<string, string> = {
  daily: "Diário",
  weekly: "Semanal",
  monthly: "Mensal",
  yearly: "Anual",
};

const statusColors: Record<string, "default" | "secondary" | "success"> = {
  active: "success",
  paused: "secondary",
  finished: "default",
};

export default async function RecurringPage(props: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  let query = supabase
    .from("recurring_transactions")
    .select("*, account:accounts(*), category:categories(*)");

  if (searchParams.type) {
    query = query.eq("type", searchParams.type);
  }

  if (searchParams.category_id) {
    query = query.eq("category_id", searchParams.category_id);
  }

  query = query.order("created_at", { ascending: false });

  const { data: rules } = await query;

  return (
    <div className="space-y-6">
      <RecurringFilters categories={categories ?? []} />

      <p className="text-sm text-muted-foreground">
        {rules?.length ?? 0} regras recorrentes
      </p>

      {rules && rules.length > 0 ? (
        <div className="space-y-1">
          {rules.map((rule) => (
            <Link key={rule.id} href={`/recurring/${rule.id}`}>
              <Card className="transition-colors hover:bg-accent/50">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Repeat className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">
                          {rule.description || "Sem descrição"}
                        </p>
                        <Badge
                          variant={statusColors[rule.status]}
                          className="shrink-0 text-[10px] px-1.5 py-0"
                        >
                          {rule.status === "active"
                            ? "Ativo"
                            : rule.status === "paused"
                            ? "Pausado"
                            : "Finalizado"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatCurrency(rule.amount)} ·{" "}
                        {frequencyLabels[rule.frequency]} ·{" "}
                        {rule.occurrences_created} ocorrências
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-muted-foreground">Nenhuma transação recorrente</p>
          <Link href="/transactions/new">
            <Button variant="outline">Nova transação</Button>
          </Link>
        </div>
      )}
    </div>
  );
}

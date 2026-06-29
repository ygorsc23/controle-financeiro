import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TransactionList } from "@/components/transactions/TransactionList";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

const frequencyLabels: Record<string, string> = {
  daily: "Diário",
  weekly: "Semanal",
  monthly: "Mensal",
  yearly: "Anual",
};

export default async function RecurringDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: rule } = await supabase
    .from("recurring_transactions")
    .select("*, account:accounts!transactions_account_id_fkey(*), category:categories(*)")
    .eq("id", id)
    .single();

  if (!rule) notFound();

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*, account:accounts!transactions_account_id_fkey(*), category:categories(*), subcategory:subcategories(*)")
    .eq("recurring_id", id)
    .order("date", { ascending: true });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/recurring"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para recorrentes
      </Link>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">
          {rule.description || "Sem descrição"}
        </h2>
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <span>{formatCurrency(rule.amount)}</span>
          <span>·</span>
          <span>
            {frequencyLabels[rule.frequency]}
            {rule.interval_value > 1 ? ` (a cada ${rule.interval_value})` : ""}
          </span>
          <span>·</span>
          <span>{rule.occurrences_created} ocorrências geradas</span>
          <span>·</span>
          <Badge
            variant={
              rule.status === "active"
                ? "success"
                : rule.status === "paused"
                ? "secondary"
                : "default"
            }
          >
            {rule.status === "active"
              ? "Ativo"
              : rule.status === "paused"
              ? "Pausado"
              : "Finalizado"}
          </Badge>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Transações geradas ({transactions?.length ?? 0})
        </h3>
        <TransactionList transactions={transactions ?? []} />
      </div>
    </div>
  );
}

import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default async function InstallmentDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*, category:categories(*)")
    .eq("installment_group_id", id)
    .order("installment_number");

  if (!transactions || transactions.length === 0) notFound();

  const first = transactions[0];
  const totalAmount = transactions.reduce(
    (s, t) => s + parseFloat(String(t.amount)),
    0
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/installments"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para parcelas
      </Link>

      <div>
        <h2 className="text-lg font-semibold">
          {first.description || "Sem descrição"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {transactions.length}x de {formatCurrency(first.amount)} · Total{" "}
          {formatCurrency(totalAmount)}
        </p>
      </div>

      <div className="space-y-2">
        {transactions.map((t) => {
          const isPast = new Date(t.date) <= new Date();
          return (
            <div
              key={t.id}
              className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
                isPast ? "" : "opacity-50"
              }`}
            >
              <div className="flex items-center gap-3">
                {t.category && (
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: t.category.color }}
                  />
                )}
                <div>
                  <p className="text-sm font-medium">
                    Parcela {t.installment_number}/{t.installment_total}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(t.date)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tabular-nums">
                  {formatCurrency(t.amount)}
                </span>
                <Badge
                  variant={isPast ? "success" : "outline"}
                  className="text-[10px] px-1.5 py-0"
                >
                  {isPast ? "Paga" : "Pendente"}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

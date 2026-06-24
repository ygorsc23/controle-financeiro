import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { TransactionList } from "@/components/transactions/TransactionList";
import { ArrowLeft } from "lucide-react";
import type { Account } from "@/types";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function getPeriodStart(year: number, month: number, closingDay: number): string {
  const startMonth = month === 0 ? 11 : month - 1;
  const startYear = month === 0 ? year - 1 : year;
  const d = new Date(startYear, startMonth, closingDay + 1);
  return d.toISOString().split("T")[0];
}

function getPeriodEnd(year: number, month: number, closingDay: number): string {
  const d = new Date(year, month, closingDay);
  return d.toISOString().split("T")[0];
}

type InvoiceStatus = "open" | "closed" | "overdue";

function getInvoiceStatus(closingDate: Date, dueDate: Date): InvoiceStatus {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  if (now <= closingDate) return "open";
  if (now <= dueDate) return "closed";
  return "overdue";
}

const statusConfig: Record<InvoiceStatus, { label: string; variant: "secondary" | "success" | "destructive" }> = {
  open: { label: "Aberta", variant: "secondary" },
  closed: { label: "Fechada", variant: "success" },
  overdue: { label: "Vencida", variant: "destructive" },
};

export default async function CreditCardDetailPage(props: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const accountId = searchParams.accountId;
  const period = searchParams.period;

  if (!accountId || !period) notFound();

  const match = period.match(/^(\d{4})-(\d{2})$/);
  if (!match) notFound();

  const year = parseInt(match[1]);
  const month = parseInt(match[2]) - 1;

  const supabase = await createClient();

  const { data: account } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", accountId)
    .single<Account>();

  if (!account || account.type !== "credit") notFound();

  const closingDay = account.closing_day ?? 1;
  const dueDay = account.due_day ?? 15;

  const startDate = getPeriodStart(year, month, closingDay);
  const endDate = getPeriodEnd(year, month, closingDay);

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*, account:accounts(*), category:categories(*), subcategory:subcategories(*)")
    .eq("account_id", accountId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });

  const totalAmount = (transactions ?? []).reduce(
    (sum, t) => sum + Number(t.amount),
    0
  );

  const closingDate = new Date(year, month, closingDay);
  const dueDate = new Date(year, month, dueDay);
  const status = getInvoiceStatus(closingDate, dueDate);
  const config = statusConfig[status];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/credit-cards"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para faturas
      </Link>

      <div className="space-y-1">
        <h2 className="text-lg font-semibold">
          {account.name} - {MONTH_NAMES[month]}/{year}
        </h2>
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <span>{formatCurrency(totalAmount)}</span>
          <span>·</span>
          <span>
            Vencimento{" "}
            {String(dueDate.getDate()).padStart(2, "0")}/
            {String(dueDate.getMonth() + 1).padStart(2, "0")}/{dueDate.getFullYear()}
          </span>
          <span>·</span>
          <Badge variant={config.variant} className="text-[10px] px-1.5 py-0">
            {config.label}
          </Badge>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Transações ({transactions?.length ?? 0})
        </h3>
        <TransactionList transactions={transactions ?? []} />
      </div>
    </div>
  );
}

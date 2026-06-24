import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { CreditCard, ChevronRight } from "lucide-react";
import type { Account } from "@/types";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

interface InvoicePeriod {
  year: number;
  month: number;
  label: string;
}

function getInvoicePeriod(date: Date, closingDay: number): InvoicePeriod {
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();

  let invoiceMonth: number;
  let invoiceYear: number;

  if (day > closingDay) {
    if (month === 11) {
      invoiceYear = year + 1;
      invoiceMonth = 0;
    } else {
      invoiceYear = year;
      invoiceMonth = month + 1;
    }
  } else {
    invoiceYear = year;
    invoiceMonth = month;
  }

  return {
    year: invoiceYear,
    month: invoiceMonth,
    label: `${MONTH_NAMES[invoiceMonth]}/${invoiceYear}`,
  };
}

function getClosingDate(year: number, month: number, closingDay: number): Date {
  return new Date(year, month, closingDay);
}

function getDueDate(year: number, month: number, dueDay: number): Date {
  return new Date(year, month, dueDay);
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

interface InvoiceSummary {
  period: InvoicePeriod;
  totalAmount: number;
  transactionCount: number;
  dueDate: Date;
  status: InvoiceStatus;
}

export default async function CreditCardsPage() {
  const supabase = await createClient();

  const { data: accounts } = await supabase
    .from("accounts")
    .select("*")
    .eq("type", "credit")
    .order("name");

  if (!accounts || accounts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <CreditCard className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Nenhum cartão de crédito cadastrado</p>
        <Link href="/accounts/new">
          <Button variant="outline">Nova conta</Button>
        </Link>
      </div>
    );
  }

  const accountIds = accounts.map((a) => a.id);

  const { data: rawTransactions } = await supabase
    .from("transactions")
    .select("*, category:categories(*)")
    .in("account_id", accountIds)
    .order("date", { ascending: false });

  const transactions = rawTransactions ?? [];

  const txByAccount = new Map<string, typeof transactions>();
  for (const t of transactions) {
    const list = txByAccount.get(t.account_id) ?? [];
    list.push(t);
    txByAccount.set(t.account_id, list);
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const accountsWithInvoices = accounts.map((account) => {
    const accountTransactions = txByAccount.get(account.id) ?? [];
    const closingDay = account.closing_day ?? 1;
    const dueDay = account.due_day ?? 15;

    const invoiceMap = new Map<string, InvoiceSummary>();

    for (const t of accountTransactions) {
      const period = getInvoicePeriod(new Date(t.date), closingDay);
      const key = `${period.year}-${String(period.month + 1).padStart(2, "0")}`;

      const existing = invoiceMap.get(key);
      const amount = Number(t.amount);

      if (existing) {
        existing.totalAmount += amount;
        existing.transactionCount++;
      } else {
        const closingDate = getClosingDate(period.year, period.month, closingDay);
        const dueDate = getDueDate(period.year, period.month, dueDay);
        invoiceMap.set(key, {
          period,
          totalAmount: amount,
          transactionCount: 1,
          dueDate,
          status: getInvoiceStatus(closingDate, dueDate),
        });
      }
    }

    const invoices = Array.from(invoiceMap.values()).sort((a, b) => {
      const aKey = `${a.period.year}${String(a.period.month + 1).padStart(2, "0")}`;
      const bKey = `${b.period.year}${String(b.period.month + 1).padStart(2, "0")}`;
      return bKey.localeCompare(aKey);
    });

    return { account, invoices };
  });

  const hasAnyInvoice = accountsWithInvoices.some((a) => a.invoices.length > 0);

  return (
    <div className="space-y-8">
      {accountsWithInvoices.map(({ account, invoices }) => (
        <section key={account.id}>
          <div className="flex items-center gap-3 mb-4">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${account.color}20` }}
            >
              <CreditCard className="h-4 w-4" style={{ color: account.color }} />
            </div>
            <div>
              <h2 className="font-semibold">{account.name}</h2>
              <p className="text-xs text-muted-foreground">
                Fechamento dia {account.closing_day} · Vencimento dia {account.due_day}
              </p>
            </div>
          </div>

          {invoices.length > 0 ? (
            <div className="space-y-1">
              {invoices.map((inv) => {
                const config = statusConfig[inv.status];
                return (
                  <Link
                    key={`${account.id}-${inv.period.year}-${inv.period.month}`}
                    href={`/credit-cards/detail?accountId=${account.id}&period=${inv.period.year}-${String(inv.period.month + 1).padStart(2, "0")}`}
                  >
                    <Card className="transition-colors hover:bg-accent/50">
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                            style={{ backgroundColor: `${account.color}15` }}
                          >
                            <span className="text-xs font-bold" style={{ color: account.color }}>
                              {String(inv.period.month + 1).padStart(2, "0")}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="truncate font-medium">{inv.period.label}</p>
                              <Badge
                                variant={config.variant}
                                className="shrink-0 text-[10px] px-1.5 py-0"
                              >
                                {config.label}
                              </Badge>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {formatCurrency(inv.totalAmount)} · Venc{" "}
                              {String(inv.dueDate.getDate()).padStart(2, "0")}/
                              {String(inv.dueDate.getMonth() + 1).padStart(2, "0")} ·{" "}
                              {inv.transactionCount}{" "}
                              {inv.transactionCount === 1 ? "transação" : "transações"}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4">
              Nenhuma fatura encontrada para este cartão
            </p>
          )}
        </section>
      ))}

      {!hasAnyInvoice && (
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <p className="text-muted-foreground">
            Nenhuma transação encontrada nos cartões de crédito
          </p>
          <Link href="/transactions/new">
            <Button variant="outline">Nova transação</Button>
          </Link>
        </div>
      )}
    </div>
  );
}

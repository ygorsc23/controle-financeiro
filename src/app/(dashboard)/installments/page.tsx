import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface InstallmentGroup {
  id: string;
  description: string;
  categoryName: string;
  categoryColor: string;
  accountName: string;
  totalAmount: number;
  totalCount: number;
  paidCount: number;
}

export default async function InstallmentsPage() {
  const supabase = await createClient();

  const { data: raw } = await supabase
    .from("transactions")
    .select("*, account:accounts(*), category:categories(*)")
    .not("installment_group_id", "is", null)
    .order("installment_group_id")
    .order("installment_number");

  const transactions = raw ?? [];

  const groupMap = new Map<string, InstallmentGroup>();

  for (const t of transactions) {
    const gid = t.installment_group_id!;
    const existing = groupMap.get(gid);

    if (existing) {
      existing.totalAmount += parseFloat(String(t.amount));
      existing.totalCount++;
      if (new Date(t.date) <= new Date()) existing.paidCount++;
    } else {
      groupMap.set(gid, {
        id: gid,
        description: t.description ?? "Sem descrição",
        categoryName: (t.category as unknown as { name?: string })?.name ?? "",
        categoryColor: (t.category as unknown as { color?: string })?.color ?? "",
        accountName: (t.account as unknown as { name?: string })?.name ?? "",
        totalAmount: parseFloat(String(t.amount)),
        totalCount: 1,
        paidCount: new Date(t.date) <= new Date() ? 1 : 0,
      });
    }
  }

  const groups = Array.from(groupMap.values());

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {groups.length} compras parceladas
      </p>

      {groups.length > 0 ? (
        <div className="space-y-1">
          {groups.map((g) => (
            <Link key={g.id} href={`/installments/${g.id}`}>
              <Card className="transition-colors hover:bg-accent/50">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{g.description}</p>
                      {g.categoryName && (
                        <Badge
                          variant="outline"
                          className="shrink-0 text-[10px] px-1.5 py-0"
                        >
                          {g.categoryName}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {g.accountName} · {formatCurrency(g.totalAmount)} ·{" "}
                      {g.paidCount}/{g.totalCount} pagas
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-muted-foreground">Nenhuma compra parcelada</p>
          <Link href="/transactions/new">
            <Button variant="outline">Nova transação</Button>
          </Link>
        </div>
      )}
    </div>
  );
}

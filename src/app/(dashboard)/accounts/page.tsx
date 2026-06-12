import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { AccountCard } from "@/components/accounts/AccountCard";
import { Plus } from "lucide-react";

export default async function AccountsPage() {
  const supabase = await createClient();

  const { data: accounts } = await supabase
    .from("accounts")
    .select("*")
    .order("type")
    .order("name");

  const total = accounts?.reduce((sum, a) => sum + parseFloat(String(a.balance)), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {accounts?.length ?? 0} contas · Saldo total:{" "}
          <span className="font-semibold text-foreground">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(total)}
          </span>
        </p>
        <Link href="/accounts/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova conta
          </Button>
        </Link>
      </div>

      {accounts && accounts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-muted-foreground">Nenhuma conta cadastrada</p>
          <Link href="/accounts/new">
            <Button variant="outline">Criar primeira conta</Button>
          </Link>
        </div>
      )}
    </div>
  );
}

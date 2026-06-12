import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccountForm } from "@/components/accounts/AccountForm";

export default async function EditAccountPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: account } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", id)
    .single();

  if (!account) notFound();

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Editar conta</h2>
        <p className="text-sm text-muted-foreground">{account.name}</p>
      </div>
      <AccountForm account={account} />
    </div>
  );
}

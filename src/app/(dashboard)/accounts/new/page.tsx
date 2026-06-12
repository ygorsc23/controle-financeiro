import { AccountForm } from "@/components/accounts/AccountForm";

export default function NewAccountPage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Nova conta</h2>
        <p className="text-sm text-muted-foreground">
          Adicione uma conta bancária ou carteira
        </p>
      </div>
      <AccountForm />
    </div>
  );
}

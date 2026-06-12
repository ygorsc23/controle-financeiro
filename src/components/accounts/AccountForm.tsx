"use client";

import { useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createAccount,
  updateAccount,
  type AccountState,
} from "@/lib/actions/accounts";
import { ACCOUNT_COLORS } from "@/lib/constants";
import type { Account } from "@/types";

interface AccountFormProps {
  account?: Account;
}

export function AccountForm({ account }: AccountFormProps) {
  const router = useRouter();
  const action = (account ? updateAccount : createAccount) as (
    prevState: AccountState,
    formData: FormData
  ) => Promise<AccountState>;
  const [state, formAction, pending] = useActionState(action, undefined);
  const [type, setType] = useState<"checking" | "savings" | "credit">(account?.type ?? "checking");

  return (
    <form action={formAction} className="space-y-6">
      {account && <input type="hidden" name="id" value={account.id} />}

      {state?.error && (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Nome da conta</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={account?.name}
          placeholder="Ex: Nubank, Itaú, Carteira"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Tipo</Label>
        <select
          id="type"
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as "checking" | "savings" | "credit")}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          required
        >
          <option value="checking">Conta Corrente</option>
          <option value="savings">Poupança</option>
          <option value="credit">Cartão de Crédito</option>
        </select>
      </div>

      {!account && (
        <div className="space-y-2">
          <Label htmlFor="balance">Saldo inicial</Label>
          <Input
            id="balance"
            name="balance"
            type="number"
            step="0.01"
            defaultValue="0"
            placeholder="0,00"
          />
        </div>
      )}

      {type === "credit" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="closing_day">Dia de fechamento</Label>
            <Input
              id="closing_day"
              name="closing_day"
              type="number"
              min="1"
              max="31"
              defaultValue={account?.closing_day ?? ""}
              placeholder="Ex: 15"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="due_day">Dia de vencimento</Label>
            <Input
              id="due_day"
              name="due_day"
              type="number"
              min="1"
              max="31"
              defaultValue={account?.due_day ?? ""}
              placeholder="Ex: 5"
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>Cor</Label>
        <div className="flex flex-wrap gap-2">
          {ACCOUNT_COLORS.map((c) => (
            <label key={c.value} className="cursor-pointer">
              <input
                type="radio"
                name="color"
                value={c.value}
                defaultChecked={
                  account?.color === c.value ||
                  (!account && c.value === "#6366f1")
                }
                className="sr-only peer"
              />
              <div
                className="h-8 w-8 rounded-full border-2 transition-transform peer-checked:scale-110 peer-checked:border-foreground"
                style={{ backgroundColor: c.value }}
                title={c.name}
              />
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : account ? "Atualizar" : "Criar conta"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

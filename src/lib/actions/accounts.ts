"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureProfileExists } from "@/lib/utils";

export type AccountState = { error: string } | undefined;

export async function createAccount(prevState: AccountState, formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  await ensureProfileExists(supabase, user.id);

  const type = formData.get("type") as string;

  const payload: Record<string, unknown> = {
    user_id: user.id,
    name: formData.get("name"),
    type,
    balance: parseFloat(formData.get("balance") as string) || 0,
    color: formData.get("color"),
  };

  if (type === "credit") {
    payload.closing_day = parseInt(formData.get("closing_day") as string) || null;
    payload.due_day = parseInt(formData.get("due_day") as string) || null;
  }

  const { error } = await supabase.from("accounts").insert(payload);

  if (error) return { error: error.message };

  revalidatePath("/accounts");
  redirect("/accounts");
}

export async function updateAccount(prevState: AccountState, formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;
  const type = formData.get("type") as string;

  const payload: Record<string, unknown> = {
    name: formData.get("name"),
    type,
    color: formData.get("color"),
  };

  if (type === "credit") {
    payload.closing_day = parseInt(formData.get("closing_day") as string) || null;
    payload.due_day = parseInt(formData.get("due_day") as string) || null;
  } else {
    payload.closing_day = null;
    payload.due_day = null;
  }

  const { error } = await supabase.from("accounts").update(payload).eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/accounts");
  redirect("/accounts");
}

export async function deleteAccount(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("accounts").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/accounts");
}

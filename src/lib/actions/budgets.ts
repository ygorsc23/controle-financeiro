"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureProfileExists } from "@/lib/utils";

export type BudgetState = { error: string } | undefined;

export async function createBudget(prevState: BudgetState, formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  await ensureProfileExists(supabase, user.id);

  const month = formData.get("month") as string;
  const [year, monthNum] = month.split("-");
  const firstDay = `${year}-${monthNum}-01`;

  const { error } = await supabase.from("budgets").insert({
    user_id: user.id,
    category_id: formData.get("category_id") as string,
    month: firstDay,
    limit_amount: parseFloat(formData.get("limit_amount") as string),
  });

  if (error) return { error: error.message };

  revalidatePath("/budgets");
  redirect("/budgets");
}

export async function updateBudget(prevState: BudgetState, formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;

  const { error } = await supabase
    .from("budgets")
    .update({
      limit_amount: parseFloat(formData.get("limit_amount") as string),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/budgets");
  redirect("/budgets");
}

export async function deleteBudget(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("budgets").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/budgets");
}

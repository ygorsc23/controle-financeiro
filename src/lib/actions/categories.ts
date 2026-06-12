"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureProfileExists } from "@/lib/utils";

export type CategoryState = { error: string } | undefined;

export async function createCategory(prevState: CategoryState, formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  await ensureProfileExists(supabase, user.id);

  const { error } = await supabase.from("categories").insert({
    user_id: user.id,
    name: formData.get("name") as string,
    type: formData.get("type") as "income" | "expense",
    color: formData.get("color") as string,
    icon: formData.get("icon") as string | null,
  });

  if (error) return { error: error.message };

  revalidatePath("/categories");
  redirect("/categories");
}

export async function updateCategory(prevState: CategoryState, formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;

  const { error } = await supabase
    .from("categories")
    .update({
      name: formData.get("name") as string,
      type: formData.get("type") as "income" | "expense",
      color: formData.get("color") as string,
      icon: formData.get("icon") as string | null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/categories");
  redirect("/categories");
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/categories");
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureProfileExists } from "@/lib/utils";

export type SubcategoryState = { error: string } | undefined;

export async function createSubcategory(prevState: SubcategoryState, formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  await ensureProfileExists(supabase, user.id);

  const categoryId = formData.get("category_id") as string;

  const { error } = await supabase.from("subcategories").insert({
    user_id: user.id,
    category_id: categoryId,
    name: formData.get("name") as string,
  });

  if (error) return { error: error.message };

  revalidatePath(`/categories/${categoryId}`);
  redirect(`/categories/${categoryId}`);
}

export async function updateSubcategory(prevState: SubcategoryState, formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;
  const categoryId = formData.get("category_id") as string;

  const { error } = await supabase
    .from("subcategories")
    .update({ name: formData.get("name") as string })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(`/categories/${categoryId}`);
  redirect(`/categories/${categoryId}`);
}

export async function deleteSubcategory(id: string, categoryId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("subcategories").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(`/categories/${categoryId}`);
}

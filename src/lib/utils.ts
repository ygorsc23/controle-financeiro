import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { SupabaseClient } from "@supabase/supabase-js";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function ensureProfileExists(
  supabase: SupabaseClient,
  userId: string,
  name?: string
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    await supabase.from("profiles").insert({
      id: userId,
      name: name || null,
    });
  }
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
}

export function formatDateISO(date: string | Date): string {
  const d = new Date(date);
  return d.toISOString().split("T")[0];
}

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { SupabaseClient } from "@supabase/supabase-js";
import { format } from "date-fns/format";
import parseISO from "date-fns/parseISO";
import { ptBR } from "date-fns/locale/pt-BR";

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
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd/MM/yyyy", { locale: ptBR });
}

export function formatDateISO(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "yyyy-MM-dd");
}

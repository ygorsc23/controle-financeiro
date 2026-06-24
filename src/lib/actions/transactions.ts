"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureProfileExists } from "@/lib/utils";
import type { TransactionStatus } from "@/types";

export type TransactionState = { error: string } | undefined;

async function updateAccountBalance(
  supabase: Awaited<ReturnType<typeof createClient>>,
  accountId: string,
  amount: number,
  type: "income" | "expense",
  operation: "add" | "subtract" = "add"
) {
  const factor = operation === "add" ? 1 : -1;
  const signal = type === "income" ? 1 : -1;

  const { data: account } = await supabase
    .from("accounts")
    .select("balance")
    .eq("id", accountId)
    .single();

  if (account) {
    const newBalance = parseFloat(String(account.balance)) + factor * signal * amount;
    await supabase
      .from("accounts")
      .update({ balance: newBalance })
      .eq("id", accountId);
  }
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function addInterval(date: Date, frequency: string, interval: number): Date {
  const d = new Date(date);
  switch (frequency) {
    case "daily": d.setDate(d.getDate() + interval); break;
    case "weekly": d.setDate(d.getDate() + 7 * interval); break;
    case "monthly": d.setMonth(d.getMonth() + interval); break;
    case "yearly": d.setFullYear(d.getFullYear() + interval); break;
  }
  return d;
}

export async function createTransaction(prevState: TransactionState, formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  await ensureProfileExists(supabase, user.id);

  const accountId = formData.get("account_id") as string;
  const type = formData.get("type") as "income" | "expense";
  const amount = parseFloat(formData.get("amount") as string);
  const date = formData.get("date") as string;
  const isInstallment = formData.get("is_installment") === "true";
  const isRecurring = formData.get("is_recurring") === "true";

  const status = formData.get("status") as string || "pending";

  const baseTransaction = {
    user_id: user.id,
    account_id: accountId,
    category_id: formData.get("category_id") || null,
    subcategory_id: formData.get("subcategory_id") || null,
    type,
    amount,
    description: formData.get("description") as string || null,
    date,
  };

  try {
    if (isInstallment) {
      const totalInstallments = parseInt(formData.get("installment_total") as string);
      const installmentGroupId = crypto.randomUUID();

      const totalCents = Math.round(amount * 100);
      const baseCents = Math.floor(totalCents / totalInstallments);
      const remainderCents = totalCents - baseCents * totalInstallments;

      for (let i = 1; i <= totalInstallments; i++) {
        const installmentDate = addMonths(new Date(date), i - 1)
          .toISOString()
          .split("T")[0];

        const installmentStatus = i === 1 ? status : "pending";

        const installmentCents = i === totalInstallments
          ? baseCents + remainderCents
          : baseCents;
        const installmentAmount = installmentCents / 100;

        const { error } = await supabase.from("transactions").insert({
          ...baseTransaction,
          amount: installmentAmount,
          date: installmentDate,
          status: installmentStatus,
          installment_group_id: installmentGroupId,
          installment_number: i,
          installment_total: totalInstallments,
        });

        if (error) return { error: error.message };
      }

      if (status === "paid" || status === "received") {
        await updateAccountBalance(supabase, accountId, baseCents / 100, type);
      }
    } else if (isRecurring) {
      const frequency = formData.get("frequency") as string;
      const intervalValue = parseInt(formData.get("interval_value") as string) || 1;
      const totalOccurrences = parseInt(formData.get("total_occurrences") as string);

      // Create recurring rule
      const { data: rule, error: ruleError } = await supabase
        .from("recurring_transactions")
        .insert({
          user_id: user.id,
          account_id: accountId,
          category_id: baseTransaction.category_id,
          subcategory_id: baseTransaction.subcategory_id,
          type,
          amount,
          description: baseTransaction.description,
          frequency,
          interval_value: intervalValue,
          total_occurrences: totalOccurrences,
          occurrences_created: totalOccurrences,
          start_date: date,
          status: "active",
        })
        .select("id")
        .single();

      if (ruleError) return { error: ruleError.message };

      for (let i = 0; i < totalOccurrences; i++) {
        const occurrenceDate = addInterval(new Date(date), frequency, i * intervalValue)
          .toISOString()
          .split("T")[0];

        const occurrenceStatus = i === 0 ? status : "pending";

        const { error } = await supabase.from("transactions").insert({
          ...baseTransaction,
          date: occurrenceDate,
          status: occurrenceStatus,
          recurring_id: rule.id,
          is_recurring: true,
        });

        if (error) return { error: error.message };
      }

      if (status === "paid" || status === "received") {
        await updateAccountBalance(supabase, accountId, amount, type);
      }
    } else {
      const { error } = await supabase.from("transactions").insert({
        ...baseTransaction,
        status,
      });
      if (error) return { error: error.message };

      if (status === "paid" || status === "received") {
        await updateAccountBalance(supabase, accountId, amount, type);
      }
    }
  } catch {
    return { error: "Erro ao criar transação" };
  }

  revalidatePath("/transactions");
  revalidatePath("/");
  redirect("/transactions");
}

export async function updateTransaction(prevState: TransactionState, formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;

  // Get original transaction to revert balance
  const { data: original } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .single();

  if (!original) return { error: "Transação não encontrada" };

  const wasBalanceAffected = original.status === "paid" || original.status === "received";

  // Revert original balance if it was applied
  if (wasBalanceAffected) {
    await updateAccountBalance(
      supabase,
      original.account_id,
      parseFloat(String(original.amount)),
      original.type,
      "subtract"
    );
  }

  const type = formData.get("type") as "income" | "expense";
  const amount = parseFloat(formData.get("amount") as string);
  const status = formData.get("status") as string || "pending";

  const { error } = await supabase
    .from("transactions")
    .update({
      account_id: formData.get("account_id") as string,
      category_id: formData.get("category_id") || null,
      subcategory_id: formData.get("subcategory_id") || null,
      type,
      amount,
      description: formData.get("description") as string || null,
      date: formData.get("date") as string,
      status,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  // Apply new balance if status is paid/received
  const shouldUpdateBalance = status === "paid" || status === "received";
  if (shouldUpdateBalance) {
    await updateAccountBalance(
      supabase,
      formData.get("account_id") as string,
      amount,
      type
    );
  }

  revalidatePath("/transactions");
  revalidatePath("/");
  redirect("/transactions");
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient();

  const { data: transaction } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .single();

  if (!transaction) return { error: "Transação não encontrada" };

  // Revert balance only if it was previously affected
  const wasBalanceAffected = transaction.status === "paid" || transaction.status === "received";
  if (wasBalanceAffected) {
    await updateAccountBalance(
      supabase,
      transaction.account_id,
      parseFloat(String(transaction.amount)),
      transaction.type,
      "subtract"
    );
  }

  const { error } = await supabase.from("transactions").delete().eq("id", id);

  if (error) return { error: error.message };

  if (transaction.recurring_id) {
    const { count } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("recurring_id", transaction.recurring_id);

    if (count === 0) {
      await supabase
        .from("recurring_transactions")
        .delete()
        .eq("id", transaction.recurring_id);
    }
  }

  revalidatePath("/transactions");
  revalidatePath("/recurring");
  revalidatePath("/");
}

export async function quickUpdateTransactionStatus(
  id: string,
  newStatus: TransactionStatus
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { data: original } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .single();

  if (!original) return { error: "Transação não encontrada" };

  const wasEffective = original.status === "paid" || original.status === "received";
  if (wasEffective) {
    await updateAccountBalance(
      supabase,
      original.account_id,
      parseFloat(String(original.amount)),
      original.type,
      "subtract"
    );
  }

  const { error } = await supabase
    .from("transactions")
    .update({ status: newStatus })
    .eq("id", id);

  if (error) return { error: error.message };

  const willBeEffective = newStatus === "paid" || newStatus === "received";
  if (willBeEffective) {
    await updateAccountBalance(
      supabase,
      original.account_id,
      parseFloat(String(original.amount)),
      original.type
    );
  }

  revalidatePath("/transactions");
  revalidatePath("/");
  return {};
}

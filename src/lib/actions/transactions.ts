"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureProfileExists } from "@/lib/utils";
import type { TransactionStatus, TransactionType } from "@/types";

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

async function adjustAccountBalance(
  supabase: Awaited<ReturnType<typeof createClient>>,
  accountId: string,
  delta: number
) {
  const { data: account } = await supabase
    .from("accounts")
    .select("balance")
    .eq("id", accountId)
    .single();

  if (account) {
    const newBalance = parseFloat(String(account.balance)) + delta;
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
  const type = formData.get("type") as TransactionType;
  const amount = parseFloat(formData.get("amount") as string);
  const date = formData.get("date") as string;
  const isRecurring = formData.get("is_recurring") === "true";

  try {
    if (type === "transfer") {
      const destinationAccountId = formData.get("destination_account_id") as string;
      if (!destinationAccountId) return { error: "Conta destino é obrigatória" };
      if (destinationAccountId === accountId) return { error: "Conta origem e destino devem ser diferentes" };

      if (isRecurring) {
        const frequency = formData.get("frequency") as string;
        const intervalValue = parseInt(formData.get("interval_value") as string) || 1;
        const totalOccurrences = parseInt(formData.get("total_occurrences") as string);

        const { data: rule, error: ruleError } = await supabase
          .from("recurring_transactions")
          .insert({
            user_id: user.id,
            account_id: accountId,
            destination_account_id: destinationAccountId,
            type,
            amount,
            description: formData.get("description") as string || null,
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

          const { error } = await supabase.from("transactions").insert({
            user_id: user.id,
            account_id: accountId,
            destination_account_id: destinationAccountId,
            type,
            amount,
            description: formData.get("description") as string || null,
            date: occurrenceDate,
            status: "paid",
            recurring_id: rule.id,
            is_recurring: true,
          });

          if (error) return { error: error.message };
        }
      } else {
        const { error } = await supabase.from("transactions").insert({
          user_id: user.id,
          account_id: accountId,
          destination_account_id: destinationAccountId,
          type,
          amount,
          description: formData.get("description") as string || null,
          date,
          status: "paid",
        });

        if (error) return { error: error.message };
      }

      await adjustAccountBalance(supabase, accountId, -amount);
      await adjustAccountBalance(supabase, destinationAccountId, amount);
    } else {
      const isInstallment = formData.get("is_installment") === "true";
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

  // Get original transaction
  const { data: original } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .single();

  if (!original) return { error: "Transação não encontrada" };

  const updateScope = formData.get("update_scope") as string || "this";
  const type = formData.get("type") as TransactionType;
  const amount = parseFloat(formData.get("amount") as string);
  const status = formData.get("status") as string || "pending";
  const description = formData.get("description") as string || null;

  // Collect transactions to update
  let transactionsToUpdate = [original];

  if (updateScope !== "this" && (original.recurring_id || original.installment_group_id)) {
    let query = supabase.from("transactions").select("*");

    if (original.recurring_id) {
      query = query.eq("recurring_id", original.recurring_id);
    } else if (original.installment_group_id) {
      query = query.eq("installment_group_id", original.installment_group_id);
    }

    const { data: linked } = await query;

    if (linked) {
      if (updateScope === "future") {
        if (original.installment_group_id) {
          transactionsToUpdate = linked.filter(
            (t) => t.installment_number! >= original.installment_number!
          );
        } else if (original.recurring_id) {
          transactionsToUpdate = linked.filter(
            (t) => t.date >= original.date
          );
        }
      } else {
        transactionsToUpdate = linked;
      }
    }
  }

  // Process each transaction
  for (const txn of transactionsToUpdate) {
    const isOriginal = txn.id === original.id;
    const originalAmount = parseFloat(String(txn.amount));

    // Revert original balance if it was applied
    const wasBalanceAffected = txn.status === "paid" || txn.status === "received";
    if (wasBalanceAffected) {
      if (txn.type === "transfer") {
        await adjustAccountBalance(supabase, txn.account_id, originalAmount);
        if (txn.destination_account_id) {
          await adjustAccountBalance(supabase, txn.destination_account_id, -originalAmount);
        }
      } else {
        await updateAccountBalance(supabase, txn.account_id, originalAmount, txn.type, "subtract");
      }
    }

    // Update fields
    if (isOriginal) {
      const updateData: Record<string, unknown> = {
        account_id: formData.get("account_id") as string,
        type,
        amount,
        description,
        date: formData.get("date") as string,
      };

      if (type === "transfer") {
        updateData.destination_account_id = formData.get("destination_account_id") || null;
        updateData.status = "paid";
        updateData.category_id = null;
        updateData.subcategory_id = null;
      } else {
        updateData.category_id = formData.get("category_id") || null;
        updateData.subcategory_id = formData.get("subcategory_id") || null;
        updateData.status = status;
      }

      const { error } = await supabase
        .from("transactions")
        .update(updateData)
        .eq("id", id);

      if (error) return { error: error.message };
    } else {
      const { error } = await supabase
        .from("transactions")
        .update({ amount, description })
        .eq("id", txn.id);

      if (error) return { error: error.message };
    }

    // Apply new balance
    const newStatus = isOriginal ? (type === "transfer" ? "paid" : status) : txn.status;
    const shouldUpdateBalance = newStatus === "paid" || newStatus === "received";
    if (shouldUpdateBalance) {
      if (type === "transfer" && isOriginal) {
        const destAccountId = formData.get("destination_account_id") as string;
        await adjustAccountBalance(supabase, formData.get("account_id") as string, -amount);
        if (destAccountId) {
          await adjustAccountBalance(supabase, destAccountId, amount);
        }
      } else if (txn.type === "transfer" && !isOriginal) {
        await adjustAccountBalance(supabase, txn.account_id, -amount);
        if (txn.destination_account_id) {
          await adjustAccountBalance(supabase, txn.destination_account_id, amount);
        }
      } else {
        const effectiveAccount = isOriginal ? formData.get("account_id") as string : txn.account_id;
        const effectiveType = isOriginal ? type : txn.type;
        await updateAccountBalance(supabase, effectiveAccount, amount, effectiveType as "income" | "expense");
      }
    }
  }

  // If recurring and propagating changes, update the recurring rule too
  if (original.recurring_id && updateScope !== "this") {
    const ruleUpdateData: Record<string, unknown> = { amount, description };
    if (type === "transfer") {
      ruleUpdateData.destination_account_id = formData.get("destination_account_id") || null;
    }
    await supabase
      .from("recurring_transactions")
      .update(ruleUpdateData)
      .eq("id", original.recurring_id);
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
    if (transaction.type === "transfer") {
      const amount = parseFloat(String(transaction.amount));
      await adjustAccountBalance(supabase, transaction.account_id, amount);
      if (transaction.destination_account_id) {
        await adjustAccountBalance(supabase, transaction.destination_account_id, -amount);
      }
    } else {
      await updateAccountBalance(
        supabase,
        transaction.account_id,
        parseFloat(String(transaction.amount)),
        transaction.type,
        "subtract"
      );
    }
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

  if (original.type === "transfer") {
    return { error: "Transferências não podem ter status alterado" };
  }

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

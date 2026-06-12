export type TransactionType = "income" | "expense";

export type AccountType = "checking" | "savings" | "credit";

export type Frequency = "daily" | "weekly" | "monthly" | "yearly";

export type RecurringStatus = "active" | "paused" | "finished";

export interface Profile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string | null;
  created_at: string;
}

export interface Subcategory {
  id: string;
  category_id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  balance: number;
  color: string;
  closing_day: number | null;
  due_day: number | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string | null;
  subcategory_id: string | null;
  type: TransactionType;
  amount: number;
  description: string | null;
  date: string;
  installment_group_id: string | null;
  installment_number: number | null;
  installment_total: number | null;
  recurring_id: string | null;
  is_recurring: boolean;
  created_at: string;
  // Joins
  category?: Category;
  subcategory?: Subcategory;
  account?: Account;
}

export interface RecurringTransaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string | null;
  subcategory_id: string | null;
  type: TransactionType;
  amount: number;
  description: string | null;
  frequency: Frequency;
  interval_value: number;
  total_occurrences: number | null;
  occurrences_created: number;
  start_date: string;
  end_date: string | null;
  status: RecurringStatus;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  month: string;
  limit_amount: number;
  created_at: string;
  // Joins
  category?: Category;
}

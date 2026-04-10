export interface CategoryInfo {
  id: string;
  name: string;
  color: string;
  transactionCount: number;
  totalAmount: number;
  lastAssignedMerchant?: string;
  lastAssignedDate?: string;
}

/** A user-defined category persisted in the database. */
export interface UserCategory {
  id: string;
  name: string;
  color: string;
  display_order: number | null;
  transaction_count: number;
  created_at: string;
  updated_at: string;
}

/** Filter mode for the categorize transaction list. */
export type TransactionFilter = 'uncategorized' | 'all' | string;

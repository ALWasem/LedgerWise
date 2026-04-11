export interface CategoryInfo {
  id: string;
  name: string;
  colorId: number;
  transactionCount: number;
  totalAmount: number;
  lastAssignedMerchant?: string;
  lastAssignedDate?: string;
}

/** A user-defined category persisted in the database. */
export interface UserCategory {
  id: string;
  name: string;
  color_id: number;
  display_order: number | null;
  transaction_count: number;
  created_at: string;
  updated_at: string;
}

/** Filter mode for the categorize transaction list. */
export type TransactionFilter = 'uncategorized' | 'all' | string;

/** API response for merchant match preview. */
export interface MerchantMatchPreview {
  merchant_pattern: string;
  match_field: string;
  matching_count: number;
}

/** API response when creating a merchant rule. */
export interface MerchantRuleResponse {
  id: string;
  merchant_pattern: string;
  match_field: string;
  category_name: string;
  transactions_updated: number;
  created_at: string;
}

/** Pending merchant rule prompt state. */
export interface MerchantRulePromptData {
  transactionId: string;
  categoryName: string;
  merchantPattern: string;
  matchField: string;
  matchingCount: number;
  /** Original transaction details for the toast */
  merchant: string;
  amount: string;
}

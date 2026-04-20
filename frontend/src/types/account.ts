export interface Account {
  id: string;
  provider: string;
  institution_name: string | null;
  account_name: string | null;
  account_type: string | null;
  account_subtype: string | null;
  balance_current: string | null;
  balance_limit: string | null;
  item_id: string | null;
  persistent_account_id: string | null;
  created_at: string | null;
}

export interface PlaidItem {
  id: string;
  item_id: string;
  institution_id: string | null;
  institution_name: string | null;
  last_synced_at: string | null;
  created_at: string | null;
}

export interface ExchangeTokenResponse {
  item: PlaidItem;
  accounts: Account[];
}

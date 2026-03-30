export interface CategoryInfo {
  id: string;
  name: string;
  color: string;
  transactionCount: number;
  totalAmount: number;
  lastAssignedMerchant?: string;
  lastAssignedDate?: string;
}

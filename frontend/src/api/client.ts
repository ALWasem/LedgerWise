import type { Account, ExchangeTokenResponse, PlaidItem } from '../types/account';
import type { MerchantMatchPreview, MerchantRuleResponse, UserCategory } from '../types/categorize';
import type { SpendingSummaryData } from '../types/spending';
import type { Transaction } from '../types/transaction';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

/** Default cache TTL in milliseconds (5 minutes). */
const CACHE_TTL = 5 * 60 * 1000;

// --- In-memory response cache ---

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T, ttl = CACHE_TTL): void {
  cache.set(key, { data, expiresAt: Date.now() + ttl });
}

/** Clear all cached responses. Call after mutations (enroll, etc.). */
export function clearApiCache(): void {
  cache.clear();
}

// --- Error types ---

/** Thrown when the server returns 401 — signals the session has expired. */
export class UnauthorizedError extends Error {
  constructor() {
    super('Session expired');
    this.name = 'UnauthorizedError';
  }
}

// --- Helpers ---

function authHeaders(token: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.ok) return res.json() as Promise<T>;
  if (res.status === 401) throw new UnauthorizedError();
  throw new Error(`Server error: ${res.status}`);
}

async function cachedGet<T>(url: string, token: string): Promise<T> {
  const cacheKey = url;
  const cached = getCached<T>(cacheKey);
  if (cached) return cached;

  const res = await fetch(url, { headers: authHeaders(token) });
  const data = await handleResponse<T>(res);
  setCache(cacheKey, data);
  return data;
}

// --- API functions ---

export async function fetchAccounts(token: string): Promise<Account[]> {
  return cachedGet<Account[]>(`${API_URL}/api/v1/banking/accounts?account_type=credit`, token);
}

export async function fetchTransactions(
  token: string,
  startDate?: string,
  endDate?: string,
): Promise<Transaction[]> {
  const params = new URLSearchParams();
  params.set('account_type', 'credit');
  if (startDate) params.set('start_date', startDate);
  if (endDate) params.set('end_date', endDate);
  return cachedGet<Transaction[]>(
    `${API_URL}/api/v1/banking/transactions?${params.toString()}`,
    token,
  );
}

export async function fetchSpendingSummary(
  token: string,
  startDate?: string,
  endDate?: string,
): Promise<SpendingSummaryData> {
  const params = new URLSearchParams();
  params.set('account_type', 'credit');
  if (startDate) params.set('start_date', startDate);
  if (endDate) params.set('end_date', endDate);
  return cachedGet<SpendingSummaryData>(
    `${API_URL}/api/v1/spending/summary?${params.toString()}`,
    token,
  );
}

export async function updateTransactionCategory(
  token: string,
  transactionId: string,
  category: string,
): Promise<Transaction> {
  const res = await fetch(
    `${API_URL}/api/v1/banking/transactions/${encodeURIComponent(transactionId)}/category`,
    {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify({ category }),
    },
  );
  const data = await handleResponse<Transaction>(res);
  clearApiCache();
  return data;
}

// --- Plaid API functions ---

export async function createPlaidLinkToken(
  token: string,
  receivedRedirectUri?: string,
): Promise<string> {
  const res = await fetch(`${API_URL}/api/v1/plaid/create-link-token`, {
    method: 'POST',
    headers: authHeaders(token),
    body: receivedRedirectUri
      ? JSON.stringify({ received_redirect_uri: receivedRedirectUri })
      : undefined,
  });
  const data = await handleResponse<{ link_token: string }>(res);
  return data.link_token;
}

export async function exchangePlaidToken(
  token: string,
  publicToken: string,
): Promise<ExchangeTokenResponse> {
  const res = await fetch(`${API_URL}/api/v1/plaid/exchange-token`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ public_token: publicToken }),
  });
  const data = await handleResponse<ExchangeTokenResponse>(res);
  clearApiCache();
  return data;
}

export async function syncPlaidTransactions(token: string): Promise<{ synced: number }> {
  const res = await fetch(`${API_URL}/api/v1/plaid/sync`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  const data = await handleResponse<{ synced: number }>(res);
  if (data.synced > 0) clearApiCache();
  return data;
}

export async function backfillPlaidTransactions(token: string): Promise<{ fetched: number }> {
  const res = await fetch(`${API_URL}/api/v1/plaid/backfill`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  const data = await handleResponse<{ fetched: number }>(res);
  if (data.fetched > 0) clearApiCache();
  return data;
}

export async function getPlaidItems(token: string): Promise<PlaidItem[]> {
  return cachedGet<PlaidItem[]>(`${API_URL}/api/v1/plaid/items`, token);
}

// --- Category management ---

export async function fetchCategories(token: string): Promise<UserCategory[]> {
  return cachedGet<UserCategory[]>(`${API_URL}/api/v1/categories/`, token);
}

export async function createCategoryApi(
  token: string,
  name: string,
  colorId: number,
): Promise<UserCategory> {
  const res = await fetch(`${API_URL}/api/v1/categories/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ name, color_id: colorId }),
  });
  const data = await handleResponse<UserCategory>(res);
  clearApiCache();
  return data;
}

export async function updateCategoryApi(
  token: string,
  id: string,
  updates: { name?: string; color_id?: number },
): Promise<UserCategory> {
  const res = await fetch(
    `${API_URL}/api/v1/categories/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify(updates),
    },
  );
  const data = await handleResponse<UserCategory>(res);
  clearApiCache();
  return data;
}

export async function deleteCategoryApi(
  token: string,
  id: string,
): Promise<{ deleted: boolean; transactions_affected: number }> {
  const res = await fetch(
    `${API_URL}/api/v1/categories/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
      headers: authHeaders(token),
    },
  );
  const data = await handleResponse<{ deleted: boolean; transactions_affected: number }>(res);
  clearApiCache();
  return data;
}

// --- Merchant rules ---

export async function fetchMerchantMatchPreview(
  token: string,
  transactionId: string,
): Promise<MerchantMatchPreview | null> {
  const res = await fetch(
    `${API_URL}/api/v1/merchant-rules/preview/${encodeURIComponent(transactionId)}`,
    { headers: authHeaders(token) },
  );
  if (res.status === 204) return null;
  return handleResponse<MerchantMatchPreview>(res);
}

// --- Billing ---

export async function createCheckoutSession(
  token: string,
  priceId: string,
): Promise<string> {
  const res = await fetch(`${API_URL}/api/v1/billing/create-checkout-session`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ price_id: priceId }),
  });
  const data = await handleResponse<{ checkout_url: string }>(res);
  return data.checkout_url;
}

export async function createMerchantRule(
  token: string,
  transactionId: string,
  categoryName: string,
): Promise<MerchantRuleResponse> {
  const res = await fetch(`${API_URL}/api/v1/merchant-rules/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ transaction_id: transactionId, category_name: categoryName }),
  });
  const data = await handleResponse<MerchantRuleResponse>(res);
  clearApiCache();
  return data;
}

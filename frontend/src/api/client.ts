import type { Account, ExchangeTokenResponse, PlaidItem } from '../types/account';
import type { UserCategory } from '../types/categorize';
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
  return cachedGet<Account[]>(`${API_URL}/api/v1/teller/accounts?account_type=credit`, token);
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
    `${API_URL}/api/v1/teller/transactions?${params.toString()}`,
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
    `${API_URL}/api/v1/teller/transactions/${encodeURIComponent(transactionId)}/category`,
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

export async function enrollAccount(
  token: string,
  tellerAccessToken: string,
): Promise<Account[]> {
  const res = await fetch(`${API_URL}/api/v1/teller/enroll`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ access_token: tellerAccessToken }),
  });
  const data = await handleResponse<Account[]>(res);
  clearApiCache();
  return data;
}

// --- Plaid API functions ---

export async function createPlaidLinkToken(token: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/v1/plaid/create-link-token`, {
    method: 'POST',
    headers: authHeaders(token),
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
  color: string,
): Promise<UserCategory> {
  const res = await fetch(`${API_URL}/api/v1/categories/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ name, color }),
  });
  const data = await handleResponse<UserCategory>(res);
  clearApiCache();
  return data;
}

export async function updateCategoryApi(
  token: string,
  id: string,
  updates: { name?: string; color?: string },
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

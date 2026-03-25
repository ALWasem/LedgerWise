import type { Account } from '../types/account';
import type { SpendingSummaryData } from '../types/spending';
import type { Transaction } from '../types/transaction';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

/** Thrown when the server returns 401 — signals the session has expired. */
export class UnauthorizedError extends Error {
  constructor() {
    super('Session expired');
    this.name = 'UnauthorizedError';
  }
}

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

export async function fetchAccounts(token: string): Promise<Account[]> {
  const res = await fetch(`${API_URL}/api/v1/teller/accounts`, {
    headers: authHeaders(token),
  });
  return handleResponse<Account[]>(res);
}

export async function fetchTransactions(token: string): Promise<Transaction[]> {
  const res = await fetch(`${API_URL}/api/v1/teller/transactions`, {
    headers: authHeaders(token),
  });
  return handleResponse<Transaction[]>(res);
}

export async function fetchSpendingSummary(token: string): Promise<SpendingSummaryData> {
  const res = await fetch(`${API_URL}/api/v1/spending/summary`, {
    headers: authHeaders(token),
  });
  return handleResponse<SpendingSummaryData>(res);
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
  return handleResponse<Account[]>(res);
}

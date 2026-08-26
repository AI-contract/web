// Central API client.
//
// Base URL comes from NEXT_PUBLIC_API_URL (set in .env.local).
// Falls back to localhost only for local dev convenience.
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const TOKEN_KEY = "contract_ai_token";

// ---------------------------------------------------------------
// Token storage
// ---------------------------------------------------------------
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

// ---------------------------------------------------------------
// Low-level request helper
// ---------------------------------------------------------------
class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    ...(options.body instanceof URLSearchParams
      ? {}
      : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      // response wasn't JSON — keep statusText
    }
    throw new ApiError(res.status, detail);
  }

  // 204 / empty body responses
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

// ---------------------------------------------------------------
// Types matching backend Pydantic schemas
// ---------------------------------------------------------------
export interface UserOut {
  id: number;
  email: string;
  plan: string;
  requests_used: number;
  requests_limit: number;
}

export interface UserMe {
  email: string;
  plan: string;
  requests_used: number;
  requests_limit: number;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface ContractOut {
  id: number;
  user_id: number;
  file_name: string;
  analysis_result: string;
  created_at: string;
}

export interface BillingStatus {
  plan: string;
  requests_used: number;
  requests_limit: number;
  is_pro: boolean;
}

export interface CheckoutResponse {
  checkout_url: string;
  plan: string;
  subscription_status: string | null;
}

// ---------------------------------------------------------------
// Auth
// ---------------------------------------------------------------
export function register(email: string, password: string) {
  return request<UserOut>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function login(
  email: string,
  password: string
): Promise<Token> {
  // Backend uses FastAPI's OAuth2PasswordRequestForm —
  // it expects x-www-form-urlencoded fields "username" and
  // "password", NOT JSON.
  const form = new URLSearchParams();
  form.set("username", email);
  form.set("password", password);

  const token = await request<Token>("/auth/login", {
    method: "POST",
    body: form,
  });

  setToken(token.access_token);
  return token;
}

export function getMe() {
  return request<UserMe>("/auth/me");
}

// ---------------------------------------------------------------
// Contracts
// ---------------------------------------------------------------
export function generateContract(payload: Record<string, string>) {
  return request<ContractOut>("/generate-contract", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function myContracts() {
  return request<ContractOut[]>("/my-contracts");
}

export function getContract(id: number) {
  return request<ContractOut>(`/contracts/${id}`);
}

export function deleteContract(id: number) {
  return request<{ message: string }>(`/contracts/${id}`, {
    method: "DELETE",
  });
}

// Downloads need the auth header too, so we can't just <a href>
// straight to the API — fetch as a blob and trigger the save
// ourselves.
async function downloadFile(path: string, filename: string) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    throw new ApiError(res.status, "Download failed");
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export function downloadContractDocx(id: number, fileName: string) {
  return downloadFile(
    `/contracts/${id}/download-docx`,
    `${fileName}.docx`
  );
}

export function downloadContractPdf(id: number, fileName: string) {
  return downloadFile(
    `/contracts/${id}/download-pdf`,
    `${fileName}.pdf`
  );
}

// ---------------------------------------------------------------
// Billing
// ---------------------------------------------------------------
export function startCheckout() {
  return request<CheckoutResponse>("/billing/checkout", {
    method: "POST",
  });
}

export function getBillingStatus() {
  return request<BillingStatus>("/billing/status");
}

export { ApiError };

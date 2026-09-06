// Central API client.
//
// Base URL comes from NEXT_PUBLIC_API_URL (set in .env.local).
// Falls back to localhost only for local dev convenience.
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// Fail fast in production if the env var was forgotten — better to
// see a loud console error at startup than have every request
// silently try (and fail) to hit localhost in prod.
if (
  process.env.NODE_ENV === "production" &&
  !process.env.NEXT_PUBLIC_API_URL
) {
  // eslint-disable-next-line no-console
  console.error(
    "[api] NEXT_PUBLIC_API_URL is not set in a production build — " +
      "falling back to http://127.0.0.1:8000, which is almost " +
      "certainly wrong. Set NEXT_PUBLIC_API_URL in the deploy env."
  );
}

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
    ...(options.body instanceof URLSearchParams ||
    options.body instanceof FormData
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
  review_used: number;
  review_limit: number;
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

export interface ContractReviewOut {
  id: number;
  user_id: number;
  original_filename: string;
  analysis_result: string;
  revised_contract_text: string | null;
  revised_contract_type: string | null;
  revised_contract_title: string | null;
  created_at: string;
}

export interface ContractTypeFields {
  contract_type: string;
  title: string;
  required_fields: string[];
}

export interface BillingStatus {
  plan: string;
  requests_used: number;
  requests_limit: number;
  is_pro: boolean;
}

export interface CheckoutResponse {
  checkout_url: string;
  order_invoice_number: string;
}

// Yêu cầu review lưu theo tài khoản (mục tiêu review đã chọn +
// văn bản pháp luật/yêu cầu riêng do người dùng tự nhập). Backend
// cần trả về { goals: [], custom_instructions: "" } cho tài khoản
// chưa từng lưu gì (không phải lỗi 404).
export interface ReviewPreferences {
  goals: string[];
  custom_instructions: string;
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
// Contracts (tạo hợp đồng)
// ---------------------------------------------------------------
// Fetches the current required_fields + title for a contract type
// directly from the backend, so the form always matches whatever
// clauses the backend actually uses — no hardcoded field lists to
// keep in sync by hand.
export function getContractTypeFields(contractType: string) {
  return request<ContractTypeFields>(
    `/contract-types/${contractType}/fields`
  );
}

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
// Contract reviews (review hợp đồng đã upload)
// ---------------------------------------------------------------
// Multipart upload — can't go through the JSON-only request()
// helper above (it always sets Content-Type: application/json).
// Uses fetch directly, same auth-header + error-handling pattern.
//
// `options.goals`/`options.custom_instructions`: yêu cầu review cho
// LẦN NÀY cụ thể (có thể khác với bản đã lưu mặc định ở
// ReviewPreferences, vì người dùng có thể sửa ngay trước khi nhấn
// "Phân tích hợp đồng"). Gửi `goals` dưới dạng chuỗi JSON qua
// multipart form field — backend cần đọc field "goals" (str) rồi
// json.loads(...) thành list[str], thay vì List[str] trực tiếp
// (multipart form không hỗ trợ mảng JSON gốc).
export async function reviewContract(
  file: File,
  options?: { goals?: string[]; custom_instructions?: string }
): Promise<ContractReviewOut> {
  const token = getToken();
  const formData = new FormData();
  formData.append("file", file);

  if (options?.goals && options.goals.length > 0) {
    formData.append("goals", JSON.stringify(options.goals));
  }
  if (options?.custom_instructions) {
    formData.append("custom_instructions", options.custom_instructions);
  }

  const res = await fetch(`${API_URL}/review-contract`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
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

  return res.json();
}

export function myContractReviews() {
  return request<ContractReviewOut[]>("/my-contract-reviews");
}

export function getContractReview(id: number) {
  return request<ContractReviewOut>(`/contract-reviews/${id}`);
}

export function downloadRevisedContractDocx(id: number) {
  return downloadFile(
    `/contract-reviews/${id}/download-docx`,
    `hop-dong-da-sua-${id}.docx`
  );
}

export function downloadRevisedContractPdf(id: number) {
  return downloadFile(
    `/contract-reviews/${id}/download-pdf`,
    `hop-dong-da-sua-${id}.pdf`
  );
}

// Yêu cầu review đã lưu mặc định cho tài khoản (mục tiêu + văn bản
// pháp luật/yêu cầu riêng). Áp dụng sẵn (pre-fill) mỗi khi vào tab
// Review; người dùng vẫn sửa được cho từng lần review cụ thể mà
// không ảnh hưởng tới bản đã lưu cho tới khi bấm "Lưu làm mặc định"
// lần nữa.
export function getReviewPreferences() {
  return request<ReviewPreferences>("/review-preferences");
}

export function saveReviewPreferences(prefs: ReviewPreferences) {
  return request<ReviewPreferences>("/review-preferences", {
    method: "PUT",
    body: JSON.stringify(prefs),
  });
}

// ---------------------------------------------------------------
// Billing
// ---------------------------------------------------------------

// Domains SePay is allowed to redirect the browser to. Adjust this
// list to match SePay's real checkout host(s) — this is a
// defense-in-depth check on the client so that a compromised/
// tampered backend response (or a MITM on a non-HTTPS link) can't
// silently redirect a paying user to a look-alike phishing page.
// The backend must still be the source of truth: ideally it signs
// or restricts the checkout_url it generates. This is a second
// layer, not a replacement for that.
const ALLOWED_CHECKOUT_HOSTS = ["my.sepay.vn", "sepay.vn"];

export function isSafeCheckoutUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      u.protocol === "https:" &&
      ALLOWED_CHECKOUT_HOSTS.some(
        (host) => u.hostname === host || u.hostname.endsWith(`.${host}`)
      )
    );
  } catch {
    return false;
  }
}

const CHECKOUT_TIMEOUT_MS = 15000;

export async function startCheckout(
  planKey: string
): Promise<CheckoutResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CHECKOUT_TIMEOUT_MS);

  try {
    return await request<CheckoutResponse>(
      `/billing/sepay/checkout?plan_key=${encodeURIComponent(planKey)}`,
      { method: "POST", signal: controller.signal }
    );
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError(0, "Yêu cầu thanh toán quá thời gian chờ, vui lòng thử lại.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function getBillingStatus() {
  return request<BillingStatus>("/billing/status");
}

// ---------------------------------------------------------------
// Trợ lý ảo (widget góc dưới phải, hỗ trợ khách hàng dùng nền tảng)
// ---------------------------------------------------------------
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantAskResponse {
  reply: string;
}

// `history` nên bao gồm cả câu hỏi mới nhất của người dùng (widget tự
// thêm vào state trước khi gọi hàm này) — backend chỉ dùng để lấy ngữ
// cảnh, không lưu lại vào DB.
export function askAssistant(history: ChatMessage[]) {
  return request<AssistantAskResponse>("/assistant/ask", {
    method: "POST",
    body: JSON.stringify({
      message: history[history.length - 1]?.content ?? "",
      history,
    }),
  });
}

export { ApiError };

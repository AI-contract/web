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
  extracted_text: string;
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

// SePay checkout/init CHỈ chấp nhận HTML form POST — không phải GET
// redirect với query string. Backend trả về action_url (nơi submit form)
// + fields (các input ẩn, đã bao gồm "signature"), thay vì một
// checkout_url để redirect trực tiếp.
export interface CheckoutResponse {
  action_url: string;
  fields: Record<string, string>;
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

// Bản DOCX kèm Track Changes thật (w:ins/w:del) — mở bằng Word sẽ
// thấy đúng các thay đổi ở chế độ Review, chấp nhận/từ chối được
// từng chỗ, khác với bản DOCX thường ở trên (chỉ là bản đã sửa,
// không đánh dấu thay đổi).
export function downloadRevisedContractDocxTrackChanges(id: number) {
  return downloadFile(
    `/contract-reviews/${id}/download-docx-trackchanges`,
    `hop-dong-so-sanh-track-changes-${id}.docx`
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

// Hồ sơ Bên A lưu theo tài khoản - tự điền lại các field PARTY_A_*
// cho lần tạo hợp đồng sau (bất kể loại hợp đồng nào, vì tên field
// giống nhau ở cả 5 loại).
export interface PartyAProfile {
  fields: Record<string, string>;
}

export function getPartyAProfile() {
  return request<PartyAProfile>("/party-a-profile");
}

export function savePartyAProfile(fields: Record<string, string>) {
  return request<PartyAProfile>("/party-a-profile", {
    method: "PUT",
    body: JSON.stringify({ fields }),
  });
}

// Hồ sơ Bên B - cùng cơ chế với hồ sơ Bên A ở trên.
export interface PartyBProfile {
  fields: Record<string, string>;
}

export function getPartyBProfile() {
  return request<PartyBProfile>("/party-b-profile");
}

export function savePartyBProfile(fields: Record<string, string>) {
  return request<PartyBProfile>("/party-b-profile", {
    method: "PUT",
    body: JSON.stringify({ fields }),
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

// Thứ tự field phải khớp với SIGNED_FIELDS_ORDER ở backend
// (app/services/sepay_service.py) — giữ đúng thứ tự input trong form
// theo khuyến nghị của tài liệu SePay.
const SEPAY_FIELD_ORDER = [
  "order_amount",
  "merchant",
  "currency",
  "operation",
  "order_description",
  "order_invoice_number",
  "customer_id",
  "payment_method",
  "success_url",
  "error_url",
  "cancel_url",
  "signature",
];

// Dựng một <form method="POST"> ẩn với input cho từng field (theo đúng
// thứ tự), gắn vào <body>, rồi submit() để chuyển hướng sang trang
// thanh toán SePay. SePay yêu cầu POST form, không chấp nhận GET
// redirect với query string.
export function submitSepayCheckoutForm(
  actionUrl: string,
  fields: Record<string, string>
): void {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = actionUrl;
  form.style.display = "none";

  const orderedKeys = [
    ...SEPAY_FIELD_ORDER.filter((key) => key in fields),
    ...Object.keys(fields).filter((key) => !SEPAY_FIELD_ORDER.includes(key)),
  ];

  for (const key of orderedKeys) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = fields[key];
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
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

// ---------------------------------------------------------------
// Chat hỏi-đáp trên hợp đồng vừa review (khác với trợ lý ảo chung
// ở askAssistant() phía trên — phạm vi rộng hơn, có ngữ cảnh là
// chính hợp đồng đang xem, được phép nói cả về pháp luật liên quan
// nhưng phải nêu rõ nguồn).
// ---------------------------------------------------------------
export interface ReviewChatMessageOut {
  id: number;
  role: "user" | "assistant";
  content: string;
  sources_note: string | null;
  created_at: string;
}

export function getReviewChatHistory(reviewId: number) {
  return request<ReviewChatMessageOut[]>(
    `/contract-reviews/${reviewId}/chat`
  );
}

export function askReviewChat(reviewId: number, message: string) {
  return request<ReviewChatMessageOut>(
    `/contract-reviews/${reviewId}/chat`,
    {
      method: "POST",
      body: JSON.stringify({ message }),
    }
  );
}

// ---------------------------------------------------------------
// Thư viện điều khoản theo ngành
// ---------------------------------------------------------------
export interface ClauseIndustry {
  key: string;
  label: string;
  clause_count: number;
}

export interface ClauseSummary {
  clause_name: string;
  label: string;
  preview: string;
}

export interface ClauseContent {
  contract_type: string;
  clause_name: string;
  content: string;
}

export function getClauseIndustries() {
  return request<{ industries: ClauseIndustry[] }>("/clause-library");
}

export function getClausesByIndustry(contractType: string) {
  return request<{ contract_type: string; clauses: ClauseSummary[] }>(
    `/clause-library/${contractType}`
  );
}

export function getClauseContent(contractType: string, clauseName: string) {
  return request<ClauseContent>(
    `/clause-library/${contractType}/${clauseName}`
  );
}

// ---------------------------------------------------------------
// Nhắc hạn hợp đồng
// ---------------------------------------------------------------
export interface ContractDeadline {
  id: number;
  title: string;
  deadline_type: string;
  due_date: string; // "YYYY-MM-DD"
  notify_offsets_days: string;
  note: string | null;
  is_resolved: boolean;
  contract_id: number | null;
  contract_review_id: number | null;
  created_at: string;
  days_remaining: number;
}

export interface ContractDeadlineIn {
  title: string;
  deadline_type?: string;
  due_date: string;
  notify_offsets_days?: string;
  note?: string;
  contract_id?: number;
  contract_review_id?: number;
}

export function listDeadlines(includeResolved = false) {
  return request<ContractDeadline[]>(
    `/deadlines?include_resolved=${includeResolved}`
  );
}

export function createDeadline(payload: ContractDeadlineIn) {
  return request<ContractDeadline>("/deadlines", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateDeadline(
  id: number,
  payload: Partial<ContractDeadlineIn & { is_resolved: boolean }>
) {
  return request<ContractDeadline>(`/deadlines/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteDeadline(id: number) {
  return request<{ message: string }>(`/deadlines/${id}`, {
    method: "DELETE",
  });
}

// ---------------------------------------------------------------
// Workspace nhiều người dùng (ENTERPRISE)
// ---------------------------------------------------------------
export interface OrganizationOut {
  id: number;
  name: string;
  owner_id: number;
  created_at: string;
}

export interface OrganizationMemberOut {
  id: number;
  email: string;
  user_id: number | null;
  role: "owner" | "admin" | "member";
  status: "pending" | "active" | "removed";
  invited_at: string;
  joined_at: string | null;
}

export function createOrganization(name: string) {
  return request<OrganizationOut>("/organizations", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function getMyOrganization() {
  return request<OrganizationOut | null>("/organizations/me");
}

export function listOrganizationMembers() {
  return request<OrganizationMemberOut[]>("/organizations/members");
}

export function inviteOrganizationMember(email: string, role: string = "member") {
  return request<{
    id: number;
    email: string;
    role: string;
    status: string;
    invite_token: string;
  }>("/organizations/invite", {
    method: "POST",
    body: JSON.stringify({ email, role }),
  });
}

export function acceptOrganizationInvite(inviteToken: string) {
  return request<OrganizationMemberOut>("/organizations/accept-invite", {
    method: "POST",
    body: JSON.stringify({ invite_token: inviteToken }),
  });
}

export function removeOrganizationMember(memberId: number) {
  return request<{ message: string }>(
    `/organizations/members/${memberId}`,
    { method: "DELETE" }
  );
}

export function leaveOrganization() {
  return request<{ message: string }>("/organizations/leave", {
    method: "POST",
  });
}

export function listOrganizationContracts() {
  return request<ContractOut[]>("/organizations/contracts");
}

export function listOrganizationContractReviews() {
  return request<ContractReviewOut[]>("/organizations/contract-reviews");
}

// ---------------------------------------------------------------
// Tra cứu pháp lý (văn bản pháp luật, bản án, án lệ)
// ---------------------------------------------------------------
export interface LegalOption {
  value: string;
  label: string;
  count: number;
}

export interface LegalMeta {
  doc_types: LegalOption[];
  fields: LegalOption[];
  statuses: LegalOption[];
  issuers: string[];
  total_documents: number;
}

export interface LegalSearchItem {
  document_id: number;
  doc_type: string;
  doc_type_label: string;
  fields: string[];
  field_labels: string[];
  number: string | null;
  title: string;
  issuer: string | null;
  issued_on: string | null;
  effective_on: string | null;
  status: string;
  status_label: string;
  source_name: string | null;
  source_url: string | null;
  data_updated_at: string | null;
  // Đoạn/Điều khớp nhất trong văn bản, vd "Điều 418".
  locator: string | null;
  snippet: string;
  // Vị trí tô sáng [start, end] tương đối theo `snippet` (tính theo
  // ký tự Unicode/code point, KHÔNG phải HTML).
  highlights: number[][];
  score: number;
}

export interface LegalSearchResponse {
  total: number;
  page: number;
  page_size: number;
  items: LegalSearchItem[];
  query_terms: string[];
  disclaimer: string;
}

export interface LegalChunk {
  id: number;
  position: number;
  locator: string | null;
  content: string;
}

export interface LegalDocumentDetail {
  id: number;
  doc_type: string;
  doc_type_label: string;
  fields: string[];
  field_labels: string[];
  number: string | null;
  title: string;
  issuer: string | null;
  issued_on: string | null;
  effective_on: string | null;
  status: string;
  status_label: string;
  summary: string | null;
  source_name: string | null;
  source_url: string | null;
  data_updated_at: string | null;
  chunks: LegalChunk[];
  disclaimer: string;
}

export interface LegalSearchParams {
  q?: string;
  doc_type?: string;
  field?: string;
  issuer?: string;
  status?: string;
  year?: number;
  page?: number;
  page_size?: number;
}

export function getLegalMeta() {
  return request<LegalMeta>("/legal/meta");
}

export function searchLegal(params: LegalSearchParams) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    qs.set(key, String(value));
  }
  const suffix = qs.toString();
  return request<LegalSearchResponse>(
    `/legal/search${suffix ? `?${suffix}` : ""}`
  );
}

// "Căn cứ pháp lý" cho một đoạn văn (vd một điều khoản hợp đồng).
export function searchLegalByText(
  text: string,
  opts: { doc_type?: string; field?: string; limit?: number } = {}
) {
  return request<LegalSearchResponse>("/legal/search-by-text", {
    method: "POST",
    body: JSON.stringify({ text, ...opts }),
  });
}

export function getLegalDocument(id: number) {
  return request<LegalDocumentDetail>(`/legal/documents/${id}`);
}

export { ApiError };

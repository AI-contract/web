"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, ScanSearch, LogOut, Loader2, Upload } from "lucide-react";
import {
  ApiError,
  ContractOut,
  ContractReviewOut,
  UserMe,
  clearToken,
  downloadContractDocx,
  downloadContractPdf,
  downloadRevisedContractDocx,
  downloadRevisedContractPdf,
  generateContract,
  getContractTypeFields,
  getMe,
  isSafeCheckoutUrl,
  myContracts,
  myContractReviews,
  reviewContract,
  startCheckout,
} from "@/lib/api";

// ---- contract types available ----
// (the set of contract_type identifiers is fixed by the backend's
// VALID_CONTRACT_TYPES — only the *fields* for each type are fetched
// dynamically, since those change whenever the clause library does)
const CONTRACT_TYPES: { value: string; label: string }[] = [
  { value: "service", label: "Hợp đồng dịch vụ" },
  { value: "labor", label: "Hợp đồng lao động" },
  { value: "nda", label: "Thỏa thuận bảo mật (NDA)" },
  { value: "sale", label: "Hợp đồng mua bán" },
  { value: "probation", label: "Hợp đồng thử việc" },
];

// ---- friendly labels for known field keys ----
// Falls back to a humanized version of the key (FIELD_KEY -> "Field
// Key") for any field the backend adds later that isn't listed here,
// so a new clause variable never breaks the form — it just shows a
// slightly less polished label until someone adds a proper entry.
const FIELD_LABELS: Record<string, string> = {
  PARTY_A_NAME: "Tên Bên A",
  PARTY_A_REPRESENTATIVE: "Người đại diện Bên A",
  PARTY_A_ADDRESS: "Địa chỉ Bên A",
  PARTY_A_PHONE: "Số điện thoại Bên A",
  PARTY_A_POSITION: "Chức vụ Bên A",
  PARTY_A_BUSINESS_REG_NUMBER: "Mã số doanh nghiệp Bên A",
  PARTY_A_BUSINESS_REG_DATE: "Ngày đăng ký kinh doanh Bên A",
  PARTY_B_NAME: "Tên / Họ tên Bên B",
  PARTY_B_REPRESENTATIVE: "Người đại diện Bên B",
  PARTY_B_ADDRESS: "Địa chỉ Bên B",
  PARTY_B_PHONE: "Số điện thoại Bên B",
  PARTY_B_POSITION: "Chức vụ Bên B",
  PARTY_B_BUSINESS_REG_NUMBER: "Mã số doanh nghiệp Bên B",
  PARTY_B_BUSINESS_REG_DATE: "Ngày đăng ký kinh doanh Bên B",
  PARTY_B_DOB: "Ngày sinh Bên B",
  PARTY_B_ID_NUMBER: "Số CCCD/CMND Bên B",
  PARTY_B_ID_ISSUE_DATE: "Ngày cấp CCCD/CMND",
  PARTY_B_ID_ISSUE_PLACE: "Nơi cấp CCCD/CMND",
  PURPOSE: "Mục đích",
  SERVICE_DESCRIPTION: "Nội dung dịch vụ",
  CONFIDENTIALITY_PERIOD: "Thời hạn bảo mật",
  EFFECTIVE_PERIOD: "Thời hạn hiệu lực hợp đồng",
  PENALTY_RATE: "Mức phạt vi phạm (%)",
  CONTRACT_VALUE: "Giá trị hợp đồng",
  PAYMENT_METHOD: "Hình thức thanh toán",
  PAYMENT_TERM: "Thời hạn thanh toán",
  BANK_ACCOUNT: "Số tài khoản ngân hàng",
  NOTICE_DAYS: "Số ngày báo trước (chấm dứt HĐ)",
  GOODS_NAME: "Tên hàng hóa",
  QUANTITY: "Số lượng",
  SPECIFICATIONS: "Quy cách, chất lượng",
  DELIVERY_LOCATION: "Địa điểm giao hàng",
  DELIVERY_TERM: "Thời hạn giao hàng",
  WARRANTY_PERIOD: "Thời hạn bảo hành",
  JOB_TITLE: "Vị trí / chức danh",
  JOB_DESCRIPTION: "Mô tả công việc",
  WORK_LOCATION: "Địa điểm làm việc",
  SALARY: "Lương",
  ALLOWANCES: "Phụ cấp",

  // ---- new fields (added with the expanded clause_library) ----
  CONTRACT_TERM_TYPE: "Loại hợp đồng (xác định/không xác định thời hạn)",
  START_DATE: "Ngày bắt đầu hợp đồng",
  END_DATE: "Ngày kết thúc hợp đồng",
  PROBATION_DAYS: "Số ngày thử việc",
  PROBATION_SALARY_PERCENT: "Lương thử việc (% lương chính thức)",
  FINAL_PAYMENT_DAYS: "Số ngày thanh toán sau khi chấm dứt HĐ",
  WORKING_HOURS_PER_DAY: "Số giờ làm việc/ngày",
  WORKING_HOURS_PER_WEEK: "Số giờ làm việc/tuần",
  MAX_LIABILITY_MONTHS: "Mức bồi thường tối đa (số tháng lương)",
  DISPUTE_LOCATION: "Nơi giải quyết tranh chấp",
  PENALTY_CAP_PERCENT: "Mức phạt tối đa (% giá trị hợp đồng)",
  LIABILITY_CAP_MONTHS: "Giới hạn trách nhiệm (số tháng phí gần nhất)",
  CONTRACT_TERM_MONTHS: "Thời hạn hợp đồng (tháng)",
  MAX_LIABILITY_AMOUNT: "Mức trách nhiệm bồi thường tối đa (VNĐ)",
};

// Fields long enough to deserve a <textarea> instead of a one-line
// <input>. Same fallback philosophy: an unknown field just renders
// as a single-line input, which is never wrong, just not ideal.
const LONG_TEXT_FIELDS = new Set([
  "PURPOSE",
  "SERVICE_DESCRIPTION",
  "JOB_DESCRIPTION",
  "SPECIFICATIONS",
]);

// Fields that must hold a bare number or percentage — nothing else.
// These get a placeholder showing the expected format so people
// don't type e.g. "45 ngày." into a field that's later combined
// with a fixed unit already written in the clause template (which
// used to produce duplicated text like "45 ngày. ngày, trừ...").
const NUMERIC_HINT_FIELDS: Record<string, string> = {
  NOTICE_DAYS: "Chỉ nhập số, ví dụ: 45",
  PENALTY_RATE: "Chỉ nhập số, ví dụ: 8",
  PROBATION_DAYS: "Chỉ nhập số, ví dụ: 30",
  PROBATION_SALARY_PERCENT: "Chỉ nhập số, ví dụ: 85",
  FINAL_PAYMENT_DAYS: "Chỉ nhập số, ví dụ: 7",
  WORKING_HOURS_PER_DAY: "Chỉ nhập số, ví dụ: 8",
  WORKING_HOURS_PER_WEEK: "Chỉ nhập số, ví dụ: 48",
  MAX_LIABILITY_MONTHS: "Chỉ nhập số, ví dụ: 3",
  PENALTY_CAP_PERCENT: "Chỉ nhập số, ví dụ: 20",
  LIABILITY_CAP_MONTHS: "Chỉ nhập số, ví dụ: 12",
  CONTRACT_TERM_MONTHS: "Chỉ nhập số, ví dụ: 12",
};

function humanizeFieldKey(key: string): string {
  return key
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function labelForField(key: string): string {
  return FIELD_LABELS[key] || humanizeFieldKey(key);
}

// ---- top-level tab ----
type Tab = "generate" | "review";

export default function Home() {
  const router = useRouter();

  const [user, setUser] = useState<UserMe | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [tab, setTab] = useState<Tab>("generate");

  const [contractType, setContractType] = useState<string>("service");
  const [form, setForm] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [lastContract, setLastContract] = useState<ContractOut | null>(
    null
  );

  const [contracts, setContracts] = useState<ContractOut[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const [upgrading, setUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  // ---- fields for the currently selected contract type ----
  // Fetched fresh from the backend every time contractType changes,
  // so the form always reflects whatever fields the clause library
  // actually requires right now.
  const [currentFields, setCurrentFields] = useState<string[]>([]);
  const [contractTitle, setContractTitle] = useState<string>("");
  const [loadingFields, setLoadingFields] = useState(false);
  const [fieldsError, setFieldsError] = useState<string | null>(null);

  // ---- contract review state ----
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [lastReview, setLastReview] = useState<ContractReviewOut | null>(
    null
  );
  const [reviewResultTab, setReviewResultTab] = useState<
    "analysis" | "revised"
  >("analysis");

  const [reviews, setReviews] = useState<ContractReviewOut[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  const loadFieldsFor = (type: string, cancelledRef: { current: boolean }) => {
    setLoadingFields(true);
    setFieldsError(null);

    getContractTypeFields(type)
      .then((data) => {
        if (cancelledRef.current) return;
        setCurrentFields(data.required_fields);
        setContractTitle(data.title);
      })
      .catch((err) => {
        if (cancelledRef.current) return;
        const message =
          err instanceof ApiError
            ? err.message
            : "Không thể tải danh sách trường thông tin";
        setFieldsError(message);
        setCurrentFields([]);
      })
      .finally(() => {
        if (!cancelledRef.current) setLoadingFields(false);
      });
  };

  useEffect(() => {
    if (!authChecked) return;

    const cancelledRef = { current: false };
    loadFieldsFor(contractType, cancelledRef);

    return () => {
      cancelledRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractType, authChecked]);

  // ---- auth check on mount ----
  useEffect(() => {
    getMe()
      .then((me) => {
        setUser(me);
        setAuthChecked(true);
      })
      .catch(() => {
        router.push("/login");
      });
  }, [router]);

  const refreshContracts = () => {
    setLoadingList(true);
    myContracts()
      .then(setContracts)
      .catch(() => {
        // non-fatal — just show empty list
      })
      .finally(() => setLoadingList(false));
  };

  const refreshUser = () => {
    getMe()
      .then(setUser)
      .catch(() => {
        // non-fatal — sidebar just keeps showing the last known values
      });
  };

  const refreshReviews = () => {
    setLoadingReviews(true);
    myContractReviews()
      .then(setReviews)
      .catch(() => {
        // non-fatal — just show empty list
      })
      .finally(() => setLoadingReviews(false));
  };

  // ---- load contract list once authed ----
  useEffect(() => {
    if (!authChecked) return;
    refreshContracts();
    refreshReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked]);

  const handleLogout = () => {
    clearToken();
    router.push("/login");
  };

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleContractTypeChange = (value: string) => {
    setContractType(value);
    setForm({}); // reset form data when switching contract type
    setGenError(null);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenError(null);
    setGenerating(true);

    try {
      const payload = { contract_type: contractType, ...form };
      const contract = await generateContract(payload);
      setLastContract(contract);
      refreshContracts();
      refreshUser();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Không thể tạo hợp đồng";
      setGenError(message);
    } finally {
      setGenerating(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setReviewError(null);
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setReviewError(null);
    setReviewing(true);

    try {
      const review = await reviewContract(selectedFile);
      setLastReview(review);
      setReviewResultTab("analysis");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      refreshReviews();
      refreshUser();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Không thể review hợp đồng";
      setReviewError(message);
    } finally {
      setReviewing(false);
    }
  };

  const handleUpgrade = async (planKey: string) => {
    setUpgradeError(null);
    setUpgrading(true);
    try {
      const { checkout_url } = await startCheckout(planKey);

      // FIX: don't blindly trust whatever URL the backend returned —
      // only redirect if it points to a known SePay checkout host
      // over HTTPS. Protects against a compromised/tampered backend
      // response silently sending a paying user to a phishing page.
      if (!isSafeCheckoutUrl(checkout_url)) {
        setUpgrading(false);
        setUpgradeError(
          "Liên kết thanh toán không hợp lệ. Vui lòng thử lại hoặc liên hệ hỗ trợ."
        );
        return;
      }

      window.location.href = checkout_url;
    } catch (err) {
      setUpgrading(false);
      const message =
        err instanceof ApiError
          ? err.message
          : "Không thể khởi tạo thanh toán, thử lại sau.";
      setUpgradeError(message);
    }
  };

  if (!authChecked) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="animate-spin" size={32} />
      </main>
    );
  }

  const reviewLimitReached =
    !!user && user.plan !== "FREE" && user.review_used >= user.review_limit;
  const reviewBlockedForFree = !!user && user.plan === "FREE";

  return (
    <main className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-700 text-white p-6 hidden md:flex md:flex-col">
        <h1 className="text-3xl font-bold mb-10">Legal AI</h1>

        <nav className="space-y-2 flex-1">
          <button
            onClick={() => setTab("generate")}
            className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left transition ${
              tab === "generate"
                ? "bg-white text-blue-700"
                : "text-blue-100 hover:bg-blue-800"
            }`}
          >
            <FileText size={20} />
            <span>Tạo hợp đồng</span>
          </button>
          <button
            onClick={() => setTab("review")}
            className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left transition ${
              tab === "review"
                ? "bg-white text-blue-700"
                : "text-blue-100 hover:bg-blue-800"
            }`}
          >
            <ScanSearch size={20} />
            <span>Review hợp đồng</span>
          </button>
        </nav>

        {user && (
          <div className="border-t border-blue-500 pt-4 text-sm text-blue-100 space-y-2">
            <div>{user.email}</div>
            <div>
              Gói:{" "}
              <span className="font-semibold text-white">
                {user.plan}
              </span>
            </div>
            <div>
              {user.requests_used}/{user.requests_limit} lượt tạo hợp đồng
            </div>
            <div>
              {user.plan === "FREE"
                ? "Review: không khả dụng (gói FREE)"
                : `${user.review_used}/${user.review_limit} lượt review/tháng`}
            </div>
            {upgradeError && (
              <p className="text-red-400 text-xs mt-1">{upgradeError}</p>
            )}
            {user.plan === "FREE" && (
              <>
                <button
                  onClick={() => handleUpgrade("PRO_MONTHLY")}
                  disabled={upgrading}
                  className="w-full bg-white text-blue-700 rounded-lg py-2 mt-2 font-medium disabled:opacity-50"
                >
                  {upgrading ? "Đang chuyển hướng..." : "Nâng cấp PRO"}
                </button>
                <button
                  onClick={() => handleUpgrade("ENTERPRISE_MONTHLY")}
                  disabled={upgrading}
                  className="w-full bg-blue-900 text-white rounded-lg py-2 mt-2 font-medium disabled:opacity-50"
                >
                  {upgrading ? "Đang chuyển hướng..." : "Nâng cấp ENTERPRISE"}
                </button>
              </>
            )}
            {user.plan === "PRO" && (
              <button
                onClick={() => handleUpgrade("ENTERPRISE_MONTHLY")}
                disabled={upgrading}
                className="w-full bg-blue-900 text-white rounded-lg py-2 mt-2 font-medium disabled:opacity-50"
              >
                {upgrading ? "Đang chuyển hướng..." : "Nâng cấp ENTERPRISE"}
              </button>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 text-blue-200 hover:text-white mt-2"
            >
              <LogOut size={16} /> Đăng xuất
            </button>
          </div>
        )}
      </aside>

      {/* Main */}
      <section className="flex-1 p-10">
        <div className="max-w-5xl mx-auto">
          {tab === "generate" ? (
            <>
              <div className="mb-10">
                <h2 className="text-4xl font-bold mb-3">
                  {contractTitle
                    ? `Tạo ${contractTitle.toLowerCase()}`
                    : "Tạo hợp đồng"}
                </h2>
                <p className="text-gray-500 text-lg">
                  Điền thông tin để AI tạo hợp đồng từ thư viện điều khoản.
                </p>
              </div>

              {/* Generate form */}
              <form
                onSubmit={handleGenerate}
                className="bg-white rounded-3xl shadow-xl p-8 mb-10"
              >
                {/* Contract type selector */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-1">
                    Loại hợp đồng
                  </label>
                  <select
                    value={contractType}
                    onChange={(e) => handleContractTypeChange(e.target.value)}
                    className="w-full md:w-1/2 border rounded-lg px-3 py-2 bg-white"
                  >
                    {CONTRACT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                {loadingFields && (
                  <p className="text-gray-500 text-sm flex items-center gap-2 mb-4">
                    <Loader2 size={16} className="animate-spin" />
                    Đang tải danh sách trường thông tin...
                  </p>
                )}

                {fieldsError && !loadingFields && (
                  <p className="text-red-600 text-sm mb-4">{fieldsError}</p>
                )}

                {!loadingFields && !fieldsError && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentFields.map((key) =>
                      LONG_TEXT_FIELDS.has(key) ? (
                        <div key={key} className="md:col-span-2">
                          <label className="block text-sm font-medium mb-1">
                            {labelForField(key)}
                          </label>
                          <textarea
                            value={form[key] || ""}
                            onChange={(e) =>
                              handleChange(key, e.target.value)
                            }
                            rows={3}
                            className="w-full border rounded-lg px-3 py-2"
                          />
                        </div>
                      ) : (
                        <div key={key}>
                          <label className="block text-sm font-medium mb-1">
                            {labelForField(key)}
                          </label>
                          <input
                            value={form[key] || ""}
                            onChange={(e) =>
                              handleChange(key, e.target.value)
                            }
                            placeholder={NUMERIC_HINT_FIELDS[key]}
                            className="w-full border rounded-lg px-3 py-2"
                          />
                        </div>
                      )
                    )}
                  </div>
                )}

                {genError && (
                  <p className="text-red-600 text-sm mt-4">{genError}</p>
                )}

                <button
                  type="submit"
                  disabled={generating || loadingFields || !!fieldsError}
                  className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {generating && (
                    <Loader2 size={18} className="animate-spin" />
                  )}
                  {generating ? "Đang tạo..." : "Tạo hợp đồng"}
                </button>
              </form>

              {/* Just-generated result */}
              {lastContract && (
                <div className="bg-white rounded-2xl shadow p-6 mb-10 border">
                  <h3 className="text-xl font-semibold mb-4">
                    Hợp đồng vừa tạo: {lastContract.file_name}
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-4 text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
                    {lastContract.analysis_result}
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() =>
                        downloadContractDocx(
                          lastContract.id,
                          lastContract.file_name
                        )
                      }
                      className="border rounded-lg px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      Tải DOCX
                    </button>
                    <button
                      onClick={() =>
                        downloadContractPdf(
                          lastContract.id,
                          lastContract.file_name
                        )
                      }
                      className="border rounded-lg px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      Tải PDF
                    </button>
                  </div>
                </div>
              )}

              {/* Contract list */}
              <div>
                <h3 className="text-2xl font-semibold mb-4">
                  Hợp đồng của tôi
                </h3>

                {loadingList && (
                  <p className="text-gray-500">Đang tải...</p>
                )}

                {!loadingList && contracts.length === 0 && (
                  <p className="text-gray-500">Chưa có hợp đồng nào.</p>
                )}

                <div className="space-y-3">
                  {contracts.map((c) => (
                    <div
                      key={c.id}
                      className="bg-white rounded-xl shadow-sm border p-4 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium">{c.file_name}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(c.created_at).toLocaleString("vi-VN")}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            downloadContractDocx(c.id, c.file_name)
                          }
                          className="border rounded-lg px-3 py-1.5 text-sm hover:bg-gray-50"
                        >
                          DOCX
                        </button>
                        <button
                          onClick={() =>
                            downloadContractPdf(c.id, c.file_name)
                          }
                          className="border rounded-lg px-3 py-1.5 text-sm hover:bg-gray-50"
                        >
                          PDF
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="mb-10">
                <h2 className="text-4xl font-bold mb-3">
                  Review hợp đồng
                </h2>
                <p className="text-gray-500 text-lg">
                  Tải lên hợp đồng (PDF hoặc DOCX) để AI đánh giá rủi ro
                  pháp lý và soạn lại bản đã chỉnh sửa.
                </p>
              </div>

              {reviewBlockedForFree && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 mb-6 text-sm">
                  Tính năng review hợp đồng chỉ dành cho gói PRO trở lên.
                  Nâng cấp để sử dụng.
                </div>
              )}

              {!reviewBlockedForFree && reviewLimitReached && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 mb-6 text-sm">
                  Bạn đã dùng hết lượt review hợp đồng trong tháng này. Vui
                  lòng thử lại vào tháng sau hoặc nâng cấp gói.
                </div>
              )}

              {/* Upload form */}
              <form
                onSubmit={handleReview}
                className="bg-white rounded-3xl shadow-xl p-8 mb-10"
              >
                <label className="block text-sm font-medium mb-2">
                  Chọn file hợp đồng (PDF hoặc DOCX, tối đa 10MB)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                  disabled={reviewBlockedForFree || reviewLimitReached}
                  className="block w-full text-sm border rounded-lg px-3 py-2 bg-white disabled:opacity-50"
                />

                {reviewError && (
                  <p className="text-red-600 text-sm mt-4">{reviewError}</p>
                )}

                <button
                  type="submit"
                  disabled={
                    reviewing ||
                    !selectedFile ||
                    reviewBlockedForFree ||
                    reviewLimitReached
                  }
                  className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {reviewing ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Upload size={18} />
                  )}
                  {reviewing ? "Đang phân tích..." : "Phân tích hợp đồng"}
                </button>
                {reviewing && (
                  <p className="text-gray-500 text-sm mt-3">
                    Có thể mất khoảng 1-2 phút vì AI cần đọc, đánh giá rủi
                    ro, và soạn lại toàn văn hợp đồng.
                  </p>
                )}
              </form>

              {/* Just-reviewed result */}
              {lastReview && (
                <div className="bg-white rounded-2xl shadow p-6 mb-10 border">
                  <h3 className="text-xl font-semibold mb-4">
                    Kết quả: {lastReview.original_filename}
                  </h3>

                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setReviewResultTab("analysis")}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        reviewResultTab === "analysis"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Đánh giá rủi ro
                    </button>
                    <button
                      onClick={() => setReviewResultTab("revised")}
                      disabled={!lastReview.revised_contract_text}
                      className={`px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 ${
                        reviewResultTab === "revised"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Bản đã chỉnh sửa
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
                    {reviewResultTab === "analysis"
                      ? lastReview.analysis_result
                      : lastReview.revised_contract_text}
                  </div>

                  {reviewResultTab === "revised" &&
                    lastReview.revised_contract_text && (
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={() =>
                            downloadRevisedContractDocx(lastReview.id)
                          }
                          className="border rounded-lg px-4 py-2 text-sm hover:bg-gray-50"
                        >
                          Tải DOCX
                        </button>
                        <button
                          onClick={() =>
                            downloadRevisedContractPdf(lastReview.id)
                          }
                          className="border rounded-lg px-4 py-2 text-sm hover:bg-gray-50"
                        >
                          Tải PDF
                        </button>
                      </div>
                    )}
                </div>
              )}

              {/* Review list */}
              <div>
                <h3 className="text-2xl font-semibold mb-4">
                  Lịch sử review
                </h3>

                {loadingReviews && (
                  <p className="text-gray-500">Đang tải...</p>
                )}

                {!loadingReviews && reviews.length === 0 && (
                  <p className="text-gray-500">Chưa có review nào.</p>
                )}

                <div className="space-y-3">
                  {reviews.map((r) => (
                    <div
                      key={r.id}
                      className="bg-white rounded-xl shadow-sm border p-4 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium">
                          {r.revised_contract_title || r.original_filename}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(r.created_at).toLocaleString("vi-VN")}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setLastReview(r);
                            setReviewResultTab("analysis");
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="border rounded-lg px-3 py-1.5 text-sm hover:bg-gray-50"
                        >
                          Xem
                        </button>
                        {r.revised_contract_text && (
                          <>
                            <button
                              onClick={() =>
                                downloadRevisedContractDocx(r.id)
                              }
                              className="border rounded-lg px-3 py-1.5 text-sm hover:bg-gray-50"
                            >
                              DOCX
                            </button>
                            <button
                              onClick={() =>
                                downloadRevisedContractPdf(r.id)
                              }
                              className="border rounded-lg px-3 py-1.5 text-sm hover:bg-gray-50"
                            >
                              PDF
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

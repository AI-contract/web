"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, ScanSearch, LogOut, Loader2, Upload, Scale, BookOpen, Info, Bot, X, Send } from "lucide-react";
import {
  ApiError,
  askAssistant,
  ChatMessage,
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
  getPartyAProfile,
  getReviewPreferences,
  isSafeCheckoutUrl,
  myContracts,
  myContractReviews,
  reviewContract,
  savePartyAProfile,
  saveReviewPreferences,
  startCheckout,
} from "@/lib/api";

// ---- preset "mục tiêu review" - chọn nhanh, có thể chọn nhiều ----
// (danh sách gợi ý; người dùng vẫn có thể ghi thêm yêu cầu/căn cứ
// pháp luật riêng ở ô văn bản tự do bên dưới)
const REVIEW_GOAL_PRESETS = [
  "Bảo vệ quyền lợi Bên A",
  "Bảo vệ quyền lợi Bên B",
  "Bảo vệ quyền lợi Bên mua",
  "Bảo vệ quyền lợi Bên bán",
  "Hạn chế rủi ro pháp lý cho Bên A",
  "Hạn chế rủi ro pháp lý cho Bên B",
];

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
  DISPUTE_LOCATION: "Nơi giải quyết tranh chấp",
  PENALTY_CAP_PERCENT: "Mức phạt tối đa (% giá trị hợp đồng)",
  CONTRACT_TERM_MONTHS: "Thời hạn hợp đồng (tháng)",
  MAX_LIABILITY_AMOUNT: "Mức trách nhiệm bồi thường tối đa (VNĐ)",
  ADVANCE_PAYMENT_AMOUNT: "Số tiền tạm ứng",
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
  PENALTY_CAP_PERCENT: "Chỉ nhập số, ví dụ: 20",
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
type Tab = "generate" | "review" | "intro";

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

  // ---- hồ sơ Bên A: lưu lại để tự điền cho các lần tạo hợp đồng sau
  // (dùng chung được cho cả 5 loại vì tên field PARTY_A_* giống nhau) ----
  const [partyAProfile, setPartyAProfile] = useState<Record<string, string>>(
    {}
  );
  const partyAProfileRef = useRef<Record<string, string>>({});
  const [savePartyA, setSavePartyA] = useState(false);

  useEffect(() => {
    partyAProfileRef.current = partyAProfile;
  }, [partyAProfile]);

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

  // ---- yêu cầu review: mục tiêu (chọn nhanh) + văn bản pháp luật/
  // yêu cầu riêng (tự do) - tải mặc định đã lưu theo tài khoản khi
  // vào trang, nhưng vẫn sửa được cho từng lần review cụ thể ----
  const [reviewGoals, setReviewGoals] = useState<string[]>([]);
  const [reviewInstructions, setReviewInstructions] = useState("");
  const [savingReviewPrefs, setSavingReviewPrefs] = useState(false);
  const [reviewPrefsSaved, setReviewPrefsSaved] = useState(false);

  const toggleReviewGoal = (goal: string) => {
    setReviewPrefsSaved(false);
    setReviewGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const handleSaveReviewPrefs = async () => {
    setSavingReviewPrefs(true);
    setReviewPrefsSaved(false);
    try {
      await saveReviewPreferences({
        goals: reviewGoals,
        custom_instructions: reviewInstructions,
      });
      setReviewPrefsSaved(true);
    } catch {
      // non-fatal — mặc định chỉ áp dụng cho lần review này thôi
    } finally {
      setSavingReviewPrefs(false);
    }
  };

  // ---- trợ lý ảo (widget góc dưới phải) ----
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState<ChatMessage[]>(
    []
  );
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantSending, setAssistantSending] = useState(false);
  const assistantEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!assistantOpen) return;
    assistantEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [assistantMessages, assistantOpen]);

  const handleAssistantSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const question = assistantInput.trim();
    if (!question || assistantSending) return;

    const nextMessages: ChatMessage[] = [
      ...assistantMessages,
      { role: "user", content: question },
    ];
    setAssistantMessages(nextMessages);
    setAssistantInput("");
    setAssistantSending(true);

    try {
      const res = await askAssistant(nextMessages);
      setAssistantMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.reply },
      ]);
    } catch {
      setAssistantMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Xin lỗi, trợ lý đang gặp sự cố. Bạn thử lại sau ít phút nhé.",
        },
      ]);
    } finally {
      setAssistantSending(false);
    }
  };

  const loadFieldsFor = (type: string, cancelledRef: { current: boolean }) => {
    setLoadingFields(true);
    setFieldsError(null);

    getContractTypeFields(type)
      .then((data) => {
        if (cancelledRef.current) return;
        setCurrentFields(data.required_fields);
        setContractTitle(data.title);

        // Tự điền các field PARTY_A_* từ hồ sơ đã lưu (nếu có) - chỉ
        // điền vào field đang trống, không ghi đè gì người dùng đã gõ.
        setForm((prev) => {
          const next = { ...prev };
          for (const key of data.required_fields) {
            if (
              key.startsWith("PARTY_A_") &&
              !next[key] &&
              partyAProfileRef.current[key]
            ) {
              next[key] = partyAProfileRef.current[key];
            }
          }
          return next;
        });
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

  // ---- tải yêu cầu review đã lưu mặc định cho tài khoản (nếu có) ----
  useEffect(() => {
    if (!authChecked) return;
    getReviewPreferences()
      .then((prefs) => {
        setReviewGoals(prefs.goals ?? []);
        setReviewInstructions(prefs.custom_instructions ?? "");
      })
      .catch(() => {
        // non-fatal — chưa từng lưu mặc định thì cứ để trống
      });
  }, [authChecked]);

  // ---- tải hồ sơ Bên A đã lưu cho tài khoản (nếu có) ----
  useEffect(() => {
    if (!authChecked) return;
    getPartyAProfile()
      .then((profile) => {
        setPartyAProfile(profile.fields ?? {});
      })
      .catch(() => {
        // non-fatal — chưa từng lưu thì cứ để form trống như cũ
      });
  }, [authChecked]);

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

      // Lưu hồ sơ Bên A nếu người dùng có tick chọn - không chặn kết
      // quả tạo hợp đồng nếu bước lưu này lỗi (chỉ là tiện ích phụ).
      if (savePartyA) {
        const partyAFields: Record<string, string> = {};
        for (const key of currentFields) {
          if (key.startsWith("PARTY_A_") && form[key]) {
            partyAFields[key] = form[key];
          }
        }
        try {
          const saved = await savePartyAProfile(partyAFields);
          setPartyAProfile(saved.fields);
        } catch {
          // non-fatal
        }
      }
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
      const review = await reviewContract(selectedFile, {
        goals: reviewGoals,
        custom_instructions: reviewInstructions,
      });
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
      <main className="min-h-screen flex items-center justify-center bg-[#FAF8F3]">
        <Loader2 className="animate-spin" size={32} />
      </main>
    );
  }

  const reviewLimitReached =
    !!user && user.plan !== "FREE" && user.review_used >= user.review_limit;
  const reviewBlockedForFree = !!user && user.plan === "FREE";

  return (
    <main className="min-h-screen bg-[#FAF8F3] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#16213E] text-white p-6 hidden md:flex md:flex-col border-r border-black/20">
        <div className="mb-10">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#9C7A3C]/15 border border-[#9C7A3C]/40">
              <Scale size={18} className="text-[#C6A15C]" strokeWidth={1.75} />
            </span>
            <h1 className="text-2xl font-serif font-semibold tracking-tight">Legal AI</h1>
          </div>
          <div className="mt-3 h-px w-10 bg-[#9C7A3C]" />
        </div>

        <nav className="space-y-1">
          <button
            onClick={() => setTab("intro")}
            className={`w-full flex items-center gap-3 border-l-2 px-3 py-2.5 text-left transition ${
              tab === "intro"
                ? "border-[#9C7A3C] bg-white/5 text-white"
                : "border-transparent text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Info size={18} />
            <span className="text-sm">Giới thiệu về Legal AI</span>
          </button>
          <button
            onClick={() => setTab("generate")}
            className={`w-full flex items-center gap-3 border-l-2 px-3 py-2.5 text-left transition ${
              tab === "generate"
                ? "border-[#9C7A3C] bg-white/5 text-white"
                : "border-transparent text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <FileText size={18} />
            <span className="text-sm">Tạo hợp đồng</span>
          </button>
          <button
            onClick={() => setTab("review")}
            className={`w-full flex items-center gap-3 border-l-2 px-3 py-2.5 text-left transition ${
              tab === "review"
                ? "border-[#9C7A3C] bg-white/5 text-white"
                : "border-transparent text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <ScanSearch size={18} />
            <span className="text-sm">Review hợp đồng</span>
          </button>
        </nav>

        {/* Ảnh minh họa gốc (SVG tự vẽ, không phải ảnh stock nên
            không phát sinh vấn đề bản quyền) - đặt 2 file .svg vào
            frontend/public/images/ */}
        <div className="flex-1 flex flex-col justify-center gap-4 py-6">
          <div className="rounded-md overflow-hidden">
            <img
              src="/images/scales-of-justice.svg"
              alt="Cán cân công lý"
              className="w-full h-28 object-cover"
            />
          </div>
          <div className="rounded-md overflow-hidden">
            <img
              src="/images/law-book.svg"
              alt="Sách luật"
              className="w-full h-28 object-cover"
            />
          </div>
        </div>

        {user && (
          <div className="border-t border-white/10 pt-4 text-sm text-slate-300 space-y-2">
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
                  className="w-full bg-[#9C7A3C] hover:bg-[#8A6B34] text-white rounded-md py-2 mt-2 font-medium disabled:opacity-50 transition"
                >
                  {upgrading ? "Đang chuyển hướng..." : "Nâng cấp PRO"}
                </button>
                <button
                  onClick={() => handleUpgrade("ENTERPRISE_MONTHLY")}
                  disabled={upgrading}
                  className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-md py-2 mt-2 font-medium disabled:opacity-50 transition"
                >
                  {upgrading ? "Đang chuyển hướng..." : "Nâng cấp ENTERPRISE"}
                </button>
              </>
            )}
            {user.plan === "PRO" && (
              <button
                onClick={() => handleUpgrade("ENTERPRISE_MONTHLY")}
                disabled={upgrading}
                className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-md py-2 mt-2 font-medium disabled:opacity-50 transition"
              >
                {upgrading ? "Đang chuyển hướng..." : "Nâng cấp ENTERPRISE"}
              </button>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-white mt-2"
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
                <div className="flex items-center gap-3 mb-3">
                  <BookOpen size={28} className="text-[#9C7A3C]" strokeWidth={1.5} />
                  <h2 className="text-4xl font-semibold text-[#1C2333] tracking-tight">
                    {contractTitle
                      ? `Tạo ${contractTitle.toLowerCase()}`
                      : "Tạo hợp đồng"}
                  </h2>
                </div>
                <p className="text-[#5B6472] text-lg">
                  Điền thông tin để AI tạo hợp đồng từ thư viện điều khoản.
                </p>
              </div>

              {/* Generate form */}
              <form
                onSubmit={handleGenerate}
                className="bg-white rounded-lg border border-[#DCD7C9] shadow-sm p-8 mb-10"
              >
                {/* Contract type selector */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-1">
                    Loại hợp đồng
                  </label>
                  <select
                    value={contractType}
                    onChange={(e) => handleContractTypeChange(e.target.value)}
                    className="w-full md:w-1/2 border border-[#DCD7C9] rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#9C7A3C]/30 focus:border-[#9C7A3C]"
                  >
                    {CONTRACT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                {loadingFields && (
                  <p className="text-[#5B6472] text-sm flex items-center gap-2 mb-4">
                    <Loader2 size={16} className="animate-spin" />
                    Đang tải danh sách trường thông tin...
                  </p>
                )}

                {fieldsError && !loadingFields && (
                  <p className="text-red-600 text-sm mb-4">{fieldsError}</p>
                )}

                {!loadingFields && !fieldsError && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentFields.map((key, index) => {
                      const isLastPartyAField =
                        key.startsWith("PARTY_A_") &&
                        (index === currentFields.length - 1 ||
                          !currentFields[index + 1].startsWith("PARTY_A_"));

                      const fieldEl = LONG_TEXT_FIELDS.has(key) ? (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium mb-1">
                            {labelForField(key)}
                          </label>
                          <textarea
                            value={form[key] || ""}
                            onChange={(e) =>
                              handleChange(key, e.target.value)
                            }
                            rows={3}
                            className="w-full border border-[#DCD7C9] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#9C7A3C]/30 focus:border-[#9C7A3C]"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            {labelForField(key)}
                          </label>
                          <input
                            value={form[key] || ""}
                            onChange={(e) =>
                              handleChange(key, e.target.value)
                            }
                            placeholder={NUMERIC_HINT_FIELDS[key]}
                            className="w-full border border-[#DCD7C9] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#9C7A3C]/30 focus:border-[#9C7A3C]"
                          />
                        </div>
                      );

                      return (
                        <Fragment key={key}>
                          {fieldEl}
                          {isLastPartyAField && (
                            <div className="md:col-span-2 -mt-1">
                              <label className="flex items-center gap-2 text-sm text-[#5B6472] cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={savePartyA}
                                  onChange={(e) =>
                                    setSavePartyA(e.target.checked)
                                  }
                                  className="rounded border-[#DCD7C9] text-[#16213E] focus:ring-[#9C7A3C]"
                                />
                                Lưu thông tin Bên A này cho các lần tạo
                                hợp đồng sau
                              </label>
                            </div>
                          )}
                        </Fragment>
                      );
                    })}
                  </div>
                )}

                {genError && (
                  <p className="text-red-600 text-sm mt-4">{genError}</p>
                )}

                <button
                  type="submit"
                  disabled={generating || loadingFields || !!fieldsError}
                  className="mt-6 bg-[#16213E] hover:bg-[#0E1629] text-white px-8 py-3 rounded-md font-medium disabled:opacity-50 flex items-center gap-2 transition"
                >
                  {generating && (
                    <Loader2 size={18} className="animate-spin" />
                  )}
                  {generating ? "Đang tạo..." : "Tạo hợp đồng"}
                </button>
              </form>

              {/* Just-generated result */}
              {lastContract && (
                <div className="bg-white rounded-lg border border-[#DCD7C9] shadow-sm p-6 mb-10">
                  <h3 className="text-xl font-semibold mb-4 text-[#1C2333]">
                    Hợp đồng vừa tạo: {lastContract.file_name}
                  </h3>
                  <div className="bg-[#FAF8F3] rounded-md border border-[#DCD7C9] p-4 text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
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
                      className="border border-[#DCD7C9] rounded-md px-4 py-2 text-sm hover:bg-[#FAF8F3] transition"
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
                      className="border border-[#DCD7C9] rounded-md px-4 py-2 text-sm hover:bg-[#FAF8F3] transition"
                    >
                      Tải PDF
                    </button>
                  </div>
                </div>
              )}

              {/* Contract list */}
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-[#1C2333]">
                  Hợp đồng của tôi
                </h3>

                {loadingList && (
                  <p className="text-[#5B6472]">Đang tải...</p>
                )}

                {!loadingList && contracts.length === 0 && (
                  <p className="text-[#5B6472]">Chưa có hợp đồng nào.</p>
                )}

                <div className="space-y-3">
                  {contracts.map((c) => (
                    <div
                      key={c.id}
                      className="bg-white rounded-md border border-[#DCD7C9] p-4 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium">{c.file_name}</div>
                        <div className="text-sm text-[#5B6472]">
                          {new Date(c.created_at).toLocaleString("vi-VN")}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            downloadContractDocx(c.id, c.file_name)
                          }
                          className="border border-[#DCD7C9] rounded-md px-3 py-1.5 text-sm hover:bg-[#FAF8F3] transition"
                        >
                          DOCX
                        </button>
                        <button
                          onClick={() =>
                            downloadContractPdf(c.id, c.file_name)
                          }
                          className="border border-[#DCD7C9] rounded-md px-3 py-1.5 text-sm hover:bg-[#FAF8F3] transition"
                        >
                          PDF
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : tab === "review" ? (
            <>
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-3">
                  <Scale size={28} className="text-[#9C7A3C]" strokeWidth={1.5} />
                  <h2 className="text-4xl font-semibold text-[#1C2333] tracking-tight">
                    Review hợp đồng
                  </h2>
                </div>
                <p className="text-[#5B6472] text-lg">
                  Tải lên hợp đồng (PDF hoặc DOCX) để AI đánh giá rủi ro
                  pháp lý và soạn lại bản đã chỉnh sửa.
                </p>
              </div>

              {reviewBlockedForFree && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-md p-4 mb-6 text-sm">
                  Tính năng review hợp đồng chỉ dành cho gói PRO trở lên.
                  Nâng cấp để sử dụng.
                </div>
              )}

              {!reviewBlockedForFree && reviewLimitReached && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-md p-4 mb-6 text-sm">
                  Bạn đã dùng hết lượt review hợp đồng trong tháng này. Vui
                  lòng thử lại vào tháng sau hoặc nâng cấp gói.
                </div>
              )}

              {/* Upload form */}
              <form
                onSubmit={handleReview}
                className="bg-white rounded-lg border border-[#DCD7C9] shadow-sm p-8 mb-10"
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

                <div className="mt-6 pt-6 border-t border-[#DCD7C9]">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-[#1C2333]">
                      Yêu cầu review
                    </label>
                    {reviewPrefsSaved && (
                      <span className="text-xs text-[#9C7A3C]">
                        Đã lưu làm mặc định
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#5B6472] mb-3">
                    Chọn mục tiêu review và/hoặc ghi rõ văn bản pháp luật, yêu
                    cầu riêng để AI căn cứ vào đó khi đánh giá hợp đồng. Có
                    thể lưu làm mặc định để áp dụng cho các lần review sau.
                  </p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {REVIEW_GOAL_PRESETS.map((goal) => (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => toggleReviewGoal(goal)}
                        className={`px-3 py-1.5 rounded-full text-xs border transition ${
                          reviewGoals.includes(goal)
                            ? "bg-[#16213E] text-white border-[#16213E]"
                            : "bg-white text-[#5B6472] border-[#DCD7C9] hover:bg-[#FAF8F3]"
                        }`}
                      >
                        {goal}
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={reviewInstructions}
                    onChange={(e) => {
                      setReviewPrefsSaved(false);
                      setReviewInstructions(e.target.value);
                    }}
                    placeholder="Ví dụ: Căn cứ Bộ luật Lao động 2019, Nghị định 145/2020; ưu tiên chỉ ra điều khoản bất lợi cho Bên A về nghĩa vụ bồi thường..."
                    rows={3}
                    className="w-full border border-[#DCD7C9] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9C7A3C]/30 focus:border-[#9C7A3C]"
                  />

                  <button
                    type="button"
                    onClick={handleSaveReviewPrefs}
                    disabled={savingReviewPrefs}
                    className="mt-3 border border-[#DCD7C9] rounded-md px-3 py-1.5 text-xs hover:bg-[#FAF8F3] transition disabled:opacity-50"
                  >
                    {savingReviewPrefs
                      ? "Đang lưu..."
                      : "Lưu làm mặc định cho tài khoản"}
                  </button>
                </div>

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
                  className="mt-6 bg-[#16213E] hover:bg-[#0E1629] text-white px-8 py-3 rounded-md font-medium disabled:opacity-50 flex items-center gap-2 transition"
                >
                  {reviewing ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Upload size={18} />
                  )}
                  {reviewing ? "Đang phân tích..." : "Phân tích hợp đồng"}
                </button>
                {reviewing && (
                  <p className="text-[#5B6472] text-sm mt-3">
                    Có thể mất khoảng 1-2 phút vì AI cần đọc, đánh giá rủi
                    ro, và soạn lại toàn văn hợp đồng.
                  </p>
                )}
              </form>

              {/* Just-reviewed result */}
              {lastReview && (
                <div className="bg-white rounded-lg border border-[#DCD7C9] shadow-sm p-6 mb-10">
                  <h3 className="text-xl font-semibold mb-4 text-[#1C2333]">
                    Kết quả: {lastReview.original_filename}
                  </h3>

                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setReviewResultTab("analysis")}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        reviewResultTab === "analysis"
                          ? "bg-[#16213E] text-white"
                          : "bg-[#FAF8F3] text-[#5B6472] hover:bg-[#F0EDE4] border border-[#DCD7C9]"
                      }`}
                    >
                      Đánh giá rủi ro
                    </button>
                    <button
                      onClick={() => setReviewResultTab("revised")}
                      disabled={!lastReview.revised_contract_text}
                      className={`px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 ${
                        reviewResultTab === "revised"
                          ? "bg-[#16213E] text-white"
                          : "bg-[#FAF8F3] text-[#5B6472] hover:bg-[#F0EDE4] border border-[#DCD7C9]"
                      }`}
                    >
                      Bản đã chỉnh sửa
                    </button>
                  </div>

                  <div className="bg-[#FAF8F3] rounded-md border border-[#DCD7C9] p-4 text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
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
                          className="border border-[#DCD7C9] rounded-md px-4 py-2 text-sm hover:bg-[#FAF8F3] transition"
                        >
                          Tải DOCX
                        </button>
                        <button
                          onClick={() =>
                            downloadRevisedContractPdf(lastReview.id)
                          }
                          className="border border-[#DCD7C9] rounded-md px-4 py-2 text-sm hover:bg-[#FAF8F3] transition"
                        >
                          Tải PDF
                        </button>
                      </div>
                    )}
                </div>
              )}

              {/* Review list */}
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-[#1C2333]">
                  Lịch sử review
                </h3>

                {loadingReviews && (
                  <p className="text-[#5B6472]">Đang tải...</p>
                )}

                {!loadingReviews && reviews.length === 0 && (
                  <p className="text-[#5B6472]">Chưa có review nào.</p>
                )}

                <div className="space-y-3">
                  {reviews.map((r) => (
                    <div
                      key={r.id}
                      className="bg-white rounded-md border border-[#DCD7C9] p-4 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium">
                          {r.revised_contract_title || r.original_filename}
                        </div>
                        <div className="text-sm text-[#5B6472]">
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
                          className="border border-[#DCD7C9] rounded-md px-3 py-1.5 text-sm hover:bg-[#FAF8F3] transition"
                        >
                          Xem
                        </button>
                        {r.revised_contract_text && (
                          <>
                            <button
                              onClick={() =>
                                downloadRevisedContractDocx(r.id)
                              }
                              className="border border-[#DCD7C9] rounded-md px-3 py-1.5 text-sm hover:bg-[#FAF8F3] transition"
                            >
                              DOCX
                            </button>
                            <button
                              onClick={() =>
                                downloadRevisedContractPdf(r.id)
                              }
                              className="border border-[#DCD7C9] rounded-md px-3 py-1.5 text-sm hover:bg-[#FAF8F3] transition"
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
          ) : (
            <>
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-3">
                  <Info size={28} className="text-[#9C7A3C]" strokeWidth={1.5} />
                  <h2 className="text-4xl font-semibold text-[#1C2333] tracking-tight">
                    Giới thiệu về Legal AI
                  </h2>
                </div>
                <p className="text-[#5B6472] text-lg">
                  Nền tảng AI hỗ trợ soạn thảo và rà soát hợp đồng dựa trên
                  thư viện điều khoản chuẩn theo pháp luật Việt Nam.
                </p>
              </div>

              <div className="bg-white rounded-lg border border-[#DCD7C9] shadow-sm p-8 mb-8">
                <h3 className="text-2xl font-semibold mb-2 text-[#1C2333] flex items-center gap-2.5">
                  <BookOpen size={22} className="text-[#9C7A3C]" strokeWidth={1.75} />
                  Tạo hợp đồng
                </h3>
                <p className="text-[#5B6472] mb-6">
                  Soạn nhanh 5 loại hợp đồng (Dịch vụ, Lao động, Mua bán, NDA,
                  Thử việc) từ thư viện điều khoản chuẩn.
                </p>
                <ol className="space-y-5">
                  {[
                    {
                      title: "Chọn loại hợp đồng",
                      desc: "Ở mục \"Loại hợp đồng\", chọn loại bạn cần soạn: Dịch vụ, Lao động, Mua bán, NDA hoặc Thử việc.",
                    },
                    {
                      title: "Điền thông tin hai bên và các điều khoản",
                      desc: "Form sẽ tự hiển thị đúng các trường cần thiết cho loại hợp đồng đã chọn (thông tin Bên A/Bên B, giá trị, thời hạn, các điều khoản riêng...).",
                    },
                    {
                      title: "Nhấn \"Tạo hợp đồng\"",
                      desc: "AI sẽ ghép thông tin bạn nhập vào đúng thứ tự Điều khoản chuẩn của thư viện, tạo thành văn bản hợp đồng hoàn chỉnh.",
                    },
                    {
                      title: "Tải về hoặc xem lại",
                      desc: "Tải file DOCX/PDF ngay sau khi tạo, hoặc xem lại bất kỳ lúc nào trong mục \"Hợp đồng của tôi\" bên dưới form.",
                    },
                  ].map((step, i) => (
                    <li key={i} className="flex gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#9C7A3C]/50 text-[#9C7A3C] text-sm font-serif font-semibold">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-medium text-[#1C2333]">{step.title}</p>
                        <p className="text-sm text-[#5B6472] mt-0.5">{step.desc}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="bg-white rounded-lg border border-[#DCD7C9] shadow-sm p-8 mb-10">
                <h3 className="text-2xl font-semibold mb-2 text-[#1C2333] flex items-center gap-2.5">
                  <Scale size={22} className="text-[#9C7A3C]" strokeWidth={1.75} />
                  Review hợp đồng
                </h3>
                <p className="text-[#5B6472] mb-6">
                  Tải lên hợp đồng có sẵn để AI rà soát rủi ro pháp lý và đề
                  xuất bản chỉnh sửa. Tính năng này dành cho gói PRO và
                  ENTERPRISE.
                </p>
                <ol className="space-y-5">
                  {[
                    {
                      title: "Tải lên hợp đồng",
                      desc: "Chọn file hợp đồng cần rà soát, định dạng PDF hoặc DOCX.",
                    },
                    {
                      title: "Nhấn \"Phân tích hợp đồng\"",
                      desc: "AI đọc toàn bộ nội dung, đối chiếu với quy định pháp luật và các rủi ro thường gặp trong loại hợp đồng đó.",
                    },
                    {
                      title: "Xem \"Đánh giá rủi ro\"",
                      desc: "Các điều khoản có vấn đề (thiếu chặt chẽ, bất lợi, trái quy định...) được liệt kê kèm giải thích cụ thể.",
                    },
                    {
                      title: "Xem và tải \"Bản đã chỉnh sửa\"",
                      desc: "AI đề xuất phiên bản đã sửa lại các điều khoản rủi ro; tải về DOCX hoặc PDF để sử dụng ngay.",
                    },
                  ].map((step, i) => (
                    <li key={i} className="flex gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#9C7A3C]/50 text-[#9C7A3C] text-sm font-serif font-semibold">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-medium text-[#1C2333]">{step.title}</p>
                        <p className="text-sm text-[#5B6472] mt-0.5">{step.desc}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="bg-white rounded-lg border border-[#DCD7C9] shadow-sm p-8 mb-10">
                <h3 className="text-2xl font-semibold mb-2 text-[#1C2333] flex items-center gap-2.5">
                  <Scale size={22} className="text-[#9C7A3C]" strokeWidth={1.75} />
                  Bảng giá
                </h3>
                <p className="text-[#5B6472] mb-6">
                  Phí đăng ký gói PRO và ENTERPRISE, kèm ưu đãi khi đăng ký
                  theo năm.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    {
                      name: "PRO",
                      monthly: "500.000đ",
                      yearly: "5.000.000đ",
                      savings:
                        "Tiết kiệm 1.000.000đ/năm — tương đương 2 tháng miễn phí",
                    },
                    {
                      name: "ENTERPRISE",
                      monthly: "1.000.000đ",
                      yearly: "10.000.000đ",
                      savings:
                        "Tiết kiệm 2.000.000đ/năm — tương đương 2 tháng miễn phí",
                    },
                  ].map((plan) => (
                    <div
                      key={plan.name}
                      className="rounded-md border border-[#DCD7C9] p-6"
                    >
                      <p className="text-sm font-medium text-[#9C7A3C] tracking-wide uppercase mb-1">
                        Gói {plan.name}
                      </p>
                      <p className="text-3xl font-semibold text-[#1C2333]">
                        {plan.monthly}
                        <span className="text-base font-normal text-[#5B6472]">
                          {" "}
                          /tháng
                        </span>
                      </p>
                      <div className="mt-4 pt-4 border-t border-[#DCD7C9]">
                        <p className="text-sm text-[#5B6472]">
                          Đăng ký theo năm
                        </p>
                        <p className="text-xl font-semibold text-[#1C2333]">
                          {plan.yearly}
                          <span className="text-sm font-normal text-[#5B6472]">
                            {" "}
                            /năm
                          </span>
                        </p>
                        <p className="text-xs text-[#9C7A3C] mt-1">
                          {plan.savings}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Trợ lý ảo - widget góc dưới bên phải */}
      <div className="fixed bottom-6 right-6 z-50">
        {assistantOpen && (
          <div className="mb-3 w-80 sm:w-96 h-[28rem] bg-white rounded-lg border border-[#DCD7C9] shadow-xl flex flex-col overflow-hidden">
            <div className="bg-[#16213E] text-white px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#9C7A3C]/20 border border-[#9C7A3C]/50">
                  <Bot size={15} className="text-[#C6A15C]" />
                </span>
                <span className="font-serif font-semibold">
                  Trợ lý Legal AI
                </span>
              </div>
              <button
                onClick={() => setAssistantOpen(false)}
                className="text-slate-300 hover:text-white"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAF8F3]">
              {assistantMessages.length === 0 && (
                <p className="text-sm text-[#5B6472]">
                  Xin chào! Mình có thể giúp bạn về cách tạo hợp đồng,
                  review hợp đồng, hoặc bảng giá các gói. Bạn cần hỏi gì?
                </p>
              )}
              {assistantMessages.map((m, i) => (
                <div
                  key={i}
                  className={`flex items-end gap-2 ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {m.role === "assistant" && (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#9C7A3C]/20 border border-[#9C7A3C]/50">
                      <Bot size={13} className="text-[#C6A15C]" />
                    </span>
                  )}
                  <div
                    className={`max-w-[80%] rounded-md px-3 py-2 text-sm whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-[#16213E] text-white"
                        : "bg-white border border-[#DCD7C9] text-[#1C2333]"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {assistantSending && (
                <div className="flex items-end gap-2 justify-start">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#9C7A3C]/20 border border-[#9C7A3C]/50">
                    <Bot size={13} className="text-[#C6A15C]" />
                  </span>
                  <div className="bg-white border border-[#DCD7C9] rounded-md px-3 py-2">
                    <Loader2
                      size={16}
                      className="animate-spin text-[#9C7A3C]"
                    />
                  </div>
                </div>
              )}
              <div ref={assistantEndRef} />
            </div>

            <form
              onSubmit={handleAssistantSend}
              className="border-t border-[#DCD7C9] p-3 flex gap-2 bg-white shrink-0"
            >
              <input
                value={assistantInput}
                onChange={(e) => setAssistantInput(e.target.value)}
                placeholder="Nhập câu hỏi..."
                className="flex-1 border border-[#DCD7C9] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9C7A3C]/30 focus:border-[#9C7A3C]"
              />
              <button
                type="submit"
                disabled={assistantSending || !assistantInput.trim()}
                className="bg-[#16213E] hover:bg-[#0E1629] text-white rounded-md px-3 disabled:opacity-50 transition"
                aria-label="Gửi"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          {!assistantOpen && (
            <span className="bg-white text-[#16213E] text-sm font-medium px-3 py-1.5 rounded-full shadow-md border border-[#DCD7C9] whitespace-nowrap">
              Trợ lý AI
            </span>
          )}

          <button
            onClick={() => setAssistantOpen((v) => !v)}
            className="relative h-14 w-14 rounded-full bg-gradient-to-br from-[#233457] to-[#0E1629] hover:from-[#2A3E68] hover:to-[#16213E] text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shrink-0"
            aria-label="Trợ lý AI"
          >
            {!assistantOpen && assistantMessages.length === 0 && (
              <span className="absolute inset-0 rounded-full bg-[#9C7A3C]/50 animate-ping" />
            )}
            {assistantOpen ? (
              <X size={22} />
            ) : (
              <Bot size={24} strokeWidth={1.75} />
            )}
            {!assistantOpen && (
              <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-[#0E1629]">
                <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping" />
              </span>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}

"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, ScanSearch, LogOut, Loader2, Upload, Scale, BookOpen, Info, Bot, X, Send, Phone, Mail, MapPin, Calendar, Clock, Percent, Wallet, Landmark, Hash, Briefcase, Building2, User, UserCheck, CreditCard, Package, Truck, ShieldCheck, FileSignature, CheckCircle2, Languages } from "lucide-react";
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
  getPartyBProfile,
  getReviewPreferences,
  isSafeCheckoutUrl,
  myContracts,
  myContractReviews,
  reviewContract,
  savePartyAProfile,
  savePartyBProfile,
  saveReviewPreferences,
  startCheckout,
} from "@/lib/api";

// ---- ngôn ngữ giao diện (menu/nhãn chính) - KHÔNG áp dụng cho
// FIELD_LABELS/FIELD_LABEL_OVERRIDES_BY_TYPE, vì văn bản hợp đồng
// luôn được soạn bằng tiếng Việt theo quy định pháp luật. ----
export type Lang = "vi" | "en" | "zh";

const LANG_OPTIONS: { value: Lang; label: string }[] = [
  { value: "vi", label: "VI" },
  { value: "en", label: "EN" },
  { value: "zh", label: "中文" },
];

const LOCALE_MAP: Record<Lang, string> = {
  vi: "vi-VN",
  en: "en-US",
  zh: "zh-CN",
};

// ---- preset "mục tiêu review" - chọn nhanh, có thể chọn nhiều ----
// (danh sách gợi ý; người dùng vẫn có thể ghi thêm yêu cầu/căn cứ
// pháp luật riêng ở ô văn bản tự do bên dưới)
// LƯU Ý: "value" luôn giữ nguyên tiếng Việt vì đây là nội dung được
// gửi cho AI để căn cứ khi review hợp đồng (hợp đồng & pháp luật VN
// đều bằng tiếng Việt) - chỉ "label" (hiển thị trên nút) được dịch.
const REVIEW_GOAL_PRESETS: { value: string; label: Record<Lang, string> }[] = [
  {
    value: "Bảo vệ quyền lợi Bên A",
    label: {
      vi: "Bảo vệ quyền lợi Bên A",
      en: "Protect Party A's interests",
      zh: "保护甲方权益",
    },
  },
  {
    value: "Bảo vệ quyền lợi Bên B",
    label: {
      vi: "Bảo vệ quyền lợi Bên B",
      en: "Protect Party B's interests",
      zh: "保护乙方权益",
    },
  },
  {
    value: "Bảo vệ quyền lợi Bên mua",
    label: {
      vi: "Bảo vệ quyền lợi Bên mua",
      en: "Protect the Buyer's interests",
      zh: "保护买方权益",
    },
  },
  {
    value: "Bảo vệ quyền lợi Bên bán",
    label: {
      vi: "Bảo vệ quyền lợi Bên bán",
      en: "Protect the Seller's interests",
      zh: "保护卖方权益",
    },
  },
  {
    value: "Hạn chế rủi ro pháp lý cho Bên A",
    label: {
      vi: "Hạn chế rủi ro pháp lý cho Bên A",
      en: "Minimize legal risk for Party A",
      zh: "降低甲方的法律风险",
    },
  },
  {
    value: "Hạn chế rủi ro pháp lý cho Bên B",
    label: {
      vi: "Hạn chế rủi ro pháp lý cho Bên B",
      en: "Minimize legal risk for Party B",
      zh: "降低乙方的法律风险",
    },
  },
];

// ---- contract types available ----
// (the set of contract_type identifiers is fixed by the backend's
// VALID_CONTRACT_TYPES — only the *fields* for each type are fetched
// dynamically, since those change whenever the clause library does)
// "value" is the identifier sent to the backend and never changes;
// only "label" (what the user sees in the dropdown/lists) is
// translated.
const CONTRACT_TYPES: { value: string; label: Record<Lang, string> }[] = [
  {
    value: "service",
    label: {
      vi: "Hợp đồng dịch vụ",
      en: "Service Contract",
      zh: "服务合同",
    },
  },
  {
    value: "labor",
    label: {
      vi: "Hợp đồng lao động",
      en: "Labor Contract",
      zh: "劳动合同",
    },
  },
  {
    value: "nda",
    label: {
      vi: "Thỏa thuận bảo mật (NDA)",
      en: "Non-Disclosure Agreement (NDA)",
      zh: "保密协议（NDA）",
    },
  },
  {
    value: "sale",
    label: {
      vi: "Hợp đồng mua bán",
      en: "Sale Contract",
      zh: "买卖合同",
    },
  },
  {
    value: "probation",
    label: {
      vi: "Hợp đồng thử việc",
      en: "Probation Contract",
      zh: "试用合同",
    },
  },
];

function contractTypeLabel(value: string, lang: Lang): string {
  return (
    CONTRACT_TYPES.find((t) => t.value === value)?.label[lang] || value
  );
}

// ---- friendly labels for known field keys ----
// Falls back to a humanized version of the key (FIELD_KEY -> "Field
// Key") for any field the backend adds later that isn't listed here,
// so a new clause variable never breaks the form — it just shows a
// slightly less polished label until someone adds a proper entry.
const FIELD_LABELS: Record<string, string> = {
  SIGNING_DATE: "Ngày ký hợp đồng",
  SIGNING_LOCATION: "Địa điểm ký hợp đồng",
  PARTY_A_NAME: "Tên Bên A",
  PARTY_A_REPRESENTATIVE: "Người đại diện Bên A",
  PARTY_A_ADDRESS: "Địa chỉ trụ sở chính Bên A",
  PARTY_A_PHONE: "Số điện thoại Bên A",
  PARTY_A_POSITION: "Chức vụ Người đại diện Bên A",
  PARTY_A_BUSINESS_REG_NUMBER: "Mã số doanh nghiệp/Mã số thuế Bên A",
  PARTY_B_NAME: "Tên / Họ tên Bên B",
  PARTY_B_REPRESENTATIVE: "Người đại diện Bên B",
  PARTY_B_ADDRESS: "Địa chỉ Bên B",
  PARTY_B_PHONE: "Số điện thoại Bên B",
  PARTY_B_POSITION: "Chức vụ Người đại diện Bên B",
  PARTY_B_BUSINESS_REG_NUMBER: "Mã số doanh nghiệp/Mã số thuế Bên B",
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
  CONTRACT_TERM_MONTHS: "Thời hạn hợp đồng",
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
const NUMERIC_HINT_FIELDS: Record<string, Record<Lang, string>> = {
  NOTICE_DAYS: {
    vi: "Chỉ nhập số, ví dụ: 45",
    en: "Numbers only, e.g.: 45",
    zh: "仅填数字，例如：45",
  },
  PENALTY_RATE: {
    vi: "Chỉ nhập số, ví dụ: 8",
    en: "Numbers only, e.g.: 8",
    zh: "仅填数字，例如：8",
  },
  PROBATION_DAYS: {
    vi: "Chỉ nhập số, ví dụ: 30",
    en: "Numbers only, e.g.: 30",
    zh: "仅填数字，例如：30",
  },
  PROBATION_SALARY_PERCENT: {
    vi: "Chỉ nhập số, ví dụ: 85",
    en: "Numbers only, e.g.: 85",
    zh: "仅填数字，例如：85",
  },
  FINAL_PAYMENT_DAYS: {
    vi: "Chỉ nhập số, ví dụ: 7",
    en: "Numbers only, e.g.: 7",
    zh: "仅填数字，例如：7",
  },
  WORKING_HOURS_PER_DAY: {
    vi: "Chỉ nhập số, ví dụ: 8",
    en: "Numbers only, e.g.: 8",
    zh: "仅填数字，例如：8",
  },
  WORKING_HOURS_PER_WEEK: {
    vi: "Chỉ nhập số, ví dụ: 48",
    en: "Numbers only, e.g.: 48",
    zh: "仅填数字，例如：48",
  },
  PENALTY_CAP_PERCENT: {
    vi: "Chỉ nhập số, ví dụ: 20",
    en: "Numbers only, e.g.: 20",
    zh: "仅填数字，例如：20",
  },
  CONTRACT_TERM_MONTHS: {
    vi: "VD: 01 năm; 01 tháng",
    en: "E.g.: 1 year; 1 month",
    zh: "例如：1 年；1 个月",
  },
};

function humanizeFieldKey(key: string): string {
  return key
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Nhãn field khác nhau tùy loại hợp đồng, dùng khi cùng 1 tên field
// (PARTY_A_NAME, PARTY_B_ADDRESS...) cần hiển thị khác nhau tùy ngữ
// cảnh - vd "BÊN A"/"BÊN B" chỉ áp dụng cho service/nda/sale (không
// áp dụng cho labor/probation, nơi vẫn giữ "Tên Bên A"/"Tên/Họ tên
// Bên B" cho rõ ràng vì Bên B là cá nhân); "Địa chỉ trụ sở chính"
// cho nhóm Bên B là công ty, "Địa chỉ cư trú" cho nhóm Bên B là cá
// nhân. Không khớp type nào thì rơi về FIELD_LABELS mặc định.
const FIELD_LABEL_OVERRIDES_BY_TYPE: Record<
  string,
  Record<string, string>
> = {
  service: {
    PARTY_A_NAME: "BÊN A",
    PARTY_B_NAME: "BÊN B",
    PARTY_B_ADDRESS: "Địa chỉ trụ sở chính Bên B",
  },
  nda: {
    PARTY_A_NAME: "BÊN A",
    PARTY_B_NAME: "BÊN B",
    PARTY_B_ADDRESS: "Địa chỉ trụ sở chính Bên B",
  },
  sale: {
    PARTY_A_NAME: "BÊN A",
    PARTY_B_NAME: "BÊN B",
    PARTY_B_ADDRESS: "Địa chỉ trụ sở chính Bên B",
  },
  labor: {
    PARTY_A_NAME: "NGƯỜI SỬ DỤNG LAO ĐỘNG (BÊN A)",
    PARTY_B_NAME: "NGƯỜI LAO ĐỘNG (BÊN B)",
    PARTY_B_ADDRESS: "Địa chỉ cư trú Bên B",
  },
  probation: {
    PARTY_A_NAME: "NGƯỜI SỬ DỤNG LAO ĐỘNG (BÊN A)",
    PARTY_B_NAME: "NGƯỜI LAO ĐỘNG (BÊN B)",
    PARTY_B_ADDRESS: "Địa chỉ cư trú Bên B",
  },
};

function labelForField(key: string, contractType: string): string {
  return (
    FIELD_LABEL_OVERRIDES_BY_TYPE[contractType]?.[key] ||
    FIELD_LABELS[key] ||
    humanizeFieldKey(key)
  );
}

// Icon minh họa đặt bên trong ô nhập, chọn theo từ khóa trong tên field -
// thứ tự kiểm tra từ cụ thể đến chung chung, dừng ở match đầu tiên.
function iconForField(key: string) {
  if (key === "PARTY_A_NAME") return Building2;
  if (key === "PARTY_B_NAME") return User;
  if (key.includes("PHONE")) return Phone;
  if (key.includes("EMAIL")) return Mail;
  if (key.includes("ADDRESS")) return MapPin;
  if (key.includes("REPRESENTATIVE")) return UserCheck;
  if (key.includes("POSITION") || key.includes("JOB_TITLE"))
    return Briefcase;
  if (key.includes("BUSINESS_REG_NUMBER")) return Hash;
  if (key.includes("ID_NUMBER")) return CreditCard;
  if (key.includes("BANK_ACCOUNT")) return Landmark;
  if (key.includes("PAYMENT_METHOD")) return CreditCard;
  if (key.includes("GOODS_NAME")) return Package;
  if (key.includes("QUANTITY")) return Hash;
  if (key.includes("WARRANTY")) return ShieldCheck;
  if (key.includes("DELIVERY_TERM")) return Truck;
  if (key.includes("LOCATION")) return MapPin;
  if (
    key.includes("VALUE") ||
    key.includes("SALARY") ||
    key.includes("ALLOWANCES") ||
    key.includes("AMOUNT")
  )
    return Wallet;
  if (key.includes("PERCENT") || key === "PENALTY_RATE") return Percent;
  if (key.includes("DATE") || key === "PARTY_B_DOB") return Calendar;
  if (
    key.includes("DAYS") ||
    key.includes("MONTHS") ||
    key.includes("TERM") ||
    key.includes("PERIOD") ||
    key.includes("HOURS")
  )
    return Clock;
  return FileText;
}

// ---- văn bản tĩnh của giao diện (menu/nhãn chính, tiêu đề, nút
// bấm, trợ lý AI...), dịch đủ VI/EN/中文. KHÔNG bao gồm nhãn field
// hợp đồng (xem FIELD_LABELS / FIELD_LABEL_OVERRIDES_BY_TYPE ở trên)
// vì văn bản hợp đồng luôn phải bằng tiếng Việt. ----
const UI_TEXT: Record<Lang, {
  navIntro: string;
  navGenerate: string;
  navReview: string;
  scalesAlt: string;
  lawBookAlt: string;
  planLabel: string;
  contractsUsed: (used: number, limit: number) => string;
  reviewUnavailableFree: string;
  reviewUsed: (used: number, limit: number) => string;
  redirecting: string;
  upgradePro: string;
  upgradeEnterprise: string;
  logout: string;

  generateTitleDefault: string;
  generateTitlePrefix: string;
  generateSubtitle: string;
  contractTypeLabel: string;
  loadingFieldsText: string;
  signingInfoHeader: string;
  partyAHeader: string;
  partyBHeader: string;
  savePartyACheckbox: string;
  savePartyBCheckbox: string;
  generatingBtn: string;
  createBtn: string;
  justGeneratedTitle: (fileName: string) => string;
  downloadDocx: string;
  downloadPdf: string;
  myContractsTitle: string;
  loadingText: string;
  noContracts: string;
  docxBtn: string;
  pdfBtn: string;

  reviewTitle: string;
  reviewSubtitle: string;
  reviewBlockedFree: string;
  reviewLimitReached: string;
  chooseFileLabel: string;
  reviewRequestLabel: string;
  savedAsDefault: string;
  reviewRequestDesc: string;
  instructionsPlaceholder: string;
  savingBtn: string;
  saveDefaultBtn: string;
  analyzingBtn: string;
  analyzeBtn: string;
  analyzingHint: string;
  resultTitle: (fileName: string) => string;
  riskTabBtn: string;
  revisedTabBtn: string;
  historyTitle: string;
  noReviews: string;
  viewBtn: string;

  heroTag: string;
  heroTitle: string;
  heroSubtitle: string;
  featuresTitle: string;
  featuresList: string[];
  generateSectionTitle: string;
  generateSectionDesc: string;
  generateSteps: { title: string; desc: string }[];
  reviewSectionTitle: string;
  reviewSectionDesc: string;
  reviewSteps: { title: string; desc: string }[];
  pricingTitle: string;
  pricingDesc: string;
  planPrefix: string;
  perMonth: string;
  yearlySubscribe: string;
  perYear: string;
  proSavings: string;
  entSavings: string;

  assistantHeaderTitle: string;
  closeAria: string;
  assistantGreeting: string;
  inputPlaceholder: string;
  sendAria: string;
  floatingLabel: string;
  floatingAria: string;
  assistantErrorFallback: string;

  errLoadFields: string;
  errGenerate: string;
  errReview: string;
  errCheckoutInvalid: string;
  errCheckoutStart: string;
}> = {
  vi: {
    navIntro: "Giới thiệu về Legal AI",
    navGenerate: "Tạo hợp đồng",
    navReview: "Review hợp đồng",
    scalesAlt: "Cán cân công lý",
    lawBookAlt: "Sách luật",
    planLabel: "Gói",
    contractsUsed: (used, limit) => `${used}/${limit} lượt tạo hợp đồng`,
    reviewUnavailableFree: "Review: không khả dụng (gói FREE)",
    reviewUsed: (used, limit) => `${used}/${limit} lượt review/tháng`,
    redirecting: "Đang chuyển hướng...",
    upgradePro: "Nâng cấp PRO",
    upgradeEnterprise: "Nâng cấp ENTERPRISE",
    logout: "Đăng xuất",

    generateTitleDefault: "Tạo hợp đồng",
    generateTitlePrefix: "Tạo",
    generateSubtitle: "Điền thông tin để AI tạo hợp đồng từ thư viện điều khoản.",
    contractTypeLabel: "Loại hợp đồng",
    loadingFieldsText: "Đang tải danh sách trường thông tin...",
    signingInfoHeader: "Thông tin ký kết",
    partyAHeader: "Thông tin Bên A",
    partyBHeader: "Thông tin Bên B",
    savePartyACheckbox: "Lưu thông tin Bên A này cho các lần tạo hợp đồng sau",
    savePartyBCheckbox: "Lưu thông tin Bên B này cho các lần tạo hợp đồng sau",
    generatingBtn: "Đang tạo...",
    createBtn: "Tạo hợp đồng",
    justGeneratedTitle: (fileName) => `Hợp đồng vừa tạo: ${fileName}`,
    downloadDocx: "Tải DOCX",
    downloadPdf: "Tải PDF",
    myContractsTitle: "Hợp đồng của tôi",
    loadingText: "Đang tải...",
    noContracts: "Chưa có hợp đồng nào.",
    docxBtn: "DOCX",
    pdfBtn: "PDF",

    reviewTitle: "Review hợp đồng",
    reviewSubtitle:
      "Tải lên hợp đồng (PDF hoặc DOCX) để AI đánh giá rủi ro pháp lý và soạn lại bản đã chỉnh sửa.",
    reviewBlockedFree:
      "Tính năng review hợp đồng chỉ dành cho gói PRO trở lên. Nâng cấp để sử dụng.",
    reviewLimitReached:
      "Bạn đã dùng hết lượt review hợp đồng trong tháng này. Vui lòng thử lại vào tháng sau hoặc nâng cấp gói.",
    chooseFileLabel: "Chọn file hợp đồng (PDF hoặc DOCX, tối đa 10MB)",
    reviewRequestLabel: "Yêu cầu review",
    savedAsDefault: "Đã lưu làm mặc định",
    reviewRequestDesc:
      "Chọn mục tiêu review và/hoặc ghi rõ văn bản pháp luật, yêu cầu riêng để AI căn cứ vào đó khi đánh giá hợp đồng. Có thể lưu làm mặc định để áp dụng cho các lần review sau.",
    instructionsPlaceholder:
      "Ví dụ: Căn cứ Bộ luật Lao động 2019, Nghị định 145/2020; ưu tiên chỉ ra điều khoản bất lợi cho Bên A về nghĩa vụ bồi thường...",
    savingBtn: "Đang lưu...",
    saveDefaultBtn: "Lưu làm mặc định cho tài khoản",
    analyzingBtn: "Đang phân tích...",
    analyzeBtn: "Phân tích hợp đồng",
    analyzingHint:
      "Có thể mất khoảng 1-2 phút vì AI cần đọc, đánh giá rủi ro, và soạn lại toàn văn hợp đồng.",
    resultTitle: (fileName) => `Kết quả: ${fileName}`,
    riskTabBtn: "Đánh giá rủi ro",
    revisedTabBtn: "Bản đã chỉnh sửa",
    historyTitle: "Lịch sử review",
    noReviews: "Chưa có review nào.",
    viewBtn: "Xem",

    heroTag: "Nền tảng AI pháp lý",
    heroTitle: "Soạn thảo & Review hợp đồng chuẩn theo pháp luật Việt Nam",
    heroSubtitle:
      "Tạo nhanh 5 loại hợp đồng phổ biến từ thư viện điều khoản chuẩn; Rà soát rủi ro pháp lý và kèm bản chỉnh sửa — chỉ trong vài phút.",
    featuresTitle: "Tính năng nổi bật của Legal AI",
    featuresList: [
      "Tạo hợp đồng từ thư viện điều khoản chuẩn, đủ 5 loại hợp đồng phổ biến (Dịch vụ, Lao động, Mua bán, NDA, Thử việc).",
      "Rà soát rủi ro pháp lý của hợp đồng và tự soạn lại bản đã chỉnh sửa.",
      "Tùy chọn yêu cầu review theo mục tiêu bảo vệ quyền lợi và căn cứ pháp luật riêng.",
      "Lưu hồ sơ Bên A/Bên B, tự động điền sẵn cho các lần tạo hợp đồng sau.",
      "Trợ lý AI hỗ trợ giải đáp thắc mắc ngay trong quá trình sử dụng.",
      "Tải hợp đồng dưới định dạng DOCX hoặc PDF, đúng chuẩn văn bản pháp lý.",
    ],
    generateSectionTitle: "Tạo hợp đồng",
    generateSectionDesc:
      "Soạn nhanh 5 loại hợp đồng (Dịch vụ, Lao động, Mua bán, NDA, Thử việc) từ thư viện điều khoản chuẩn.",
    generateSteps: [
      {
        title: "Chọn loại hợp đồng",
        desc: 'Ở mục "Loại hợp đồng", chọn loại bạn cần soạn: Dịch vụ, Lao động, Mua bán, NDA hoặc Thử việc.',
      },
      {
        title: "Điền thông tin hai bên và các điều khoản",
        desc: "Form sẽ tự hiển thị đúng các trường cần thiết cho loại hợp đồng đã chọn (thông tin Bên A/Bên B, giá trị, thời hạn, các điều khoản riêng...).",
      },
      {
        title: 'Nhấn "Tạo hợp đồng"',
        desc: "AI sẽ ghép thông tin bạn nhập vào đúng thứ tự Điều khoản chuẩn của thư viện, tạo thành văn bản hợp đồng hoàn chỉnh.",
      },
      {
        title: "Tải về hoặc xem lại",
        desc: 'Tải file DOCX/PDF ngay sau khi tạo, hoặc xem lại bất kỳ lúc nào trong mục "Hợp đồng của tôi" bên dưới form.',
      },
    ],
    reviewSectionTitle: "Review hợp đồng",
    reviewSectionDesc:
      "Tải lên hợp đồng có sẵn để AI rà soát rủi ro pháp lý và đề xuất bản chỉnh sửa. Tính năng này dành cho gói PRO và ENTERPRISE.",
    reviewSteps: [
      {
        title: "Tải lên hợp đồng",
        desc: "Chọn file hợp đồng cần rà soát, định dạng PDF hoặc DOCX.",
      },
      {
        title: 'Nhấn "Phân tích hợp đồng"',
        desc: "AI đọc toàn bộ nội dung, đối chiếu với quy định pháp luật và các rủi ro thường gặp trong loại hợp đồng đó.",
      },
      {
        title: 'Xem "Đánh giá rủi ro"',
        desc: "Các điều khoản có vấn đề (thiếu chặt chẽ, bất lợi, trái quy định...) được liệt kê kèm giải thích cụ thể.",
      },
      {
        title: 'Xem và tải "Bản đã chỉnh sửa"',
        desc: "AI đề xuất phiên bản đã sửa lại các điều khoản rủi ro; tải về DOCX hoặc PDF để sử dụng ngay.",
      },
    ],
    pricingTitle: "Bảng giá",
    pricingDesc: "Phí đăng ký gói PRO và ENTERPRISE, kèm ưu đãi khi đăng ký theo năm.",
    planPrefix: "Gói",
    perMonth: "/tháng",
    yearlySubscribe: "Đăng ký theo năm",
    perYear: "/năm",
    proSavings: "Tiết kiệm 1.000.000đ/năm — tương đương 2 tháng miễn phí",
    entSavings: "Tiết kiệm 2.000.000đ/năm — tương đương 2 tháng miễn phí",

    assistantHeaderTitle: "Trợ lý Legal AI",
    closeAria: "Đóng",
    assistantGreeting:
      "Xin chào! Mình có thể giúp bạn về cách tạo hợp đồng, review hợp đồng, hoặc bảng giá các gói. Bạn cần hỏi gì?",
    inputPlaceholder: "Nhập câu hỏi...",
    sendAria: "Gửi",
    floatingLabel: "Trợ lý AI",
    floatingAria: "Trợ lý AI",
    assistantErrorFallback:
      "Xin lỗi, trợ lý đang gặp sự cố. Bạn thử lại sau ít phút nhé.",

    errLoadFields: "Không thể tải danh sách trường thông tin",
    errGenerate: "Không thể tạo hợp đồng",
    errReview: "Không thể review hợp đồng",
    errCheckoutInvalid:
      "Liên kết thanh toán không hợp lệ. Vui lòng thử lại hoặc liên hệ hỗ trợ.",
    errCheckoutStart: "Không thể khởi tạo thanh toán, thử lại sau.",
  },
  en: {
    navIntro: "About Legal AI",
    navGenerate: "Generate Contract",
    navReview: "Review Contract",
    scalesAlt: "Scales of justice",
    lawBookAlt: "Law book",
    planLabel: "Plan",
    contractsUsed: (used, limit) => `${used}/${limit} contracts generated`,
    reviewUnavailableFree: "Review: unavailable (FREE plan)",
    reviewUsed: (used, limit) => `${used}/${limit} reviews this month`,
    redirecting: "Redirecting...",
    upgradePro: "Upgrade to PRO",
    upgradeEnterprise: "Upgrade to ENTERPRISE",
    logout: "Log out",

    generateTitleDefault: "Generate Contract",
    generateTitlePrefix: "Generate",
    generateSubtitle: "Fill in the details for AI to generate a contract from the clause library.",
    contractTypeLabel: "Contract type",
    loadingFieldsText: "Loading required fields...",
    signingInfoHeader: "Signing details",
    partyAHeader: "Party A details",
    partyBHeader: "Party B details",
    savePartyACheckbox: "Save this Party A information for future contracts",
    savePartyBCheckbox: "Save this Party B information for future contracts",
    generatingBtn: "Generating...",
    createBtn: "Generate contract",
    justGeneratedTitle: (fileName) => `Contract just generated: ${fileName}`,
    downloadDocx: "Download DOCX",
    downloadPdf: "Download PDF",
    myContractsTitle: "My Contracts",
    loadingText: "Loading...",
    noContracts: "No contracts yet.",
    docxBtn: "DOCX",
    pdfBtn: "PDF",

    reviewTitle: "Review Contract",
    reviewSubtitle:
      "Upload a contract (PDF or DOCX) for AI to assess legal risks and draft a revised version.",
    reviewBlockedFree:
      "The contract review feature is available on the PRO plan and above. Upgrade to use it.",
    reviewLimitReached:
      "You've used all your contract reviews for this month. Please try again next month or upgrade your plan.",
    chooseFileLabel: "Choose a contract file (PDF or DOCX, max 10MB)",
    reviewRequestLabel: "Review request",
    savedAsDefault: "Saved as default",
    reviewRequestDesc:
      "Select review goals and/or specify the legal basis or particular requirements for the AI to use when assessing the contract. You can save this as the default for future reviews.",
    instructionsPlaceholder:
      "E.g.: Based on the 2019 Labor Code, Decree 145/2020; prioritize flagging clauses unfavorable to Party A regarding compensation obligations...",
    savingBtn: "Saving...",
    saveDefaultBtn: "Save as account default",
    analyzingBtn: "Analyzing...",
    analyzeBtn: "Analyze contract",
    analyzingHint:
      "This may take about 1-2 minutes as the AI reads the document, assesses risks, and drafts the full revised text.",
    resultTitle: (fileName) => `Result: ${fileName}`,
    riskTabBtn: "Risk assessment",
    revisedTabBtn: "Revised version",
    historyTitle: "Review history",
    noReviews: "No reviews yet.",
    viewBtn: "View",

    heroTag: "AI Legal Platform",
    heroTitle: "Draft & review contracts compliant with Vietnamese law",
    heroSubtitle:
      "Quickly generate 5 common contract types from a standard clause library; review legal risks and get a revised version — in minutes.",
    featuresTitle: "Legal AI's standout features",
    featuresList: [
      "Generate contracts from a standard clause library, covering all 5 common contract types (Service, Labor, Sale, NDA, Probation).",
      "Review a contract's legal risks and automatically draft a revised version.",
      "Optionally request a review based on your protection goals and your own legal basis.",
      "Save Party A/Party B profiles, auto-filled for future contract generations.",
      "AI assistant on hand to answer questions while you work.",
      "Download contracts as DOCX or PDF, formatted to legal standards.",
    ],
    generateSectionTitle: "Generate contract",
    generateSectionDesc:
      "Quickly draft 5 contract types (Service, Labor, Sale, NDA, Probation) from the standard clause library.",
    generateSteps: [
      {
        title: "Choose a contract type",
        desc: 'In the "Contract type" field, choose the type you need: Service, Labor, Sale, NDA, or Probation.',
      },
      {
        title: "Fill in both parties' details and the clauses",
        desc: "The form automatically shows the exact fields required for the selected contract type (Party A/Party B details, value, term, specific clauses...).",
      },
      {
        title: 'Click "Generate contract"',
        desc: "The AI assembles the information you entered into the correct order of standard clauses from the library, producing a complete contract document.",
      },
      {
        title: "Download or review later",
        desc: 'Download the DOCX/PDF right away, or come back any time under "My Contracts" below the form.',
      },
    ],
    reviewSectionTitle: "Review contract",
    reviewSectionDesc:
      "Upload an existing contract for the AI to review legal risks and propose a revised version. This feature is available on the PRO and ENTERPRISE plans.",
    reviewSteps: [
      {
        title: "Upload the contract",
        desc: "Choose the contract file to review, in PDF or DOCX format.",
      },
      {
        title: 'Click "Analyze contract"',
        desc: "The AI reads the full content and checks it against legal regulations and risks commonly found in that contract type.",
      },
      {
        title: 'View "Risk assessment"',
        desc: "Problematic clauses (loosely worded, unfavorable, non-compliant...) are listed with a specific explanation.",
      },
      {
        title: 'View and download the "Revised version"',
        desc: "The AI proposes a version with the risky clauses rewritten; download it as DOCX or PDF to use right away.",
      },
    ],
    pricingTitle: "Pricing",
    pricingDesc: "PRO and ENTERPRISE subscription fees, with a discount for annual billing.",
    planPrefix: "Plan",
    perMonth: "/month",
    yearlySubscribe: "Annual billing",
    perYear: "/year",
    proSavings: "Save 1,000,000đ/year — equivalent to 2 free months",
    entSavings: "Save 2,000,000đ/year — equivalent to 2 free months",

    assistantHeaderTitle: "Legal AI Assistant",
    closeAria: "Close",
    assistantGreeting:
      "Hi! I can help you with generating contracts, reviewing contracts, or plan pricing. What would you like to ask?",
    inputPlaceholder: "Type your question...",
    sendAria: "Send",
    floatingLabel: "AI Assistant",
    floatingAria: "AI Assistant",
    assistantErrorFallback:
      "Sorry, the assistant is having trouble right now. Please try again in a few minutes.",

    errLoadFields: "Couldn't load the list of required fields",
    errGenerate: "Couldn't generate the contract",
    errReview: "Couldn't review the contract",
    errCheckoutInvalid:
      "Invalid checkout link. Please try again or contact support.",
    errCheckoutStart: "Couldn't start checkout, please try again later.",
  },
  zh: {
    navIntro: "关于 Legal AI",
    navGenerate: "生成合同",
    navReview: "审查合同",
    scalesAlt: "正义天平",
    lawBookAlt: "法律书籍",
    planLabel: "套餐",
    contractsUsed: (used, limit) => `已生成 ${used}/${limit} 份合同`,
    reviewUnavailableFree: "审查功能：不可用（FREE 套餐）",
    reviewUsed: (used, limit) => `本月已使用 ${used}/${limit} 次审查`,
    redirecting: "正在跳转...",
    upgradePro: "升级至 PRO",
    upgradeEnterprise: "升级至 ENTERPRISE",
    logout: "退出登录",

    generateTitleDefault: "生成合同",
    generateTitlePrefix: "生成",
    generateSubtitle: "填写信息，AI 将根据条款库为您生成合同。",
    contractTypeLabel: "合同类型",
    loadingFieldsText: "正在加载所需字段...",
    signingInfoHeader: "签署信息",
    partyAHeader: "甲方信息",
    partyBHeader: "乙方信息",
    savePartyACheckbox: "保存此甲方信息，供以后生成合同时自动填写",
    savePartyBCheckbox: "保存此乙方信息，供以后生成合同时自动填写",
    generatingBtn: "正在生成...",
    createBtn: "生成合同",
    justGeneratedTitle: (fileName) => `刚生成的合同：${fileName}`,
    downloadDocx: "下载 DOCX",
    downloadPdf: "下载 PDF",
    myContractsTitle: "我的合同",
    loadingText: "正在加载...",
    noContracts: "暂无合同。",
    docxBtn: "DOCX",
    pdfBtn: "PDF",

    reviewTitle: "审查合同",
    reviewSubtitle: "上传合同（PDF 或 DOCX），AI 将评估法律风险并生成修订版本。",
    reviewBlockedFree: "合同审查功能仅限 PRO 及以上套餐使用，请升级后使用。",
    reviewLimitReached: "您本月的合同审查次数已用完，请下月再试或升级套餐。",
    chooseFileLabel: "选择合同文件（PDF 或 DOCX，最大 10MB）",
    reviewRequestLabel: "审查要求",
    savedAsDefault: "已保存为默认设置",
    reviewRequestDesc:
      "选择审查目标和/或注明具体法律依据、特殊要求，供 AI 在评估合同时参考。可保存为默认设置，供以后审查使用。",
    instructionsPlaceholder:
      "例如：依据 2019 年劳动法典、第 145/2020 号议定；优先指出对甲方不利的赔偿义务条款……",
    savingBtn: "正在保存...",
    saveDefaultBtn: "保存为账户默认设置",
    analyzingBtn: "正在分析...",
    analyzeBtn: "分析合同",
    analyzingHint: "此过程可能需要 1-2 分钟，因为 AI 需要阅读、评估风险并重新撰写整份合同。",
    resultTitle: (fileName) => `结果：${fileName}`,
    riskTabBtn: "风险评估",
    revisedTabBtn: "修订版本",
    historyTitle: "审查历史",
    noReviews: "暂无审查记录。",
    viewBtn: "查看",

    heroTag: "AI 法律平台",
    heroTitle: "起草与审查符合越南法律的合同",
    heroSubtitle:
      "通过标准条款库快速生成 5 种常见合同；审查法律风险并附修订版本——只需几分钟。",
    featuresTitle: "Legal AI 主要功能",
    featuresList: [
      "通过标准条款库生成合同，涵盖全部 5 种常见合同类型（服务、劳动、买卖、保密协议、试用）。",
      "审查合同的法律风险，并自动生成修订版本。",
      "可选择按保护目标及自定义法律依据提出审查要求。",
      "保存甲方/乙方信息，供以后生成合同时自动填写。",
      "AI 助手在使用过程中随时解答疑问。",
      "以 DOCX 或 PDF 格式下载合同，符合法律文本规范。",
    ],
    generateSectionTitle: "生成合同",
    generateSectionDesc: "通过标准条款库快速起草 5 种合同（服务、劳动、买卖、保密协议、试用）。",
    generateSteps: [
      {
        title: "选择合同类型",
        desc: "在“合同类型”中选择您需要起草的类型：服务、劳动、买卖、保密协议或试用。",
      },
      {
        title: "填写双方信息及各项条款",
        desc: "表单会自动显示所选合同类型所需的字段（甲方/乙方信息、金额、期限、具体条款等）。",
      },
      {
        title: "点击“生成合同”",
        desc: "AI 会将您输入的信息按条款库的标准顺序组合，生成完整的合同文本。",
      },
      {
        title: "下载或查看",
        desc: "生成后立即下载 DOCX/PDF 文件，或随时在表单下方的“我的合同”中查看。",
      },
    ],
    reviewSectionTitle: "审查合同",
    reviewSectionDesc: "上传现有合同，由 AI 审查法律风险并提出修订建议。此功能适用于 PRO 及 ENTERPRISE 套餐。",
    reviewSteps: [
      {
        title: "上传合同",
        desc: "选择需要审查的合同文件，格式为 PDF 或 DOCX。",
      },
      {
        title: "点击“分析合同”",
        desc: "AI 将阅读全部内容，并对照法律法规及该类合同常见的风险进行核对。",
      },
      {
        title: "查看“风险评估”",
        desc: "存在问题的条款（表述不严谨、不利、违反规定等）将逐条列出并附具体说明。",
      },
      {
        title: "查看并下载“修订版本”",
        desc: "AI 提出已修改风险条款的版本；下载 DOCX 或 PDF 即可立即使用。",
      },
    ],
    pricingTitle: "价格",
    pricingDesc: "PRO 与 ENTERPRISE 套餐订阅费用，按年订阅可享优惠。",
    planPrefix: "套餐",
    perMonth: "/月",
    yearlySubscribe: "按年订阅",
    perYear: "/年",
    proSavings: "每年节省 1,000,000 越南盾——相当于 2 个月免费",
    entSavings: "每年节省 2,000,000 越南盾——相当于 2 个月免费",

    assistantHeaderTitle: "Legal AI 助手",
    closeAria: "关闭",
    assistantGreeting: "您好！我可以帮您了解如何生成合同、审查合同或套餐价格。请问需要咨询什么？",
    inputPlaceholder: "请输入您的问题...",
    sendAria: "发送",
    floatingLabel: "AI 助手",
    floatingAria: "AI 助手",
    assistantErrorFallback: "抱歉，助手暂时出现问题，请稍后再试。",

    errLoadFields: "无法加载字段列表",
    errGenerate: "无法生成合同",
    errReview: "无法审查合同",
    errCheckoutInvalid: "支付链接无效，请重试或联系客服。",
    errCheckoutStart: "无法发起支付，请稍后再试。",
  },
};

// ---- top-level tab ----
type Tab = "generate" | "review" | "intro";

export default function Home() {
  const router = useRouter();

  const [user, setUser] = useState<UserMe | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [tab, setTab] = useState<Tab>("generate");
  const [lang, setLang] = useState<Lang>("vi");
  const ui = UI_TEXT[lang];

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

  // ---- hồ sơ Bên B: cùng cơ chế với Bên A ở trên. Lưu ý: bộ field
  // Bên B khác nhau giữa nhóm hợp đồng có Bên B là công ty (service/
  // nda/sale) và nhóm có Bên B là cá nhân (labor/probation) - chỉ
  // những field thực sự xuất hiện ở loại hợp đồng đang chọn mới được
  // tự điền, nhưng NAME/PHONE/ADDRESS trùng tên ở cả 2 nhóm nên có
  // thể tự điền chéo không đúng ngữ cảnh - vẫn sửa lại được như thường.
  const [partyBProfile, setPartyBProfile] = useState<Record<string, string>>(
    {}
  );
  const partyBProfileRef = useRef<Record<string, string>>({});
  const [savePartyB, setSavePartyB] = useState(false);

  useEffect(() => {
    partyBProfileRef.current = partyBProfile;
  }, [partyBProfile]);

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
          content: ui.assistantErrorFallback,
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

        // Tự điền các field PARTY_A_*/PARTY_B_* từ hồ sơ đã lưu (nếu
        // có) - chỉ điền vào field đang trống, không ghi đè gì người
        // dùng đã gõ.
        setForm((prev) => {
          const next = { ...prev };
          for (const key of data.required_fields) {
            if (key.startsWith("PARTY_A_") && !next[key]) {
              if (partyAProfileRef.current[key]) {
                next[key] = partyAProfileRef.current[key];
              }
            } else if (key.startsWith("PARTY_B_") && !next[key]) {
              if (partyBProfileRef.current[key]) {
                next[key] = partyBProfileRef.current[key];
              }
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
            : ui.errLoadFields;
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

  // ---- tải hồ sơ Bên B đã lưu cho tài khoản (nếu có) ----
  useEffect(() => {
    if (!authChecked) return;
    getPartyBProfile()
      .then((profile) => {
        setPartyBProfile(profile.fields ?? {});
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

      // Lưu hồ sơ Bên B nếu người dùng có tick chọn - cùng cơ chế.
      if (savePartyB) {
        const partyBFields: Record<string, string> = {};
        for (const key of currentFields) {
          if (key.startsWith("PARTY_B_") && form[key]) {
            partyBFields[key] = form[key];
          }
        }
        try {
          const saved = await savePartyBProfile(partyBFields);
          setPartyBProfile(saved.fields);
        } catch {
          // non-fatal
        }
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : ui.errGenerate;
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
          : ui.errReview;
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
          ui.errCheckoutInvalid
        );
        return;
      }

      window.location.href = checkout_url;
    } catch (err) {
      setUpgrading(false);
      const message =
        err instanceof ApiError
          ? err.message
          : ui.errCheckoutStart;
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

        {/* Bộ chọn ngôn ngữ giao diện */}
        <div className="flex items-center gap-1 mb-6">
          <Languages size={14} className="text-slate-400 mr-1" />
          {LANG_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setLang(opt.value)}
              className={`text-xs px-2 py-1 rounded-md border transition ${
                lang === opt.value
                  ? "bg-[#9C7A3C] border-[#9C7A3C] text-white"
                  : "border-white/20 text-slate-300 hover:text-white hover:border-white/40"
              }`}
            >
              {opt.label}
            </button>
          ))}
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
            <span className="text-sm">{ui.navIntro}</span>
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
            <span className="text-sm">{ui.navGenerate}</span>
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
            <span className="text-sm">{ui.navReview}</span>
          </button>
        </nav>

        {/* Ảnh minh họa gốc (SVG tự vẽ, không phải ảnh stock nên
            không phát sinh vấn đề bản quyền) - đặt 2 file .svg vào
            frontend/public/images/ */}
        <div className="flex-1 flex flex-col justify-center gap-4 py-6">
          <div className="rounded-md overflow-hidden">
            <img
              src="/images/scales-of-justice.svg"
              alt={ui.scalesAlt}
              className="w-full h-28 object-cover"
            />
          </div>
          <div className="rounded-md overflow-hidden">
            <img
              src="/images/law-book.svg"
              alt={ui.lawBookAlt}
              className="w-full h-28 object-cover"
            />
          </div>
        </div>

        {user && (
          <div className="border-t border-white/10 pt-4 text-sm text-slate-300 space-y-2">
            <div>{user.email}</div>
            <div>
              {ui.planLabel}:{" "}
              <span className="font-semibold text-white">
                {user.plan}
              </span>
            </div>
            <div>
              {ui.contractsUsed(user.requests_used, user.requests_limit)}
            </div>
            <div>
              {user.plan === "FREE"
                ? ui.reviewUnavailableFree
                : ui.reviewUsed(user.review_used, user.review_limit)}
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
                  {upgrading ? ui.redirecting : ui.upgradePro}
                </button>
                <button
                  onClick={() => handleUpgrade("ENTERPRISE_MONTHLY")}
                  disabled={upgrading}
                  className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-md py-2 mt-2 font-medium disabled:opacity-50 transition"
                >
                  {upgrading ? ui.redirecting : ui.upgradeEnterprise}
                </button>
              </>
            )}
            {user.plan === "PRO" && (
              <button
                onClick={() => handleUpgrade("ENTERPRISE_MONTHLY")}
                disabled={upgrading}
                className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-md py-2 mt-2 font-medium disabled:opacity-50 transition"
              >
                {upgrading ? ui.redirecting : ui.upgradeEnterprise}
              </button>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-white mt-2"
            >
              <LogOut size={16} /> {ui.logout}
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
                      ? `${ui.generateTitlePrefix} ${contractTypeLabel(
                          contractType,
                          lang
                        ).toLowerCase()}`
                      : ui.generateTitleDefault}
                  </h2>
                </div>
                <p className="text-[#5B6472] text-lg">{ui.generateSubtitle}</p>
              </div>

              {/* Generate form */}
              <form
                onSubmit={handleGenerate}
                className="bg-white rounded-lg border border-[#DCD7C9] shadow-sm p-8 mb-10"
              >
                {/* Contract type selector */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-1">
                    {ui.contractTypeLabel}
                  </label>
                  <select
                    value={contractType}
                    onChange={(e) => handleContractTypeChange(e.target.value)}
                    className="w-full md:w-1/2 border border-[#DCD7C9] rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#9C7A3C]/30 focus:border-[#9C7A3C]"
                  >
                    {CONTRACT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label[lang]}
                      </option>
                    ))}
                  </select>
                </div>

                {loadingFields && (
                  <p className="text-[#5B6472] text-sm flex items-center gap-2 mb-4">
                    <Loader2 size={16} className="animate-spin" />
                    {ui.loadingFieldsText}
                  </p>
                )}

                {fieldsError && !loadingFields && (
                  <p className="text-red-600 text-sm mb-4">{fieldsError}</p>
                )}

                {!loadingFields && !fieldsError && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentFields.map((key, index) => {
                      const isFirstPartyAField =
                        key.startsWith("PARTY_A_") &&
                        (index === 0 ||
                          !currentFields[index - 1].startsWith("PARTY_A_"));
                      const isSigningInfoField = key === "SIGNING_DATE";
                      const isFirstPartyBField =
                        key.startsWith("PARTY_B_") &&
                        (index === 0 ||
                          !currentFields[index - 1].startsWith("PARTY_B_"));
                      const isLastPartyAField =
                        key.startsWith("PARTY_A_") &&
                        (index === currentFields.length - 1 ||
                          !currentFields[index + 1].startsWith("PARTY_A_"));
                      const isLastPartyBField =
                        key.startsWith("PARTY_B_") &&
                        (index === currentFields.length - 1 ||
                          !currentFields[index + 1].startsWith("PARTY_B_"));

                      const Icon = iconForField(key);

                      const fieldEl = LONG_TEXT_FIELDS.has(key) ? (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium mb-1">
                            {labelForField(key, contractType)}
                          </label>
                          <div className="relative">
                            <Icon
                              size={16}
                              className="absolute left-3 top-3 text-[#9C7A3C]/70 pointer-events-none"
                            />
                            <textarea
                              value={form[key] || ""}
                              onChange={(e) =>
                                handleChange(key, e.target.value)
                              }
                              rows={3}
                              className="w-full border border-[#DCD7C9] rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#9C7A3C]/30 focus:border-[#9C7A3C]"
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            {labelForField(key, contractType)}
                          </label>
                          <div className="relative">
                            <Icon
                              size={16}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9C7A3C]/70 pointer-events-none"
                            />
                            <input
                              value={form[key] || ""}
                              onChange={(e) =>
                                handleChange(key, e.target.value)
                              }
                              placeholder={NUMERIC_HINT_FIELDS[key]?.[lang]}
                              className="w-full border border-[#DCD7C9] rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#9C7A3C]/30 focus:border-[#9C7A3C]"
                            />
                          </div>
                        </div>
                      );

                      return (
                        <Fragment key={key}>
                          {isSigningInfoField && (
                            <div className="md:col-span-2 flex items-center gap-2 pb-1">
                              <Calendar size={16} className="text-[#9C7A3C]" />
                              <span className="text-xs font-semibold tracking-wide uppercase text-[#9C7A3C]">
                                {ui.signingInfoHeader}
                              </span>
                            </div>
                          )}
                          {isFirstPartyAField && (
                            <div className="md:col-span-2 flex items-center gap-2 pt-2 pb-1 border-t border-[#DCD7C9] first:border-t-0 first:pt-0">
                              <Building2
                                size={16}
                                className="text-[#9C7A3C]"
                              />
                              <span className="text-xs font-semibold tracking-wide uppercase text-[#9C7A3C]">
                                {ui.partyAHeader}
                              </span>
                            </div>
                          )}
                          {isFirstPartyBField && (
                            <div className="md:col-span-2 flex items-center gap-2 pt-4 pb-1 border-t border-[#DCD7C9]">
                              <User size={16} className="text-[#9C7A3C]" />
                              <span className="text-xs font-semibold tracking-wide uppercase text-[#9C7A3C]">
                                {ui.partyBHeader}
                              </span>
                            </div>
                          )}
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
                                {ui.savePartyACheckbox}
                              </label>
                            </div>
                          )}
                          {isLastPartyBField && (
                            <div className="md:col-span-2 -mt-1">
                              <label className="flex items-center gap-2 text-sm text-[#5B6472] cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={savePartyB}
                                  onChange={(e) =>
                                    setSavePartyB(e.target.checked)
                                  }
                                  className="rounded border-[#DCD7C9] text-[#16213E] focus:ring-[#9C7A3C]"
                                />
                                {ui.savePartyBCheckbox}
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
                  {generating ? ui.generatingBtn : ui.createBtn}
                </button>
              </form>

              {/* Just-generated result */}
              {lastContract && (
                <div className="bg-white rounded-lg border border-[#DCD7C9] shadow-sm p-6 mb-10">
                  <h3 className="text-xl font-semibold mb-4 text-[#1C2333]">
                    {ui.justGeneratedTitle(lastContract.file_name)}
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
                      {ui.downloadDocx}
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
                      {ui.downloadPdf}
                    </button>
                  </div>
                </div>
              )}

              {/* Contract list */}
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-[#1C2333]">
                  {ui.myContractsTitle}
                </h3>

                {loadingList && (
                  <p className="text-[#5B6472]">{ui.loadingText}</p>
                )}

                {!loadingList && contracts.length === 0 && (
                  <p className="text-[#5B6472]">{ui.noContracts}</p>
                )}

                <div className="space-y-3">
                  {contracts.map((c) => (
                    <div
                      key={c.id}
                      className="bg-white rounded-md border border-[#DCD7C9] p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#9C7A3C]/10 border border-[#9C7A3C]/30">
                          <FileSignature size={16} className="text-[#9C7A3C]" />
                        </span>
                        <div>
                          <div className="font-medium">
                            {CONTRACT_TYPES.find((t) => t.value === c.file_name)
                              ?.label[lang] || c.file_name}
                          </div>
                          <div className="text-sm text-[#5B6472]">
                            {new Date(c.created_at).toLocaleString(LOCALE_MAP[lang])}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            downloadContractDocx(c.id, c.file_name)
                          }
                          className="border border-[#DCD7C9] rounded-md px-3 py-1.5 text-sm hover:bg-[#FAF8F3] transition"
                        >
                          {ui.docxBtn}
                        </button>
                        <button
                          onClick={() =>
                            downloadContractPdf(c.id, c.file_name)
                          }
                          className="border border-[#DCD7C9] rounded-md px-3 py-1.5 text-sm hover:bg-[#FAF8F3] transition"
                        >
                          {ui.pdfBtn}
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
                    {ui.reviewTitle}
                  </h2>
                </div>
                <p className="text-[#5B6472] text-lg">{ui.reviewSubtitle}</p>
              </div>

              {reviewBlockedForFree && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-md p-4 mb-6 text-sm">
                  {ui.reviewBlockedFree}
                </div>
              )}

              {!reviewBlockedForFree && reviewLimitReached && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-md p-4 mb-6 text-sm">
                  {ui.reviewLimitReached}
                </div>
              )}

              {/* Upload form */}
              <form
                onSubmit={handleReview}
                className="bg-white rounded-lg border border-[#DCD7C9] shadow-sm p-8 mb-10"
              >
                <label className="block text-sm font-medium mb-2">
                  {ui.chooseFileLabel}
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
                      {ui.reviewRequestLabel}
                    </label>
                    {reviewPrefsSaved && (
                      <span className="text-xs text-[#9C7A3C]">
                        {ui.savedAsDefault}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#5B6472] mb-3">
                    {ui.reviewRequestDesc}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {REVIEW_GOAL_PRESETS.map((goal) => (
                      <button
                        key={goal.value}
                        type="button"
                        onClick={() => toggleReviewGoal(goal.value)}
                        className={`px-3 py-1.5 rounded-full text-xs border transition ${
                          reviewGoals.includes(goal.value)
                            ? "bg-[#16213E] text-white border-[#16213E]"
                            : "bg-white text-[#5B6472] border-[#DCD7C9] hover:bg-[#FAF8F3]"
                        }`}
                      >
                        {goal.label[lang]}
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={reviewInstructions}
                    onChange={(e) => {
                      setReviewPrefsSaved(false);
                      setReviewInstructions(e.target.value);
                    }}
                    placeholder={ui.instructionsPlaceholder}
                    rows={3}
                    className="w-full border border-[#DCD7C9] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9C7A3C]/30 focus:border-[#9C7A3C]"
                  />

                  <button
                    type="button"
                    onClick={handleSaveReviewPrefs}
                    disabled={savingReviewPrefs}
                    className="mt-3 border border-[#DCD7C9] rounded-md px-3 py-1.5 text-xs hover:bg-[#FAF8F3] transition disabled:opacity-50"
                  >
                    {savingReviewPrefs ? ui.savingBtn : ui.saveDefaultBtn}
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
                  {reviewing ? ui.analyzingBtn : ui.analyzeBtn}
                </button>
                {reviewing && (
                  <p className="text-[#5B6472] text-sm mt-3">
                    {ui.analyzingHint}
                  </p>
                )}
              </form>

              {/* Just-reviewed result */}
              {lastReview && (
                <div className="bg-white rounded-lg border border-[#DCD7C9] shadow-sm p-6 mb-10">
                  <h3 className="text-xl font-semibold mb-4 text-[#1C2333]">
                    {ui.resultTitle(lastReview.original_filename)}
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
                      {ui.riskTabBtn}
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
                      {ui.revisedTabBtn}
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
                          {ui.downloadDocx}
                        </button>
                        <button
                          onClick={() =>
                            downloadRevisedContractPdf(lastReview.id)
                          }
                          className="border border-[#DCD7C9] rounded-md px-4 py-2 text-sm hover:bg-[#FAF8F3] transition"
                        >
                          {ui.downloadPdf}
                        </button>
                      </div>
                    )}
                </div>
              )}

              {/* Review list */}
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-[#1C2333]">
                  {ui.historyTitle}
                </h3>

                {loadingReviews && (
                  <p className="text-[#5B6472]">{ui.loadingText}</p>
                )}

                {!loadingReviews && reviews.length === 0 && (
                  <p className="text-[#5B6472]">{ui.noReviews}</p>
                )}

                <div className="space-y-3">
                  {reviews.map((r) => (
                    <div
                      key={r.id}
                      className="bg-white rounded-md border border-[#DCD7C9] p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#9C7A3C]/10 border border-[#9C7A3C]/30">
                          <ScanSearch size={16} className="text-[#9C7A3C]" />
                        </span>
                        <div>
                          <div className="font-medium">
                            {r.revised_contract_title || r.original_filename}
                          </div>
                          <div className="text-sm text-[#5B6472]">
                            {new Date(r.created_at).toLocaleString(LOCALE_MAP[lang])}
                          </div>
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
                          {ui.viewBtn}
                        </button>
                        {r.revised_contract_text && (
                          <>
                            <button
                              onClick={() =>
                                downloadRevisedContractDocx(r.id)
                              }
                              className="border border-[#DCD7C9] rounded-md px-3 py-1.5 text-sm hover:bg-[#FAF8F3] transition"
                            >
                              {ui.docxBtn}
                            </button>
                            <button
                              onClick={() =>
                                downloadRevisedContractPdf(r.id)
                              }
                              className="border border-[#DCD7C9] rounded-md px-3 py-1.5 text-sm hover:bg-[#FAF8F3] transition"
                            >
                              {ui.pdfBtn}
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
              {/* Hero banner */}
              <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-[#1B2745] to-[#0E1629] text-white p-8 md:p-12 mb-10">
                <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div>
                    <p className="text-[#C6A15C] text-sm font-semibold tracking-wide uppercase mb-3">
                      {ui.heroTag}
                    </p>
                    <h2 className="text-3xl md:text-4xl font-semibold mb-4 leading-tight">
                      {ui.heroTitle}
                    </h2>
                    <p className="text-slate-300 text-lg">{ui.heroSubtitle}</p>
                  </div>
                  <div className="hidden md:block">
                    <img
                      src="/images/hero-illustration.svg"
                      alt={ui.heroTitle}
                      className="w-full max-w-xs mx-auto"
                    />
                  </div>
                </div>
              </div>

              {/* Tính năng nổi bật */}
              <div className="bg-white rounded-lg border border-[#DCD7C9] shadow-sm p-8 mb-8">
                <h3 className="text-2xl font-semibold mb-5 text-[#1C2333]">
                  {ui.featuresTitle}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  {ui.featuresList.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CheckCircle2
                        size={18}
                        className="text-[#9C7A3C] shrink-0 mt-0.5"
                      />
                      <span className="text-[#1C2333]">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg border border-[#DCD7C9] shadow-sm p-8 mb-8">
                <h3 className="text-2xl font-semibold mb-2 text-[#1C2333] flex items-center gap-2.5">
                  <BookOpen size={22} className="text-[#9C7A3C]" strokeWidth={1.75} />
                  {ui.generateSectionTitle}
                </h3>
                <p className="text-[#5B6472] mb-6">{ui.generateSectionDesc}</p>
                <ol className="space-y-5">
                  {ui.generateSteps.map((step, i) => (
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
                  {ui.reviewSectionTitle}
                </h3>
                <p className="text-[#5B6472] mb-6">{ui.reviewSectionDesc}</p>
                <ol className="space-y-5">
                  {ui.reviewSteps.map((step, i) => (
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
                  {ui.pricingTitle}
                </h3>
                <p className="text-[#5B6472] mb-6">{ui.pricingDesc}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    {
                      name: "PRO",
                      monthly: "500.000đ",
                      yearly: "5.000.000đ",
                      savings: ui.proSavings,
                    },
                    {
                      name: "ENTERPRISE",
                      monthly: "1.000.000đ",
                      yearly: "10.000.000đ",
                      savings: ui.entSavings,
                    },
                  ].map((plan) => (
                    <div
                      key={plan.name}
                      className="rounded-md border border-[#DCD7C9] p-6"
                    >
                      <p className="text-sm font-medium text-[#9C7A3C] tracking-wide uppercase mb-1">
                        {ui.planPrefix} {plan.name}
                      </p>
                      <p className="text-3xl font-semibold text-[#1C2333]">
                        {plan.monthly}
                        <span className="text-base font-normal text-[#5B6472]">
                          {" "}
                          {ui.perMonth}
                        </span>
                      </p>
                      <div className="mt-4 pt-4 border-t border-[#DCD7C9]">
                        <p className="text-sm text-[#5B6472]">
                          {ui.yearlySubscribe}
                        </p>
                        <p className="text-xl font-semibold text-[#1C2333]">
                          {plan.yearly}
                          <span className="text-sm font-normal text-[#5B6472]">
                            {" "}
                            {ui.perYear}
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
                  {ui.assistantHeaderTitle}
                </span>
              </div>
              <button
                onClick={() => setAssistantOpen(false)}
                className="text-slate-300 hover:text-white"
                aria-label={ui.closeAria}
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAF8F3]">
              {assistantMessages.length === 0 && (
                <p className="text-sm text-[#5B6472]">
                  {ui.assistantGreeting}
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
                placeholder={ui.inputPlaceholder}
                className="flex-1 border border-[#DCD7C9] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9C7A3C]/30 focus:border-[#9C7A3C]"
              />
              <button
                type="submit"
                disabled={assistantSending || !assistantInput.trim()}
                className="bg-[#16213E] hover:bg-[#0E1629] text-white rounded-md px-3 disabled:opacity-50 transition"
                aria-label={ui.sendAria}
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          {!assistantOpen && (
            <span className="bg-white text-[#16213E] text-sm font-medium px-3 py-1.5 rounded-full shadow-md border border-[#DCD7C9] whitespace-nowrap">
              {ui.floatingLabel}
            </span>
          )}

          <button
            onClick={() => setAssistantOpen((v) => !v)}
            className="relative h-14 w-14 rounded-full bg-gradient-to-br from-[#233457] to-[#0E1629] hover:from-[#2A3E68] hover:to-[#16213E] text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shrink-0"
            aria-label={ui.floatingAria}
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

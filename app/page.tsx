"use client";

import { useState } from "react";
import {
  Scale,
  ScanSearch,
  CheckCircle2,
  Menu,
  X,
  Bot,
  FileSignature,
  Phone,
  Languages,
} from "lucide-react";

const HOTLINE = "0972.44.15.66";
const HOTLINE_TEL = "tel:+84972441566";

type Lang = "vi" | "en" | "zh";

const LANG_LABELS: Record<Lang, string> = {
  vi: "VI",
  en: "EN",
  zh: "中文",
};

// ---- văn bản tĩnh, chuyển ngữ Việt/Anh/Trung ----
const T: Record<Lang, Record<string, string>> = {
  vi: {
    navFeatures: "Tính năng",
    navHow: "Cách hoạt động",
    navPricing: "Bảng giá",
    login: "Đăng nhập",
    tryFree: "Dùng thử miễn phí",
    heroTag: "Nền tảng AI pháp lý",
    heroTitle:
      "Soạn thảo & Review hợp đồng chuẩn theo pháp luật Việt Nam",
    heroSubtitle:
      "Tạo nhanh 5 loại hợp đồng phổ biến từ thư viện điều khoản chuẩn; Rà soát rủi ro pháp lý và kèm bản chỉnh sửa — chỉ trong vài phút.",
    ctaLearnFeatures: "Tìm hiểu tính năng",
    featuresTag: "Tính năng",
    featuresTitle: "Tính năng nổi bật của Legal AI",
    howTag: "Cách hoạt động",
    howTitle: "Chỉ 4 bước đơn giản",
    pricingTag: "Bảng giá",
    pricingTitle: "Chọn gói phù hợp với bạn",
    ctaStart: "Bắt đầu ngay",
    ctaBottomTitle: "Bắt đầu tạo hợp đồng đầu tiên ngay hôm nay",
    ctaBottomSubtitle:
      "Miễn phí 3 lượt tạo hợp đồng, không cần thẻ thanh toán.",
    footerTagline: "Nền tảng AI hỗ trợ soạn thảo & rà soát hợp đồng.",
    hotline: "Hotline",
  },
  en: {
    navFeatures: "Features",
    navHow: "How it works",
    navPricing: "Pricing",
    login: "Log in",
    tryFree: "Try for free",
    heroTag: "AI Legal Platform",
    heroTitle: "Draft & Review contracts compliant with Vietnamese law",
    heroSubtitle:
      "Quickly generate 5 common contract types from a standard clause library; review legal risks and get a revised version — in minutes.",
    ctaLearnFeatures: "Explore features",
    featuresTag: "Features",
    featuresTitle: "Legal AI's standout features",
    howTag: "How it works",
    howTitle: "Just 4 simple steps",
    pricingTag: "Pricing",
    pricingTitle: "Choose the plan that fits you",
    ctaStart: "Get started",
    ctaBottomTitle: "Create your first contract today",
    ctaBottomSubtitle: "3 free contract generations, no payment card required.",
    footerTagline: "AI platform for drafting & reviewing contracts.",
    hotline: "Hotline",
  },
  zh: {
    navFeatures: "功能",
    navHow: "使用流程",
    navPricing: "价格",
    login: "登录",
    tryFree: "免费试用",
    heroTag: "AI 法律平台",
    heroTitle: "起草与审查符合越南法律的合同",
    heroSubtitle:
      "通过标准条款库快速生成 5 种常见合同类型；审查法律风险并附修订版本——只需几分钟。",
    ctaLearnFeatures: "了解功能",
    featuresTag: "功能",
    featuresTitle: "Legal AI 主要功能",
    howTag: "使用流程",
    howTitle: "只需简单 4 步",
    pricingTag: "价格",
    pricingTitle: "选择适合您的套餐",
    ctaStart: "立即开始",
    ctaBottomTitle: "今天就创建您的第一份合同",
    ctaBottomSubtitle: "免费生成 3 份合同，无需支付卡信息。",
    footerTagline: "AI 平台，助您起草与审查合同。",
    hotline: "热线",
  },
};

const NAV_LINKS = (t: Record<string, string>) => [
  { href: "#tinh-nang", label: t.navFeatures },
  { href: "#cach-hoat-dong", label: t.navHow },
  { href: "#bang-gia", label: t.navPricing },
];

const FEATURES: Record<
  Lang,
  { icon: typeof FileSignature; title: string; desc: string }[]
> = {
  vi: [
    {
      icon: FileSignature,
      title: "Tạo hợp đồng từ thư viện điều khoản chuẩn",
      desc: "Soạn nhanh 5 loại hợp đồng phổ biến: Dịch vụ, Lao động, Mua bán, NDA, Thử việc — điền thông tin, AI ghép đúng thứ tự Điều khoản chuẩn.",
    },
    {
      icon: ScanSearch,
      title: "Rà soát rủi ro pháp lý của hợp đồng",
      desc: "Tải hợp đồng có sẵn lên, AI chỉ ra điều khoản rủi ro, bất lợi, thiếu sót — và tự soạn lại bản đã chỉnh sửa.",
    },
    {
      icon: Scale,
      title: "Yêu cầu review theo mục tiêu riêng",
      desc: "Chọn mục tiêu (bảo vệ quyền lợi Bên A/B, hạn chế rủi ro pháp lý...) hoặc nêu rõ căn cứ pháp luật để AI ưu tiên khi đánh giá.",
    },
    {
      icon: Bot,
      title: "Trợ lý AI hỗ trợ trực tiếp",
      desc: "Giải đáp thắc mắc về cách dùng tính năng, bảng giá, tài khoản ngay trong lúc thao tác, không cần chờ hỗ trợ.",
    },
  ],
  en: [
    {
      icon: FileSignature,
      title: "Generate contracts from a standard clause library",
      desc: "Quickly draft 5 common contract types: Service, Labor, Sale, NDA, Probation — fill in your info, AI assembles the correct standard clause order.",
    },
    {
      icon: ScanSearch,
      title: "Review a contract's legal risks",
      desc: "Upload an existing contract; AI flags risky, unfavorable, or missing clauses — and drafts a revised version for you.",
    },
    {
      icon: Scale,
      title: "Custom review goals",
      desc: "Choose a goal (protect Party A/B's interests, minimize legal risk...) or state your own legal basis for AI to prioritize.",
    },
    {
      icon: Bot,
      title: "Live AI assistant",
      desc: "Get answers about features, pricing, and your account right while you work — no waiting for support.",
    },
  ],
  zh: [
    {
      icon: FileSignature,
      title: "通过标准条款库生成合同",
      desc: "快速起草 5 种常见合同：服务、劳动、买卖、保密协议、试用——填写信息，AI 按标准条款顺序自动组合。",
    },
    {
      icon: ScanSearch,
      title: "审查合同的法律风险",
      desc: "上传现有合同，AI 指出存在风险、不利或缺失的条款——并自动生成修订版本。",
    },
    {
      icon: Scale,
      title: "按自定义目标审查",
      desc: "选择审查目标（保护甲方/乙方权益、降低法律风险等）或注明具体法律依据，供 AI 在评估时优先参考。",
    },
    {
      icon: Bot,
      title: "AI 助手实时支持",
      desc: "在使用过程中随时解答关于功能、价格、账户的疑问，无需等待人工支持。",
    },
  ],
};

const PRICING: Record<
  Lang,
  {
    name: string;
    price: string;
    period: string;
    yearly?: string;
    desc: string;
    features: string[];
    highlight: boolean;
  }[]
> = {
  vi: [
    {
      name: "FREE",
      price: "0đ",
      period: "",
      desc: "Dùng thử tạo hợp đồng",
      features: [
        "3 lượt tạo hợp đồng (trọn đời)",
        "Đủ 5 loại hợp đồng",
        "Không có tính năng review",
      ],
      highlight: false,
    },
    {
      name: "PRO",
      price: "500.000đ",
      period: "/tháng",
      yearly: "hoặc 5.000.000đ/năm — tiết kiệm 2 tháng",
      desc: "Cho cá nhân & doanh nghiệp nhỏ",
      features: [
        "Tạo hợp đồng không giới hạn",
        "Review hợp đồng: 1 lần/tháng",
        "Lưu hồ sơ Bên A/Bên B",
      ],
      highlight: true,
    },
    {
      name: "ENTERPRISE",
      price: "1.000.000đ",
      period: "/tháng",
      yearly: "hoặc 10.000.000đ/năm — tiết kiệm 2 tháng",
      desc: "Cho doanh nghiệp dùng thường xuyên",
      features: [
        "Tạo hợp đồng không giới hạn",
        "Review hợp đồng không giới hạn",
        "Lưu hồ sơ Bên A/Bên B",
      ],
      highlight: false,
    },
  ],
  en: [
    {
      name: "FREE",
      price: "0đ",
      period: "",
      desc: "Try out contract generation",
      features: [
        "3 contract generations (lifetime)",
        "All 5 contract types",
        "No review feature",
      ],
      highlight: false,
    },
    {
      name: "PRO",
      price: "500,000đ",
      period: "/month",
      yearly: "or 5,000,000đ/year — save 2 months",
      desc: "For individuals & small businesses",
      features: [
        "Unlimited contract generation",
        "Contract review: 1x/month",
        "Save Party A/Party B profiles",
      ],
      highlight: true,
    },
    {
      name: "ENTERPRISE",
      price: "1,000,000đ",
      period: "/month",
      yearly: "or 10,000,000đ/year — save 2 months",
      desc: "For businesses with frequent use",
      features: [
        "Unlimited contract generation",
        "Unlimited contract review",
        "Save Party A/Party B profiles",
      ],
      highlight: false,
    },
  ],
  zh: [
    {
      name: "FREE",
      price: "0越南盾",
      period: "",
      desc: "试用生成合同",
      features: [
        "3 次生成合同（终身）",
        "支持全部 5 种合同类型",
        "不含审查功能",
      ],
      highlight: false,
    },
    {
      name: "PRO",
      price: "500,000越南盾",
      period: "/月",
      yearly: "或 5,000,000越南盾/年——节省 2 个月",
      desc: "适合个人及小型企业",
      features: [
        "无限次生成合同",
        "合同审查：每月 1 次",
        "保存甲方/乙方信息",
      ],
      highlight: true,
    },
    {
      name: "ENTERPRISE",
      price: "1,000,000越南盾",
      period: "/月",
      yearly: "或 10,000,000越南盾/年——节省 2 个月",
      desc: "适合经常使用的企业",
      features: [
        "无限次生成合同",
        "无限次合同审查",
        "保存甲方/乙方信息",
      ],
      highlight: false,
    },
  ],
};

const HOW_IT_WORKS: Record<Lang, { title: string; desc: string }[]> = {
  vi: [
    {
      title: "Chọn loại hợp đồng",
      desc: "Dịch vụ, Lao động, Mua bán, NDA hoặc Thử việc.",
    },
    {
      title: "Điền thông tin",
      desc: "Form tự hiển thị đúng field cần thiết cho loại đã chọn.",
    },
    {
      title: "AI soạn thảo / rà soát",
      desc: "Tạo hợp đồng hoàn chỉnh, hoặc phân tích rủi ro pháp lý.",
    },
    {
      title: "Tải về sử dụng",
      desc: "Xuất file DOCX hoặc PDF, đúng chuẩn văn bản pháp lý.",
    },
  ],
  en: [
    {
      title: "Choose a contract type",
      desc: "Service, Labor, Sale, NDA, or Probation.",
    },
    {
      title: "Fill in the details",
      desc: "The form shows exactly the fields needed for that type.",
    },
    {
      title: "AI drafts / reviews",
      desc: "Get a complete contract, or a legal risk analysis.",
    },
    {
      title: "Download & use",
      desc: "Export as DOCX or PDF, formatted to legal standards.",
    },
  ],
  zh: [
    {
      title: "选择合同类型",
      desc: "服务、劳动、买卖、保密协议或试用。",
    },
    {
      title: "填写信息",
      desc: "表单会自动显示所选类型所需的字段。",
    },
    {
      title: "AI 起草／审查",
      desc: "生成完整合同，或进行法律风险分析。",
    },
    {
      title: "下载使用",
      desc: "导出 DOCX 或 PDF 文件，符合法律文本规范。",
    },
  ],
};

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lang, setLang] = useState<Lang>("vi");
  const t = T[lang];

  const nextLang: Record<Lang, Lang> = { vi: "en", en: "zh", zh: "vi" };

  return (
    <main className="min-h-screen bg-[#FAF8F3] text-[#1C2333]">
      {/* Top nav */}
      <header className="sticky top-0 z-40 bg-[#16213E] text-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#9C7A3C]/15 border border-[#9C7A3C]/40">
              <Scale size={18} className="text-[#C6A15C]" strokeWidth={1.75} />
            </span>
            <span className="text-xl font-semibold tracking-tight">
              Legal AI
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS(t).map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-slate-300 hover:text-white transition"
              >
                {link.label}
              </a>
            ))}
            <a
              href={HOTLINE_TEL}
              className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition"
            >
              <Phone size={14} />
              {t.hotline}: {HOTLINE}
            </a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setLang((l) => nextLang[l])}
              className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition border border-white/20 rounded-md px-2.5 py-1.5"
              aria-label="Switch language"
            >
              <Languages size={14} />
              {LANG_LABELS[lang]}
            </button>
            <a
              href="/login"
              className="text-sm text-slate-300 hover:text-white transition"
            >
              {t.login}
            </a>
            <a
              href="/login"
              className="bg-[#9C7A3C] hover:bg-[#8A6B34] text-white text-sm font-medium px-4 py-2 rounded-md transition"
            >
              {t.tryFree}
            </a>
          </div>

          <button
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 px-6 py-4 space-y-3">
            {NAV_LINKS(t).map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block text-sm text-slate-300 hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a
              href={HOTLINE_TEL}
              className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white"
            >
              <Phone size={14} />
              {t.hotline}: {HOTLINE}
            </a>
            <button
              onClick={() => setLang((l) => nextLang[l])}
              className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white"
            >
              <Languages size={14} />
              {lang === "vi" ? "English" : lang === "en" ? "中文" : "Tiếng Việt"}
            </button>
            <a
              href="/login"
              className="block text-sm text-slate-300 hover:text-white"
            >
              {t.login}
            </a>
            <a
              href="/login"
              className="block bg-[#9C7A3C] text-white text-sm font-medium px-4 py-2 rounded-md text-center"
            >
              {t.tryFree}
            </a>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1B2745] to-[#0E1629] text-white">
        <div className="max-w-6xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[#C6A15C] text-sm font-semibold tracking-wide uppercase mb-3">
              {t.heroTag}
            </p>
            <h1 className="text-4xl md:text-5xl font-semibold mb-5 leading-tight">
              {t.heroTitle}
            </h1>
            <p className="text-slate-300 text-lg mb-8">{t.heroSubtitle}</p>
            <div className="flex flex-wrap gap-3">
              <a
                href="/login"
                className="bg-[#9C7A3C] hover:bg-[#8A6B34] text-white font-medium px-6 py-3 rounded-md transition"
              >
                {t.tryFree}
              </a>
              <a
                href="#tinh-nang"
                className="border border-white/30 hover:bg-white/10 text-white font-medium px-6 py-3 rounded-md transition"
              >
                {t.ctaLearnFeatures}
              </a>
            </div>
          </div>

          <div className="hidden md:block">
            <img
              src="/images/hero-illustration.svg"
              alt="Legal AI illustration"
              className="w-full max-w-md mx-auto"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="tinh-nang" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-[#9C7A3C] text-sm font-semibold tracking-wide uppercase mb-2">
            {t.featuresTag}
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold text-[#1C2333]">
            {t.featuresTitle}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FEATURES[lang].map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="bg-white rounded-lg border border-[#DCD7C9] p-6 flex gap-4"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#9C7A3C]/10 border border-[#9C7A3C]/30">
                  <Icon size={20} className="text-[#9C7A3C]" />
                </span>
                <div>
                  <h3 className="font-semibold text-[#1C2333] mb-1">
                    {f.title}
                  </h3>
                  <p className="text-sm text-[#5B6472]">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section id="cach-hoat-dong" className="bg-white border-y border-[#DCD7C9]">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-[#9C7A3C] text-sm font-semibold tracking-wide uppercase mb-2">
              {t.howTag}
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold text-[#1C2333]">
              {t.howTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {HOW_IT_WORKS[lang].map((step, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#9C7A3C]/50 text-[#9C7A3C] text-lg font-semibold">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-[#1C2333] mb-1">
                  {step.title}
                </h3>
                <p className="text-sm text-[#5B6472]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="bang-gia" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-[#9C7A3C] text-sm font-semibold tracking-wide uppercase mb-2">
            {t.pricingTag}
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold text-[#1C2333]">
            {t.pricingTitle}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PRICING[lang].map((plan) => (
            <div
              key={plan.name}
              className={`rounded-lg border p-8 flex flex-col ${
                plan.highlight
                  ? "border-[#9C7A3C] bg-[#16213E] text-white shadow-lg md:-translate-y-2"
                  : "border-[#DCD7C9] bg-white"
              }`}
            >
              <p
                className={`text-sm font-semibold tracking-wide uppercase mb-2 ${
                  plan.highlight ? "text-[#C6A15C]" : "text-[#9C7A3C]"
                }`}
              >
                {plan.name}
              </p>
              <p
                className={`text-3xl font-semibold mb-1 ${
                  plan.highlight ? "text-white" : "text-[#1C2333]"
                }`}
              >
                {plan.price}
                <span
                  className={`text-base font-normal ${
                    plan.highlight ? "text-slate-300" : "text-[#5B6472]"
                  }`}
                >
                  {plan.period}
                </span>
              </p>
              {plan.yearly && (
                <p
                  className={`text-xs mb-4 ${
                    plan.highlight ? "text-[#C6A15C]" : "text-[#9C7A3C]"
                  }`}
                >
                  {plan.yearly}
                </p>
              )}
              <p
                className={`text-sm mb-6 ${
                  plan.highlight ? "text-slate-300" : "text-[#5B6472]"
                }`}
              >
                {plan.desc}
              </p>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2
                      size={16}
                      className={`shrink-0 mt-0.5 ${
                        plan.highlight ? "text-[#C6A15C]" : "text-[#9C7A3C]"
                      }`}
                    />
                    <span
                      className={
                        plan.highlight ? "text-slate-200" : "text-[#1C2333]"
                      }
                    >
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <a
                href="/login"
                className={`text-center font-medium px-4 py-2.5 rounded-md transition ${
                  plan.highlight
                    ? "bg-[#9C7A3C] hover:bg-[#8A6B34] text-white"
                    : "border border-[#DCD7C9] hover:bg-[#FAF8F3] text-[#1C2333]"
                }`}
              >
                {t.ctaStart}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-[#1B2745] to-[#0E1629] text-white">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-semibold mb-4">{t.ctaBottomTitle}</h2>
          <p className="text-slate-300 mb-8">{t.ctaBottomSubtitle}</p>
          <a
            href="/login"
            className="inline-block bg-[#9C7A3C] hover:bg-[#8A6B34] text-white font-medium px-8 py-3 rounded-md transition"
          >
            {t.tryFree}
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0E1629] text-slate-400">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Scale size={16} className="text-[#9C7A3C]" />
            <span className="text-white font-medium">Legal AI</span>
          </div>
          <a
            href={HOTLINE_TEL}
            className="flex items-center gap-1.5 text-sm hover:text-white transition"
          >
            <Phone size={14} />
            {t.hotline}: {HOTLINE}
          </a>
          <p className="text-sm">
            © {new Date().getFullYear()} Legal AI. {t.footerTagline}
          </p>
        </div>
      </footer>
    </main>
  );
}

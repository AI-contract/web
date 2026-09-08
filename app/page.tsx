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
} from "lucide-react";

const NAV_LINKS = [
  { href: "#tinh-nang", label: "Tính năng" },
  { href: "#cach-hoat-dong", label: "Cách hoạt động" },
  { href: "#bang-gia", label: "Bảng giá" },
];

const FEATURES = [
  {
    icon: FileSignature,
    title: "Tạo hợp đồng từ thư viện điều khoản chuẩn",
    desc: "Soạn nhanh 5 loại hợp đồng phổ biến: Dịch vụ, Lao động, Mua bán, NDA, Thử việc — điền thông tin, AI ghép đúng thứ tự Điều khoản chuẩn.",
  },
  {
    icon: ScanSearch,
    title: "AI rà soát rủi ro pháp lý",
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
];

const PRICING = [
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
];

const HOW_IT_WORKS = [
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
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-slate-300 hover:text-white transition"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <a
              href="/login"
              className="text-sm text-slate-300 hover:text-white transition"
            >
              Đăng nhập
            </a>
            <a
              href="/login"
              className="bg-[#9C7A3C] hover:bg-[#8A6B34] text-white text-sm font-medium px-4 py-2 rounded-md transition"
            >
              Dùng thử miễn phí
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
            {NAV_LINKS.map((link) => (
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
              href="/login"
              className="block text-sm text-slate-300 hover:text-white"
            >
              Đăng nhập
            </a>
            <a
              href="/login"
              className="block bg-[#9C7A3C] text-white text-sm font-medium px-4 py-2 rounded-md text-center"
            >
              Dùng thử miễn phí
            </a>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1B2745] to-[#0E1629] text-white">
        <div className="max-w-6xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[#C6A15C] text-sm font-semibold tracking-wide uppercase mb-3">
              Nền tảng AI pháp lý
            </p>
            <h1 className="text-4xl md:text-5xl font-semibold mb-5 leading-tight">
              Soạn thảo &amp; rà soát hợp đồng bằng AI, chuẩn theo pháp
              luật Việt Nam
            </h1>
            <p className="text-slate-300 text-lg mb-8">
              Tạo nhanh 5 loại hợp đồng phổ biến từ thư viện điều khoản
              chuẩn, hoặc để AI rà soát rủi ro pháp lý và tự soạn lại bản
              chỉnh sửa — chỉ trong vài phút, không cần chờ luật sư.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="/login"
                className="bg-[#9C7A3C] hover:bg-[#8A6B34] text-white font-medium px-6 py-3 rounded-md transition"
              >
                Dùng thử miễn phí
              </a>
              <a
                href="#tinh-nang"
                className="border border-white/30 hover:bg-white/10 text-white font-medium px-6 py-3 rounded-md transition"
              >
                Tìm hiểu tính năng
              </a>
            </div>
          </div>

          <div className="hidden md:block">
            <img
              src="/images/hero-illustration.svg"
              alt="Minh họa Legal AI"
              className="w-full max-w-md mx-auto"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="tinh-nang" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-[#9C7A3C] text-sm font-semibold tracking-wide uppercase mb-2">
            Tính năng
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold text-[#1C2333]">
            Tính năng nổi bật của Legal AI
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FEATURES.map((f, i) => {
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
              Cách hoạt động
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold text-[#1C2333]">
              Chỉ 4 bước đơn giản
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((step, i) => (
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
            Bảng giá
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold text-[#1C2333]">
            Chọn gói phù hợp với bạn
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PRICING.map((plan) => (
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
                Bắt đầu ngay
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-[#1B2745] to-[#0E1629] text-white">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-semibold mb-4">
            Bắt đầu tạo hợp đồng đầu tiên ngay hôm nay
          </h2>
          <p className="text-slate-300 mb-8">
            Miễn phí 3 lượt tạo hợp đồng, không cần thẻ thanh toán.
          </p>
          <a
            href="/login"
            className="inline-block bg-[#9C7A3C] hover:bg-[#8A6B34] text-white font-medium px-8 py-3 rounded-md transition"
          >
            Dùng thử miễn phí
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
          <p className="text-sm">
            © {new Date().getFullYear()} Legal AI. Nền tảng AI hỗ trợ soạn
            thảo &amp; rà soát hợp đồng.
          </p>
        </div>
      </footer>
    </main>
  );
}

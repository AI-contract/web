"use client";

/**
 * app/components/AppSidebar.tsx
 *
 * Cột menu bên trái dùng chung cho các trang ngoài dashboard (hiện dùng ở
 * "Tra cứu pháp lý"), giữ nguyên giao diện/mục menu như sidebar của dashboard:
 * logo, chọn ngôn ngữ, 7 mục chức năng, 2 ảnh minh họa, tài khoản + đăng xuất.
 *
 * - 3 mục "Giới thiệu / Tạo hợp đồng / Review hợp đồng" nằm trong dashboard
 *   (state `tab`), nên ở đây là link tới /dashboard?tab=... (dashboard đọc tham số này).
 * - Ngôn ngữ dùng chung với dashboard qua lib/lang.ts (lưu localStorage).
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Building2,
  Calendar,
  FileText,
  Info,
  Languages,
  LogOut,
  Scale,
  ScanSearch,
} from "lucide-react";
import { clearToken, getMe, type UserMe } from "@/lib/api";
import { useLang, type Lang } from "@/lib/lang";

export type SidebarActive =
  | "intro"
  | "generate"
  | "review"
  | "legalLookup"
  | "clauseLibrary"
  | "deadlines"
  | "workspace";

const LANG_OPTIONS: { value: Lang; label: string }[] = [
  { value: "vi", label: "VI" },
  { value: "en", label: "EN" },
  { value: "zh", label: "中文" },
  { value: "ko", label: "한국어" },
  { value: "ja", label: "日本語" },
];

interface Labels {
  intro: string;
  generate: string;
  review: string;
  legalLookup: string;
  clauseLibrary: string;
  deadlines: string;
  workspace: string;
  plan: string;
  logout: string;
  scalesAlt: string;
  lawBookAlt: string;
}

// Nhãn khớp với UI_TEXT / NAV_EXTRA trong app/dashboard/page.tsx.
const LABELS: Record<Lang, Labels> = {
  vi: {
    intro: "Giới thiệu về Legal AI",
    generate: "Tạo hợp đồng",
    review: "Review hợp đồng",
    legalLookup: "Tra cứu pháp lý",
    clauseLibrary: "Thư viện điều khoản",
    deadlines: "Nhắc hạn hợp đồng",
    workspace: "Workspace (Enterprise)",
    plan: "Gói",
    logout: "Đăng xuất",
    scalesAlt: "Cán cân công lý",
    lawBookAlt: "Sách luật",
  },
  en: {
    intro: "About Legal AI",
    generate: "Generate Contract",
    review: "Review Contract",
    legalLookup: "Legal Research",
    clauseLibrary: "Clause Library",
    deadlines: "Contract Deadline Reminders",
    workspace: "Workspace (Enterprise)",
    plan: "Plan",
    logout: "Log out",
    scalesAlt: "Scales of justice",
    lawBookAlt: "Law book",
  },
  zh: {
    intro: "关于 Legal AI",
    generate: "生成合同",
    review: "审查合同",
    legalLookup: "法律检索",
    clauseLibrary: "条款库",
    deadlines: "合同到期提醒",
    workspace: "工作区（企业版）",
    plan: "套餐",
    logout: "退出登录",
    scalesAlt: "正义天平",
    lawBookAlt: "法律书籍",
  },
  ko: {
    intro: "Legal AI 소개",
    generate: "계약서 생성",
    review: "계약서 검토",
    legalLookup: "법률 검색",
    clauseLibrary: "조항 라이브러리",
    deadlines: "계약 기한 알림",
    workspace: "워크스페이스 (엔터프라이즈)",
    plan: "요금제",
    logout: "로그아웃",
    scalesAlt: "정의의 저울",
    lawBookAlt: "법률 서적",
  },
  ja: {
    intro: "Legal AIについて",
    generate: "契約書を作成",
    review: "契約書をレビュー",
    legalLookup: "法令・判例検索",
    clauseLibrary: "条項ライブラリ",
    deadlines: "契約期限リマインダー",
    workspace: "ワークスペース（エンタープライズ）",
    plan: "プラン",
    logout: "ログアウト",
    scalesAlt: "正義の天秤",
    lawBookAlt: "法律書",
  },
};

const ITEM_BASE = "w-full flex items-center gap-3 border-l-2 px-3 py-2.5 text-left transition";
const ITEM_ACTIVE = "border-[#9C7A3C] bg-white/5 text-white";
const ITEM_IDLE = "border-transparent text-slate-300 hover:bg-white/5 hover:text-white";

export default function AppSidebar({ active }: { active: SidebarActive }) {
  const router = useRouter();
  const [lang, setLang] = useLang();
  const t = LABELS[lang];
  const [user, setUser] = useState<UserMe | null>(null);

  // Thông tin tài khoản chỉ để hiển thị; lỗi thì bỏ qua (trang chính tự xử lý đăng nhập).
  useEffect(() => {
    let cancelled = false;
    getMe()
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = () => {
    clearToken();
    router.push("/login");
  };

  const items: {
    key: SidebarActive;
    href: string;
    label: string;
    icon: React.ReactNode;
    bold?: boolean;
  }[] = [
    { key: "intro", href: "/dashboard?tab=intro", label: t.intro, icon: <Info size={18} /> },
    { key: "legalLookup", href: "/legal-lookup", label: t.legalLookup, icon: <Scale size={18} />, bold: true },
    { key: "generate", href: "/dashboard?tab=generate", label: t.generate, icon: <FileText size={18} />, bold: true },
    { key: "review", href: "/dashboard?tab=review", label: t.review, icon: <ScanSearch size={18} />, bold: true },
    { key: "clauseLibrary", href: "/clause-library", label: t.clauseLibrary, icon: <BookOpen size={18} /> },
    { key: "deadlines", href: "/deadlines", label: t.deadlines, icon: <Calendar size={18} /> },
    { key: "workspace", href: "/workspace", label: t.workspace, icon: <Building2 size={18} /> },
  ];

  return (
    <aside className="w-64 shrink-0 bg-[#16213E] text-white p-6 hidden md:flex md:flex-col border-r border-black/20 sticky top-0 h-screen overflow-y-auto">
      <div className="mb-10">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#9C7A3C]/15 border border-[#9C7A3C]/40">
            <Scale size={18} className="text-[#C6A15C]" strokeWidth={1.75} />
          </span>
          <span className="text-2xl font-serif font-semibold tracking-tight">Legal AI</span>
        </div>
        <div className="mt-3 h-px w-10 bg-[#9C7A3C]" />
      </div>

      <div className="flex flex-wrap items-center gap-1 mb-6">
        <Languages size={14} className="text-slate-400 mr-1" />
        {LANG_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setLang(opt.value)}
            className={`text-xs px-2 py-1 rounded-md border whitespace-nowrap transition ${
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
        {items.map((it) => (
          <Link
            key={it.key}
            href={it.href}
            aria-current={active === it.key ? "page" : undefined}
            className={`${ITEM_BASE} ${active === it.key ? ITEM_ACTIVE : ITEM_IDLE}`}
          >
            {it.icon}
            <span className={`text-sm ${it.bold ? "font-bold" : ""}`}>{it.label}</span>
          </Link>
        ))}
      </nav>

      <div className="flex-1 flex flex-col justify-center gap-4 py-6">
        <div className="rounded-md overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/scales-of-justice.svg" alt={t.scalesAlt} className="w-full h-28 object-cover" />
        </div>
        <div className="rounded-md overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/law-book.svg" alt={t.lawBookAlt} className="w-full h-28 object-cover" />
        </div>
      </div>

      {user && (
        <div className="border-t border-white/10 pt-4 text-sm text-slate-300 space-y-2">
          <div className="break-all">{user.email}</div>
          <div>
            {t.plan}: <span className="font-semibold text-white">{user.plan}</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-white mt-2"
          >
            <LogOut size={16} /> {t.logout}
          </button>
        </div>
      )}
    </aside>
  );
}

"use client";

/**
 * app/privacy/page.tsx — "Cam kết bảo mật và bảo vệ dữ liệu cá nhân".
 *
 * Trang công khai (không cần đăng nhập), dịch đủ 5 ngôn ngữ theo ngôn ngữ đang chọn (lib/lang.ts,
 * dùng chung với dashboard). Nội dung ở lib/privacy.ts — người vận hành cần rà soát lại với luật sư
 * trước khi công bố và cập nhật PRIVACY_UPDATED khi nội dung thay đổi.
 */

import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import LangSwitcher from "@/app/components/LangSwitcher";
import { useLang } from "@/lib/lang";
import { PRIVACY, PRIVACY_EMAIL, PRIVACY_UPDATED } from "@/lib/privacy";

export default function PrivacyPage() {
  const [lang] = useLang();
  const t = PRIVACY[lang];

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <header className="bg-[#16213E] text-white">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-white"
          >
            <ArrowLeft size={16} /> {t.back}
          </Link>
          <span className="inline-flex items-center gap-2 text-lg font-semibold">
            <ShieldCheck size={20} className="text-[#C6A15C]" /> {t.linkLabel}
          </span>
          <LangSwitcher />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-serif font-semibold text-[#1C2333]">{t.pageTitle}</h1>
        <p className="mt-2 text-sm text-[#8A919C]">
          {t.updatedLabel}: {PRIVACY_UPDATED}
        </p>
        <p className="mt-5 text-base leading-relaxed text-[#1C2333]">{t.intro}</p>

        <div className="mt-8 space-y-6">
          {t.sections.map((section, i) => (
            <section
              key={section.title}
              className="bg-white border border-[#DCD7C9] rounded-lg px-6 py-5"
            >
              <h2 className="text-lg font-semibold text-[#1C2333] mb-3">
                <span className="text-[#9C7A3C] mr-2">{i + 1}.</span>
                {section.title}
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-[15px] leading-relaxed text-[#3B4252]">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}

          <section className="bg-white border border-[#DCD7C9] border-l-4 border-l-[#9C7A3C] rounded-lg px-6 py-5">
            <h2 className="text-lg font-semibold text-[#1C2333] mb-2">{t.contactTitle}</h2>
            <p className="text-[15px] leading-relaxed text-[#3B4252]">
              {PRIVACY_EMAIL ? t.contactWithEmail(PRIVACY_EMAIL) : t.contactNoEmail}
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

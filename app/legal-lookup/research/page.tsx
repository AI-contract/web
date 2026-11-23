"use client";

/**
 * app/legal-lookup/research/page.tsx — "Tư vấn pháp lý AI" (CHECKLIST Phase 4).
 *
 * Trang riêng, KHÔNG thay đổi trang /legal-lookup đang chạy (engine tra cứu trực tiếp). Gọi
 * POST /legal/research trực tiếp tới FastAPI qua NEXT_PUBLIC_API_URL kèm JWT (xem lib/api.ts),
 * rồi hiển thị bằng LegalResearchWorkspace (2 cột).
 *
 * Biến môi trường (xem .env.local.example):
 *  - NEXT_PUBLIC_LEGAL_RESEARCH_MOCK=1: dùng dữ liệu minh hoạ (lib/legalResearchMock.ts) để thử
 *    giao diện khi backend chưa xong.
 *  - NEXT_PUBLIC_LEGAL_RESEARCH_ENABLED=1: hiện liên kết vào trang này ở trang Tra cứu pháp lý.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import Link from "next/link";
import { ArrowRight, Gauge, Loader2, Search, X } from "lucide-react";
import AppSidebar from "@/app/components/AppSidebar";
import LegalResearchWorkspace from "@/app/components/LegalResearchWorkspace";
import { RS } from "@/app/components/legal-research-i18n";
import { PageHeader, useAuthGuard } from "../_components/live";
import { useLL } from "../_components/i18n";
import { useLang } from "@/lib/lang";
import { ApiError, researchLegal, type LegalResearchData } from "@/lib/api";

const QUERY_MAX = 1500;
const MOCK = process.env.NEXT_PUBLIC_LEGAL_RESEARCH_MOCK === "1";

// Đích của nút "Nâng cấp gói" khi hết hạn mức tháng. Mặc định về dashboard (nơi có luồng thanh toán);
// đặt NEXT_PUBLIC_UPGRADE_URL (đường dẫn nội bộ bắt đầu bằng "/" hoặc https://) để đổi. Giá trị khác bị bỏ qua.
const UPGRADE_ENV = process.env.NEXT_PUBLIC_UPGRADE_URL ?? "";
const UPGRADE_HREF =
  /^\/(?!\/)/.test(UPGRADE_ENV) || /^https:\/\//i.test(UPGRADE_ENV) ? UPGRADE_ENV : "/dashboard?tab=intro";

type Phase =
  | { kind: "idle" }
  | { kind: "loading"; q: string }
  | { kind: "error"; q: string; message: string }
  | { kind: "quota"; q: string; message: string }
  | { kind: "done"; q: string; data: LegalResearchData };

async function fetchResearch(q: string, signal: AbortSignal): Promise<LegalResearchData> {
  if (MOCK) {
    const { mockResearch } = await import("@/lib/legalResearchMock");
    return mockResearch(q, signal);
  }
  return researchLegal(q, signal);
}

function ResearchSkeleton() {
  const bar = "rounded bg-[#EAE5D8]";
  return (
    <div className="grid animate-pulse gap-6 lg:grid-cols-12" aria-hidden="true">
      <div className="space-y-3 rounded-lg border border-[#DCD7C9] bg-white p-6 lg:col-span-7">
        <div className={`${bar} h-5 w-1/3`} />
        <div className={`${bar} h-3 w-full`} />
        <div className={`${bar} h-3 w-11/12`} />
        <div className={`${bar} h-3 w-10/12`} />
        <div className={`${bar} mt-5 h-5 w-1/4`} />
        <div className={`${bar} h-3 w-full`} />
        <div className={`${bar} h-3 w-9/12`} />
      </div>
      <div className="hidden space-y-3 lg:col-span-5 lg:block">
        <div className="space-y-2 rounded-lg border border-[#DCD7C9] bg-white p-4">
          <div className={`${bar} h-4 w-1/2`} />
          <div className={`${bar} h-3 w-full`} />
          <div className={`${bar} h-3 w-10/12`} />
        </div>
        <div className="space-y-2 rounded-lg border border-[#DCD7C9] bg-white p-4">
          <div className={`${bar} h-4 w-2/5`} />
          <div className={`${bar} h-3 w-full`} />
        </div>
      </div>
    </div>
  );
}

export default function LegalResearchPage() {
  const { ok, onUnauthorized } = useAuthGuard();
  const L = useLL();
  const [lang] = useLang();
  const R = RS[lang];

  const [text, setText] = useState("");
  const [formError, setFormError] = useState(false);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const ctrlRef = useRef<AbortController | null>(null);

  // Rời trang thì huỷ yêu cầu đang chạy.
  useEffect(() => () => ctrlRef.current?.abort(), []);

  const run = useCallback(
    (raw: string) => {
      const q = raw.replace(/\s+/g, " ").trim();
      if (q.length < 2) {
        setFormError(true);
        return;
      }
      setFormError(false);
      setText(q);

      ctrlRef.current?.abort();
      const ctrl = new AbortController();
      ctrlRef.current = ctrl;
      setPhase({ kind: "loading", q });

      fetchResearch(q, ctrl.signal)
        .then((data) => {
          if (ctrl.signal.aborted) return;
          setPhase({ kind: "done", q, data });
        })
        .catch((err) => {
          if (ctrl.signal.aborted) return;
          if (err instanceof ApiError && err.status === 401) {
            onUnauthorized();
            return;
          }
          // 429 = hết hạn mức tra cứu trong tháng (CLAUDE.md 7.6): hiện thẻ riêng kèm nút nâng cấp, không có "Thử lại".
          if (err instanceof ApiError && err.status === 429) {
            setPhase({ kind: "quota", q, message: err.message });
            return;
          }
          let message = L.genericError;
          if (err instanceof ApiError) {
            if ([404, 501, 502, 503].includes(err.status)) message = R.unavailable;
            else if (err.status === 0) message = R.timeout;
            else if (err.message) message = err.message; // vd 429: thông báo hết lượt tháng từ server
          }
          setPhase({ kind: "error", q, message });
        });
    },
    [L.genericError, R.unavailable, R.timeout, onUnauthorized]
  );

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    run(text);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter = gửi (như ô tra cứu chính); Shift+Enter = xuống dòng.
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      run(text);
    }
  }

  if (!ok) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F3]">
        <Loader2 className="animate-spin text-[#9C7A3C]" size={28} />
      </div>
    );
  }

  const busy = phase.kind === "loading";
  const hasResult = phase.kind !== "idle";

  return (
    <div className="min-h-screen bg-[#FAF8F3] flex">
      <AppSidebar active="legalLookup" />
      <div className="flex-1 min-w-0">
        <PageHeader title={R.pageTitle} backHref="/legal-lookup" backLabel={L.pageTitle} />

        <main className={`${hasResult ? "max-w-6xl" : "max-w-3xl"} mx-auto px-6 py-8`}>
          <form onSubmit={onSubmit} className={hasResult ? "mb-6" : "mt-6 mb-6"}>
            {!hasResult && (
              <p className="text-center text-[28px] font-bold leading-snug text-[#5B6472] mb-6">{R.intro}</p>
            )}
            <div className="flex items-start gap-2 bg-white border border-[#DCD7C9] rounded-3xl pl-4 pr-2 py-2 shadow-sm focus-within:ring-1 focus-within:ring-[#9C7A3C]">
              <Search size={18} className="text-[#9C7A3C] mt-2.5 shrink-0" />
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={onKeyDown}
                maxLength={QUERY_MAX}
                rows={text.length > 90 || text.includes("\n") ? 3 : 1}
                placeholder={R.placeholder}
                aria-label={R.pageTitle}
                className="flex-1 resize-none bg-transparent px-1 py-2 text-sm leading-relaxed focus:outline-none"
              />
              {text && (
                <button
                  type="button"
                  onClick={() => setText("")}
                  aria-label={L.clearText}
                  className="mt-1.5 p-1.5 rounded-full text-[#8A919C] hover:text-[#1C2333]"
                >
                  <X size={16} />
                </button>
              )}
              <button
                type="submit"
                disabled={busy}
                className="mt-0.5 inline-flex items-center gap-1.5 rounded-full bg-[#16213E] text-white px-5 py-2 text-sm hover:bg-[#1C2333] disabled:opacity-60 transition"
              >
                {busy && <Loader2 size={14} className="animate-spin" />}
                {R.submit}
              </button>
            </div>
            {formError && <p className="mt-2 text-sm text-red-600">{L.errShort}</p>}
          </form>

          {phase.kind === "loading" && (
            <div aria-live="polite">
              <p className="mb-4 flex items-center gap-2 text-sm text-[#5B6472]">
                <Loader2 size={16} className="animate-spin text-[#9C7A3C]" />
                {R.loading}
              </p>
              <ResearchSkeleton />
            </div>
          )}

          {phase.kind === "quota" && (
            <section
              role="alert"
              className="rounded-lg border border-amber-200 border-l-4 border-l-[#9C7A3C] bg-white px-5 py-5"
            >
              <p className="flex items-center gap-2 text-base font-semibold text-[#1C2333]">
                <Gauge size={18} className="shrink-0 text-[#9C7A3C]" />
                {R.quotaTitle}
              </p>
              <p className="mt-1.5 text-sm text-[#5B6472]">{R.quotaBody}</p>
              {phase.message && <p className="mt-2 text-xs text-[#8A919C]">{phase.message}</p>}
              <Link
                href={UPGRADE_HREF}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#9C7A3C] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#B08A45]"
              >
                {R.upgrade}
                <ArrowRight size={14} />
              </Link>
            </section>
          )}

          {phase.kind === "error" && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              <p>{phase.message}</p>
              {phase.message !== R.unavailable && (
                <button type="button" onClick={() => run(phase.q)} className="mt-2 underline">
                  {L.retry}
                </button>
              )}
            </div>
          )}

          {phase.kind === "done" && (
            <div>
              <p className="mb-4 text-sm text-[#5B6472]">
                {L.resultsFor}{" "}
                <span className="text-[#1C2333] font-medium">
                  “{phase.q.length > 120 ? `${phase.q.slice(0, 120)}…` : phase.q}”
                </span>
              </p>
              <LegalResearchWorkspace
                key={phase.data.query_id}
                data={phase.data}
                mock={MOCK}
                onUnauthorized={onUnauthorized}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

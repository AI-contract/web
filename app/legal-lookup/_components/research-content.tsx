"use client";

/**
 * app/legal-lookup/_components/research-content.tsx — nội dung trang "Tra cứu pháp lý" (gộp với "Tư vấn pháp lý AI", CHECKLIST Phase 4).
 *
 * Đây là trang chính của mục "Tra cứu pháp lý" (/legal-lookup): vào là thấy ngay ô nhập từ khóa/tình huống,
 * nhận kết quả tư vấn IRAC trong một bước. Trang tra cứu trực tiếp cũ nằm ở /legal-lookup/live;
 * /legal-lookup/research chuyển hướng về /legal-lookup. Gọi
 * POST /legal/research trực tiếp tới FastAPI qua NEXT_PUBLIC_API_URL kèm JWT (xem lib/api.ts),
 * rồi hiển thị bằng LegalResearchWorkspace (2 cột).
 *
 * Biến môi trường (xem .env.local.example):
 *  - NEXT_PUBLIC_LEGAL_RESEARCH_MOCK=1: dùng dữ liệu minh hoạ (lib/legalResearchMock.ts) để thử
 *    giao diện khi backend chưa xong.
 */

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { Gauge, History, Loader2, Search, X } from "lucide-react";
import AppSidebar from "@/app/components/AppSidebar";
import LegalResearchWorkspace from "@/app/components/LegalResearchWorkspace";
import { RS } from "@/app/components/legal-research-i18n";
import { PageHeader, useAuthGuard } from "./live";
import { useLL } from "./i18n";
import LegalCatalog from "./catalog";
import ContributeBox from "./contribute";
import { useLang } from "@/lib/lang";
import { ApiError, researchLegal, type LegalResearchData } from "@/lib/api";

const QUERY_MAX = 1500;
const MOCK = process.env.NEXT_PUBLIC_LEGAL_RESEARCH_MOCK === "1";

// Lịch sử tra cứu gần đây: CHỈ lưu trong trình duyệt này (localStorage), không gửi lên máy chủ — backend không lưu nội dung câu hỏi.
// Đọc qua useSyncExternalStore: lần render đầu (và khi dựng sẵn trên máy chủ) luôn là danh sách rỗng nên không lệch HTML,
// rồi mới hiện lịch sử thật; các tab cùng trình duyệt tự đồng bộ qua sự kiện "storage".
const HISTORY_KEY = "legalai.research.history.v1";
const HISTORY_EVENT = "legalai-research-history";
const HISTORY_MAX = 8;
const NO_HISTORY: string[] = [];

let historyRaw: string | null = null;
let historyList: string[] = NO_HISTORY;

function readHistory(): string[] {
  let raw = "";
  try {
    raw = window.localStorage.getItem(HISTORY_KEY) ?? "";
  } catch {
    raw = "";
  }
  if (raw === historyRaw) return historyList; // cùng chuỗi -> cùng mảng (useSyncExternalStore cần snapshot ổn định)
  historyRaw = raw;
  try {
    const parsed: unknown = JSON.parse(raw || "[]");
    historyList = Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string" && x.length > 0).slice(0, HISTORY_MAX)
      : NO_HISTORY;
  } catch {
    historyList = NO_HISTORY;
  }
  return historyList;
}

function writeHistory(list: string[]) {
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
  } catch {
    // Trình duyệt chặn lưu trữ (chế độ riêng tư...): bỏ qua, không có lịch sử nhưng tra cứu vẫn chạy bình thường.
  }
  window.dispatchEvent(new Event(HISTORY_EVENT));
}

function subscribeHistory(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(HISTORY_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(HISTORY_EVENT, onChange);
  };
}

const serverHistory = () => NO_HISTORY;

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
  const history = useSyncExternalStore(subscribeHistory, readHistory, serverHistory);
  const ctrlRef = useRef<AbortController | null>(null);

  const remember = useCallback((q: string) => {
    writeHistory([q, ...readHistory().filter((x) => x !== q)].slice(0, HISTORY_MAX));
  }, []);
  const forget = useCallback((q: string) => {
    writeHistory(readHistory().filter((x) => x !== q));
  }, []);
  const clearHistory = useCallback(() => {
    writeHistory([]);
  }, []);

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
          remember(q);
        })
        .catch((err) => {
          if (ctrl.signal.aborted) return;
          if (err instanceof ApiError && err.status === 401) {
            onUnauthorized();
            return;
          }
          // 429 = hết lượt trong ngày của người dùng hoặc hết ngân sách tháng của hệ thống (CLAUDE.md 7.6): hiện thẻ riêng kèm thông báo của server, không có "Thử lại".
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
    [L.genericError, R.unavailable, R.timeout, onUnauthorized, remember]
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
        <PageHeader title={L.pageTitle} backHref="/dashboard" backLabel={L.back} />

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
                aria-label={L.pageTitle}
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

          {history.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-medium text-[#5B6472] flex items-center gap-1 mb-1.5">
                <History size={12} /> {R.recentTitle}
                <button
                  type="button"
                  onClick={clearHistory}
                  className="ml-2 font-normal text-[#8A919C] underline hover:text-[#9C7A3C]"
                >
                  {R.clearHistory}
                </button>
              </p>
              <div className="flex flex-wrap gap-2">
                {history.map((h) => (
                  <span
                    key={h}
                    className="inline-flex items-center rounded-full border border-dashed border-[#DCD7C9] bg-[#FAF8F3] text-xs text-[#5B6472] hover:border-[#9C7A3C]"
                  >
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => run(h)}
                      className="pl-3 pr-1.5 py-1 disabled:opacity-60"
                    >
                      {h.length > 60 ? `${h.slice(0, 60)}…` : h}
                    </button>
                    <button
                      type="button"
                      onClick={() => forget(h)}
                      aria-label={R.removeFromHistory}
                      className="pr-2 py-1 text-[#8A919C] hover:text-red-600"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

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

          {/* Danh mục văn bản theo lĩnh vực (chỉ xem) và ô "Cập nhật VBPL/Án lệ/Bản án" (admin + khách đóng góp): giữ nguyên từ trang tra cứu cũ, đặt dưới khung tư vấn. */}
          <div className="mt-8 space-y-4">
            <LegalCatalog />
            <ContributeBox />
          </div>
        </main>
      </div>
    </div>
  );
}

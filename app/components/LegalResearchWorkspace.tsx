"use client";

/**
 * app/components/LegalResearchWorkspace.tsx
 *
 * Không gian làm việc 2 cột cho "Tư vấn pháp lý AI" (CHECKLIST 4.2 + 4.3), dùng đúng Design System
 * của Legal AI (navy #16213E, vàng đồng #9C7A3C/#C6A15C, nền kem #FAF8F3, viền #DCD7C9; badge xanh
 * lục cho "còn hiệu lực", hộp hổ phách cho cảnh báo).
 *
 *  - Cột trái (7/12): câu trả lời IRAC (react-markdown), thẻ [cite:art_X] thành nút Badge tương tác,
 *    hộp câu hỏi làm rõ, nút xuất DOCX/PDF, banner chuyển sang "Tạo hợp đồng".
 *  - Cột phải (5/12, sticky): thẻ nguyên văn điều luật + huy hiệu hiệu lực + tô vàng highlight_snippet.
 *    Bấm Badge ở cột trái → cuộn mượt tới thẻ tương ứng và viền sáng thẻ đó.
 *  - Điện thoại (< lg): cột phải thành ngăn kéo trượt từ dưới lên, mở khi bấm Badge hoặc nút "Xem nguồn".
 *
 * Nội dung do backend trả về (câu trả lời, nguyên văn điều luật) được hiển thị dạng text/markdown thuần,
 * KHÔNG render HTML thô (react-markdown mặc định bỏ qua HTML) và link ngoài chỉ chấp nhận http(s).
 */

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import ReactMarkdown, { type Components } from "react-markdown";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileDown,
  HelpCircle,
  Loader2,
  Scale,
  X,
} from "lucide-react";
import {
  ApiError,
  exportLegalResearch,
  type CitedArticle,
  type LegalResearchData,
  type SuggestedAction,
} from "@/lib/api";
import { useLang } from "@/lib/lang";
import { safeUrl } from "@/app/legal-lookup/_components/live";
import { useLL, type LLFull } from "@/app/legal-lookup/_components/i18n";
import { RS, type ResearchText } from "./legal-research-i18n";

// ---------------------------------------------------------------
// Tiện ích
// ---------------------------------------------------------------

// [cite:art_1] hoặc [cite:art_1, art_2] → các link nội bộ "#cite-<key>" mà react-markdown sẽ chuyển
// thành Badge (xem components.a). Chỉ nhận khoá an toàn [A-Za-z0-9_-].
const CITE_RE = /\[cite:\s*([A-Za-z0-9_,\s-]+?)\s*\]/g;

function linkifyCites(markdown: string): string {
  return markdown.replace(CITE_RE, (_m, keys: string) =>
    keys
      .split(",")
      .map((k) => k.trim())
      .filter((k) => /^[A-Za-z0-9_-]+$/.test(k))
      .map((k) => `[${k}](#cite-${k})`)
      .join(" ")
  );
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Tìm highlight_snippet trong nội dung Điều (không phân biệt hoa/thường, dung sai khoảng trắng/xuống dòng).
function findSnippet(text: string, snippet: string | null | undefined): [number, number] | null {
  const s = (snippet ?? "").normalize("NFC").trim();
  if (s.length < 8) return null;
  const pattern = escapeRegExp(s).replace(/\s+/g, "\\s+");
  const m = new RegExp(pattern, "i").exec(text);
  return m ? [m.index, m.index + m[0].length] : null;
}

const COLLAPSE_OVER = 700; // Điều dài hơn ngưỡng này thì mặc định hiển thị đoạn quanh phần được tô vàng.

interface ArticleView {
  head: boolean;
  before: string;
  mark: string;
  after: string;
  tail: boolean;
  canToggle: boolean;
}

function buildView(content: string, snippet: string | null, expanded: boolean): ArticleView {
  const text = content.normalize("NFC");
  const hit = findSnippet(text, snippet);
  const canToggle = text.length > COLLAPSE_OVER;
  let w0 = 0;
  let w1 = text.length;
  if (canToggle && !expanded) {
    if (hit) {
      w0 = Math.max(0, hit[0] - 200);
      w1 = Math.min(text.length, hit[1] + 300);
    } else {
      w1 = 600;
    }
  }
  if (!hit) {
    return { head: w0 > 0, before: text.slice(w0, w1), mark: "", after: "", tail: w1 < text.length, canToggle };
  }
  const s = Math.max(hit[0], w0);
  const e = Math.min(hit[1], w1);
  return {
    head: w0 > 0,
    before: text.slice(w0, s),
    mark: text.slice(s, e),
    after: text.slice(e, w1),
    tail: w1 < text.length,
    canToggle,
  };
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (cb: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    [query]
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  );
}

// Loại hợp đồng backend gợi ý → mã loại trong dashboard (CONTRACT_TYPES: "sale", không phải "sales").
const CONTRACT_TYPE_PARAM: Record<string, string> = {
  SERVICE: "service",
  LABOR: "labor",
  SALES: "sale",
  NDA: "nda",
  PROBATION: "probation",
};

function createContractHref(action: SuggestedAction): string {
  const type = CONTRACT_TYPE_PARAM[action.contract_type];
  return `/dashboard?tab=generate${type ? `&type=${type}` : ""}`;
}

// ---------------------------------------------------------------
// Badge trích dẫn (cột trái)
// ---------------------------------------------------------------
function CiteBadge({
  art,
  active,
  onClick,
}: {
  art: CitedArticle;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={`${art.article_number} — ${art.doc_title}`}
      className={`mx-0.5 inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 align-baseline text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9C7A3C] ${
        active
          ? "border-[#9C7A3C] bg-[#9C7A3C] text-white"
          : "border-[#C6A15C]/60 bg-[#FAF8F3] text-[#9C7A3C] hover:border-[#9C7A3C] hover:bg-[#F3EFE4]"
      }`}
    >
      <Scale size={11} className="shrink-0" />
      <span>
        {art.article_number} ({art.doc_number})
      </span>
    </button>
  );
}

// ---------------------------------------------------------------
// Renderer markdown cho câu trả lời IRAC
// ---------------------------------------------------------------
function buildComponents(args: {
  byKey: Map<string, CitedArticle>;
  activeKey: string | null;
  onCite: (key: string) => void;
  unknownCite: string;
}): Components {
  return {
    a({ href, children }) {
      if (href?.startsWith("#cite-")) {
        const key = href.slice("#cite-".length);
        const art = args.byKey.get(key);
        if (!art) {
          // Thẻ trích dẫn không có trong danh sách đối chiếu: KHÔNG ẩn đi, cảnh báo để người dùng biết
          // luận điểm này chưa kiểm chứng được (chính sách không suy diễn của hệ thống).
          return (
            <span
              title={args.unknownCite}
              className="mx-0.5 inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 align-baseline text-xs text-amber-800"
            >
              <AlertTriangle size={11} className="shrink-0" />?
            </span>
          );
        }
        return <CiteBadge art={art} active={args.activeKey === key} onClick={() => args.onCite(key)} />;
      }
      const safe = safeUrl(href);
      return safe ? (
        <a href={safe} target="_blank" rel="noopener noreferrer" className="text-[#9C7A3C] underline">
          {children}
        </a>
      ) : (
        <span>{children}</span>
      );
    },
    h1: ({ children }) => <h2 className="mt-6 mb-2 text-lg font-semibold text-[#1C2333] first:mt-0">{children}</h2>,
    h2: ({ children }) => (
      <h3 className="mt-6 mb-2 border-b border-[#EAE5D8] pb-1.5 text-base font-semibold text-[#1C2333] first:mt-0">
        {children}
      </h3>
    ),
    h3: ({ children }) => <h4 className="mt-4 mb-1 text-sm font-semibold text-[#9C7A3C]">{children}</h4>,
    p: ({ children }) => <p className="mb-3 text-sm leading-relaxed text-[#1C2333]">{children}</p>,
    ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5 text-sm leading-relaxed text-[#1C2333]">{children}</ul>,
    ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-[#1C2333]">{children}</ol>,
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    blockquote: ({ children }) => (
      <blockquote className="mb-3 border-l-4 border-[#C6A15C] bg-[#FAF8F3] px-3 py-2 text-sm text-[#1C2333]">
        {children}
      </blockquote>
    ),
    hr: () => <hr className="my-4 border-[#EAE5D8]" />,
  };
}

// ---------------------------------------------------------------
// Huy hiệu hiệu lực + thẻ điều luật (cột phải)
// ---------------------------------------------------------------
function StatusBadge({ status, L }: { status: CitedArticle["status"]; L: LLFull }) {
  if (status === "ACTIVE") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
        <CheckCircle2 size={12} /> {L.statusInForce}
      </span>
    );
  }
  if (status === "AMENDED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-800">
        <AlertTriangle size={12} /> {L.statusPartlyExpired}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
      <AlertTriangle size={12} /> {L.statusExpired}
    </span>
  );
}

function SourceCard({
  art,
  active,
  expanded,
  onToggle,
  registerRef,
  L,
  R,
}: {
  art: CitedArticle;
  active: boolean;
  expanded: boolean;
  onToggle: () => void;
  registerRef: (el: HTMLElement | null) => void;
  L: LLFull;
  R: ResearchText;
}) {
  const view = buildView(art.content, art.highlight_snippet, expanded);
  const effective = formatDate(art.effective_date);
  return (
    <article
      ref={registerRef}
      id={`cite-card-${art.cite_key}`}
      tabIndex={-1}
      aria-current={active ? "true" : undefined}
      className={`scroll-mt-4 rounded-lg border bg-white p-4 transition-shadow focus:outline-none ${
        active ? "border-[#9C7A3C] ring-2 ring-[#C6A15C]/40" : "border-[#DCD7C9]"
      }`}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <StatusBadge status={art.status} L={L} />
        {effective && <span className="text-xs text-[#5B6472]">{L.effectiveFrom(effective)}</span>}
      </div>
      <p className="text-sm font-semibold text-[#1C2333]">
        {art.article_number}
        {art.article_title ? `. ${art.article_title}` : ""}
      </p>
      <p className="mt-0.5 text-xs text-[#5B6472]">
        {art.doc_title} · {art.doc_number}
      </p>

      <p className="mt-3 whitespace-pre-wrap border-l-2 border-[#DCD7C9] pl-3 text-sm leading-relaxed text-[#1C2333]">
        {view.head && "… "}
        {view.before}
        {view.mark && <mark className="rounded bg-yellow-200/80 px-0.5 text-[#1C2333]">{view.mark}</mark>}
        {view.after}
        {view.tail && " …"}
      </p>

      {view.canToggle && (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="mt-2 inline-flex items-center gap-1 text-xs text-[#9C7A3C] hover:underline"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? R.collapse : R.expand}
        </button>
      )}
    </article>
  );
}

// ---------------------------------------------------------------
// Workspace
// ---------------------------------------------------------------
export default function LegalResearchWorkspace({
  data,
  mock = false,
  onUnauthorized,
}: {
  data: LegalResearchData;
  // true = dữ liệu minh họa (chế độ thử giao diện) → hiện biển báo.
  mock?: boolean;
  onUnauthorized?: () => void;
}) {
  const [lang] = useLang();
  const L = useLL();
  const R = RS[lang];

  const byKey = useMemo(() => new Map(data.cited_articles.map((a) => [a.cite_key, a])), [data.cited_articles]);

  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Mỗi lần bấm Badge (kể cả bấm lại cùng một Badge) tăng bộ đếm để effect cuộn chạy lại.
  const [scrollTick, setScrollTick] = useState(0);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const mobileSheet = drawerOpen && !isDesktop;

  const cardRefs = useRef(new Map<string, HTMLElement>());
  const panelRef = useRef<HTMLElement | null>(null);

  const onCite = useCallback((key: string) => {
    setActiveKey(key);
    setExpanded((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
    setDrawerOpen(true);
    setScrollTick((t) => t + 1);
  }, []);

  // Cuộn mượt tới thẻ điều luật. Chờ 2 khung vẽ để ngăn kéo (mobile) đã mở và thẻ đã bung xong.
  useEffect(() => {
    if (!activeKey) return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const el = cardRefs.current.get(activeKey);
        if (!el) return;
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
        el.focus({ preventScroll: true });
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [activeKey, scrollTick]);

  // Ngăn kéo trên điện thoại: khoá cuộn nền, đóng bằng Esc, đưa focus vào ngăn kéo.
  useEffect(() => {
    if (!mobileSheet) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileSheet]);

  const components = useMemo(
    () => buildComponents({ byKey, activeKey, onCite, unknownCite: R.unknownCite }),
    [byKey, activeKey, onCite, R.unknownCite]
  );
  const markdown = useMemo(() => linkifyCites(data.answer_markdown), [data.answer_markdown]);

  // ---- xuất DOCX/PDF ----
  const [exporting, setExporting] = useState<null | "docx" | "pdf">(null);
  const [exportError, setExportError] = useState<string | null>(null);
  async function onExport(format: "docx" | "pdf") {
    setExporting(format);
    setExportError(null);
    try {
      await exportLegalResearch(format, data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onUnauthorized?.();
      } else {
        setExportError(R.exportFailed);
      }
    } finally {
      setExporting(null);
    }
  }

  const count = data.cited_articles.length;
  const questions = data.missing_info_questions.filter((q) => q.trim().length > 0);
  const action = data.suggested_action;

  const panelClass = mobileSheet
    ? "fixed inset-x-0 bottom-0 z-[60] max-h-[85vh] overflow-y-auto overscroll-contain rounded-t-2xl border-t border-[#DCD7C9] bg-[#FAF8F3] p-4 shadow-2xl animate-sheet-up"
    : "hidden";
  const desktopPanelClass =
    "lg:sticky lg:inset-x-auto lg:bottom-auto lg:top-6 lg:z-auto lg:col-span-5 lg:block lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:overscroll-contain lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none";

  return (
    <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
      {/* ---------------- Cột trái: tư vấn của AI ---------------- */}
      <div className="min-w-0 space-y-4 lg:col-span-7">
        {mock && (
          <p className="flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            {R.mockBanner}
          </p>
        )}

        <section aria-label={R.answerTitle} className="rounded-lg border border-[#DCD7C9] bg-white p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#EAE5D8] pb-3">
            <h2 className="flex items-center gap-2 text-base font-semibold text-[#1C2333]">
              <Scale size={18} className="text-[#9C7A3C]" />
              {R.answerTitle}
            </h2>
            <span className="rounded-full border border-[#DCD7C9] bg-[#F3EFE4] px-2 py-0.5 text-xs text-[#5B6472]">
              {R.detectedLang}: {data.detected_language}
            </span>
          </div>

          <ReactMarkdown components={components}>{markdown}</ReactMarkdown>

          <p className="mt-2 flex items-start gap-1.5 border-t border-[#EAE5D8] pt-3 text-xs text-amber-700">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            {L.aiDisclaimer}
          </p>
        </section>

        {questions.length > 0 && (
          <section
            aria-label={R.missingTitle}
            className="rounded-lg border border-amber-200 border-l-4 border-l-amber-500 bg-amber-50 px-5 py-4"
          >
            <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-900">
              <HelpCircle size={16} /> {R.missingTitle}
            </p>
            <p className="mt-1 text-sm text-amber-900/80">{R.missingHint}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
              {questions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </section>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {(["docx", "pdf"] as const).map((fmt) => (
            <button
              key={fmt}
              type="button"
              onClick={() => onExport(fmt)}
              disabled={exporting !== null}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#DCD7C9] bg-white px-4 py-2 text-sm text-[#5B6472] transition hover:border-[#9C7A3C] hover:text-[#9C7A3C] disabled:opacity-60"
            >
              {exporting === fmt ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
              {exporting === fmt ? R.exporting : fmt === "docx" ? R.exportDocx : R.exportPdf}
            </button>
          ))}
          {exportError && (
            <span role="alert" className="text-sm text-red-600">
              {exportError}
            </span>
          )}
        </div>

        {action && (
          <section
            aria-label={R.ctaTitle}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#C6A15C]/40 border-l-4 border-l-[#9C7A3C] bg-[#16213E] px-5 py-4 text-white"
          >
            <div className="min-w-[14rem] flex-1">
              <p className="text-sm font-semibold text-[#C6A15C]">{R.ctaTitle}</p>
              <p className="mt-0.5 text-sm text-slate-300">{R.ctaDesc}</p>
            </div>
            <Link
              href={createContractHref(action)}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#9C7A3C] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#B08A45]"
            >
              {action.label}
              <ArrowRight size={14} />
            </Link>
          </section>
        )}
      </div>

      {/* ---------------- Cột phải: đối chiếu nguồn (sticky / ngăn kéo mobile) ---------------- */}
      {mobileSheet && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        ref={panelRef}
        tabIndex={-1}
        role={mobileSheet ? "dialog" : undefined}
        aria-modal={mobileSheet ? true : undefined}
        aria-label={R.sourcesTitle}
        className={`${panelClass} ${desktopPanelClass} focus:outline-none`}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-[#1C2333]">
              <CheckCircle2 size={18} className="text-emerald-600" />
              {R.sourcesTitle}
              <span className="text-sm font-normal text-[#5B6472]">({R.sourcesCount(count)})</span>
            </h2>
            <p className="mt-0.5 text-xs text-[#8A919C]">{R.sourcesHint}</p>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label={R.close}
            className="rounded-full p-1.5 text-[#5B6472] hover:bg-white hover:text-[#1C2333] lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {count === 0 ? (
          <p className="flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            {R.noSources}
          </p>
        ) : (
          <div className="space-y-3">
            {data.cited_articles.map((art) => (
              <SourceCard
                key={art.cite_key}
                art={art}
                active={activeKey === art.cite_key}
                expanded={expanded.has(art.cite_key)}
                onToggle={() =>
                  setExpanded((prev) => {
                    const next = new Set(prev);
                    if (next.has(art.cite_key)) next.delete(art.cite_key);
                    else next.add(art.cite_key);
                    return next;
                  })
                }
                registerRef={(el) => {
                  if (el) cardRefs.current.set(art.cite_key, el);
                  else cardRefs.current.delete(art.cite_key);
                }}
                L={L}
                R={R}
              />
            ))}
          </div>
        )}
      </aside>

      {/* Nút nổi mở ngăn kéo nguồn trên điện thoại */}
      {!mobileSheet && count > 0 && (
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="fixed bottom-4 right-4 z-30 flex items-center gap-2 rounded-full border border-white/10 bg-[#16213E] px-4 py-3 text-sm font-medium text-white shadow-lg lg:hidden"
        >
          <Scale size={16} className="text-[#C6A15C]" />
          {R.viewSources(count)}
        </button>
      )}
    </div>
  );
}

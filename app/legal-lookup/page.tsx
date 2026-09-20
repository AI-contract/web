"use client";

/**
 * app/legal-lookup/page.tsx
 *
 * Tra cứu văn bản pháp luật, bản án, án lệ theo từ khóa + lĩnh vực.
 * Gọi backend /legal/* (xem lib/api.ts). Hai chế độ:
 *   - "Từ khóa": ô từ khóa + bộ lọc, có phân trang;
 *   - "Căn cứ cho điều khoản": dán một đoạn/điều khoản hợp đồng, hệ
 *     thống tìm các văn bản/án lệ liên quan nhất.
 *
 * Nội dung snippet do backend trả về dạng text thuần + vị trí tô sáng;
 * trang này tự bọc <mark> bằng React (không dùng dangerouslySetInnerHTML)
 * nên không có rủi ro XSS từ dữ liệu tài liệu.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { ElementType, ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Gavel,
  Info,
  Landmark,
  Loader2,
  Scale,
  Search,
  X,
} from "lucide-react";
import {
  ApiError,
  LegalDocumentDetail,
  LegalMeta,
  LegalSearchItem,
  LegalSearchResponse,
  getLegalDocument,
  getLegalMeta,
  getMe,
  searchLegal,
  searchLegalByText,
} from "@/lib/api";

// ---------------------------------------------------------------
// Hằng số & tiện ích
// ---------------------------------------------------------------
const PAGE_SIZE = 10;
const HEADER_LOCATOR = "Thông tin chung";

const DOC_TYPE_ICONS: Record<string, ElementType> = {
  van_ban: FileText,
  ban_an: Gavel,
  an_le: Landmark,
};

const STATUS_TONE: Record<string, string> = {
  con_hieu_luc: "bg-emerald-50 text-emerald-700 border-emerald-200",
  het_hieu_luc: "bg-red-50 text-red-700 border-red-200",
  het_hieu_luc_mot_phan: "bg-amber-50 text-amber-800 border-amber-200",
  chua_co_hieu_luc: "bg-sky-50 text-sky-700 border-sky-200",
  chua_xac_minh: "bg-slate-100 text-slate-600 border-slate-300",
};

interface Filters {
  q: string;
  docType: string;
  field: string;
  issuer: string;
  status: string;
  year: string;
}

const EMPTY_FILTERS: Filters = {
  q: "",
  docType: "",
  field: "",
  issuer: "",
  status: "",
  year: "",
};

type Mode = "keyword" | "clause";

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  const parts = iso.slice(0, 10).split("-");
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : iso;
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("vi-VN");
}

// Chỉ cho phép link http(s) — chặn javascript: và các scheme lạ.
function safeUrl(url: string | null): string | null {
  return url && /^https?:\/\//i.test(url) ? url : null;
}

function errorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : "Có lỗi xảy ra, vui lòng thử lại.";
}

/** Tô sáng theo vị trí [start, end] tính bằng code point. */
function Highlighted({ text, ranges }: { text: string; ranges: number[][] }) {
  const chars = Array.from(text);
  const valid = ranges
    .filter(
      ([s, e]) =>
        Number.isInteger(s) && Number.isInteger(e) && s >= 0 && e > s && e <= chars.length
    )
    .sort((a, b) => a[0] - b[0]);

  const parts: ReactNode[] = [];
  let cursor = 0;
  valid.forEach(([s, e], i) => {
    if (s < cursor) return; // bỏ vùng chồng lấn
    if (s > cursor) parts.push(chars.slice(cursor, s).join(""));
    parts.push(
      <mark key={i} className="bg-[#F3E3B6] text-[#1C2333] rounded-sm px-0.5">
        {chars.slice(s, e).join("")}
      </mark>
    );
    cursor = e;
  });
  if (cursor < chars.length) parts.push(chars.slice(cursor).join(""));
  return <>{parts}</>;
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <span
      className={`inline-block text-xs px-2 py-0.5 rounded-full border ${
        STATUS_TONE[status] ?? STATUS_TONE.chua_xac_minh
      }`}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------
// Modal chi tiết văn bản
// ---------------------------------------------------------------
function DetailModal({
  docId,
  focusLocator,
  onClose,
}: {
  docId: number;
  focusLocator: string | null;
  onClose: () => void;
}) {
  const [doc, setDoc] = useState<LegalDocumentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getLegalDocument(docId)
      .then((d) => {
        if (!cancelled) setDoc(d);
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [docId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Cuộn tới Điều khớp khi mở từ một kết quả tìm kiếm.
  useEffect(() => {
    if (!doc || !focusLocator) return;
    const target = doc.chunks.find((c) => c.locator === focusLocator);
    if (target) {
      document
        .getElementById(`legal-chunk-${target.id}`)
        ?.scrollIntoView({ block: "start" });
    }
  }, [doc, focusLocator]);

  const body = doc?.chunks.filter((c) => c.position > 0) ?? [];
  const src = doc ? safeUrl(doc.source_url) : null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Chi tiết tài liệu pháp lý"
        className="bg-white rounded-lg max-w-3xl w-full max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-[#DCD7C9]">
          <div className="min-w-0">
            {doc ? (
              <>
                <p className="text-xs text-[#9C7A3C] font-medium mb-1">
                  {doc.doc_type_label}
                  {doc.number ? ` · ${doc.number}` : ""}
                </p>
                <h3 className="text-lg font-semibold text-[#1C2333]">{doc.title}</h3>
              </>
            ) : (
              <h3 className="text-lg font-semibold text-[#1C2333]">
                {error ? "Không tải được tài liệu" : "Đang tải..."}
              </h3>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="text-[#5B6472] hover:text-[#1C2333] shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}
          {!doc && !error && <Loader2 className="animate-spin text-[#9C7A3C]" size={22} />}

          {doc && (
            <>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <StatusBadge status={doc.status} label={doc.status_label} />
                {doc.field_labels.map((f) => (
                  <span
                    key={f}
                    className="text-xs px-2 py-0.5 rounded-full bg-[#F3EFE4] text-[#5B6472] border border-[#DCD7C9]"
                  >
                    {f}
                  </span>
                ))}
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm mb-4">
                {doc.issuer && (
                  <div>
                    <dt className="text-[#5B6472]">Cơ quan</dt>
                    <dd className="text-[#1C2333]">{doc.issuer}</dd>
                  </div>
                )}
                {doc.issued_on && (
                  <div>
                    <dt className="text-[#5B6472]">Ngày ban hành</dt>
                    <dd className="text-[#1C2333]">{fmtDate(doc.issued_on)}</dd>
                  </div>
                )}
                {doc.effective_on && (
                  <div>
                    <dt className="text-[#5B6472]">Ngày có hiệu lực</dt>
                    <dd className="text-[#1C2333]">{fmtDate(doc.effective_on)}</dd>
                  </div>
                )}
                {doc.data_updated_at && (
                  <div>
                    <dt className="text-[#5B6472]">Dữ liệu cập nhật</dt>
                    <dd className="text-[#1C2333]">{fmtDateTime(doc.data_updated_at)}</dd>
                  </div>
                )}
              </dl>

              {doc.summary && (
                <p className="text-sm text-[#1C2333] leading-relaxed mb-4">{doc.summary}</p>
              )}

              {src && (
                <a
                  href={src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-[#9C7A3C] hover:underline mb-4"
                >
                  <ExternalLink size={14} />
                  {doc.source_name ? `Xem tại ${doc.source_name}` : "Xem nguồn gốc"}
                </a>
              )}

              {body.length === 0 ? (
                <p className="text-sm text-[#5B6472] bg-[#FAF8F3] border border-[#DCD7C9] rounded-md px-3 py-2">
                  Tài liệu này chưa có toàn văn trong cơ sở dữ liệu. Vui lòng xem tại nguồn
                  gốc để đối chiếu.
                </p>
              ) : (
                <div className="space-y-3">
                  {body.map((c) => (
                    <div
                      key={c.id}
                      id={`legal-chunk-${c.id}`}
                      className={`rounded-md border px-3 py-2 ${
                        focusLocator && c.locator === focusLocator
                          ? "border-[#9C7A3C] bg-[#FBF6EA]"
                          : "border-[#EAE5D8]"
                      }`}
                    >
                      {c.locator && (
                        <p className="text-xs font-semibold text-[#9C7A3C] mb-1">{c.locator}</p>
                      )}
                      <p className="whitespace-pre-wrap text-sm text-[#1C2333] leading-relaxed">
                        {c.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <p className="mt-4 text-xs text-[#5B6472] flex gap-1.5">
                <Info size={14} className="shrink-0 mt-0.5" />
                {doc.disclaimer}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// Thẻ kết quả
// ---------------------------------------------------------------
function ResultCard({
  item,
  onOpen,
}: {
  item: LegalSearchItem;
  onOpen: (item: LegalSearchItem) => void;
}) {
  const src = safeUrl(item.source_url);
  const showSnippet = item.snippet && item.locator !== HEADER_LOCATOR;

  return (
    <article className="bg-white border border-[#DCD7C9] rounded-lg p-5 hover:border-[#9C7A3C] transition">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-xs px-2 py-0.5 rounded-full bg-[#16213E] text-white">
          {item.doc_type_label}
        </span>
        <StatusBadge status={item.status} label={item.status_label} />
        {item.field_labels.map((f) => (
          <span
            key={f}
            className="text-xs px-2 py-0.5 rounded-full bg-[#F3EFE4] text-[#5B6472] border border-[#DCD7C9]"
          >
            {f}
          </span>
        ))}
      </div>

      <button
        onClick={() => onOpen(item)}
        className="text-left font-semibold text-[#1C2333] hover:text-[#9C7A3C] transition"
      >
        {item.title}
      </button>

      <p className="text-sm text-[#5B6472] mt-1">
        {[
          item.number && `Số ${item.number}`,
          item.issuer,
          item.issued_on && `Ban hành ${fmtDate(item.issued_on)}`,
          item.effective_on && `Hiệu lực ${fmtDate(item.effective_on)}`,
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>

      {showSnippet && (
        <div className="mt-3 border-l-2 border-[#C6A15C] pl-3">
          {item.locator && (
            <p className="text-xs font-semibold text-[#9C7A3C] mb-0.5">{item.locator}</p>
          )}
          <p className="text-sm text-[#1C2333] leading-relaxed whitespace-pre-wrap">
            <Highlighted text={item.snippet} ranges={item.highlights} />
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
        <button onClick={() => onOpen(item)} className="text-[#9C7A3C] hover:underline">
          Xem chi tiết
        </button>
        {src && (
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[#5B6472] hover:text-[#9C7A3C]"
          >
            <ExternalLink size={13} />
            {item.source_name ?? "Nguồn gốc"}
          </a>
        )}
      </div>
    </article>
  );
}

// ---------------------------------------------------------------
// Trang chính
// ---------------------------------------------------------------
export default function LegalLookupPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  const [meta, setMeta] = useState<LegalMeta | null>(null);
  const [mode, setMode] = useState<Mode>("keyword");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [clauseText, setClauseText] = useState("");

  const [results, setResults] = useState<LegalSearchResponse | null>(null);
  const [resultMode, setResultMode] = useState<Mode>("keyword");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [detail, setDetail] = useState<{ id: number; locator: string | null } | null>(null);

  // Bỏ qua phản hồi cũ khi người dùng bấm tìm liên tiếp.
  const requestId = useRef(0);

  // Giữ router trong ref để handleError (và các hàm tìm kiếm phụ thuộc
  // vào nó) có identity ỔN ĐỊNH — nếu không, effect tải dữ liệu ban đầu
  // sẽ chạy lại mỗi khi identity của router đổi và xoá mất bộ lọc.
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  const handleError = useCallback((err: unknown) => {
    if (err instanceof ApiError && err.status === 401) {
      routerRef.current.push("/login");
      return;
    }
    setError(errorMessage(err));
  }, []);

  useEffect(() => {
    getMe()
      .then(() => setAuthChecked(true))
      .catch(() => router.push("/login"));
  }, [router]);

  const runKeywordSearch = useCallback(
    async (f: Filters, nextPage: number) => {
      const id = ++requestId.current;

      const yearText = f.year.trim();
      const year = yearText ? Number(yearText) : undefined;
      if (year !== undefined && (!Number.isInteger(year) || year < 1900 || year > 2100)) {
        setError("Năm ban hành không hợp lệ (từ 1900 đến 2100).");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await searchLegal({
          q: f.q.trim() || undefined,
          doc_type: f.docType || undefined,
          field: f.field || undefined,
          issuer: f.issuer || undefined,
          status: f.status || undefined,
          year,
          page: nextPage,
          page_size: PAGE_SIZE,
        });
        if (id !== requestId.current) return;
        setResults(res);
        setResultMode("keyword");
        setPage(nextPage);
      } catch (err) {
        if (id === requestId.current) handleError(err);
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [handleError]
  );

  const runClauseSearch = useCallback(async () => {
    const text = clauseText.trim();
    if (text.length < 10) {
      setError("Vui lòng dán đoạn điều khoản dài hơn (tối thiểu 10 ký tự).");
      return;
    }
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const res = await searchLegalByText(text, {
        doc_type: filters.docType || undefined,
        field: filters.field || undefined,
        limit: 10,
      });
      if (id !== requestId.current) return;
      setResults(res);
      setResultMode("clause");
      setPage(1);
    } catch (err) {
      if (id === requestId.current) handleError(err);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [clauseText, filters.docType, filters.field, handleError]);

  // Sau khi đăng nhập hợp lệ: tải thống kê + hiển thị tài liệu mới nhất.
  // (Gọi API trực tiếp và setState trong callback bất đồng bộ — không
  // gọi runKeywordSearch ở đây để tránh setState đồng bộ trong effect.)
  useEffect(() => {
    if (!authChecked) return;
    let cancelled = false;

    getLegalMeta()
      .then((m) => {
        if (!cancelled) setMeta(m);
      })
      .catch((err) => {
        if (!cancelled) handleError(err);
      });

    searchLegal({ page: 1, page_size: PAGE_SIZE })
      .then((res) => {
        if (cancelled) return;
        setResults(res);
        setResultMode("keyword");
        setPage(1);
      })
      .catch((err) => {
        if (!cancelled) handleError(err);
      })
      .finally(() => {
        if (!cancelled) setInitialLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authChecked, handleError]);

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  // Bấm thẻ thống kê/chip lĩnh vực: bật/tắt bộ lọc và tìm ngay.
  function toggleFilter(key: "docType" | "field", value: string) {
    const next = { ...filters, [key]: filters[key] === value ? "" : value };
    setFilters(next);
    if (mode === "keyword") runKeywordSearch(next, 1);
  }

  function resetAll() {
    setFilters(EMPTY_FILTERS);
    setClauseText("");
    setError(null);
    if (mode === "keyword") runKeywordSearch(EMPTY_FILTERS, 1);
    else setResults(null);
  }

  function switchMode(next: Mode) {
    if (next === mode) return;
    setMode(next);
    setError(null);
    if (next === "keyword") runKeywordSearch(filters, 1);
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F3]">
        <Loader2 className="animate-spin text-[#9C7A3C]" size={28} />
      </div>
    );
  }

  const totalPages = results ? Math.max(1, Math.ceil(results.total / results.page_size)) : 1;
  const selectClass =
    "w-full rounded-md border border-[#DCD7C9] bg-white px-3 py-2 text-sm text-[#1C2333] focus:outline-none focus:ring-1 focus:ring-[#9C7A3C]";

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <header className="bg-[#16213E] text-white px-6 py-4 flex items-center gap-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white"
        >
          <ArrowLeft size={16} />
          Quay lại
        </Link>
        <div className="flex items-center gap-2">
          <Scale size={20} className="text-[#C6A15C]" />
          <h1 className="text-lg font-semibold">Tra cứu pháp lý</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Thẻ thống kê theo loại tài liệu */}
        <section aria-label="Thống kê" className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          {(meta?.doc_types ?? []).map((t) => {
            const Icon = DOC_TYPE_ICONS[t.value] ?? FileText;
            const active = filters.docType === t.value;
            return (
              <button
                key={t.value}
                onClick={() => toggleFilter("docType", t.value)}
                aria-pressed={active}
                className={`text-left rounded-lg p-5 border transition ${
                  active
                    ? "bg-[#16213E] text-white border-[#16213E]"
                    : "bg-white text-[#1C2333] border-[#DCD7C9] hover:border-[#9C7A3C]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-semibold">{t.count}</span>
                  <Icon size={28} className={active ? "text-[#C6A15C]" : "text-[#9C7A3C]"} />
                </div>
                <p className={`text-sm mt-1 ${active ? "text-slate-300" : "text-[#5B6472]"}`}>
                  {t.label}
                </p>
              </button>
            );
          })}
        </section>

        {/* Chip lĩnh vực */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(meta?.fields ?? []).map((f) => {
            const active = filters.field === f.value;
            return (
              <button
                key={f.value}
                onClick={() => toggleFilter("field", f.value)}
                aria-pressed={active}
                className={`text-sm px-3 py-1 rounded-full border transition ${
                  active
                    ? "bg-[#9C7A3C] text-white border-[#9C7A3C]"
                    : "bg-white text-[#1C2333] border-[#DCD7C9] hover:border-[#9C7A3C]"
                }`}
              >
                {f.label} <span className="opacity-60">({f.count})</span>
              </button>
            );
          })}
        </div>

        {/* Hướng dẫn */}
        <div className="bg-white border border-[#DCD7C9] border-l-4 border-l-[#9C7A3C] rounded-lg px-5 py-4 mb-6 text-sm text-[#1C2333]">
          <p className="font-semibold text-[#9C7A3C] flex items-center gap-1.5 mb-1.5">
            <Info size={16} /> Hướng dẫn tra cứu
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#5B6472]">
            <li>
              Nhập từ khóa (có dấu hoặc không dấu) hoặc số hiệu, ví dụ{" "}
              <em>phạt vi phạm hợp đồng</em>, <em>45/2019/QH14</em>.
            </li>
            <li>Bấm vào thẻ thống kê hoặc lĩnh vực phía trên để lọc nhanh, kết hợp thêm bộ lọc bên dưới.</li>
            <li>
              Dùng chế độ <strong>Căn cứ cho điều khoản</strong> để dán một điều khoản hợp đồng và
              tìm các văn bản, án lệ liên quan.
            </li>
          </ul>
        </div>

        {/* Chọn chế độ */}
        <div className="inline-flex rounded-md border border-[#DCD7C9] bg-white p-1 mb-4">
          {(
            [
              ["keyword", "Từ khóa"],
              ["clause", "Căn cứ cho điều khoản"],
            ] as [Mode, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => switchMode(value)}
              aria-pressed={mode === value}
              className={`px-4 py-1.5 text-sm rounded transition ${
                mode === value ? "bg-[#16213E] text-white" : "text-[#5B6472] hover:text-[#1C2333]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Form tìm kiếm */}
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (mode === "keyword") runKeywordSearch(filters, 1);
            else runClauseSearch();
          }}
          className="bg-white border border-[#DCD7C9] rounded-lg p-5 mb-6 space-y-4"
        >
          {mode === "keyword" ? (
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9C7A3C]"
              />
              <input
                type="text"
                value={filters.q}
                onChange={(e) => updateFilter("q", e.target.value)}
                maxLength={200}
                placeholder="Nhập từ khóa, tên hoặc số hiệu văn bản..."
                className="w-full rounded-md border border-[#DCD7C9] pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#9C7A3C]"
              />
            </div>
          ) : (
            <textarea
              value={clauseText}
              onChange={(e) => setClauseText(e.target.value)}
              maxLength={6000}
              rows={5}
              placeholder="Dán nội dung điều khoản hợp đồng cần tìm căn cứ pháp lý..."
              className="w-full rounded-md border border-[#DCD7C9] px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#9C7A3C]"
            />
          )}

          <div
            className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${
              mode === "keyword" ? "lg:grid-cols-5" : "lg:grid-cols-2"
            }`}
          >
            <select
              value={filters.docType}
              onChange={(e) => updateFilter("docType", e.target.value)}
              className={selectClass}
              aria-label="Loại tài liệu"
            >
              <option value="">Tất cả loại tài liệu</option>
              {(meta?.doc_types ?? []).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              value={filters.field}
              onChange={(e) => updateFilter("field", e.target.value)}
              className={selectClass}
              aria-label="Lĩnh vực"
            >
              <option value="">Tất cả lĩnh vực</option>
              {(meta?.fields ?? []).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            {mode === "keyword" && (
              <>
                <select
                  value={filters.issuer}
                  onChange={(e) => updateFilter("issuer", e.target.value)}
                  className={selectClass}
                  aria-label="Cơ quan ban hành"
                >
                  <option value="">Tất cả cơ quan</option>
                  {(meta?.issuers ?? []).map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.status}
                  onChange={(e) => updateFilter("status", e.target.value)}
                  className={selectClass}
                  aria-label="Tình trạng hiệu lực"
                >
                  <option value="">Mọi tình trạng</option>
                  {(meta?.statuses ?? []).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1900}
                  max={2100}
                  value={filters.year}
                  onChange={(e) => updateFilter("year", e.target.value)}
                  placeholder="Năm ban hành"
                  aria-label="Năm ban hành"
                  className={selectClass}
                />
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-md bg-[#16213E] text-white px-5 py-2 text-sm hover:bg-[#1C2333] disabled:opacity-60 transition"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              Tra cứu
            </button>
            <button
              type="button"
              onClick={resetAll}
              className="text-sm text-[#5B6472] hover:text-[#1C2333]"
            >
              Xoá bộ lọc
            </button>
          </div>
        </form>

        {error && (
          <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        {initialLoading && !results && (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-[#9C7A3C]" size={24} />
          </div>
        )}

        {/* Kết quả */}
        {results && (
          <section aria-live="polite">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
              <p className="text-sm text-[#5B6472]">
                {results.total === 0
                  ? "Không có kết quả"
                  : resultMode === "keyword" &&
                      !filters.q.trim() &&
                      !filters.docType &&
                      !filters.field &&
                      !filters.issuer &&
                      !filters.status &&
                      !filters.year.trim()
                    ? `Tài liệu mới nhất — tổng ${results.total} tài liệu`
                    : `${results.total} kết quả`}
              </p>
              {resultMode === "clause" && results.query_terms.length > 0 && (
                <p className="text-xs text-[#5B6472]">
                  Đã tìm theo các từ: {results.query_terms.slice(0, 10).join(", ")}
                </p>
              )}
            </div>

            {results.total === 0 ? (
              <div className="bg-white border border-[#DCD7C9] rounded-lg p-6 text-sm text-[#5B6472]">
                {meta && meta.total_documents === 0
                  ? "Cơ sở dữ liệu chưa có tài liệu nào. Quản trị viên cần nhập dữ liệu trước khi tra cứu."
                  : "Không tìm thấy kết quả phù hợp. Hãy thử từ khóa ngắn hơn, bỏ bớt bộ lọc, hoặc gõ không dấu."}
              </div>
            ) : (
              <div className={`space-y-3 ${loading ? "opacity-60" : ""}`}>
                {results.items.map((item) => (
                  <ResultCard
                    key={item.document_id}
                    item={item}
                    onOpen={(it) =>
                      setDetail({
                        id: it.document_id,
                        locator: it.locator === HEADER_LOCATOR ? null : it.locator,
                      })
                    }
                  />
                ))}
              </div>
            )}

            {resultMode === "keyword" && totalPages > 1 && (
              <nav
                aria-label="Phân trang"
                className="flex items-center justify-center gap-4 mt-6 text-sm"
              >
                <button
                  onClick={() => runKeywordSearch(filters, page - 1)}
                  disabled={page <= 1 || loading}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-[#DCD7C9] bg-white disabled:opacity-40 hover:border-[#9C7A3C]"
                >
                  <ChevronLeft size={16} /> Trước
                </button>
                <span className="text-[#5B6472]">
                  Trang {page} / {totalPages}
                </span>
                <button
                  onClick={() => runKeywordSearch(filters, page + 1)}
                  disabled={page >= totalPages || loading}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-[#DCD7C9] bg-white disabled:opacity-40 hover:border-[#9C7A3C]"
                >
                  Sau <ChevronRight size={16} />
                </button>
              </nav>
            )}

            <p className="mt-6 text-xs text-[#5B6472] flex gap-1.5">
              <Info size={14} className="shrink-0 mt-0.5" />
              {results.disclaimer}
            </p>
          </section>
        )}
      </main>

      {detail && (
        <DetailModal
          docId={detail.id}
          focusLocator={detail.locator}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}

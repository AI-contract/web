"use client";

/**
 * app/legal-lookup/page.tsx — CẤP 1: tổng quan tra cứu pháp lý.
 *
 *   - ô tìm chung (từ khóa) → chuyển sang cấp 2 "Tất cả lĩnh vực";
 *   - chế độ "Căn cứ cho điều khoản": dán một điều khoản, kết quả hiện ngay
 *     tại trang này dưới dạng thẻ cấp 3;
 *   - các thẻ lĩnh vực (số lượng theo loại tài liệu) → cấp 2 của lĩnh vực đó;
 *   - danh sách tài liệu mới cập nhật.
 */

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Info, Loader2, Search } from "lucide-react";
import {
  ApiError,
  LegalMeta,
  LegalSearchResponse,
  getLegalMeta,
  searchLegalByText,
} from "@/lib/api";
import {
  ALL_FIELDS,
  DISCLAIMER_FALLBACK,
  FIELD_ICONS,
  PageHeader,
  ResultCard,
  TYPE_SHORT,
  TypeBadge,
  errorMessage,
  fmtDateTime,
  useAuthGuard,
} from "./_components/shared";

type Mode = "keyword" | "clause";

export default function LegalLookupHome() {
  const router = useRouter();
  const { ok, onUnauthorized } = useAuthGuard();

  const [meta, setMeta] = useState<LegalMeta | null>(null);
  const [metaError, setMetaError] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>("keyword");
  const [docType, setDocType] = useState("");
  const [q, setQ] = useState("");
  const [clauseText, setClauseText] = useState("");

  const [clauseResults, setClauseResults] = useState<LegalSearchResponse | null>(null);
  const [clauseLoading, setClauseLoading] = useState(false);
  const [clauseError, setClauseError] = useState<string | null>(null);

  // Tải thống kê sau khi đăng nhập hợp lệ.
  useEffect(() => {
    if (!ok) return;
    let cancelled = false;
    getLegalMeta()
      .then((m) => {
        if (!cancelled) setMeta(m);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) onUnauthorized();
        else setMetaError(errorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [ok, onUnauthorized]);

  function fieldHref(field: string): string {
    const params = new URLSearchParams();
    if (docType) params.set("doc_type", docType);
    const qs = params.toString();
    return `/legal-lookup/${field}${qs ? `?${qs}` : ""}`;
  }

  function submitKeyword(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (docType) params.set("doc_type", docType);
    const qs = params.toString();
    router.push(`/legal-lookup/${ALL_FIELDS}${qs ? `?${qs}` : ""}`);
  }

  async function submitClause(e: FormEvent) {
    e.preventDefault();
    const text = clauseText.trim();
    if (text.length < 10) {
      setClauseError("Vui lòng dán đoạn điều khoản dài hơn (tối thiểu 10 ký tự).");
      return;
    }
    setClauseLoading(true);
    setClauseError(null);
    try {
      const res = await searchLegalByText(text, {
        doc_type: docType || undefined,
        limit: 10,
      });
      setClauseResults(res);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) onUnauthorized();
      else setClauseError(errorMessage(err));
    } finally {
      setClauseLoading(false);
    }
  }

  if (!ok) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F3]">
        <Loader2 className="animate-spin text-[#9C7A3C]" size={28} />
      </div>
    );
  }

  const docTypes = meta?.doc_types ?? [];

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <PageHeader title="Tra cứu pháp lý" backHref="/dashboard" backLabel="Quay lại" />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Hướng dẫn */}
        <div className="bg-white border border-[#DCD7C9] border-l-4 border-l-[#9C7A3C] rounded-lg px-5 py-4 mb-6 text-sm">
          <p className="font-semibold text-[#9C7A3C] flex items-center gap-1.5 mb-1.5">
            <Info size={16} /> Hướng dẫn tra cứu
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#5B6472]">
            <li>
              Gõ từ khóa (có dấu hoặc không dấu) hoặc số hiệu, ví dụ <em>phạt vi phạm hợp đồng</em>,{" "}
              <em>45/2019/QH14</em>; hoặc bấm vào một lĩnh vực bên dưới để tra cứu sâu hơn.
            </li>
            <li>
              Chọn loại tài liệu (văn bản, bản án, án lệ) trước để thu hẹp cả ô tìm chung lẫn các
              thẻ lĩnh vực.
            </li>
            <li>
              Dùng <strong>Căn cứ cho điều khoản</strong> để dán một điều khoản hợp đồng và tìm các
              văn bản, án lệ liên quan.
            </li>
          </ul>
        </div>

        {/* Chế độ */}
        <div className="inline-flex rounded-md border border-[#DCD7C9] bg-white p-1 mb-3">
          {(
            [
              ["keyword", "Từ khóa"],
              ["clause", "Căn cứ cho điều khoản"],
            ] as [Mode, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setMode(value)}
              aria-pressed={mode === value}
              className={`px-4 py-1.5 text-sm rounded transition ${
                mode === value ? "bg-[#16213E] text-white" : "text-[#5B6472] hover:text-[#1C2333]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Ô tìm chung */}
        <form
          onSubmit={mode === "keyword" ? submitKeyword : submitClause}
          className="bg-white border border-[#DCD7C9] rounded-lg p-5 mb-4 space-y-3"
        >
          {mode === "keyword" ? (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9C7A3C]"
                />
                <input
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  maxLength={200}
                  placeholder="Nhập từ khóa, tên hoặc số hiệu văn bản..."
                  aria-label="Từ khóa"
                  className="w-full rounded-md border border-[#DCD7C9] pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#9C7A3C]"
                />
              </div>
              <button
                type="submit"
                className="rounded-md bg-[#16213E] text-white px-5 py-2 text-sm hover:bg-[#1C2333] transition"
              >
                Tra cứu
              </button>
            </div>
          ) : (
            <>
              <textarea
                value={clauseText}
                onChange={(e) => setClauseText(e.target.value)}
                maxLength={6000}
                rows={5}
                placeholder="Dán nội dung điều khoản hợp đồng cần tìm căn cứ pháp lý..."
                aria-label="Nội dung điều khoản"
                className="w-full rounded-md border border-[#DCD7C9] px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#9C7A3C]"
              />
              <button
                type="submit"
                disabled={clauseLoading}
                className="inline-flex items-center gap-2 rounded-md bg-[#16213E] text-white px-5 py-2 text-sm hover:bg-[#1C2333] disabled:opacity-60 transition"
              >
                {clauseLoading && <Loader2 size={16} className="animate-spin" />}
                Tìm căn cứ
              </button>
            </>
          )}

          {/* Lọc theo loại tài liệu */}
          <div className="flex flex-wrap gap-2" role="group" aria-label="Loại tài liệu">
            {[{ value: "", label: "Tất cả" }, ...docTypes].map((t) => (
              <button
                key={t.value || "all"}
                type="button"
                onClick={() => setDocType(t.value)}
                aria-pressed={docType === t.value}
                className={`text-sm px-3 py-1 rounded-full border transition ${
                  docType === t.value
                    ? "bg-[#16213E] text-white border-[#16213E]"
                    : "bg-white text-[#5B6472] border-[#DCD7C9] hover:border-[#9C7A3C]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </form>

        {clauseError && mode === "clause" && (
          <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {clauseError}
          </p>
        )}

        {/* Kết quả "Căn cứ cho điều khoản" (tại chỗ) */}
        {mode === "clause" && clauseResults && (
          <section aria-live="polite" className="mb-8">
            <p className="text-sm text-[#5B6472] mb-3">
              {clauseResults.total === 0
                ? "Không tìm thấy căn cứ phù hợp."
                : `${clauseResults.total} kết quả liên quan`}
              {clauseResults.query_terms.length > 0 &&
                ` · Đã tìm theo các từ: ${clauseResults.query_terms.slice(0, 10).join(", ")}`}
            </p>
            <div className="space-y-3">
              {clauseResults.items.map((item) => (
                <ResultCard key={item.document_id} item={item} terms={clauseResults.query_terms} />
              ))}
            </div>
            <p className="mt-4 text-xs text-[#5B6472]">
              {clauseResults.disclaimer || DISCLAIMER_FALLBACK}
            </p>
          </section>
        )}

        {metaError && (
          <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {metaError}
          </p>
        )}

        {/* Thẻ lĩnh vực */}
        <div className="flex items-baseline justify-between mb-3 mt-6">
          <h2 className="text-base font-semibold text-[#1C2333]">Tra cứu theo lĩnh vực</h2>
          <Link href={fieldHref(ALL_FIELDS)} className="text-sm text-[#9C7A3C] hover:underline">
            Xem tất cả lĩnh vực
          </Link>
        </div>

        {!meta && !metaError && (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-[#9C7A3C]" size={24} />
          </div>
        )}

        {meta && (
          <section
            aria-label="Lĩnh vực"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8"
          >
            {meta.field_stats.map((f) => {
              const Icon = FIELD_ICONS[f.value] ?? FileText;
              const empty = f.total === 0;
              const shown = docType ? (f.by_type[docType] ?? 0) : f.total;
              return (
                <Link
                  key={f.value}
                  href={fieldHref(f.value)}
                  className={`rounded-lg p-4 border transition block ${
                    empty
                      ? "border-dashed border-[#DCD7C9] bg-[#FAF8F3] text-[#8A919C] hover:border-[#9C7A3C]"
                      : "bg-white border-[#DCD7C9] hover:border-[#9C7A3C] text-[#1C2333]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium">{f.label}</span>
                    <Icon size={18} className={empty ? "text-[#B5B9C0]" : "text-[#9C7A3C]"} />
                  </div>
                  <p className="text-2xl font-semibold mt-1">{shown}</p>
                  <p className="text-xs text-[#8A919C] mt-0.5">
                    {empty
                      ? "Chưa có dữ liệu"
                      : docTypes
                          .map((t) => `${TYPE_SHORT[t.value] ?? t.value} ${f.by_type[t.value] ?? 0}`)
                          .join(" · ")}
                  </p>
                </Link>
              );
            })}
          </section>
        )}

        {/* Mới cập nhật */}
        {meta && meta.recent.length > 0 && (
          <section aria-label="Mới cập nhật" className="mb-6">
            <h2 className="text-base font-semibold text-[#1C2333] mb-3">Mới cập nhật</h2>
            <ul className="bg-white border border-[#DCD7C9] rounded-lg divide-y divide-[#EAE5D8]">
              {meta.recent.map((r) => (
                <li key={r.document_id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <TypeBadge docType={r.doc_type} label={r.doc_type_label} />
                  <Link
                    href={`/legal-lookup/documents/${r.document_id}`}
                    className="flex-1 text-[#1C2333] hover:text-[#9C7A3C]"
                  >
                    {r.title}
                    {r.number && <span className="text-[#8A919C]"> · {r.number}</span>}
                  </Link>
                  <span className="text-xs text-[#8A919C]">{fmtDateTime(r.updated_at)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="text-xs text-[#5B6472] flex gap-1.5">
          <Info size={14} className="shrink-0 mt-0.5" />
          {meta?.last_updated ? `Dữ liệu cập nhật ${fmtDateTime(meta.last_updated)} · ` : ""}
          {DISCLAIMER_FALLBACK}
        </p>
      </main>
    </div>
  );
}

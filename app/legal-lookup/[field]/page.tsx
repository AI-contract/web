"use client";

/**
 * app/legal-lookup/[field]/page.tsx — CẤP 2: tra cứu trong một lĩnh vực.
 *
 * `[field]` là giá trị lĩnh vực (vd dan_su) hoặc "tat-ca" (mọi lĩnh vực).
 * Toàn bộ bộ lọc, sắp xếp và số trang nằm trên URL (query string), nên
 * nút Back của trình duyệt và việc chia sẻ link đều giữ nguyên kết quả:
 *
 *   /legal-lookup/dan_su?topic=dan_su.hop_dong&doc_type=an_le&q=phạt+vi+phạm&page=2
 *
 * URL là nguồn sự thật duy nhất: form là uncontrolled (defaultValue lấy từ URL,
 * remount khi URL đổi), kết quả được tải lại mỗi khi query string đổi.
 */

import { Suspense, useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Info, List, Loader2, Search } from "lucide-react";
import {
  LegalMeta,
  LegalSearchResponse,
  LegalSort,
  getLegalMeta,
  searchLegal,
  ApiError,
} from "@/lib/api";
import {
  ALL_FIELDS,
  DISCLAIMER_FALLBACK,
  PageHeader,
  ResultCard,
  errorMessage,
  fmtDateTime,
  useAuthGuard,
} from "../_components/shared";

const PAGE_SIZE = 10;
const SORTS: { value: LegalSort; label: string }[] = [
  { value: "relevance", label: "Liên quan nhất" },
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
];

interface Applied {
  q: string;
  topic: string;
  doc_type: string;
  issuer: string;
  status: string;
  number: string;
  issued_from: string;
  issued_to: string;
  sort: LegalSort;
  page: number;
}

function parseApplied(search: string): Applied {
  const sp = new URLSearchParams(search);
  const sort = sp.get("sort");
  const page = Number(sp.get("page"));
  return {
    q: sp.get("q") ?? "",
    topic: sp.get("topic") ?? "",
    doc_type: sp.get("doc_type") ?? "",
    issuer: sp.get("issuer") ?? "",
    status: sp.get("status") ?? "",
    number: sp.get("number") ?? "",
    issued_from: sp.get("issued_from") ?? "",
    issued_to: sp.get("issued_to") ?? "",
    sort: SORTS.some((s) => s.value === sort) ? (sort as LegalSort) : "relevance",
    page: Number.isInteger(page) && page >= 1 ? page : 1,
  };
}

type Loaded = { key: string; data: LegalSearchResponse | null; error: string | null };

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF8F3]">
      <Loader2 className="animate-spin text-[#9C7A3C]" size={28} />
    </div>
  );
}

export default function FieldLookupPage() {
  // useSearchParams cần Suspense boundary (Next.js App Router).
  return (
    <Suspense fallback={<Spinner />}>
      <FieldLookup />
    </Suspense>
  );
}

function FieldLookup() {
  const router = useRouter();
  const params = useParams<{ field: string }>();
  const searchParams = useSearchParams();
  const { ok, onUnauthorized } = useAuthGuard();

  const field = String(params.field ?? ALL_FIELDS);
  const isAll = field === ALL_FIELDS;
  const search = searchParams.toString();
  const applied = parseApplied(search);
  const requestKey = `${field}?${search}`;

  const [meta, setMeta] = useState<LegalMeta | null>(null);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Thống kê / danh mục (chuyên đề, cơ quan...) — tải một lần.
  useEffect(() => {
    if (!ok) return;
    let cancelled = false;
    getLegalMeta()
      .then((m) => {
        if (!cancelled) setMeta(m);
      })
      .catch((err) => {
        if (!cancelled && err instanceof ApiError && err.status === 401) onUnauthorized();
      });
    return () => {
      cancelled = true;
    };
  }, [ok, onUnauthorized]);

  // Tải kết quả mỗi khi lĩnh vực hoặc query string đổi.
  useEffect(() => {
    if (!ok) return;
    let cancelled = false;
    const a = parseApplied(search);
    searchLegal({
      q: a.q.trim() || undefined,
      field: field === ALL_FIELDS ? undefined : field,
      topic: a.topic || undefined,
      doc_type: a.doc_type || undefined,
      issuer: a.issuer || undefined,
      status: a.status || undefined,
      number: a.number.trim() || undefined,
      issued_from: a.issued_from || undefined,
      issued_to: a.issued_to || undefined,
      sort: a.sort,
      page: a.page,
      page_size: PAGE_SIZE,
    })
      .then((data) => {
        if (!cancelled) setLoaded({ key: `${field}?${search}`, data, error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) onUnauthorized();
        else setLoaded({ key: `${field}?${search}`, data: null, error: errorMessage(err) });
      });
    return () => {
      cancelled = true;
    };
  }, [ok, field, search, onUnauthorized]);

  const fieldInfo = meta?.field_stats.find((f) => f.value === field);
  const fieldLabel = isAll ? "Tất cả lĩnh vực" : (fieldInfo?.label ?? field);
  const unknownField = Boolean(meta) && !isAll && !fieldInfo;
  const loading = !loaded || loaded.key !== requestKey;
  const data = loaded?.key === requestKey ? loaded.data : null;
  const fetchError = loaded?.key === requestKey ? loaded.error : null;

  function go(next: Partial<Applied>, resetPage = true) {
    const merged: Applied = { ...applied, ...next };
    if (resetPage && next.page === undefined) merged.page = 1;
    const qs = new URLSearchParams();
    (
      [
        "q",
        "topic",
        "doc_type",
        "issuer",
        "status",
        "number",
        "issued_from",
        "issued_to",
      ] as const
    ).forEach((k) => {
      if (merged[k].trim()) qs.set(k, merged[k].trim());
    });
    if (merged.sort !== "relevance") qs.set("sort", merged.sort);
    if (merged.page > 1) qs.set("page", String(merged.page));
    const suffix = qs.toString();
    router.push(`/legal-lookup/${field}${suffix ? `?${suffix}` : ""}`);
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const get = (name: string) => String(fd.get(name) ?? "").trim();
    const from = get("issued_from");
    const to = get("issued_to");
    if (from && to && from > to) {
      setFormError("“Từ ngày” phải trước hoặc bằng “Đến ngày”.");
      return;
    }
    setFormError(null);
    go({
      q: get("q"),
      topic: get("topic"),
      doc_type: get("doc_type"),
      issuer: get("issuer"),
      status: get("status"),
      number: get("number"),
      issued_from: from,
      issued_to: to,
    });
  }

  if (!ok) return <Spinner />;

  const topicGroups: { label: string; options: { value: string; label: string }[] }[] = [];
  if (meta) {
    if (isAll) {
      meta.field_stats.forEach((f) => {
        const opts = meta.topics[f.value] ?? [];
        if (opts.length) topicGroups.push({ label: f.label, options: opts });
      });
    } else if ((meta.topics[field] ?? []).length) {
      topicGroups.push({ label: "", options: meta.topics[field] });
    }
  }

  const controlClass =
    "w-full rounded-md border border-[#DCD7C9] bg-white px-3 py-2 text-sm text-[#1C2333] focus:outline-none focus:ring-1 focus:ring-[#9C7A3C]";
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <PageHeader
        title={`Tra cứu: ${fieldLabel}`}
        backHref="/legal-lookup"
        backLabel="Tổng quan"
      />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <nav aria-label="Đường dẫn" className="text-sm text-[#5B6472] mb-4">
          <Link href="/legal-lookup" className="hover:text-[#9C7A3C]">
            Tra cứu pháp lý
          </Link>
          <span className="mx-1.5">›</span>
          <span className="text-[#1C2333]">{fieldLabel}</span>
        </nav>

        {unknownField ? (
          <div className="bg-white border border-[#DCD7C9] rounded-lg p-6 text-sm text-[#5B6472]">
            Không có lĩnh vực “{field}”.{" "}
            <Link href="/legal-lookup" className="text-[#9C7A3C] hover:underline">
              Quay lại trang tổng quan
            </Link>
          </div>
        ) : (
          <>
            {/* Bộ lọc nâng cao */}
            <form
              // Remount khi URL đổi VÀ khi meta tải xong: các <select> lấy tuỳ chọn
              // từ meta (bất đồng bộ), nếu không remount thì defaultValue lấy từ URL
              // (vd doc_type=an_le đến từ cấp 1) bị mất và ô lọc hiện sai giá trị.
              key={`${requestKey}|${meta ? "meta" : "loading"}`}
              noValidate
              onSubmit={onSubmit}
              className="bg-white border border-[#DCD7C9] rounded-lg p-5 mb-6 space-y-3"
            >
              <p className="text-sm font-semibold text-[#9C7A3C]">Bộ lọc nâng cao</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {topicGroups.length > 0 && (
                  <select
                    name="topic"
                    defaultValue={applied.topic}
                    aria-label="Chuyên đề"
                    className={controlClass}
                  >
                    <option value="">Tất cả chuyên đề</option>
                    {topicGroups.map((g, i) =>
                      g.label ? (
                        <optgroup key={i} label={g.label}>
                          {g.options.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </optgroup>
                      ) : (
                        g.options.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))
                      )
                    )}
                  </select>
                )}
                <select
                  name="doc_type"
                  defaultValue={applied.doc_type}
                  aria-label="Loại tài liệu"
                  className={controlClass}
                >
                  <option value="">Mọi loại tài liệu</option>
                  {(meta?.doc_types ?? []).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <select
                  name="issuer"
                  defaultValue={applied.issuer}
                  aria-label="Cơ quan ban hành"
                  className={controlClass}
                >
                  <option value="">Mọi cơ quan</option>
                  {(meta?.issuers ?? []).map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
                <select
                  name="status"
                  defaultValue={applied.status}
                  aria-label="Tình trạng hiệu lực"
                  className={controlClass}
                >
                  <option value="">Mọi tình trạng</option>
                  {(meta?.statuses ?? []).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  name="number"
                  defaultValue={applied.number}
                  maxLength={100}
                  placeholder="Số hiệu, ví dụ 91/2015/QH13"
                  aria-label="Số hiệu"
                  className={controlClass}
                />
                <label className="flex items-center gap-2 text-sm text-[#5B6472]">
                  <span className="shrink-0">Từ ngày</span>
                  <input
                    type="date"
                    name="issued_from"
                    defaultValue={applied.issued_from}
                    aria-label="Ban hành từ ngày"
                    className={controlClass}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-[#5B6472]">
                  <span className="shrink-0">Đến ngày</span>
                  <input
                    type="date"
                    name="issued_to"
                    defaultValue={applied.issued_to}
                    aria-label="Ban hành đến ngày"
                    className={controlClass}
                  />
                </label>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9C7A3C]"
                  />
                  <input
                    name="q"
                    defaultValue={applied.q}
                    maxLength={200}
                    placeholder="Từ khóa, ví dụ phạt vi phạm hợp đồng"
                    aria-label="Từ khóa"
                    className="w-full rounded-md border border-[#DCD7C9] pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#9C7A3C]"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-[#16213E] text-white px-5 py-2 text-sm hover:bg-[#1C2333] transition"
                >
                  <Search size={16} /> Tra cứu
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormError(null);
                    router.push(`/legal-lookup/${field}`);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-[#DCD7C9] bg-white text-[#1C2333] px-5 py-2 text-sm hover:border-[#9C7A3C] transition"
                >
                  <List size={16} /> Xem tất cả
                </button>
              </div>

              {formError && <p className="text-sm text-red-600">{formError}</p>}
            </form>

            {/* Kết quả */}
            {fetchError && (
              <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {fetchError}
              </p>
            )}

            {loading && !fetchError && (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-[#9C7A3C]" size={24} />
              </div>
            )}

            {data && (
              <section aria-live="polite">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <p className="text-sm text-[#5B6472]">
                    {data.total === 0
                      ? "Không có kết quả"
                      : `Tìm thấy ${data.total} kết quả`}
                  </p>
                  <label className="flex items-center gap-2 text-sm text-[#5B6472]">
                    Sắp xếp
                    <select
                      value={applied.sort}
                      onChange={(e) => go({ sort: e.target.value as LegalSort })}
                      aria-label="Sắp xếp"
                      className="rounded-md border border-[#DCD7C9] bg-white px-2 py-1 text-sm text-[#1C2333]"
                    >
                      {SORTS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {data.total === 0 ? (
                  <div className="bg-white border border-[#DCD7C9] rounded-lg p-6 text-sm text-[#5B6472]">
                    {meta && meta.total_documents === 0
                      ? "Cơ sở dữ liệu chưa có tài liệu nào. Quản trị viên cần nhập dữ liệu trước khi tra cứu."
                      : fieldInfo && fieldInfo.total === 0
                        ? "Lĩnh vực này chưa có dữ liệu."
                        : "Không tìm thấy kết quả phù hợp. Hãy thử từ khóa ngắn hơn, bỏ bớt bộ lọc, hoặc gõ không dấu."}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.items.map((item) => (
                      <ResultCard key={item.document_id} item={item} terms={data.query_terms} />
                    ))}
                  </div>
                )}

                {totalPages > 1 && (
                  <nav
                    aria-label="Phân trang"
                    className="flex items-center justify-center gap-4 mt-6 text-sm"
                  >
                    <button
                      onClick={() => go({ page: applied.page - 1 }, false)}
                      disabled={applied.page <= 1}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-[#DCD7C9] bg-white disabled:opacity-40 hover:border-[#9C7A3C]"
                    >
                      <ChevronLeft size={16} /> Trước
                    </button>
                    <span className="text-[#5B6472]">
                      Trang {applied.page} / {totalPages}
                    </span>
                    <button
                      onClick={() => go({ page: applied.page + 1 }, false)}
                      disabled={applied.page >= totalPages}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-[#DCD7C9] bg-white disabled:opacity-40 hover:border-[#9C7A3C]"
                    >
                      Sau <ChevronRight size={16} />
                    </button>
                  </nav>
                )}

                <p className="mt-6 text-xs text-[#5B6472] flex gap-1.5">
                  <Info size={14} className="shrink-0 mt-0.5" />
                  {meta?.last_updated ? `Dữ liệu cập nhật ${fmtDateTime(meta.last_updated)} · ` : ""}
                  {data.disclaimer || DISCLAIMER_FALLBACK}
                </p>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

"use client";

/**
 * app/legal-lookup/_components/catalog.tsx — "Danh mục văn bản pháp luật theo lĩnh vực".
 *
 * NGƯỜI DÙNG CHỈ XEM: chọn một lĩnh vực → xem danh sách văn bản → mở từng văn bản để đọc nội dung. Không có
 * nút/ô nhập nào để sửa, thêm hay xóa. Việc cập nhật chỉ dành cho quản trị viên (ô "Cập nhật VBPL/Án lệ/Bản án"
 * ở contribute.tsx, POST /legal/contribute); khi admin cập nhật, Legal AI tự phân loại văn bản vào lĩnh vực
 * tương ứng và văn bản xuất hiện ở đây.
 *
 * Chữ giao diện của mục này chỉ có tiếng Việt hoặc tiếng Anh (giao diện đang để ngôn ngữ khác thì dùng tiếng Việt).
 * Nội dung văn bản là tiếng Việt, giữ nguyên.
 */

import { useEffect, useState } from "react";
import { BookOpen, ChevronLeft, ChevronRight, ExternalLink, Loader2, X } from "lucide-react";
import {
  LegalCatalogPage,
  LegalDocumentDetail,
  LegalMeta,
  getLegalDocument,
  getLegalMeta,
  listLegalCatalog,
} from "@/lib/api";
import { useLang } from "@/lib/lang";

const PAGE_SIZE = 10;

const vi = {
  title: "Danh mục văn bản pháp luật theo lĩnh vực",
  hint: "Do quản trị viên cập nhật và tự động xếp theo lĩnh vực. Bạn chỉ xem, không chỉnh sửa được nội dung.",
  loading: "Đang tải…",
  error: "Không tải được dữ liệu. Vui lòng thử lại.",
  retry: "Thử lại",
  noneAtAll: "Chưa có văn bản nào được cập nhật.",
  emptyField: "Chưa có văn bản nào trong lĩnh vực này.",
  total: (n: number) => `${n} văn bản`,
  open: "Xem nội dung",
  close: "Đóng",
  prev: "Trước",
  next: "Sau",
  pageOf: (p: number, n: number) => `Trang ${p}/${n}`,
  numberLabel: "Số hiệu",
  issuerLabel: "Cơ quan ban hành",
  issuedLabel: "Ngày ban hành",
  effectiveLabel: "Hiệu lực từ",
  statusLabel: "Tình trạng",
  updatedLabel: "Cập nhật",
  summaryLabel: "Tóm tắt",
  openSource: "Mở nguồn gốc",
  readOnly: "Chỉ xem — không thể chỉnh sửa.",
};

const en: typeof vi = {
  title: "Catalog of legal documents by field",
  hint: "Maintained by administrators and sorted by field automatically. You can read the documents but cannot edit them.",
  loading: "Loading…",
  error: "Could not load the data. Please try again.",
  retry: "Try again",
  noneAtAll: "No documents have been added yet.",
  emptyField: "No documents in this field yet.",
  total: (n: number) => `${n} document${n === 1 ? "" : "s"}`,
  open: "Read",
  close: "Close",
  prev: "Previous",
  next: "Next",
  pageOf: (p: number, n: number) => `Page ${p}/${n}`,
  numberLabel: "Number",
  issuerLabel: "Issuing body",
  issuedLabel: "Issued on",
  effectiveLabel: "Effective from",
  statusLabel: "Status",
  updatedLabel: "Updated",
  summaryLabel: "Summary",
  openSource: "Open original source",
  readOnly: "Read-only — cannot be edited.",
};

const TEXT = { vi, en };

// "2026-01-15" → "15/01/2026"; chuỗi ngày giờ ISO chỉ lấy phần ngày.
function fmtDate(d: string | null | undefined): string {
  if (!d) return "";
  return d.slice(0, 10).split("-").reverse().join("/");
}

function isHttpUrl(url: string | null | undefined): url is string {
  return !!url && /^https?:\/\//i.test(url);
}

export default function LegalCatalog() {
  const [uiLang] = useLang();
  const T = TEXT[uiLang === "en" ? "en" : "vi"];

  const [opened, setOpened] = useState(false);
  const [meta, setMeta] = useState<LegalMeta | null>(null);
  const [metaError, setMetaError] = useState(false);
  const [metaTry, setMetaTry] = useState(0);

  const [field, setField] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [list, setList] = useState<LegalCatalogPage | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState(false);
  const [listTry, setListTry] = useState(0);

  const [openId, setOpenId] = useState<number | null>(null);
  const [doc, setDoc] = useState<LegalDocumentDetail | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState(false);

  // Tải số liệu theo lĩnh vực khi mở mục lần đầu (không tải nếu người dùng không mở).
  useEffect(() => {
    if (!opened || meta) return;
    let cancelled = false;
    setMetaError(false);
    getLegalMeta()
      .then((m) => {
        if (cancelled) return;
        setMeta(m);
        const first = m.field_stats.find((s) => s.total > 0);
        setField((prev) => prev ?? first?.value ?? null);
      })
      .catch(() => {
        if (!cancelled) setMetaError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [opened, meta, metaTry]);

  // Danh sách văn bản của lĩnh vực đang chọn.
  useEffect(() => {
    if (!opened || !field) return;
    let cancelled = false;
    setListLoading(true);
    setListError(false);
    listLegalCatalog(field, page, PAGE_SIZE)
      .then((res) => {
        if (!cancelled) setList(res);
      })
      .catch(() => {
        if (!cancelled) setListError(true);
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [opened, field, page, listTry]);

  // Nội dung một văn bản (chỉ đọc).
  useEffect(() => {
    if (openId === null) return;
    let cancelled = false;
    setDoc(null);
    setDocError(false);
    setDocLoading(true);
    getLegalDocument(openId)
      .then((d) => {
        if (!cancelled) setDoc(d);
      })
      .catch(() => {
        if (!cancelled) setDocError(true);
      })
      .finally(() => {
        if (!cancelled) setDocLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [openId]);

  // Esc đóng cửa sổ xem văn bản.
  useEffect(() => {
    if (openId === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openId]);

  function selectField(value: string) {
    if (value === field) return;
    setField(value);
    setPage(1);
    setList(null);
  }

  const fields = meta?.field_stats.filter((s) => s.total > 0) ?? [];
  const pageCount = list ? Math.max(1, Math.ceil(list.total / list.page_size)) : 1;
  const bodyChunks = doc?.chunks.filter((c) => c.role !== "meta") ?? [];

  return (
    <>
      <details
        className="mb-4 bg-white border border-[#DCD7C9] rounded-lg px-5 py-3"
        onToggle={(e) => setOpened(e.currentTarget.open)}
      >
        <summary className="cursor-pointer text-sm font-semibold text-[#1C2333] flex items-center gap-1.5 list-none">
          <BookOpen size={16} className="text-[#9C7A3C]" /> {T.title}
          {meta && <span className="font-normal text-[#5B6472]">— {T.total(meta.total_documents)}</span>}
        </summary>

        <p className="mt-2 text-xs text-[#8A919C]">{T.hint}</p>

        {!meta && !metaError && (
          <p className="mt-3 text-sm text-[#5B6472] flex items-center gap-2">
            <Loader2 size={14} className="animate-spin text-[#9C7A3C]" /> {T.loading}
          </p>
        )}

        {metaError && (
          <p className="mt-3 text-sm text-red-600">
            {T.error}{" "}
            <button type="button" onClick={() => setMetaTry((n) => n + 1)} className="underline">
              {T.retry}
            </button>
          </p>
        )}

        {meta && fields.length === 0 && <p className="mt-3 text-sm text-[#5B6472]">{T.noneAtAll}</p>}

        {meta && fields.length > 0 && (
          <>
            <div className="mt-3 flex flex-wrap gap-2">
              {fields.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => selectField(s.value)}
                  aria-pressed={s.value === field}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    s.value === field
                      ? "border-[#9C7A3C] bg-[#9C7A3C] text-white"
                      : "border-[#DCD7C9] bg-[#FAF8F3] text-[#5B6472] hover:border-[#9C7A3C]"
                  }`}
                >
                  {s.label} ({s.total})
                </button>
              ))}
            </div>

            <div className="mt-3">
              {listLoading && !list && (
                <p className="text-sm text-[#5B6472] flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-[#9C7A3C]" /> {T.loading}
                </p>
              )}

              {listError && (
                <p className="text-sm text-red-600">
                  {T.error}{" "}
                  <button type="button" onClick={() => setListTry((n) => n + 1)} className="underline">
                    {T.retry}
                  </button>
                </p>
              )}

              {list && list.items.length === 0 && !listError && (
                <p className="text-sm text-[#5B6472]">{T.emptyField}</p>
              )}

              {list && list.items.length > 0 && (
                <ul className="divide-y divide-[#EEE9DC] border border-[#DCD7C9] rounded-md">
                  {list.items.map((it) => (
                    <li key={it.document_id}>
                      <button
                        type="button"
                        onClick={() => setOpenId(it.document_id)}
                        className="w-full text-left px-3 py-2.5 hover:bg-[#FAF8F3] transition"
                      >
                        <span className="block text-sm font-medium text-[#1C2333]">{it.title}</span>
                        <span className="block mt-0.5 text-xs text-[#5B6472]">
                          {[
                            it.doc_type_label,
                            it.number,
                            it.issuer,
                            fmtDate(it.issued_on),
                            it.status_label,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {list && list.total > list.page_size && (
                <div className="mt-2 flex items-center justify-between text-xs text-[#5B6472]">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || listLoading}
                    className="inline-flex items-center gap-1 rounded-md border border-[#DCD7C9] px-2.5 py-1 hover:border-[#9C7A3C] disabled:opacity-50"
                  >
                    <ChevronLeft size={14} /> {T.prev}
                  </button>
                  <span>{T.pageOf(page, pageCount)}</span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                    disabled={page >= pageCount || listLoading}
                    className="inline-flex items-center gap-1 rounded-md border border-[#DCD7C9] px-2.5 py-1 hover:border-[#9C7A3C] disabled:opacity-50"
                  >
                    {T.next} <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </details>

      {/* Cửa sổ đọc văn bản — CHỈ ĐỌC, không có ô nhập hay nút sửa/xóa */}
      {openId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpenId(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={doc?.title ?? T.title}
            className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-lg bg-white border border-[#DCD7C9] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-start justify-between gap-3 bg-white border-b border-[#EEE9DC] px-5 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#1C2333]">{doc?.title ?? T.title}</p>
                <p className="mt-0.5 text-xs text-[#8A919C]">{T.readOnly}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpenId(null)}
                aria-label={T.close}
                className="shrink-0 p-1.5 rounded-full text-[#8A919C] hover:text-[#1C2333]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-5 py-4 text-sm text-[#1C2333]">
              {docLoading && (
                <p className="text-[#5B6472] flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-[#9C7A3C]" /> {T.loading}
                </p>
              )}

              {docError && <p className="text-red-600">{T.error}</p>}

              {doc && (
                <>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs text-[#5B6472]">
                    {doc.number && (
                      <>
                        <dt className="font-medium">{T.numberLabel}</dt>
                        <dd>{doc.number}</dd>
                      </>
                    )}
                    {doc.issuer && (
                      <>
                        <dt className="font-medium">{T.issuerLabel}</dt>
                        <dd>{doc.issuer}</dd>
                      </>
                    )}
                    {doc.issued_on && (
                      <>
                        <dt className="font-medium">{T.issuedLabel}</dt>
                        <dd>{fmtDate(doc.issued_on)}</dd>
                      </>
                    )}
                    {doc.effective_on && (
                      <>
                        <dt className="font-medium">{T.effectiveLabel}</dt>
                        <dd>{fmtDate(doc.effective_on)}</dd>
                      </>
                    )}
                    <dt className="font-medium">{T.statusLabel}</dt>
                    <dd>{doc.status_label}</dd>
                    {doc.data_updated_at && (
                      <>
                        <dt className="font-medium">{T.updatedLabel}</dt>
                        <dd>{fmtDate(doc.data_updated_at)}</dd>
                      </>
                    )}
                  </dl>

                  {isHttpUrl(doc.source_url) && (
                    <a
                      href={doc.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-xs text-[#9C7A3C] underline"
                    >
                      <ExternalLink size={12} /> {doc.source_name ? `${T.openSource} — ${doc.source_name}` : T.openSource}
                    </a>
                  )}

                  {doc.summary && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-[#5B6472]">{T.summaryLabel}</p>
                      <p className="mt-1 whitespace-pre-wrap leading-relaxed">{doc.summary}</p>
                    </div>
                  )}

                  <div className="mt-4 space-y-4">
                    {bodyChunks.map((c) => (
                      <section key={c.id}>
                        {c.locator && <p className="text-xs font-semibold text-[#9C7A3C]">{c.locator}</p>}
                        <p className="mt-0.5 whitespace-pre-wrap leading-relaxed">{c.content}</p>
                      </section>
                    ))}
                  </div>

                  <p className="mt-5 text-xs text-[#5B6472]">{doc.disclaimer}</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

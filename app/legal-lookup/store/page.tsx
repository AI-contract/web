"use client";

/**
 * app/legal-lookup/store/page.tsx — "Kho tự lưu" văn bản pháp luật / án lệ / bản án.
 *
 * CHỈ ADMIN (email trong ADMIN_EMAILS ở backend) xem và xóa được. Quyền được kiểm tra ở
 * backend (403 với người dùng thường); trang này chỉ hiển thị thông báo khi bị từ chối.
 */

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ExternalLink, Loader2, Search, ShieldAlert, Trash2 } from "lucide-react";
import {
  ApiError,
  LegalStoreDocumentList,
  LegalStoreStats,
  deleteLegalStoreDocument,
  getLegalStoreStats,
  listLegalStoreDocuments,
} from "@/lib/api";
import AppSidebar from "@/app/components/AppSidebar";
import { PageHeader, safeUrl, useAuthGuard } from "../_components/live";

type DocFilter = "" | "van_ban" | "an_le" | "ban_an";

const TYPE_LABEL: Record<string, string> = {
  van_ban: "Văn bản pháp luật",
  an_le: "Án lệ",
  ban_an: "Bản án",
};

const PAGE_SIZE = 20;

function fmtDate(iso: string | null): string {
  return iso ? iso.split("-").reverse().join("/") : "—";
}

export default function LegalStorePage() {
  const { ok, onUnauthorized } = useAuthGuard();

  const [docType, setDocType] = useState<DocFilter>("");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);

  const [list, setList] = useState<LegalStoreDocumentList | null>(null);
  const [stats, setStats] = useState<LegalStoreStats | null>(null);
  // Khoá của lần tải đã xong gần nhất; khác khoá hiện tại = đang tải (tránh setState đồng bộ trong effect).
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const requestKey = `${appliedSearch}|${docType}|${page}|${reloadKey}`;
  const loading = loadedKey !== requestKey;

  useEffect(() => {
    if (!ok) return;
    let cancelled = false;
    Promise.all([
      listLegalStoreDocuments({ q: appliedSearch, docType, page, pageSize: PAGE_SIZE }),
      getLegalStoreStats(),
    ])
      .then(([l, s]) => {
        if (cancelled) return;
        setList(l);
        setStats(s);
        setError(null);
        setLoadedKey(requestKey);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          onUnauthorized();
          return;
        }
        if (err instanceof ApiError && err.status === 403) {
          setForbidden(true);
        } else {
          setError(err instanceof ApiError ? err.message : "Có lỗi xảy ra, vui lòng thử lại.");
        }
        setLoadedKey(requestKey);
      });
    return () => {
      cancelled = true;
    };
  }, [ok, appliedSearch, docType, page, reloadKey, requestKey, onUnauthorized]);

  async function onDelete(id: number, title: string) {
    const short = title.length > 100 ? `${title.slice(0, 100)}…` : title;
    if (!window.confirm(`Xóa tài liệu khỏi kho tự lưu?\n\n${short}\n\nLần tra cứu sau hệ thống sẽ tìm và lưu lại từ nguồn nếu cần.`)) {
      return;
    }
    setDeletingId(id);
    setError(null);
    try {
      await deleteLegalStoreDocument(id);
      // Xóa hết mục cuối của trang thì lùi về trang trước.
      if (list && list.items.length === 1 && page > 1) setPage(page - 1);
      else setReloadKey((k) => k + 1);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onUnauthorized();
        return;
      }
      setError(err instanceof ApiError ? err.message : "Không xóa được tài liệu, vui lòng thử lại.");
    } finally {
      setDeletingId(null);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPage(1);
    setAppliedSearch(search);
  }

  if (!ok) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F3]">
        <Loader2 className="animate-spin text-[#9C7A3C]" size={28} />
      </div>
    );
  }

  const totalPages = list ? Math.max(1, Math.ceil(list.total / list.page_size)) : 1;

  return (
    <div className="min-h-screen bg-[#FAF8F3] flex">
      <AppSidebar active="legalLookup" />
      <div className="flex-1 min-w-0">
        <PageHeader title="Kho tự lưu (Admin)" backHref="/legal-lookup" backLabel="Tra cứu pháp lý" />

        <main className="max-w-6xl mx-auto px-6 py-8">
          {forbidden ? (
            <div className="bg-white border border-[#DCD7C9] rounded-lg px-6 py-8 text-center">
              <ShieldAlert className="mx-auto text-[#9C7A3C] mb-3" size={32} />
              <p className="text-[#1C2333] font-semibold">Chỉ quản trị viên mới được xem kho tự lưu.</p>
              <p className="text-sm text-[#5B6472] mt-1">
                Tài khoản của bạn không có quyền truy cập trang này.
              </p>
            </div>
          ) : (
            <>
              {stats && (
                <p className="text-sm text-[#5B6472] mb-4">
                  <strong className="text-[#1C2333]">{stats.total}</strong> / {stats.capacity} tài liệu ·{" "}
                  {stats.van_ban} văn bản · {stats.an_le} án lệ · {stats.ban_an} bản án
                  {stats.last_updated && ` · cập nhật gần nhất ${fmtDate(stats.last_updated)}`}
                  {!stats.enabled && " · (kho đang tắt: LEGAL_STORE_ENABLED=false)"}
                </p>
              )}

              <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-2 mb-4">
                <select
                  value={docType}
                  onChange={(e) => {
                    setDocType(e.target.value as DocFilter);
                    setPage(1);
                  }}
                  aria-label="Loại tài liệu"
                  className="rounded-md border border-[#DCD7C9] bg-white px-3 py-2 text-sm"
                >
                  <option value="">Tất cả loại</option>
                  <option value="van_ban">Văn bản pháp luật</option>
                  <option value="an_le">Án lệ</option>
                  <option value="ban_an">Bản án</option>
                </select>
                <div className="flex-1 min-w-[220px] flex items-center gap-2 bg-white border border-[#DCD7C9] rounded-md px-3">
                  <Search size={16} className="text-[#9C7A3C] shrink-0" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    maxLength={200}
                    placeholder="Lọc theo tiêu đề hoặc số hiệu"
                    aria-label="Lọc theo tiêu đề hoặc số hiệu"
                    className="flex-1 bg-transparent py-2 text-sm focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-md bg-[#16213E] text-white px-4 py-2 text-sm hover:bg-[#1C2333]"
                >
                  Lọc
                </button>
              </form>

              {error && (
                <p className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {error}
                </p>
              )}

              {loading && !list ? (
                <div className="flex items-center gap-2 text-sm text-[#5B6472]">
                  <Loader2 size={16} className="animate-spin text-[#9C7A3C]" /> Đang tải…
                </div>
              ) : list && list.items.length === 0 ? (
                <div className="bg-white border border-[#DCD7C9] rounded-lg px-5 py-6 text-sm text-[#5B6472]">
                  Kho chưa có tài liệu nào phù hợp. Kho tự mở rộng sau mỗi lượt tra cứu trực tiếp thành công.
                </div>
              ) : (
                list && (
                  <>
                    <div className="bg-white border border-[#DCD7C9] rounded-lg overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-[#F3EFE4] text-left text-[#5B6472]">
                          <tr>
                            <th className="px-4 py-2.5 font-medium">Tài liệu</th>
                            <th className="px-4 py-2.5 font-medium whitespace-nowrap">Loại</th>
                            <th className="px-4 py-2.5 font-medium whitespace-nowrap">Lưu ngày</th>
                            <th className="px-4 py-2.5 font-medium whitespace-nowrap">Đoạn</th>
                            <th className="px-4 py-2.5" />
                          </tr>
                        </thead>
                        <tbody className={loading ? "opacity-60" : ""}>
                          {list.items.map((d) => {
                            const src = safeUrl(d.source_url);
                            const meta = [d.number && `Số ${d.number}`, d.issuer].filter(Boolean).join(" · ");
                            return (
                              <tr key={d.id} className="border-t border-[#EAE5D8] align-top">
                                <td className="px-4 py-3">
                                  <p className="font-medium text-[#1C2333]">{d.title}</p>
                                  {meta && <p className="text-xs text-[#5B6472] mt-0.5">{meta}</p>}
                                  {src && (
                                    <a
                                      href={src}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-xs text-[#9C7A3C] hover:underline mt-1"
                                    >
                                      <ExternalLink size={11} /> Mở nguồn gốc
                                    </a>
                                  )}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-[#5B6472]">
                                  {TYPE_LABEL[d.doc_type] ?? d.doc_type}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-[#5B6472]">{fmtDate(d.stored_at)}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-[#5B6472]">{d.chunk_count}</td>
                                <td className="px-4 py-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => onDelete(d.id, d.title)}
                                    disabled={deletingId === d.id}
                                    aria-label={`Xóa: ${d.title}`}
                                    className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                                  >
                                    {deletingId === d.id ? (
                                      <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                      <Trash2 size={14} />
                                    )}
                                    Xóa
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex items-center justify-between mt-4 text-sm text-[#5B6472]">
                      <span>
                        {list.total} tài liệu · trang {page}/{totalPages}
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={page <= 1 || loading}
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          className="rounded-md border border-[#DCD7C9] bg-white px-3 py-1.5 disabled:opacity-50 hover:border-[#9C7A3C]"
                        >
                          ← Trước
                        </button>
                        <button
                          type="button"
                          disabled={page >= totalPages || loading}
                          onClick={() => setPage((p) => p + 1)}
                          className="rounded-md border border-[#DCD7C9] bg-white px-3 py-1.5 disabled:opacity-50 hover:border-[#9C7A3C]"
                        >
                          Sau →
                        </button>
                      </div>
                    </div>
                  </>
                )
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

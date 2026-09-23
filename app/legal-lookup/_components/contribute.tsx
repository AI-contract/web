"use client";

/**
 * app/legal-lookup/_components/contribute.tsx
 *
 * Ô "Cập nhật VBPL/Án lệ/Bản án": Admin và khách hàng dán toàn văn văn bản
 * pháp luật/án lệ/bản án kèm nguồn. Legal AI tự phân loại (loại/lĩnh vực/
 * chuyên đề) rồi lưu vào cơ sở dữ liệu tra cứu để dùng cho các lượt tra cứu
 * sau — khác với phần tra cứu trực tiếp ở trên (không lưu trữ gì).
 */

import { useState } from "react";
import type { FormEvent } from "react";
import { ChevronDown, ChevronUp, FilePlus2, Loader2 } from "lucide-react";
import { ApiError, LegalContributeResult, contributeLegalDocument } from "@/lib/api";

export default function ContributeBox() {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LegalContributeResult | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = content.trim();
    if (text.length < 20) {
      setError("Vui lòng dán nội dung đầy đủ hơn (tối thiểu 20 ký tự).");
      return;
    }
    setError(null);
    setResult(null);
    setSubmitting(true);
    try {
      const res = await contributeLegalDocument(text, sourceName, sourceUrl);
      setResult(res);
      setContent("");
      setSourceName("");
      setSourceUrl("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white border border-[#DCD7C9] rounded-lg mb-6 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-[#1C2333] flex items-center gap-1.5">
          <FilePlus2 size={16} className="text-[#9C7A3C]" /> Cập nhật VBPL/Án lệ/Bản án
        </span>
        {open ? (
          <ChevronUp size={16} className="text-[#8A919C]" />
        ) : (
          <ChevronDown size={16} className="text-[#8A919C]" />
        )}
      </button>

      {open && (
        <form onSubmit={onSubmit} className="px-5 pb-5 space-y-3 border-t border-[#DCD7C9] pt-4">
          <p className="text-xs text-[#8A919C]">
            Dán toàn văn văn bản pháp luật, án lệ hoặc bản án (kèm nguồn nếu có). Legal AI sẽ tự
            phân loại (loại tài liệu, lĩnh vực, chuyên đề) rồi lưu lại để dùng cho các lượt tra cứu
            sau. Nội dung do bạn cung cấp chưa qua kiểm tra đối chiếu nên ban đầu ở trạng thái
            &quot;Chưa xác minh&quot;.
          </p>

          <div>
            <label htmlFor="legal-contribute-content" className="block text-xs font-medium text-[#5B6472] mb-1">
              Văn bản
            </label>
            <textarea
              id="legal-contribute-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={200_000}
              rows={8}
              placeholder="Dán toàn văn văn bản/án lệ/bản án vào đây…"
              aria-label="Văn bản"
              className="w-full rounded-md border border-[#DCD7C9] px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#9C7A3C]"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="legal-contribute-source-name" className="block text-xs font-medium text-[#5B6472] mb-1">
                Tên nguồn <span className="font-normal text-[#8A919C]">(tuỳ chọn)</span>
              </label>
              <input
                id="legal-contribute-source-name"
                type="text"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                maxLength={255}
                placeholder="Ví dụ: Thư viện pháp luật"
                aria-label="Tên nguồn"
                className="w-full rounded-md border border-[#DCD7C9] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#9C7A3C]"
              />
            </div>
            <div>
              <label htmlFor="legal-contribute-source-url" className="block text-xs font-medium text-[#5B6472] mb-1">
                Đường dẫn nguồn <span className="font-normal text-[#8A919C]">(tuỳ chọn)</span>
              </label>
              <input
                id="legal-contribute-source-url"
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                maxLength={2000}
                placeholder="https://…"
                aria-label="Đường dẫn nguồn"
                className="w-full rounded-md border border-[#DCD7C9] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#9C7A3C]"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {result && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2.5 text-sm text-emerald-800">
              <p className="font-medium">{result.message}</p>
              <p className="mt-1 text-xs">
                {result.doc_type_label}
                {result.field_labels.length ? ` · ${result.field_labels.join(", ")}` : ""} ·{" "}
                {result.status_label} · &quot;{result.title}&quot;
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-md bg-[#16213E] text-white px-5 py-2 text-sm hover:bg-[#1C2333] disabled:opacity-60 transition"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {submitting ? "Đang phân loại…" : "Cập nhật"}
          </button>
        </form>
      )}
    </div>
  );
}

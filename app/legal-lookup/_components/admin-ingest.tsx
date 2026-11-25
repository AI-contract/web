"use client";

/**
 * app/legal-lookup/_components/admin-ingest.tsx — ô "Nạp văn bản vào Tư vấn AI" (CHỈ QUẢN TRỊ VIÊN).
 *
 * Thay cho hai lệnh `scripts.ingest_vbpl --apply` + `app.jobs.embed_legal_chunks`: quản trị viên dán đường dẫn văn bản trên vbpl.vn,
 * xem trước (không ghi dữ liệu), tích xác nhận nếu có cảnh báo, rồi nạp NỀN và theo dõi tiến độ. Khác ô "Cập nhật VBPL/Án lệ/Bản án"
 * (nội dung dán tay, chưa xác minh, Tư vấn AI KHÔNG dùng), văn bản nạp ở đây lấy nguyên văn từ nguồn chính thống và được Tư vấn AI trích dẫn.
 *
 * Quyền kiểm ở backend (/legal/admin/ingest/*, email trong ADMIN_EMAILS). Người dùng thường nhận admin=false nên component không hiển thị gì.
 * Ô này chỉ dành cho quản trị nên viết bằng tiếng Việt, không theo bộ 5 ngôn ngữ của trang tra cứu.
 */

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ChevronDown, ChevronUp, FilePlus2, Loader2, ShieldAlert } from "lucide-react";
import { ApiError, getLegalIngestAccess, getLegalIngestJob, previewLegalIngest, startLegalIngest } from "@/lib/api";
import type { LegalIngestJob, LegalIngestPreview } from "@/lib/api";

type Access = "loading" | "no" | "yes";

const STAGE_LABEL: Record<string, string> = {
  queued: "Đang chờ bắt đầu…",
  fetching: "Đang tải trang từ vbpl.vn…",
  saving: "Đang ghi vào cơ sở dữ liệu…",
  embedding: "Đang tạo embedding…",
  finished: "Đã kết thúc",
};

const POLL_MS = 2000;

export default function AdminIngestPanel() {
  const [access, setAccess] = useState<Access>("loading");
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<LegalIngestPreview | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [starting, setStarting] = useState(false);
  const [job, setJob] = useState<LegalIngestJob | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Hỏi backend có phải quản trị viên không; nếu đang có lượt nạp chạy dở (tải lại trang giữa chừng) thì mở sẵn và theo dõi tiếp.
  useEffect(() => {
    let cancelled = false;
    getLegalIngestAccess()
      .then((r) => {
        if (cancelled) return;
        setAccess(r.admin ? "yes" : "no");
        const running = r.jobs.find((j) => j.state === "running");
        if (running) {
          setJob(running);
          setOpen(true);
        }
      })
      .catch(() => {
        if (!cancelled) setAccess("no");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Theo dõi tiến độ lượt nạp đang chạy.
  const runningId = job && job.state === "running" ? job.job_id : null;
  useEffect(() => {
    if (!runningId) return;
    let cancelled = false;
    const timer = window.setInterval(() => {
      getLegalIngestJob(runningId)
        .then((j) => {
          if (!cancelled) setJob(j);
        })
        .catch((err) => {
          if (cancelled) return;
          if (err instanceof ApiError && err.status === 404) {
            // Máy chủ khởi động lại làm mất trạng thái: dừng theo dõi và hướng dẫn kiểm tra lại bằng bản xem trước.
            setJob((cur) =>
              cur && cur.job_id === runningId
                ? { ...cur, state: "failed", stage: "finished", message: err.message }
                : cur
            );
          }
          // Lỗi mạng tạm thời: bỏ qua, lần sau thử lại.
        });
    }, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [runningId]);

  if (access !== "yes") return null;

  const busy = runningId !== null;
  const canStart =
    !!preview && preview.can_apply && (!preview.needs_acknowledge || acknowledged) && !starting && !busy;

  async function onPreview(e: FormEvent) {
    e.preventDefault();
    const clean = url.trim();
    if (!clean || previewing) return;
    setPreviewing(true);
    setError(null);
    setPreview(null);
    setAcknowledged(false);
    try {
      setPreview(await previewLegalIngest(clean));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không xem trước được, vui lòng thử lại.");
    } finally {
      setPreviewing(false);
    }
  }

  async function onStart() {
    if (!preview || !canStart) return;
    setStarting(true);
    setError(null);
    try {
      setJob(await startLegalIngest(preview, acknowledged));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không bắt đầu được lượt nạp, vui lòng thử lại.");
    } finally {
      setStarting(false);
    }
  }

  function onUrlChange(value: string) {
    setUrl(value);
    // Đổi đường dẫn thì bản xem trước cũ không còn đúng: bắt buộc xem trước lại.
    setPreview(null);
    setAcknowledged(false);
  }

  const pct = job && job.embed_total > 0 ? Math.min(100, Math.round((job.embed_done / job.embed_total) * 100)) : 0;

  return (
    <section className="bg-white border border-[#DCD7C9] rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 px-5 py-4 text-left text-sm font-medium text-[#1E1E1E] hover:bg-[#FAF8F3]"
      >
        <FilePlus2 size={16} className="text-[#9C7A3C]" />
        <span className="flex-1">Nạp văn bản vào Tư vấn AI (IRAC)</span>
        <span className="rounded-full bg-[#FAF8F3] border border-[#DCD7C9] px-2 py-0.5 text-[11px] font-normal text-[#5B6472]">
          Quản trị viên
        </span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <div className="border-t border-[#DCD7C9] px-5 py-4 space-y-4">
          <p className="text-xs text-[#5B6472] leading-relaxed">
            Dán đường dẫn trang văn bản trên vbpl.vn (dạng <code>https://vbpl.vn/van-ban/chi-tiet/…</code>). Hệ thống tải nguyên văn từ
            nguồn chính thống, cắt từng Điều, ghi tình trạng hiệu lực theo trang nguồn rồi tạo embedding để Tư vấn pháp lý AI trích dẫn.
            Chỉ nhận vbpl.vn; không nhận văn bản dán tay.
          </p>

          <form onSubmit={onPreview} className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder="https://vbpl.vn/van-ban/chi-tiet/…--169032?tabs=toan-van"
              className="flex-1 min-w-0 rounded-lg border border-[#DCD7C9] px-3 py-2 text-sm outline-none focus:border-[#9C7A3C]"
              disabled={busy}
            />
            <button
              type="submit"
              disabled={!url.trim() || previewing || busy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1A2340] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {previewing && <Loader2 size={14} className="animate-spin" />}
              Xem trước
            </button>
          </form>

          {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          {preview && (
            <div className="rounded-lg border border-[#DCD7C9] bg-[#FAF8F3] p-4 space-y-3 text-sm">
              {preview.can_apply ? (
                <>
                  <div>
                    <p className="font-semibold text-[#1E1E1E]">{preview.title}</p>
                    <p className="text-xs text-[#5B6472]">
                      {preview.number ?? "(không có số hiệu)"} · ID nguồn {preview.doc_id}
                    </p>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-[#5B6472]">
                    <dt>Tình trạng hiệu lực (theo trang nguồn)</dt>
                    <dd className="font-medium text-[#1E1E1E]">{preview.status_label}</dd>
                    <dt>Số Điều tách được</dt>
                    <dd className="font-medium text-[#1E1E1E]">{preview.articles}</dd>
                    <dt>Tư vấn AI sẽ dùng văn bản này</dt>
                    <dd className="font-medium text-[#1E1E1E]">{preview.usable_by_research ? "Có" : "Không"}</dd>
                    {preview.amended_registry_articles !== null && (
                      <>
                        <dt>Điều đã khai báo bị sửa đổi</dt>
                        <dd className="font-medium text-[#1E1E1E]">{preview.amended_registry_articles}</dd>
                      </>
                    )}
                  </dl>
                  {preview.existing ? (
                    <p className="text-xs text-[#5B6472]">
                      Đã có trong hệ thống (id {preview.existing.document_id}): {preview.existing.articles} Điều,{" "}
                      {preview.existing.embedded} có embedding, tình trạng «{preview.existing.status_label}». Nạp lại sẽ cập nhật; Điều
                      không đổi giữ nguyên embedding.
                    </p>
                  ) : (
                    <p className="text-xs text-[#5B6472]">Văn bản chưa có trong hệ thống: sẽ được tạo mới.</p>
                  )}
                  {preview.warnings.length > 0 && (
                    <ul className="space-y-1.5">
                      {preview.warnings.map((w) => (
                        <li
                          key={w}
                          className="flex items-start gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-900"
                        >
                          <ShieldAlert size={13} className="mt-0.5 shrink-0" />
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {preview.needs_acknowledge && (
                    <label className="flex items-start gap-2 text-xs text-[#1E1E1E]">
                      <input
                        type="checkbox"
                        checked={acknowledged}
                        onChange={(e) => setAcknowledged(e.target.checked)}
                        className="mt-0.5"
                      />
                      <span>Tôi đã đọc các cảnh báo trên và vẫn muốn nạp văn bản này.</span>
                    </label>
                  )}
                  <button
                    type="button"
                    onClick={onStart}
                    disabled={!canStart}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#9C7A3C] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {starting && <Loader2 size={14} className="animate-spin" />}
                    Nạp vào hệ thống
                  </button>
                </>
              ) : (
                <div className="space-y-1">
                  <p className="font-medium text-red-700">Không nạp được văn bản này</p>
                  <p className="text-xs text-red-700">{preview.reason}</p>
                </div>
              )}
            </div>
          )}

          {job && (
            <div
              className={`rounded-lg border p-3 text-sm ${
                job.state === "failed"
                  ? "border-red-200 bg-red-50 text-red-800"
                  : job.state === "done"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-[#DCD7C9] bg-[#FAF8F3] text-[#1E1E1E]"
              }`}
              role="status"
            >
              <p className="flex items-center gap-1.5 font-medium">
                {job.state === "running" && <Loader2 size={14} className="animate-spin" />}
                {job.state === "running"
                  ? (STAGE_LABEL[job.stage] ?? job.stage)
                  : job.state === "done"
                    ? "Hoàn tất"
                    : "Không nạp được"}
              </p>
              {job.title && (
                <p className="mt-0.5 text-xs opacity-80">
                  {job.title}
                  {job.number ? ` (${job.number})` : ""}
                </p>
              )}
              {job.state === "running" && job.embed_total > 0 && (
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#DCD7C9]">
                  <div className="h-full bg-[#9C7A3C] transition-all" style={{ width: `${pct}%` }} />
                </div>
              )}
              <p className="mt-1 text-xs leading-relaxed">{job.message}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

"use client";

/**
 * app/legal-lookup/_components/shared.tsx
 *
 * Thành phần dùng chung cho 3 cấp của trang tra cứu pháp lý:
 *   cấp 1  /legal-lookup                    tổng quan theo lĩnh vực
 *   cấp 2  /legal-lookup/[lĩnh vực]         tra cứu + bộ lọc nâng cao
 *   cấp 3  thẻ kết quả (ResultCard) + trang toàn văn /legal-lookup/documents/[id]
 *
 * (Thư mục bắt đầu bằng "_" là private folder của Next.js: không tạo route.)
 *
 * Nội dung snippet/văn bản là text thuần; việc tô sáng do React bọc <mark>
 * (không dùng dangerouslySetInnerHTML) nên không có rủi ro XSS từ dữ liệu.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { ElementType, ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  Building2,
  Copy,
  ExternalLink,
  FileText,
  Folder,
  Gavel,
  Heart,
  Landmark,
  Lightbulb,
  Map as MapIcon,
  Scale,
  Store,
  Users,
} from "lucide-react";
import { ApiError, LegalSearchItem, getMe } from "@/lib/api";

// ---------------------------------------------------------------
// Hằng số
// ---------------------------------------------------------------
export const ALL_FIELDS = "tat-ca";
export const HEADER_LOCATOR = "Thông tin chung";

export const FIELD_ICONS: Record<string, ElementType> = {
  dan_su: Users,
  thuong_mai: Store,
  lao_dong: Briefcase,
  dat_dai: MapIcon,
  doanh_nghiep: Building2,
  hon_nhan_gia_dinh: Heart,
  so_huu_tri_tue: Lightbulb,
  pha_san: Landmark,
  hanh_chinh: FileText,
  hinh_su: Gavel,
  khac: Folder,
};

// Màu theo LOẠI tài liệu (tách khỏi màu tình trạng hiệu lực).
export const TYPE_TONE: Record<string, string> = {
  van_ban: "bg-sky-50 text-sky-700 border-sky-200",
  ban_an: "bg-amber-50 text-amber-800 border-amber-200",
  an_le: "bg-violet-50 text-violet-700 border-violet-200",
};

export const TYPE_SHORT: Record<string, string> = {
  van_ban: "VB",
  ban_an: "BA",
  an_le: "AL",
};

export const STATUS_TONE: Record<string, string> = {
  con_hieu_luc: "bg-emerald-50 text-emerald-700 border-emerald-200",
  het_hieu_luc: "bg-red-50 text-red-700 border-red-200",
  het_hieu_luc_mot_phan: "bg-orange-50 text-orange-800 border-orange-200",
  chua_co_hieu_luc: "bg-slate-50 text-slate-600 border-slate-300",
  chua_xac_minh: "bg-slate-100 text-slate-600 border-slate-300",
};

export const DISCLAIMER_FALLBACK =
  "Kết quả tra cứu chỉ mang tính tham khảo, không thay thế tư vấn pháp lý chính thức.";

// ---------------------------------------------------------------
// Tiện ích
// ---------------------------------------------------------------
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const parts = iso.slice(0, 10).split("-");
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : iso;
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("vi-VN");
}

// Chỉ cho phép link http(s) — chặn javascript: và các scheme lạ.
export function safeUrl(url: string | null | undefined): string | null {
  return url && /^https?:\/\//i.test(url) ? url : null;
}

export function errorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : "Có lỗi xảy ra, vui lòng thử lại.";
}

/** Bỏ dấu + hạ chữ thường TỪNG code point (độ dài giữ nguyên) — khớp fold_vi() của backend. */
function foldChar(ch: string): string {
  if (ch === "đ" || ch === "Đ") return "d";
  const base = ch.normalize("NFD")[0].toLowerCase();
  return /^[a-z0-9]$/.test(base) ? base : " ";
}

/**
 * Tìm vị trí (theo code point) của các từ khóa (đã bỏ dấu, lấy từ
 * `query_terms` của backend) trong `text`. Từ ≥3 ký tự khớp tiền tố
 * (giống backend), từ ngắn hơn khớp nguyên từ để tránh tô nhầm.
 */
export function findTermRanges(text: string, terms: string[]): number[][] {
  const wanted = terms.filter(Boolean);
  if (!text || wanted.length === 0) return [];
  const chars = Array.from(text);
  const folded = chars.map(foldChar).join("");

  const ranges: number[][] = [];
  const re = /[a-z0-9]+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(folded)) !== null) {
    const token = m[0];
    if (wanted.some((t) => token === t || (t.length >= 3 && token.startsWith(t)))) {
      ranges.push([m.index, m.index + token.length]);
      if (ranges.length >= 60) break;
    }
  }
  return ranges;
}

/** Tô sáng theo vị trí [start, end] tính bằng code point. */
export function Highlighted({ text, ranges }: { text: string; ranges: number[][] }) {
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

/** Tô sáng các từ khóa trong một đoạn văn dài (Vấn đề / Giải quyết). */
export function TermHighlighted({ text, terms }: { text: string; terms: string[] }) {
  return <Highlighted text={text} ranges={findTermRanges(text, terms)} />;
}

/** Chuỗi trích dẫn để sao chép. */
export function buildCitation(
  item: Pick<
    LegalSearchItem,
    | "doc_type_label"
    | "number"
    | "title"
    | "issuer"
    | "issued_on"
    | "status_label"
    | "source_url"
  >,
  locator?: string | null
): string {
  const head = item.number ? `${item.title} (số ${item.number})` : item.title;
  const parts = [head];
  if (item.issuer) parts.push(item.issuer);
  if (item.issued_on) parts.push(`ban hành ${fmtDate(item.issued_on)}`);
  let text = `${item.doc_type_label}: ${parts.join(", ")}`;
  if (locator && locator !== HEADER_LOCATOR) text += ` — ${locator}`;
  text += `. Tình trạng hiệu lực: ${item.status_label}.`;
  const src = safeUrl(item.source_url);
  if (src) text += ` Nguồn: ${src}`;
  return text;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Trình duyệt chặn Clipboard API (http, quyền...): dùng cách dự phòng.
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(area);
      return ok;
    } catch {
      return false;
    }
  }
}

// ---------------------------------------------------------------
// Kiểm tra đăng nhập (dùng chung cho cả 3 trang)
// ---------------------------------------------------------------
export function useAuthGuard(): { ok: boolean; onUnauthorized: () => void } {
  const router = useRouter();
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  const [ok, setOk] = useState(false);
  useEffect(() => {
    let cancelled = false;
    getMe()
      .then(() => {
        if (!cancelled) setOk(true);
      })
      .catch(() => {
        if (!cancelled) routerRef.current.push("/login");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Identity ổn định: dùng trong dependency của effect tải dữ liệu.
  const onUnauthorized = useCallback(() => routerRef.current.push("/login"), []);
  return { ok, onUnauthorized };
}

// ---------------------------------------------------------------
// Thành phần giao diện nhỏ
// ---------------------------------------------------------------
export function TypeBadge({ docType, label }: { docType: string; label: string }) {
  return (
    <span
      className={`inline-block text-xs px-2 py-0.5 rounded-full border ${
        TYPE_TONE[docType] ?? "bg-slate-100 text-slate-600 border-slate-300"
      }`}
    >
      {label}
    </span>
  );
}

export function StatusBadge({ status, label }: { status: string; label: string }) {
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

export function PageHeader({
  title,
  backHref,
  backLabel,
}: {
  title: string;
  backHref: string;
  backLabel: string;
}) {
  return (
    <header className="bg-[#16213E] text-white px-6 py-4 flex items-center gap-4">
      <Link href={backHref} className="text-sm text-slate-300 hover:text-white">
        ← {backLabel}
      </Link>
      <div className="flex items-center gap-2">
        <Scale size={20} className="text-[#C6A15C]" />
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
    </header>
  );
}

export function Meta({
  item,
}: {
  item: Pick<LegalSearchItem, "number" | "issuer" | "issued_on" | "effective_on">;
}) {
  const line = [
    item.number && `Số ${item.number}`,
    item.issuer,
    item.issued_on && `Ban hành ${fmtDate(item.issued_on)}`,
    item.effective_on && `Hiệu lực ${fmtDate(item.effective_on)}`,
  ]
    .filter(Boolean)
    .join(" · ");
  return line ? <p className="text-sm text-[#5B6472] mt-1">{line}</p> : null;
}

export function IssueResolution({
  issue,
  resolution,
  terms,
}: {
  issue: string | null;
  resolution: string | null;
  terms: string[];
}) {
  return (
    <>
      {issue && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-red-700 mb-1">Vấn đề pháp lý</p>
          <p className="text-sm text-[#1C2333] leading-relaxed whitespace-pre-wrap">
            <TermHighlighted text={issue} terms={terms} />
          </p>
        </div>
      )}
      {resolution && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-[#9C7A3C] mb-1">Giải quyết / Phán quyết</p>
          <p className="text-sm text-[#1C2333] leading-relaxed whitespace-pre-wrap border-l-4 border-[#C6A15C] bg-[#FAF8F3] px-3 py-2">
            <TermHighlighted text={resolution} terms={terms} />
          </p>
        </div>
      )}
    </>
  );
}

export function BasisAndKeywords({
  basis,
  keywords,
}: {
  basis: string[];
  keywords: string[];
}) {
  return (
    <>
      {basis.length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-[#5B6472] mb-1.5">Căn cứ pháp lý được viện dẫn</p>
          <div className="flex flex-wrap gap-1.5">
            {basis.map((b) => (
              <span
                key={b}
                className="text-sm px-2.5 py-0.5 rounded-full border border-[#C6A15C] text-[#7A5F2B]"
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      )}
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {keywords.map((k) => (
            <span
              key={k}
              className="text-xs px-2 py-0.5 rounded-full bg-[#F3EFE4] text-[#5B6472]"
            >
              {k}
            </span>
          ))}
        </div>
      )}
    </>
  );
}

export function CopyCitationButton({ text }: { text: string }) {
  const [state, setState] = useState<"idle" | "done" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  async function onCopy() {
    const ok = await copyToClipboard(text);
    setState(ok ? "done" : "failed");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2000);
  }

  return (
    <button
      onClick={onCopy}
      className="inline-flex items-center gap-1.5 text-sm text-[#5B6472] hover:text-[#9C7A3C]"
    >
      <Copy size={14} />
      {state === "done"
        ? "Đã sao chép"
        : state === "failed"
          ? "Không sao chép được"
          : "Sao chép trích dẫn"}
    </button>
  );
}

// ---------------------------------------------------------------
// Cấp 3: thẻ kết quả
// ---------------------------------------------------------------
export function documentHref(item: LegalSearchItem): string {
  const base = `/legal-lookup/documents/${item.document_id}`;
  return item.locator && item.locator !== HEADER_LOCATOR
    ? `${base}?locator=${encodeURIComponent(item.locator)}`
    : base;
}

export function ResultCard({
  item,
  terms,
}: {
  item: LegalSearchItem;
  terms: string[];
}) {
  const src = safeUrl(item.source_url);
  const hasCaseSections = Boolean(item.issue || item.resolution);
  const showSnippet =
    !hasCaseSections && item.snippet && item.locator !== HEADER_LOCATOR;

  return (
    <article className="bg-white border border-[#DCD7C9] rounded-lg p-5 hover:border-[#9C7A3C] transition">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <TypeBadge docType={item.doc_type} label={item.doc_type_label} />
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

      <Link
        href={documentHref(item)}
        className="font-semibold text-[#1C2333] hover:text-[#9C7A3C] transition"
      >
        {item.title}
      </Link>
      <Meta item={item} />

      {item.topic_labels.length > 0 && (
        <p className="text-xs text-[#5B6472] mt-1">
          Chuyên đề: {item.topic_labels.join(", ")}
        </p>
      )}

      {hasCaseSections && (
        <IssueResolution issue={item.issue} resolution={item.resolution} terms={terms} />
      )}

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

      <BasisAndKeywords basis={item.basis} keywords={item.keywords} />

      <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-[#EAE5D8] text-sm">
        <Link href={documentHref(item)} className="text-[#9C7A3C] hover:underline">
          Xem toàn văn
        </Link>
        <CopyCitationButton text={buildCitation(item, item.locator)} />
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

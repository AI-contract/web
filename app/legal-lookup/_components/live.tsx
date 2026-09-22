"use client";

/**
 * app/legal-lookup/_components/live.tsx
 *
 * Thành phần của trang "Tra cứu pháp lý" (tra cứu TRỰC TIẾP trên nguồn chính
 * thống, không lưu trữ dữ liệu). Thư mục bắt đầu bằng "_" là private folder
 * của Next.js: không tạo route.
 *
 * Nội dung trích dẫn là text thuần do backend đã đối chiếu với trang nguồn;
 * React tự escape khi hiển thị (không dùng dangerouslySetInnerHTML).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  HelpCircle,
  Loader2,
  RefreshCw,
  Scale,
  ShieldAlert,
} from "lucide-react";
import {
  ApiError,
  LiveGroup,
  LiveItem,
  LiveMode,
  LiveSearchResponse,
  getMe,
  searchLegalLive,
} from "@/lib/api";

// ---------------------------------------------------------------
// Hằng số & tiện ích
// ---------------------------------------------------------------
export const GROUP_ORDER: LiveGroup[] = ["van_ban", "an_le", "ban_an", "danh_gia"];

export const GROUP_META: Record<
  LiveGroup,
  { label: string; hint: string; excerptLabel: string; badge: string }
> = {
  van_ban: {
    label: "Quy định pháp luật",
    hint: "Văn bản quy phạm pháp luật có liên quan",
    excerptLabel: "Trích dẫn từ nguồn",
    badge: "bg-sky-50 text-sky-700 border-sky-200",
  },
  an_le: {
    label: "Án lệ",
    hint: "Án lệ do Tòa án nhân dân tối cao công bố",
    excerptLabel: "Khái quát nội dung án lệ",
    badge: "bg-violet-50 text-violet-700 border-violet-200",
  },
  ban_an: {
    label: "Bản án",
    hint: "Bản án, quyết định đã được công bố trên Cổng công bố bản án",
    excerptLabel: "Thông tin về vụ/việc",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
  },
  danh_gia: {
    label: "Đánh giá pháp lý & rủi ro",
    hint: "Phân tích sơ bộ do AI tổng hợp từ quy định pháp luật và nguồn mở — chỉ tham khảo",
    excerptLabel: "Phân tích",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
  },
};

const RISK_META: Record<"cao" | "trung_binh" | "thap", { label: string; tone: string }> = {
  cao: { label: "Rủi ro cao", tone: "bg-red-50 text-red-700 border-red-200" },
  trung_binh: { label: "Rủi ro trung bình", tone: "bg-orange-50 text-orange-800 border-orange-200" },
  thap: { label: "Rủi ro thấp", tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

export const DISCLAIMER_FALLBACK =
  "Legal AI không lưu trữ văn bản pháp luật, án lệ, bản án; nội dung được tìm trực tiếp trên các trang chính thống và do AI trích lục, chỉ mang tính tham khảo. Hãy mở nguồn gốc để đối chiếu nguyên văn và tình trạng hiệu lực mới nhất.";

// Chỉ cho phép link http(s) — chặn javascript: và các scheme lạ.
export function safeUrl(url: string | null | undefined): string | null {
  return url && /^https?:\/\//i.test(url) ? url : null;
}

export function errorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : "Có lỗi xảy ra, vui lòng thử lại.";
}

function foldVi(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase();
}

function statusTone(status: string): string {
  const f = foldVi(status);
  if (f.includes("het hieu luc") && !f.includes("mot phan"))
    return "bg-red-50 text-red-700 border-red-200";
  if (f.includes("mot phan") || f.includes("chua co hieu luc"))
    return "bg-orange-50 text-orange-800 border-orange-200";
  if (f.includes("con hieu luc")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  return "bg-slate-100 text-slate-600 border-slate-300";
}

export function buildCitation(item: LiveItem): string {
  let text = item.title;
  if (item.number) text += ` (số ${item.number})`;
  if (item.issuer) text += `, ${item.issuer}`;
  if (item.issued_on) text += `, ${item.issued_on}`;
  const src = safeUrl(item.url);
  return src ? `${text}. Nguồn: ${src}` : text;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
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
// Kiểm tra đăng nhập
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

  // Identity ổn định để dùng trong dependency của effect tải dữ liệu.
  const onUnauthorized = useCallback(() => routerRef.current.push("/login"), []);
  return { ok, onUnauthorized };
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

// ---------------------------------------------------------------
// Thẻ kết quả
// ---------------------------------------------------------------
function CopyCitationButton({ text }: { text: string }) {
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

function VerificationNote({ item }: { item: LiveItem }) {
  if (item.verification === "verified") {
    return (
      <p className="mt-3 flex items-start gap-1.5 text-xs text-emerald-700">
        <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
        Đã đối chiếu trích dẫn với trang nguồn.
      </p>
    );
  }
  if (item.verification === "unverified" || item.quote_removed) {
    return (
      <p className="mt-3 flex items-start gap-1.5 text-xs text-amber-700">
        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
        Một phần trích dẫn do AI đưa ra không khớp trang nguồn nên đã được ẩn. Hãy mở nguồn gốc để
        xem nguyên văn.
      </p>
    );
  }
  return (
    <p className="mt-3 flex items-start gap-1.5 text-xs text-[#5B6472]">
      <HelpCircle size={14} className="shrink-0 mt-0.5" />
      Chưa đối chiếu được với trang nguồn (trang cần JavaScript, là file PDF hoặc không tải được).
      Hãy mở nguồn gốc để kiểm tra nguyên văn.
    </p>
  );
}

export function LiveResultCard({ item, group }: { item: LiveItem; group: LiveGroup }) {
  const meta = GROUP_META[group];
  const src = safeUrl(item.url);
  const info = [
    item.number && `Số ${item.number}`,
    item.issuer,
    item.issued_on && `Ban hành ${item.issued_on}`,
    item.effective_on && `Hiệu lực từ ${item.effective_on}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="bg-white border border-[#DCD7C9] rounded-lg p-5">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className={`text-xs px-2 py-0.5 rounded-full border ${meta.badge}`}>
          {meta.label}
        </span>
        {item.status_text ? (
          <span
            className={`text-xs px-2 py-0.5 rounded-full border ${statusTone(item.status_text)}`}
          >
            {item.status_text}
          </span>
        ) : (
          group === "van_ban" && (
            <span
              className="text-xs px-2 py-0.5 rounded-full border bg-slate-100 text-slate-600 border-slate-300"
              title="Trang nguồn không ghi rõ tình trạng hiệu lực; hãy kiểm tra tại nguồn."
            >
              Chưa xác minh tình trạng hiệu lực
            </span>
          )
        )}
        {item.category && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#F3EFE4] text-[#5B6472] border border-[#DCD7C9]">
            {item.category}
          </span>
        )}
        {item.risk_level && (
          <span
            className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${RISK_META[item.risk_level].tone}`}
          >
            <ShieldAlert size={12} />
            {RISK_META[item.risk_level].label}
          </span>
        )}
      </div>

      {src ? (
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-[#1C2333] hover:text-[#9C7A3C] transition"
        >
          {item.title}
        </a>
      ) : (
        <span className="font-semibold text-[#1C2333]">{item.title}</span>
      )}
      {info && <p className="text-sm text-[#5B6472] mt-1">{info}</p>}

      {item.issue && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-red-700 mb-1">
            {group === "danh_gia" ? "Phân tích quy định liên quan" : "Vấn đề pháp lý"}
          </p>
          <p className="text-sm text-[#1C2333] leading-relaxed whitespace-pre-wrap">{item.issue}</p>
        </div>
      )}
      {item.resolution && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-[#9C7A3C] mb-1">
            {group === "danh_gia" ? "Khuyến nghị / biện pháp giảm rủi ro" : "Giải quyết / Phán quyết"}
          </p>
          <p className="text-sm text-[#1C2333] leading-relaxed whitespace-pre-wrap border-l-4 border-[#C6A15C] bg-[#FAF8F3] px-3 py-2">
            {item.resolution}
          </p>
        </div>
      )}
      {item.excerpt && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-[#5B6472] mb-1">{meta.excerptLabel}</p>
          <p className="text-sm text-[#1C2333] leading-relaxed whitespace-pre-wrap border-l-2 border-[#DCD7C9] pl-3">
            {item.excerpt}
          </p>
        </div>
      )}

      {group === "danh_gia" && item.references.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-[#5B6472] mb-1.5">Nguồn tham khảo</p>
          <ul className="space-y-1">
            {item.references.map((ref) => {
              const refUrl = safeUrl(ref.url);
              return (
                <li key={ref.url} className="text-sm">
                  {refUrl ? (
                    <a
                      href={refUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#9C7A3C] hover:underline inline-flex items-center gap-1"
                    >
                      <ExternalLink size={12} className="shrink-0" />
                      {ref.title}
                    </a>
                  ) : (
                    ref.title
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {group === "danh_gia" ? (
        <p className="mt-3 flex items-start gap-1.5 text-xs text-amber-700">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          {item.disclaimer ||
            "Nội dung do AI tổng hợp, chỉ mang tính tham khảo, không thay thế ý kiến tư vấn của luật sư/chuyên gia pháp lý."}
        </p>
      ) : (
        <VerificationNote item={item} />
      )}

      {item.relevance && (
        <p className="mt-2 text-xs italic text-[#8A919C]">Gợi ý của AI: {item.relevance}</p>
      )}

      <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-[#EAE5D8] text-sm">
        {src && (
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[#9C7A3C] hover:underline"
          >
            <ExternalLink size={13} />
            Mở nguồn gốc
          </a>
        )}
        <CopyCitationButton text={buildCitation(item)} />
      </div>
    </article>
  );
}

// ---------------------------------------------------------------
// Khối kết quả của một nhóm nguồn (tải riêng, lỗi riêng, thử lại riêng)
// ---------------------------------------------------------------
type Loaded = {
  nonce: number;
  data: LiveSearchResponse | null;
  error: string | null;
  status: number | null;
};

export function LiveGroupSection({
  group,
  domains,
  query,
  mode,
  requestText,
  onRemaining,
  onUnauthorized,
}: {
  group: LiveGroup;
  domains: string[];
  query: string;
  mode: LiveMode;
  requestText?: string;
  onRemaining: (remaining: number | null) => void;
  onUnauthorized: () => void;
}) {
  const meta = GROUP_META[group];
  const [nonce, setNonce] = useState(0);
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    let cancelled = false;
    searchLegalLive(group, query, mode, requestText)
      .then((data) => {
        if (cancelled) return;
        setLoaded({ nonce, data, error: null, status: null });
        onRemaining(data.remaining_calls);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          onUnauthorized();
          return;
        }
        setLoaded({
          nonce,
          data: null,
          error: errorMessage(err),
          status: err instanceof ApiError ? err.status : null,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [group, query, mode, requestText, nonce, onRemaining, onUnauthorized]);

  const loading = !loaded || loaded.nonce !== nonce;
  const data = !loading ? loaded.data : null;
  const error = !loading ? loaded.error : null;
  const domainText = domains.length ? domains.join(", ") : null;

  return (
    <section aria-label={meta.label} className="mb-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <h2 className="text-base font-semibold text-[#1C2333]">
          {meta.label}
          {data && data.items.length > 0 && (
            <span className="ml-2 text-sm font-normal text-[#5B6472]">
              ({data.items.length} kết quả)
            </span>
          )}
        </h2>
        {domainText && <p className="text-xs text-[#8A919C]">Nguồn: {domainText}</p>}
      </div>

      {loading && (
        <div className="flex items-center gap-2 bg-white border border-[#DCD7C9] rounded-lg px-5 py-4 text-sm text-[#5B6472]">
          <Loader2 size={16} className="animate-spin text-[#9C7A3C]" />
          Đang tìm trên các nguồn chính thống… (có thể mất 10–60 giây)
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-5 py-4 text-sm text-red-700">
          <p>{error}</p>
          {loaded?.status !== 429 && (
            <button
              onClick={() => setNonce((n) => n + 1)}
              className="mt-2 inline-flex items-center gap-1.5 text-red-700 underline"
            >
              <RefreshCw size={13} /> Thử lại
            </button>
          )}
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="bg-white border border-[#DCD7C9] rounded-lg px-5 py-4 text-sm text-[#5B6472]">
          {data.notice ?? "Không tìm thấy nội dung phù hợp trên các nguồn chính thống."}
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="space-y-3">
          {data.items.map((item) => (
            <LiveResultCard key={item.url} item={item} group={group} />
          ))}
        </div>
      )}
    </section>
  );
}

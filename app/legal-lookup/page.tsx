"use client";

/**
 * app/legal-lookup/page.tsx — trang "Tra cứu pháp lý".
 *
 * Bố cục kiểu Google: MỘT ô tìm kiếm duy nhất nhận cả từ khóa lẫn câu hỏi/tình huống
 * (vd "đăng ký bổ sung ngành nghề kinh doanh headhunter cho doanh nghiệp FDI").
 * Lĩnh vực và yêu cầu tra cứu (thủ tục, điều kiện, rủi ro...) được hệ thống tự suy ra
 * từ câu hỏi ở backend; lĩnh vực đã lưu của tài khoản (nếu có) vẫn được dùng làm bối
 * cảnh và chỉnh trong mục "Cá nhân hoá" thu gọn bên dưới.
 *
 * Giữ nguyên mục "Cập nhật VBPL/Án lệ/Bản án". Legal AI không lưu trữ văn bản pháp
 * luật: mỗi lượt tra cứu tìm trực tiếp trên nguồn chính thống.
 */

import { useCallback, useEffect, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { Briefcase, History, Info, Loader2, Search, X } from "lucide-react";
import {
  ApiError,
  LiveGroup,
  LiveInfo,
  LiveMode,
  clearLegalLiveHistory,
  getLegalLiveInfo,
  saveLegalBusinessField,
} from "@/lib/api";
import { DISCLAIMER_FALLBACK, DISPLAY_SECTIONS, PageHeader, useAuthGuard } from "./_components/live";
import LiveOverview from "./_components/overview";
import ContributeBox from "./_components/contribute";

// Backend: "keyword" nhận tối đa 500 ký tự; dài hơn (vd dán cả điều khoản) → "clause".
const KEYWORD_MAX = 500;
const QUERY_MAX = 1500;

interface Submitted {
  id: number;
  q: string;
  mode: LiveMode;
}

function modeFor(text: string): LiveMode {
  return text.length > KEYWORD_MAX ? "clause" : "keyword";
}

export default function LegalLookupPage() {
  const { ok, onUnauthorized } = useAuthGuard();

  const [info, setInfo] = useState<LiveInfo | null>(null);
  const [text, setText] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<Submitted | null>(null);
  const [remaining, setRemaining] = useState<number | null | undefined>(undefined);
  const [businessField, setBusinessField] = useState("");
  const [businessFieldSaved, setBusinessFieldSaved] = useState<string | null>(null);
  const [savingField, setSavingField] = useState(false);

  // Thông tin nguồn tra cứu + số lượt còn lại (không chặn việc tra cứu nếu lỗi).
  useEffect(() => {
    if (!ok) return;
    let cancelled = false;
    getLegalLiveInfo()
      .then((i) => {
        if (cancelled) return;
        setInfo(i);
        setRemaining(i.remaining_calls);
        setBusinessField(i.business_field ?? "");
        setBusinessFieldSaved(i.business_field ?? null);
      })
      .catch((err) => {
        if (!cancelled && err instanceof ApiError && err.status === 401) onUnauthorized();
      });
    return () => {
      cancelled = true;
    };
  }, [ok, onUnauthorized]);

  async function onSaveBusinessField() {
    setSavingField(true);
    try {
      const res = await saveLegalBusinessField(businessField);
      setBusinessFieldSaved(res.business_field);
      setBusinessField(res.business_field ?? "");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) onUnauthorized();
    } finally {
      setSavingField(false);
    }
  }

  async function onDeleteHistory(query?: string) {
    try {
      await clearLegalLiveHistory(query);
      setInfo((prev) =>
        prev
          ? { ...prev, recent_searches: query ? prev.recent_searches.filter((h) => h.query !== query) : [] }
          : prev
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) onUnauthorized();
    }
  }

  // Identity ổn định: LiveOverview dùng trong dependency của effect.
  const onRemaining = useCallback((value: number | null) => setRemaining(value), []);

  function run(raw: string, forcedMode?: LiveMode) {
    const q = raw.replace(/\s+/g, " ").trim();
    if (q.length < 2) {
      setFormError("Vui lòng nhập câu hỏi hoặc từ khóa (ít nhất 2 ký tự).");
      return;
    }
    const mode = forcedMode ?? modeFor(q);
    if (mode === "clause" && q.length < 10) {
      setFormError("Đoạn điều khoản cần tối thiểu 10 ký tự.");
      return;
    }
    setFormError(null);
    setText(q);
    setSubmitted((prev) => ({ id: (prev?.id ?? 0) + 1, q, mode }));
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    run(text);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter = tra cứu (như Google); Shift+Enter = xuống dòng.
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      run(text);
    }
  }

  if (!ok) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F3]">
        <Loader2 className="animate-spin text-[#9C7A3C]" size={28} />
      </div>
    );
  }

  const enabled = info?.enabled !== false;
  const domainsOf = (g: LiveGroup) => info?.groups.find((x) => x.value === g)?.domains ?? [];
  const sectionDomainsOf = (section: (typeof DISPLAY_SECTIONS)[number]) =>
    section.groups.flatMap((g) => domainsOf(g));
  const lowQuota = typeof remaining === "number" && remaining < 5;
  const hasResults = submitted !== null;

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <PageHeader title="Tra cứu pháp lý" backHref="/dashboard" backLabel="Quay lại" />

      <main className={`${hasResults ? "max-w-6xl" : "max-w-3xl"} mx-auto px-6 py-8`}>
        {/* Ô tìm kiếm duy nhất */}
        <form onSubmit={onSubmit} className={hasResults ? "mb-3" : "mt-6 mb-3"}>
          {!hasResults && (
            <p className="text-center text-sm text-[#5B6472] mb-4">
              Nhập từ khóa hoặc mô tả tình huống pháp lý của bạn — Legal AI tìm trực tiếp trên nguồn chính thống.
            </p>
          )}
          <div className="flex items-start gap-2 bg-white border border-[#DCD7C9] rounded-3xl pl-4 pr-2 py-2 shadow-sm focus-within:ring-1 focus-within:ring-[#9C7A3C]">
            <Search size={18} className="text-[#9C7A3C] mt-2.5 shrink-0" />
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
              maxLength={QUERY_MAX}
              rows={text.length > 90 || text.includes("\n") ? 3 : 1}
              placeholder="Từ khóa/tình huống pháp lý cần tìm kiếm"
              aria-label="Tra cứu pháp lý"
              className="flex-1 resize-none bg-transparent px-1 py-2 text-sm leading-relaxed focus:outline-none"
            />
            {text && (
              <button
                type="button"
                onClick={() => setText("")}
                aria-label="Xóa nội dung"
                className="mt-1.5 p-1.5 rounded-full text-[#8A919C] hover:text-[#1C2333]"
              >
                <X size={16} />
              </button>
            )}
            <button
              type="submit"
              disabled={!enabled}
              className="mt-0.5 rounded-full bg-[#16213E] text-white px-5 py-2 text-sm hover:bg-[#1C2333] disabled:opacity-60 transition"
            >
              Tra cứu
            </button>
          </div>
          {formError && <p className="mt-2 text-sm text-red-600">{formError}</p>}
        </form>

        {/* Tra cứu gần đây */}
        <div className="mb-4 space-y-3">
          {!!info?.recent_searches.length && (
            <div>
              <p className="text-xs font-medium text-[#5B6472] flex items-center gap-1 mb-1.5">
                <History size={12} /> Tra cứu gần đây
                <button
                  type="button"
                  onClick={() => onDeleteHistory()}
                  className="ml-2 font-normal text-[#8A919C] underline hover:text-[#9C7A3C]"
                >
                  Xóa lịch sử
                </button>
              </p>
              <div className="flex flex-wrap gap-2">
                {info.recent_searches.map((h) => (
                  <span
                    key={h.query}
                    className="inline-flex items-center rounded-full border border-dashed border-[#DCD7C9] bg-[#FAF8F3] text-xs text-[#5B6472] hover:border-[#9C7A3C]"
                  >
                    <button
                      type="button"
                      disabled={!enabled}
                      onClick={() => run(h.query, h.mode)}
                      className="pl-3 pr-1.5 py-1 disabled:opacity-60"
                    >
                      {h.query.length > 60 ? `${h.query.slice(0, 60)}…` : h.query}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteHistory(h.query)}
                      aria-label="Xóa khỏi lịch sử"
                      className="pr-2 py-1 text-[#8A919C] hover:text-red-600"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Cập nhật VBPL/Án lệ/Bản án — Admin + khách hàng đóng góp nguồn (giữ nguyên) */}
        <ContributeBox />

        {!enabled && (
          <p className="mb-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            Tính năng tra cứu trực tiếp đang tạm tắt. Vui lòng quay lại sau.
          </p>
        )}

        <p className="text-xs text-[#8A919C] mb-6">
          {typeof remaining === "number"
            ? `Còn ${remaining} lượt tra cứu hôm nay (mỗi lần tra cứu dùng 5 lượt). `
            : ""}
          {lowQuota && "Số lượt còn ít: một số phần kết quả có thể không tra cứu được."}
        </p>

        {/* Kết quả dạng Tổng quan + cột nguồn */}
        {submitted && (
          <div key={submitted.id}>
            <p className="text-sm text-[#5B6472] mb-4">
              Kết quả cho:{" "}
              <span className="text-[#1C2333] font-medium">
                “{submitted.q.length > 120 ? `${submitted.q.slice(0, 120)}…` : submitted.q}”
              </span>
            </p>
            <LiveOverview
              query={submitted.q}
              mode={submitted.mode}
              onRemaining={onRemaining}
              onUnauthorized={onUnauthorized}
              onAsk={(f) => run(f, "keyword")}
              disabled={!enabled}
            />
          </div>
        )}

        {/* Cá nhân hoá + nguồn tra cứu (thu gọn để trang gọn như Google) */}
        <div className="mt-6 space-y-3">
          <details className="bg-white border border-[#DCD7C9] rounded-lg px-5 py-3">
            <summary className="cursor-pointer text-sm font-semibold text-[#1C2333] flex items-center gap-1.5 list-none">
              <Briefcase size={16} className="text-[#9C7A3C]" /> Cá nhân hoá: lĩnh vực hoạt động của tôi
              {businessFieldSaved && (
                <span className="font-normal text-[#5B6472]">— {businessFieldSaved}</span>
              )}
            </summary>
            <div className="mt-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={businessField}
                  onChange={(e) => setBusinessField(e.target.value)}
                  maxLength={200}
                  placeholder="Ví dụ: Bất động sản, Thương mại điện tử, Xây dựng…"
                  aria-label="Lĩnh vực hoạt động"
                  className="flex-1 rounded-md border border-[#DCD7C9] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#9C7A3C]"
                />
                <button
                  type="button"
                  onClick={onSaveBusinessField}
                  disabled={savingField || businessField.trim() === (businessFieldSaved ?? "")}
                  className="rounded-md border border-[#DCD7C9] px-4 py-2 text-sm text-[#5B6472] hover:border-[#9C7A3C] disabled:opacity-50"
                >
                  {savingField ? "Đang lưu…" : "Lưu"}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-[#8A919C]">
                Không bắt buộc. Hệ thống tự nhận biết lĩnh vực từ câu hỏi; lĩnh vực đã lưu chỉ dùng làm bối
                cảnh để ưu tiên kết quả phù hợp.
              </p>
            </div>
          </details>

          <details className="bg-white border border-[#DCD7C9] border-l-4 border-l-[#9C7A3C] rounded-lg px-5 py-3 text-sm">
            <summary className="cursor-pointer font-semibold text-[#9C7A3C] flex items-center gap-1.5 list-none">
              <Info size={16} /> Tra cứu trực tiếp trên nguồn chính thống
            </summary>
            <p className="text-[#5B6472] mt-2">
              Legal AI <strong>không lưu trữ</strong> văn bản pháp luật, án lệ và bản án. Mỗi lần tra cứu, hệ
              thống tìm trực tiếp trên các trang chính thống rồi trích lục nội dung liên quan, kèm link nguồn để
              đối chiếu.
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-0.5 text-[#5B6472]">
              {DISPLAY_SECTIONS.map((section) => (
                <li key={section.key}>
                  <strong>{section.label}:</strong>{" "}
                  {sectionDomainsOf(section).length ? sectionDomainsOf(section).join(", ") : section.hint}
                </li>
              ))}
            </ul>
          </details>
        </div>

        <p className="mt-4 text-xs text-[#5B6472] flex gap-1.5">
          <Info size={14} className="shrink-0 mt-0.5" />
          {info?.disclaimer || DISCLAIMER_FALLBACK}
        </p>
      </main>
    </div>
  );
}

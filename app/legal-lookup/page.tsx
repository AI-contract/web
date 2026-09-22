"use client";

/**
 * app/legal-lookup/page.tsx — trang "Tra cứu pháp lý" (trang duy nhất).
 *
 * Người dùng nhập từ khóa (vd "Tranh chấp hợp đồng lao động") hoặc dán một điều
 * khoản hợp đồng; Legal AI tìm TRỰC TIẾP trên các trang chính thống — không lưu
 * trữ văn bản pháp luật, án lệ, bản án — và hiện 3 nhóm kết quả:
 *   1. quy định pháp luật; 2. án lệ (trích nội dung); 3. bản án.
 * Ba nhóm được gọi song song, mỗi nhóm tải/lỗi/thử lại độc lập.
 */

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Briefcase, History, Info, Loader2, Search } from "lucide-react";
import {
  ApiError,
  LiveGroup,
  LiveInfo,
  LiveMode,
  getLegalLiveInfo,
  saveLegalBusinessField,
} from "@/lib/api";
import {
  DISCLAIMER_FALLBACK,
  DISPLAY_SECTIONS,
  LiveGroupSection,
  LiveMergedGroupSection,
  PageHeader,
  useAuthGuard,
} from "./_components/live";

const EXAMPLES = [
  "Tranh chấp hợp đồng lao động",
  "Phạt vi phạm hợp đồng",
  "Đơn phương chấm dứt hợp đồng lao động",
  "Bồi thường thiệt hại ngoài hợp đồng",
];

interface Submitted {
  id: number;
  q: string;
  mode: LiveMode;
  requestText: string;
}

export default function LegalLookupPage() {
  const { ok, onUnauthorized } = useAuthGuard();

  const [info, setInfo] = useState<LiveInfo | null>(null);
  const [mode, setMode] = useState<LiveMode>("keyword");
  const [keyword, setKeyword] = useState("");
  const [clause, setClause] = useState("");
  const [requestText, setRequestText] = useState("");
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

  // Identity ổn định: LiveGroupSection dùng trong dependency của effect.
  const onRemaining = useCallback((value: number | null) => setRemaining(value), []);

  function run(q: string, m: LiveMode) {
    const text = q.trim();
    if (m === "keyword" && text.length < 2) {
      setFormError("Vui lòng nhập từ khóa (ít nhất 2 ký tự).");
      return;
    }
    if (m === "clause" && text.length < 10) {
      setFormError("Vui lòng dán đoạn điều khoản dài hơn (tối thiểu 10 ký tự).");
      return;
    }
    setFormError(null);
    setSubmitted((prev) => ({
      id: (prev?.id ?? 0) + 1,
      q: text,
      mode: m,
      requestText: requestText.trim(),
    }));
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    run(mode === "keyword" ? keyword : clause, mode);
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
  const lowQuota = typeof remaining === "number" && remaining < 3;

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <PageHeader title="Tra cứu pháp lý" backHref="/dashboard" backLabel="Quay lại" />

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Giới thiệu nguồn */}
        <div className="bg-white border border-[#DCD7C9] border-l-4 border-l-[#9C7A3C] rounded-lg px-5 py-4 mb-6 text-sm">
          <p className="font-semibold text-[#9C7A3C] flex items-center gap-1.5 mb-1.5">
            <Info size={16} /> Tra cứu trực tiếp trên nguồn chính thống
          </p>
          <p className="text-[#5B6472]">
            Legal AI <strong>không lưu trữ</strong> văn bản pháp luật, án lệ và bản án. Mỗi lần tra
            cứu, hệ thống tìm trực tiếp trên các trang chính thống rồi trích lục nội dung liên quan
            đến từ khóa của bạn, kèm link nguồn để đối chiếu.
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-0.5 text-[#5B6472]">
            {DISPLAY_SECTIONS.map((section) => (
              <li key={section.key}>
                <strong>{section.label}:</strong>{" "}
                {sectionDomainsOf(section).length ? sectionDomainsOf(section).join(", ") : section.hint}
              </li>
            ))}
          </ul>
        </div>

        {/* Lĩnh vực hoạt động — cá nhân hoá tra cứu */}
        <div className="bg-white border border-[#DCD7C9] rounded-lg px-5 py-4 mb-6">
          <label
            htmlFor="legal-live-business-field"
            className="text-sm font-semibold text-[#1C2333] flex items-center gap-1.5 mb-2"
          >
            <Briefcase size={16} className="text-[#9C7A3C]" /> Lĩnh vực hoạt động
          </label>
          <div className="flex gap-2">
            <input
              id="legal-live-business-field"
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
            Legal AI sẽ ưu tiên kết quả phù hợp với lĩnh vực này khi tra cứu, đặc biệt ở mục “Đánh
            giá pháp lý &amp; rủi ro”.
          </p>
        </div>

        {/* Chế độ */}
        <div className="inline-flex rounded-md border border-[#DCD7C9] bg-white p-1 mb-3">
          {(
            [
              ["keyword", "Từ khóa"],
              ["clause", "Căn cứ cho điều khoản"],
            ] as [LiveMode, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => {
                setMode(value);
                setFormError(null);
              }}
              aria-pressed={mode === value}
              className={`px-4 py-1.5 text-sm rounded transition ${
                mode === value ? "bg-[#16213E] text-white" : "text-[#5B6472] hover:text-[#1C2333]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Ô tìm kiếm */}
        <form
          onSubmit={onSubmit}
          className="bg-white border border-[#DCD7C9] rounded-lg p-5 mb-3 space-y-3"
        >
          {mode === "keyword" ? (
            <>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9C7A3C]"
                  />
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    maxLength={200}
                    placeholder="Ví dụ: Tranh chấp hợp đồng lao động"
                    aria-label="Từ khóa"
                    className="w-full rounded-md border border-[#DCD7C9] pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#9C7A3C]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!enabled}
                  className="rounded-md bg-[#16213E] text-white px-5 py-2 text-sm hover:bg-[#1C2333] disabled:opacity-60 transition"
                >
                  Tra cứu
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    disabled={!enabled}
                    onClick={() => {
                      setKeyword(ex);
                      run(ex, "keyword");
                    }}
                    className="text-xs px-3 py-1 rounded-full border border-[#DCD7C9] bg-white text-[#5B6472] hover:border-[#9C7A3C] disabled:opacity-60"
                  >
                    {ex}
                  </button>
                ))}
              </div>

              {!!info?.recent_searches.length && (
                <div>
                  <p className="text-xs font-medium text-[#5B6472] flex items-center gap-1 mb-1.5">
                    <History size={12} /> Tra cứu gần đây
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {info.recent_searches.map((h) => (
                      <button
                        key={h.query}
                        type="button"
                        disabled={!enabled}
                        onClick={() => {
                          if (h.mode === "keyword") {
                            setMode("keyword");
                            setKeyword(h.query);
                            run(h.query, "keyword");
                          } else {
                            setMode("clause");
                            setClause(h.query);
                            run(h.query, "clause");
                          }
                        }}
                        className="text-xs px-3 py-1 rounded-full border border-dashed border-[#DCD7C9] bg-[#FAF8F3] text-[#5B6472] hover:border-[#9C7A3C] disabled:opacity-60"
                      >
                        {h.query.length > 60 ? `${h.query.slice(0, 60)}…` : h.query}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="legal-live-request"
                  className="block text-xs font-medium text-[#5B6472] mb-1"
                >
                  Yêu cầu tra cứu <span className="font-normal text-[#8A919C]">(tuỳ chọn)</span>
                </label>
                <input
                  id="legal-live-request"
                  type="text"
                  value={requestText}
                  onChange={(e) => setRequestText(e.target.value)}
                  maxLength={500}
                  placeholder="Ví dụ: Trình tự thủ tục cần thực hiện; Biện pháp giúp hạn chế rủi ro pháp lý…"
                  aria-label="Yêu cầu tra cứu"
                  className="w-full rounded-md border border-[#DCD7C9] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#9C7A3C]"
                />
                <p className="mt-1 text-xs text-[#8A919C]">
                  Nêu rõ bạn cần gì để mục “Đánh giá pháp lý &amp; rủi ro” trả lời đúng trọng tâm hơn.
                </p>
              </div>
            </>
          ) : (
            <>
              <textarea
                value={clause}
                onChange={(e) => setClause(e.target.value)}
                maxLength={1500}
                rows={5}
                placeholder="Dán nội dung điều khoản hợp đồng cần tìm căn cứ pháp lý..."
                aria-label="Nội dung điều khoản"
                className="w-full rounded-md border border-[#DCD7C9] px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#9C7A3C]"
              />
              <button
                type="submit"
                disabled={!enabled}
                className="rounded-md bg-[#16213E] text-white px-5 py-2 text-sm hover:bg-[#1C2333] disabled:opacity-60 transition"
              >
                Tìm căn cứ
              </button>
            </>
          )}
          {formError && <p className="text-sm text-red-600">{formError}</p>}
        </form>

        {!enabled && (
          <p className="mb-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            Tính năng tra cứu trực tiếp đang tạm tắt. Vui lòng quay lại sau.
          </p>
        )}

        <p className="text-xs text-[#8A919C] mb-6">
          {typeof remaining === "number"
            ? `Còn ${remaining} lượt tra cứu hôm nay (mỗi lần tra cứu dùng 4 lượt). `
            : ""}
          {lowQuota && "Số lượt còn ít: một số nhóm kết quả có thể không tra cứu được."}
        </p>

        {/* Kết quả: 3 nhóm, gọi song song */}
        {submitted && (
          <div key={submitted.id}>
            <p className="text-sm text-[#5B6472] mb-4">
              Kết quả cho:{" "}
              <span className="text-[#1C2333] font-medium">
                “{submitted.q.length > 120 ? `${submitted.q.slice(0, 120)}…` : submitted.q}”
              </span>
            </p>
            {DISPLAY_SECTIONS.map((section) =>
              section.groups.length === 1 ? (
                <LiveGroupSection
                  key={section.key}
                  group={section.groups[0]}
                  domains={sectionDomainsOf(section)}
                  query={submitted.q}
                  mode={submitted.mode}
                  requestText={submitted.requestText}
                  onRemaining={onRemaining}
                  onUnauthorized={onUnauthorized}
                />
              ) : (
                <LiveMergedGroupSection
                  key={section.key}
                  groups={section.groups}
                  label={section.label}
                  domains={sectionDomainsOf(section)}
                  query={submitted.q}
                  mode={submitted.mode}
                  requestText={submitted.requestText}
                  onRemaining={onRemaining}
                  onUnauthorized={onUnauthorized}
                />
              )
            )}
          </div>
        )}

        <p className="mt-2 text-xs text-[#5B6472] flex gap-1.5">
          <Info size={14} className="shrink-0 mt-0.5" />
          {info?.disclaimer || DISCLAIMER_FALLBACK}
        </p>
      </main>
    </div>
  );
}

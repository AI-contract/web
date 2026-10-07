"use client";

/**
 * app/legal-lookup/_components/overview.tsx
 *
 * Kết quả tra cứu dạng "Tổng quan" (giống AI Overview của Google):
 *   1. Tổng quan: kết luận nhanh + câu hỏi gợi ý (từ nhóm "danh_gia").
 *   2. Các mục chi tiết: Kết quả tổng hợp (theo tiêu đề vấn đề), Quy định pháp luật,
 *      Án lệ/Bản án.
 *   3. Cột "Nguồn" (bên phải trên màn hình rộng, bên dưới trên điện thoại): tất cả
 *      trang nguồn của cả 4 nhóm, kèm trạng thái đối chiếu.
 *
 * Chỉ gọi 2 API song song theo mặc định (Tổng quan/Phân tích + Căn cứ pháp lý) để tiết
 * kiệm chi phí; Án lệ/Bản án (2 lượt) và Văn phòng luật (1 lượt) chỉ chạy khi người
 * dùng bấm. Mỗi nhóm tải/lỗi/thử lại độc lập. Nội dung là text thuần, React tự escape.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, ExternalLink, HelpCircle, Loader2, RefreshCw, Search, Sparkles } from "lucide-react";
import {
  ApiError,
  LiveGroup,
  LiveItem,
  LiveMode,
  LiveSearchResponse,
  LiveSourceTier,
  searchLegalLive,
} from "@/lib/api";
import { LiveResultCard, TIER_META, errorMessage, safeUrl } from "./live";
import { detectQueryLang, resultLabelLang } from "@/lib/queryLang";
import { useLang } from "@/lib/lang";
import { LL, type LLText } from "./i18n";

type GroupState = {
  nonce: number;
  data: LiveSearchResponse | null;
  error: string | null;
  status: number | null;
};

const ALL_GROUPS: LiveGroup[] = ["van_ban", "an_le", "ban_an", "danh_gia"];
// Nhóm chạy ngay khi tra cứu (2 lượt). Án lệ/Bản án chỉ chạy khi người dùng bấm.
const DEFAULT_GROUPS: LiveGroup[] = ["danh_gia", "van_ban"];

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

interface SourceCard {
  url: string;
  title: string;
  group: LiveGroup;
  tier: LiveSourceTier | null;
  note: { text: string; tone: "ok" | "warn" | "neutral" };
}

function sourceNote(item: LiveItem, group: LiveGroup, L: LLText): SourceCard["note"] {
  if (group === "danh_gia") return { text: L.noteRefs, tone: "neutral" };
  if (group === "luat_su") {
    return item.verification === "unverified"
      ? { text: L.noteHidden, tone: "warn" }
      : { text: L.notePoster, tone: "neutral" };
  }
  if (item.verification === "verified") return { text: L.noteVerified, tone: "ok" };
  if (item.verification === "unverified") return { text: L.noteHidden, tone: "warn" };
  return { text: L.noteUnchecked, tone: "neutral" };
}

export default function LiveOverview({
  query,
  mode,
  requestText,
  onRemaining,
  onUnauthorized,
  onAsk,
  disabled,
}: {
  query: string;
  mode: LiveMode;
  requestText?: string;
  onRemaining: (remaining: number | null) => void;
  onUnauthorized: () => void;
  onAsk: (followup: string) => void;
  disabled?: boolean;
}) {
  const [nonce, setNonce] = useState(0);
  const [state, setState] = useState<Partial<Record<LiveGroup, GroupState>>>({});
  // Các nhóm đã được yêu cầu tải (mặc định 2 nhóm; bấm nút để thêm). Component được tạo
  // lại cho mỗi lần tra cứu mới (key ở page.tsx) nên tự về mặc định.
  const [requested, setRequested] = useState<Set<LiveGroup>>(() => new Set(DEFAULT_GROUPS));
  const nonceRef = useRef(nonce);
  nonceRef.current = nonce;
  const startedRef = useRef<Set<string>>(new Set());
  // queryLang (vi/en): gửi backend để phần do AI viết cùng ngôn ngữ câu hỏi.
  // lang: ngôn ngữ nhãn hiển thị — câu hỏi tiếng Anh thì tiếng Anh, còn lại theo ngôn ngữ giao diện
  // đang chọn ở cột menu bên trái (trích dẫn nguyên văn vẫn là tiếng Việt).
  const [uiLang] = useLang();
  const queryLang = useMemo(() => detectQueryLang(query), [query]);
  const lang = resultLabelLang(query, uiLang);
  const L = LL[lang];

  const load = useCallback(
    (g: LiveGroup) => {
      const key = `${nonce}:${g}`;
      if (startedRef.current.has(key)) return;
      startedRef.current.add(key);
      searchLegalLive(g, query, mode, requestText, queryLang)
        .then((data) => {
          if (nonceRef.current !== nonce) return;
          setState((prev) => ({ ...prev, [g]: { nonce, data, error: null, status: null } }));
          onRemaining(data.remaining_calls);
        })
        .catch((err) => {
          if (nonceRef.current !== nonce) return;
          if (err instanceof ApiError && err.status === 401) {
            onUnauthorized();
            return;
          }
          setState((prev) => ({
            ...prev,
            [g]: {
              nonce,
              data: null,
              error: errorMessage(err),
              status: err instanceof ApiError ? err.status : null,
            },
          }));
        });
    },
    [query, mode, requestText, queryLang, nonce, onRemaining, onUnauthorized]
  );

  useEffect(() => {
    requested.forEach((g) => load(g));
  }, [requested, load]);

  const requestGroups = (groups: LiveGroup[]) =>
    setRequested((prev) => new Set([...prev, ...groups]));

  const current = (g: LiveGroup): GroupState | null => {
    const s = state[g];
    return s && s.nonce === nonce ? s : null;
  };
  const loadingOf = (g: LiveGroup) => requested.has(g) && current(g) === null;
  const itemsOf = (g: LiveGroup): LiveItem[] => current(g)?.data?.items ?? [];
  const errorOf = (g: LiveGroup) => current(g)?.error ?? null;

  // Dẫn chiếu đúng văn bản: số hiệu AI nêu trong phần tổng hợp → link tới kết quả
  // "Quy định pháp luật" có CÙNG số hiệu chuẩn hoá (nếu có).
  const docLinks = useMemo(() => {
    const map = new Map<string, string>();
    for (const it of state.van_ban && state.van_ban.nonce === nonce ? state.van_ban.data?.items ?? [] : []) {
      if (it.number_key && safeUrl(it.url) && !map.has(it.number_key)) map.set(it.number_key, it.url);
    }
    return map;
  }, [state.van_ban, nonce]);
  const resolveDoc = useCallback((key: string) => docLinks.get(key) ?? null, [docLinks]);

  const assessment = current("danh_gia")?.data ?? null;
  const overview = assessment?.overview ?? null;
  const followups = assessment?.followups ?? [];

  const sources = useMemo<SourceCard[]>(() => {
    const out: SourceCard[] = [];
    const seen = new Set<string>();
    const push = (
      url: string,
      title: string,
      group: LiveGroup,
      note: SourceCard["note"],
      tier: LiveSourceTier | null | undefined
    ) => {
      if (!safeUrl(url) || seen.has(url)) return;
      seen.add(url);
      out.push({ url, title, group, note, tier: tier ?? null });
    };
    (["van_ban", "an_le", "ban_an"] as LiveGroup[]).forEach((g) => {
      const s = state[g];
      if (!s || s.nonce !== nonce) return;
      (s.data?.items ?? []).forEach((it) => push(it.url, it.title, g, sourceNote(it, g, L), it.source_tier));
    });
    const dg = state.danh_gia;
    if (dg && dg.nonce === nonce) {
      (dg.data?.items ?? []).forEach((it) => {
        push(it.url, it.title, "danh_gia", sourceNote(it, "danh_gia", L), it.source_tier);
        it.references.forEach((r) =>
          push(r.url, r.title, "danh_gia", sourceNote(it, "danh_gia", L), r.source_tier ?? it.source_tier)
        );
      });
    }
    return out;
  }, [state, nonce, L]);

  const activeGroups = ALL_GROUPS.filter((g) => requested.has(g));
  const anyError = activeGroups.map(errorOf).filter(Boolean) as string[];
  const canRetry = activeGroups.some((g) => {
    const s = current(g);
    return !!s?.error && s.status !== 429;
  });
  const allLoaded = activeGroups.every((g) => !loadingOf(g));
  // Ẩn mục "Tổng quan" khi đã tải xong mà chưa có kết luận nhanh.
  const showOverview = loadingOf("danh_gia") || !!overview;
  // Không mục nào có kết quả (và không có lỗi để báo) thì hiện một thông báo chung.
  const hasAnyContent = !!overview || ALL_GROUPS.some((g) => itemsOf(g).length > 0);
  const emptyNotice =
    allLoaded && !hasAnyContent && anyError.length === 0
      ? (activeGroups.map((g) => current(g)?.data?.notice).find(Boolean) ?? L.noResults)
      : null;

  function renderLoading(label: string) {
    return (
      <div className="flex items-center gap-2 bg-white border border-[#DCD7C9] rounded-lg px-5 py-4 text-sm text-[#5B6472]">
        <Loader2 size={16} className="animate-spin text-[#9C7A3C]" />
        {label}
      </div>
    );
  }

  function renderSection(group: LiveGroup | LiveGroup[], title: string, hint?: string, cta?: string) {
    const groups = Array.isArray(group) ? group : [group];
    if (groups.every((g) => !requested.has(g))) {
      // Nhóm chưa tải: chỉ hiện nút, bấm mới gọi.
      return (
        <section aria-label={title} className="mb-8">
          <h2 className="text-base font-semibold text-[#1C2333] mb-1">{title}</h2>
          {hint && <p className="text-xs text-[#8A919C] mb-3">{hint}</p>}
          <button
            type="button"
            disabled={disabled}
            onClick={() => requestGroups(groups)}
            className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-[#DCD7C9] bg-white text-[#1C2333] hover:border-[#9C7A3C] disabled:opacity-60"
          >
            <Search size={14} className="text-[#9C7A3C]" />
            {cta ?? L.findLabel(title)}
          </button>
        </section>
      );
    }
    const loading = groups.some(loadingOf);
    const entries = groups.flatMap((g) => itemsOf(g).map((item) => ({ item, g })));
    if (!loading && entries.length === 0) {
      // Mục không có kết quả thì ẩn. Riêng mục do người dùng tự bấm tải (có cta) thì
      // báo ngắn gọn để họ biết đã tìm mà không có (trừ khi đã có lỗi — lỗi hiện ở khối báo lỗi).
      if (cta && !groups.some((g) => errorOf(g))) {
        return (
          <p className="mb-8 text-sm text-[#5B6472]">
            {groups.map((g) => current(g)?.data?.notice).find(Boolean) ?? L.noneFound(title)}
          </p>
        );
      }
      return null;
    }
    return (
      <section aria-label={title} className="mb-8">
        <h2 className="text-base font-semibold text-[#1C2333] mb-1">
          {title}
          {!loading && entries.length > 0 && (
            <span className="ml-2 text-sm font-normal text-[#5B6472]">({entries.length})</span>
          )}
        </h2>
        {hint && <p className="text-xs text-[#8A919C] mb-3">{hint}</p>}
        {loading ? (
          renderLoading(L.searching)
        ) : entries.length === 0 ? (
          <div className="bg-white border border-[#DCD7C9] rounded-lg px-5 py-4 text-sm text-[#5B6472]">
            {groups.map((g) => current(g)?.data?.notice).find(Boolean) ?? L.noResults}
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map(({ item, g }) => (
              <LiveResultCard key={`${g}-${item.url}`} item={item} group={g} resolveDoc={resolveDoc} lang={lang} />
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8">
      <div>
        {/* Tổng quan: chỉ hiện khi đang tải hoặc đã có kết luận nhanh */}
        {showOverview && (
        <section aria-label={L.overviewTitle} className="mb-8">
          <div className="bg-white border border-[#DCD7C9] border-l-4 border-l-[#9C7A3C] rounded-lg px-5 py-4">
            <p className="text-sm font-semibold text-[#9C7A3C] flex items-center gap-1.5 mb-2">
              <Sparkles size={15} /> {L.overviewTitle}
            </p>
            {loadingOf("danh_gia") ? (
              <p className="flex items-center gap-2 text-sm text-[#5B6472]">
                <Loader2 size={16} className="animate-spin text-[#9C7A3C]" />
                {L.synthesizing}
              </p>
            ) : overview ? (
              <>
                <p className="text-sm text-[#1C2333] leading-relaxed whitespace-pre-wrap">{overview}</p>
                <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-700">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  {L.aiOverviewNote}
                </p>
              </>
            ) : (
              <p className="text-sm text-[#5B6472]">{L.noOverview}</p>
            )}
            {followups.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[#EAE5D8]">
                <p className="text-xs font-medium text-[#5B6472] mb-1.5">{L.followups}</p>
                <div className="flex flex-wrap gap-2">
                  {followups.map((f) => (
                    <button
                      key={f}
                      type="button"
                      disabled={disabled}
                      onClick={() => onAsk(f)}
                      className="text-xs px-3 py-1 rounded-full border border-[#DCD7C9] bg-[#FAF8F3] text-[#5B6472] hover:border-[#9C7A3C] disabled:opacity-60"
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
        )}

        {emptyNotice && (
          <div className="bg-white border border-[#DCD7C9] rounded-lg px-5 py-4 text-sm text-[#5B6472] mb-6">
            {emptyNotice}
          </div>
        )}

        {allLoaded && anyError.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-5 py-4 text-sm text-red-700 mb-6">
            {activeGroups.filter((g) => errorOf(g)).map((g) => (
              <p key={g}>
                {L.groups[g].label}: {errorOf(g)}
              </p>
            ))}
            {canRetry && (
              <button
                onClick={() => setNonce((n) => n + 1)}
                className="mt-2 inline-flex items-center gap-1.5 text-red-700 underline"
              >
                <RefreshCw size={13} /> {L.retry}
              </button>
            )}
          </div>
        )}

        {renderSection("danh_gia", L.detailTitle, L.groups.danh_gia.hint)}
        {renderSection("van_ban", L.legalBasisTitle, L.groups.van_ban.hint)}
        {renderSection(
          ["an_le", "ban_an"],
          L.sectionAnLeBanAn,
          `${L.groups.an_le.hint}; ${L.groups.ban_an.hint}`,
          L.ctaPrecedents
        )}
      </div>

      {/* Cột nguồn */}
      <aside aria-label={L.sourcesTitle} className="mb-8 lg:mb-0">
        <div className="lg:sticky lg:top-4">
          <h2 className="text-base font-semibold text-[#1C2333] mb-3">
            {L.sourcesTitle}
            {sources.length > 0 && <span className="ml-2 text-sm font-normal text-[#5B6472]">({sources.length})</span>}
          </h2>
          {sources.length === 0 ? (
            <p className="text-sm text-[#8A919C]">{allLoaded ? L.sourcesNone : L.sourcesPending}</p>
          ) : (
            <ul className="space-y-2">
              {sources.map((s, i) => (
                <li key={s.url}>
                  <a
                    href={safeUrl(s.url) ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-white border border-[#DCD7C9] rounded-lg px-3 py-2.5 hover:border-[#9C7A3C] transition"
                  >
                    <p className="text-xs text-[#8A919C] flex items-center gap-1">
                      <span className="font-medium text-[#5B6472]">{i + 1}.</span> {hostOf(s.url)}
                      <ExternalLink size={11} className="ml-auto shrink-0" />
                    </p>
                    <p className="text-sm font-medium text-[#1C2333] leading-snug mt-0.5 line-clamp-2">{s.title}</p>
                    {s.tier && (
                      <span
                        title={L.tiers[s.tier].note}
                        className={`inline-block mt-1 text-[11px] px-1.5 py-0.5 rounded-full border ${TIER_META[s.tier].tone}`}
                      >
                        {L.tiers[s.tier].label}
                      </span>
                    )}
                    <p
                      className={`mt-1 text-xs flex items-center gap-1 ${
                        s.note.tone === "ok"
                          ? "text-emerald-700"
                          : s.note.tone === "warn"
                            ? "text-amber-700"
                            : "text-[#8A919C]"
                      }`}
                    >
                      {s.note.tone === "ok" ? (
                        <CheckCircle2 size={12} />
                      ) : s.note.tone === "warn" ? (
                        <AlertTriangle size={12} />
                      ) : (
                        <HelpCircle size={12} />
                      )}
                      {L.groups[s.group].label} · {s.note.text}
                    </p>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}

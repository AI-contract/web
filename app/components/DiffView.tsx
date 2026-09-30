"use client";

/**
 * app/components/DiffView.tsx
 *
 * So sánh hợp đồng gốc (extracted_text) với bản đã chỉnh sửa
 * (revised_contract_text).
 *
 * Khác bản cũ (diff một lần trên toàn văn bản, dễ lệch vị trí khi bản gốc
 * là chữ trích từ PDF còn bản AI đã được dàn lại): bản này TÁCH cả hai
 * văn bản thành từng ĐIỀU rồi ghép theo SỐ ĐIỀU, sau đó mới so sánh từng
 * từ bên trong từng Điều. Nhờ vậy nội dung không bị "trôi" sang Điều khác.
 *
 * - Phần đầu (số hợp đồng, căn cứ, thông tin các bên): so riêng, đã bỏ
 *   quốc hiệu/tiêu ngữ/tên hợp đồng vì hai bản định dạng các dòng này khác nhau.
 * - Phần ký tên và dòng "(Điều khoản kết thúc ở đây)" bị bỏ khỏi so sánh.
 * - Điều chỉ có ở bản đã sửa: hiện toàn bộ là "thêm". Điều chỉ có ở bản
 *   gốc: hiện toàn bộ là "xoá".
 * - Không tách được Điều nào (vd hợp đồng không đánh số Điều): quay về
 *   so sánh toàn văn như bản cũ.
 */

import { diffWords } from "diff";
import { useMemo } from "react";

type Lang = "vi" | "en" | "zh" | "ko" | "ja";

const LEGEND_TEXT: Record<
  Lang,
  { removed: string; added: string; newArticle: string; removedArticle: string }
> = {
  vi: {
    removed: "Đã xoá",
    added: "Đã thêm/sửa",
    newArticle: "Điều mới được thêm",
    removedArticle: "Điều không còn trong bản chỉnh sửa",
  },
  en: {
    removed: "Removed",
    added: "Added/changed",
    newArticle: "Newly added article",
    removedArticle: "Article not in the revised version",
  },
  zh: {
    removed: "已删除",
    added: "已添加/修改",
    newArticle: "新增条款",
    removedArticle: "修订版中已不存在的条款",
  },
  ko: {
    removed: "삭제됨",
    added: "추가/변경됨",
    newArticle: "새로 추가된 조항",
    removedArticle: "수정본에 없는 조항",
  },
  ja: {
    removed: "削除済み",
    added: "追加・変更済み",
    newArticle: "新規追加条項",
    removedArticle: "修正版にない条項",
  },
};

interface DiffViewProps {
  originalText: string;
  revisedText: string;
  lang: Lang;
}

// ---------------------------------------------------------------
// Tách văn bản
// ---------------------------------------------------------------

const ARTICLE_RE = /^\s*\**\s*ĐIỀU\s+(\d+)(?!\d)/i;
const END_MARK_RE =
  /^\s*\**\s*[(\[]?\s*Điều khoản kết thúc ở đây\s*[)\]]?\s*\.?\s*\**\s*$/i;
const TITLE_PREFIXES = ["HỢP ĐỒNG", "THỎA THUẬN", "BIÊN BẢN", "VĂN BẢN", "GIẤY"];

function plain(line: string): string {
  return line.replace(/[*_#]/g, "").trim();
}

function isTitleLine(line: string): boolean {
  const s = plain(line);
  return (
    s.length > 0 &&
    s.length <= 150 &&
    s === s.toUpperCase() &&
    TITLE_PREFIXES.some((p) => s.startsWith(p))
  );
}

// Cắt phần ký tên ở cuối (nếu có) khỏi danh sách dòng.
function stripSignature(lines: string[]): string[] {
  const idx = lines.findIndex((l) =>
    l.toLowerCase().includes("(ký, ghi rõ họ tên)")
  );
  if (idx === -1) return lines;

  let cut = idx;
  if (cut > 0 && lines[cut - 1].toLowerCase().includes("đại diện")) cut -= 1;
  while (cut > 0 && !lines[cut - 1].trim()) cut -= 1;

  return lines.slice(0, cut);
}

// Bỏ quốc hiệu/tiêu ngữ/gạch ngang/tên hợp đồng khỏi phần đầu để không
// tạo khác biệt giả giữa chữ trích từ file gốc và bản đã dàn lại.
function normalizeHeader(lines: string[]): string {
  return lines
    .filter((line) => {
      const s = plain(line);
      const low = s.toLowerCase();
      if (!s) return false;
      if (/^[-–—_=.\s]+$/.test(s)) return false;
      if (low.includes("cộng hòa xã hội chủ nghĩa việt nam")) return false;
      if (low.startsWith("độc lập") && low.includes("hạnh phúc")) return false;
      if (isTitleLine(line)) return false;
      return true;
    })
    .join("\n")
    .trim();
}

interface Article {
  key: string; // "<số điều>#<lần xuất hiện thứ mấy>"
  text: string;
}

interface Parsed {
  header: string;
  articles: Article[];
}

function parse(text: string): Parsed {
  const lines = stripSignature(
    (text || "").split(/\r?\n/).filter((l) => !END_MARK_RE.test(l))
  );

  const headerLines: string[] = [];
  const raw: { number: string; lines: string[] }[] = [];
  let current: { number: string; lines: string[] } | null = null;

  for (const line of lines) {
    const m = line.match(ARTICLE_RE);
    if (m) {
      current = { number: m[1], lines: [line] };
      raw.push(current);
    } else if (current) {
      current.lines.push(line);
    } else {
      headerLines.push(line);
    }
  }

  const seen: Record<string, number> = {};
  const articles = raw.map((a) => {
    seen[a.number] = (seen[a.number] ?? 0) + 1;
    return {
      key: `${a.number}#${seen[a.number]}`,
      text: a.lines.join("\n").trim(),
    };
  });

  return { header: normalizeHeader(headerLines), articles };
}

// ---------------------------------------------------------------
// Hiển thị
// ---------------------------------------------------------------

function DiffSpans({ a, b }: { a: string; b: string }) {
  const parts = useMemo(() => diffWords(a || "", b || "", { ignoreCase: true }), [a, b]);

  return (
    <>
      {parts.map((part, i) => {
        if (part.removed) {
          return (
            <span
              key={i}
              className="bg-red-100 text-red-800 line-through decoration-red-400"
            >
              {part.value}
            </span>
          );
        }
        if (part.added) {
          return (
            <span
              key={i}
              className="bg-emerald-100 text-emerald-800 underline decoration-emerald-400"
            >
              {part.value}
            </span>
          );
        }
        return <span key={i}>{part.value}</span>;
      })}
    </>
  );
}

export default function DiffView({
  originalText,
  revisedText,
  lang,
}: DiffViewProps) {
  const legend = LEGEND_TEXT[lang];

  const { orig, rev, rows } = useMemo(() => {
    const orig = parse(originalText);
    const rev = parse(revisedText);

    const origMap = new Map(orig.articles.map((a) => [a.key, a]));
    const revKeys = new Set(rev.articles.map((a) => a.key));

    type Row =
      | { kind: "same"; key: string; a: string; b: string }
      | { kind: "added"; key: string; b: string }
      | { kind: "removed"; key: string; a: string };

    const rows: Row[] = rev.articles.map((r) => {
      const o = origMap.get(r.key);
      return o
        ? { kind: "same", key: r.key, a: o.text, b: r.text }
        : { kind: "added", key: r.key, b: r.text };
    });

    for (const o of orig.articles) {
      if (!revKeys.has(o.key)) {
        rows.push({ kind: "removed", key: o.key, a: o.text });
      }
    }

    return { orig, rev, rows };
  }, [originalText, revisedText]);

  // Không tách được Điều nào ở một trong hai bản -> so sánh toàn văn.
  const useFullTextFallback =
    orig.articles.length === 0 || rev.articles.length === 0;

  const box =
    "bg-[#FAF8F3] rounded-md border border-[#DCD7C9] p-4 text-sm whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 mb-3 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-red-100 border border-red-300" />
          <span className="text-[#5B6472]">{legend.removed}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-300" />
          <span className="text-[#5B6472]">{legend.added}</span>
        </span>
      </div>

      <div className={box}>
        {useFullTextFallback ? (
          <DiffSpans a={originalText || ""} b={revisedText || ""} />
        ) : (
          <>
            {(orig.header || rev.header) && (
              <div className="mb-4">
                <DiffSpans a={orig.header} b={rev.header} />
              </div>
            )}

            {rows.map((row) => (
              <div key={`${row.kind}-${row.key}`} className="mb-4">
                {row.kind === "same" && <DiffSpans a={row.a} b={row.b} />}

                {row.kind === "added" && (
                  <>
                    <div className="text-xs text-emerald-700 mb-1">
                      {legend.newArticle}
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 underline decoration-emerald-400">
                      {row.b}
                    </span>
                  </>
                )}

                {row.kind === "removed" && (
                  <>
                    <div className="text-xs text-red-700 mb-1">
                      {legend.removedArticle}
                    </div>
                    <span className="bg-red-100 text-red-800 line-through decoration-red-400">
                      {row.a}
                    </span>
                  </>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

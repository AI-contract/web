"use client";

/**
 * app/components/DiffView.tsx
 *
 * So sánh văn bản hợp đồng gốc (extracted_text) với bản đã chỉnh sửa
 * (revised_contract_text) theo từng từ, tô màu phần bị xoá (đỏ, gạch
 * ngang) và phần được thêm (xanh, gạch chân).
 *
 * LƯU Ý: đây là diff theo VĂN BẢN THUẦN, không phải diff theo NGỮ
 * NGHĨA — nếu AI viết lại toàn bộ cấu trúc một đoạn (ví dụ phần
 * thông tin các bên), diff có thể hiện ra rối vì thứ tự câu/chữ thay
 * đổi nhiều. Vẫn hữu ích để thấy nhanh những chỗ đổi số liệu, ngày
 * tháng, điều khoản cụ thể — vốn là phần người dùng quan tâm nhất.
 */

import { diffWords } from "diff";
import { useMemo } from "react";

type Lang = "vi" | "en" | "zh" | "ko" | "ja";

const LEGEND_TEXT: Record<Lang, { removed: string; added: string }> = {
  vi: { removed: "Đã xoá", added: "Đã thêm/sửa" },
  en: { removed: "Removed", added: "Added/changed" },
  zh: { removed: "已删除", added: "已添加/修改" },
  ko: { removed: "삭제됨", added: "추가/변경됨" },
  ja: { removed: "削除済み", added: "追加・変更済み" },
};

interface DiffViewProps {
  originalText: string;
  revisedText: string;
  lang: Lang;
}

export default function DiffView({
  originalText,
  revisedText,
  lang,
}: DiffViewProps) {
  // diffWords có thể tốn CPU với văn bản dài (hợp đồng vài nghìn từ) -
  // chỉ tính lại khi 2 input thực sự đổi, không tính lại mỗi lần re-render.
  const parts = useMemo(
    () => diffWords(originalText || "", revisedText || ""),
    [originalText, revisedText]
  );

  const legend = LEGEND_TEXT[lang];

  return (
    <div>
      <div className="flex items-center gap-4 mb-3 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-red-100 border border-red-300" />
          <span className="text-[#5B6472]">{legend.removed}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-300" />
          <span className="text-[#5B6472]">{legend.added}</span>
        </span>
      </div>

      <div className="bg-[#FAF8F3] rounded-md border border-[#DCD7C9] p-4 text-sm whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed">
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
      </div>
    </div>
  );
}

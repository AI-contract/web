"use client";

import { Languages } from "lucide-react";
import { useLang, type Lang } from "@/lib/lang";

const OPTIONS: { value: Lang; label: string }[] = [
  { value: "vi", label: "VI" },
  { value: "en", label: "EN" },
  { value: "zh", label: "中文" },
  { value: "ko", label: "한국어" },
  { value: "ja", label: "日本語" },
];

// Bộ chọn ngôn ngữ giao diện dùng chung cho các trang phụ (thanh tiêu đề
// màu xanh navy). Lựa chọn được lưu ở localStorage (xem lib/lang.ts) nên
// đồng bộ với dashboard.
export default function LangSwitcher() {
  const [lang, setLang] = useLang();
  return (
    <div className="ml-auto flex items-center gap-1">
      <Languages size={14} className="text-slate-400 mr-1" />
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setLang(opt.value)}
          className={`text-xs px-2 py-1 rounded-md border transition ${
            lang === opt.value
              ? "bg-[#9C7A3C] border-[#9C7A3C] text-white"
              : "border-white/20 text-slate-300 hover:text-white hover:border-white/40"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

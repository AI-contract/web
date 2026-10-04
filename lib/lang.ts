import { useSyncExternalStore } from "react";

// Ngôn ngữ giao diện dùng chung cho dashboard và các trang khác
// (menu/nhãn/nút bấm). Nội dung hợp đồng luôn bằng tiếng Việt.
export type Lang = "vi" | "en" | "zh" | "ko" | "ja";

export const LANG_STORAGE_KEY = "legalai_lang";
const DEFAULT_LANG: Lang = "vi";
const VALID_LANGS: Lang[] = ["vi", "en", "zh", "ko", "ja"];

function isLang(value: unknown): value is Lang {
  return typeof value === "string" && (VALID_LANGS as string[]).includes(value);
}

const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  // "storage" chỉ bắn ở TAB KHÁC khi localStorage đổi -> đồng bộ giữa các tab.
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot(): Lang {
  try {
    const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
    return isLang(stored) ? stored : DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
}

// Lúc server render (và lần render đầu khi hydrate) luôn là tiếng Việt,
// sau đó React tự cập nhật sang ngôn ngữ đã lưu -> không lỗi hydration.
function getServerSnapshot(): Lang {
  return DEFAULT_LANG;
}

export function setStoredLang(lang: Lang) {
  try {
    window.localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // non-fatal — trình duyệt chặn localStorage thì chỉ không nhớ được lựa chọn
  }
  listeners.forEach((l) => l());
}

export function useLang(): [Lang, (lang: Lang) => void] {
  const lang = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return [lang, setStoredLang];
}

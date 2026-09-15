"use client";

import { useEffect } from "react";

// Đăng ký service worker cho tính năng PWA (cài lên màn hình chính,
// mở nhanh hơn, có trang offline). Chạy 1 lần khi app mount, chỉ ở
// production (tránh cache gây khó chịu lúc đang code ở "next dev").
export default function RegisterSW() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production"
    ) {
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch((err) => {
      // eslint-disable-next-line no-console
      console.error("[pwa] service worker registration failed:", err);
    });
  }, []);

  return null;
}

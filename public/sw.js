// Legal AI — service worker
//
// Mục tiêu: cho phép "Add to Home Screen" hoạt động đúng chuẩn PWA
// (yêu cầu bắt buộc phải có 1 service worker đăng ký fetch handler),
// mở nhanh hơn ở lần sau nhờ cache tài nguyên tĩnh, và có màn hình
// offline thân thiện khi mất mạng — KHÔNG cache dữ liệu hợp đồng,
// API, hay bất cứ thứ gì liên quan tài khoản/đăng nhập, vì dữ liệu
// đó luôn phải mới nhất và đúng người dùng.
//
// Tăng CACHE_VERSION mỗi khi deploy để buộc client xoá cache cũ.
const CACHE_VERSION = "v1";
const STATIC_CACHE = `legalai-static-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";

// Chỉ precache những gì thực sự tĩnh & công khai (không yêu cầu đăng
// nhập). KHÔNG precache /dashboard vì trang đó cần dữ liệu người
// dùng mới nhất từ API mỗi lần mở.
const PRECACHE_URLS = [
  "/",
  "/login",
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("legalai-") && key !== STATIC_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isApiRequest(url) {
  // Không bao giờ cache request gọi API backend (dữ liệu hợp đồng,
  // auth, billing...) — luôn phải network-only, kể cả khi offline
  // (để lỗi rõ ràng thay vì trả dữ liệu cũ/sai người dùng).
  return (
    url.pathname.startsWith("/api/") ||
    url.hostname !== self.location.hostname
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (isApiRequest(url)) return; // để trình duyệt tự xử lý, không can thiệp

  // Điều hướng trang (chuyển trang / gõ URL / mở từ icon Home Screen):
  // network-first, fallback về cache rồi tới trang offline.html.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(
          () =>
            caches.match(req).then((cached) => cached || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  // Tài nguyên tĩnh (_next/static, ảnh, icon, font...): cache-first,
  // rồi cập nhật lại cache ở nền (stale-while-revalidate).
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(?:png|jpg|jpeg|svg|webp|woff2?|ico)$/.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetchPromise = fetch(req)
          .then((res) => {
            const resClone = res.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(req, resClone));
            return res;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});

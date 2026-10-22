const CACHE_VERSION = 'davin-nova-v8.0';
const CACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './DAVIN.PNG',
  './fonts/Vazirmatn-Regular.woff2',
  './fonts/Vazirmatn-Medium.woff2',
  './fonts/Vazirmatn-Bold.woff2',
  './fonts/Vazirmatn-Black.woff2'
];

// نصب: کش کردن همه فایل‌ها
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(CACHE_ASSETS).catch((err) => {
        console.warn('[SW] Some assets failed to cache:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// فعال‌سازی: حذف کش‌های قدیمی
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

// دریافت: اول از کش، بعد از شبکه (Cache First)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        // برگرداندن از کش + به‌روزرسانی در پس‌زمینه
        fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            caches.open(CACHE_VERSION).then((cache) => {
              cache.put(event.request, response.clone());
            });
          }
        }).catch(() => {});
        return cached;
      }
      
      // اگه در کش نبود، از شبکه بگیر
      return fetch(event.request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      }).catch(() => {
        // اگه آفلاین بود و در کش نبود، صفحه اصلی رو بده
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

// پیام از صفحه اصلی
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

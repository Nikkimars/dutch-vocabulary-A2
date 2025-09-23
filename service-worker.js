// 简单的离线缓存 Service Worker
const CACHE_NAME = 'dutch-vocab-v1';
const urlsToCache = [
  './dutch-vocabulary-a2.html',
  './vocabulary-data.js'
];

// 安装时缓存核心文件
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// 请求时优先使用缓存
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果缓存中有，返回缓存
        if (response) {
          return response;
        }
        // 否则从网络获取
        return fetch(event.request);
      })
  );
});

// 更新时清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});
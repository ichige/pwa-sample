var cacheName = 'tempConverterShell';

var filesToCache = [
  '/',
  '/index.html',
  '/js/boot.js',
  '/js/main.js',
  '/css/main.css'
];

self.addEventListener('install', function (e) {
  console.log('Service Worker instll event!');
  e.waitUntil(
    caches.open(cacheName)
      .then(function (cache) {
        console.log('Service Worker cachinge app shell!');
        return cache.addAll(filesToCache);
      }
    )
  );
});

self.addEventListener('activate', function (e) {
  console.log('Service Worker activating!');
  e.waitUntil(
    caches.keys()
      .then(function (keyList) {
        return Promise.all(keyList.map(function (key) {
          if (key !== cacheName) {
            console.log('Service Worker removing old cache!');
            return caches.delete(key);
          }
        }));
      }
    )
  );
  return self.clients.claim();
});

self.addEventListener('fetch', function (e) {
  console.log('Service Worker fetching!', e.request.url);
  e.respondWith(
    caches.match(e.request)
      .then(function (response) {
        return response || fetch(e.request);
      }
    )
  );
});

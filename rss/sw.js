'use strict'

var cacheName = 'rssReader';

var fileToCaches = [
  '/',
  '/index.hml',
  '/css/main.css',
  '/js/jquery-3.3.1.min.js',
  '/js/main.js',
  '/img/reload.png',
  '/img/rss.png'
];

var dataCacheName = 'rssData';

// install event
self.addEventListener('install', function(event) {
  console.log('Service Worker installing!');
  // cacheにファイルを登録
  caches.open(cacheName).then(function(cache) {
    console.log('Service Worker cacheing app shell!');
    return cache.addAll(fileToCaches);
  })
});

// activate event
self.addEventListener('activate', function(event) {
  console.log('Service Worker activating!');
  // waitUntil に渡された Promise が完了するまで待ってくれるっぽい。
  // caches は CacheStorage のグローバルプロパティだ。
  // この辺りの処理は定型として覚えるものと理解しておくと良さそう。 
  event.waitUntil(caches.keys().then(function(keyList) {
    return Promise.all(keyList.map(function(key) {
      // キャッシュキーの変更があったタイミングで、古いキャッシュを削除する。
      if (key !== cacheName && key !== dataCacheName) {
        console.log('Service Worker removing old cache. key:' + key);
        return caches.delete(key);
      }
    }))
  }));
  // おまじないに近いが、タイミングによっては問題になることがあるそうだ。
  // アクティベート後に Service Worker 内で clients.claim() を呼び出すことによって、制御されていないクライアントを制御できます。
  // という説明だが、意味はわからん。
  return self.clients.claim();
});

// fetch event
self.addEventListener('fetch', function(event) {
  console.log('Service Worker fetching! url: ' + event.request.url);
  // yahooのapiのURLが含まれた場合は、feedを取りに行くリクエストとして判断する。
  var baseUrl = 'https://query.yahooapis.com/';
  if (event.request.url.indexOf(baseUrl) > -1) {
    console.log('fetch request for feed data!');
    // respondWith メソッドは、リクエスト → ゴニョゴニョ → レスポンスという流れを作るものらしい。
    event.respondWith(caches.open(dataCacheName).then(function(cache) {
      // web上ではajaxを利用したが、ここではfetchを使うぞと。なお、デフォではcookieを送らないそうだ。
      // @see https://developer.mozilla.org/ja/docs/Web/API/Fetch_API/Using_Fetch
      return fetch(event.request).then(function(response) {
        // キャッシュへ登録する。
        cache.put(event.request.url, response.clone());
        return response;
      });
    }));
  } else {
    console.log('featch for app shell!');
    // feedではないリクエストはキャッシュから探し、存在しない場合はfetchの結果を返す。
    event.respondWith(caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    }));
  }
});




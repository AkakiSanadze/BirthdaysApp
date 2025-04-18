const CACHE_NAME = 'birthdays-app-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './utils.js',
  './fevicon.png',
  './favicon.ico',
  './manifest.json'
];

// კეშის შექმნა და საჭირო ფაილების დამატება
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS);
      })
  );
});

// თუ ქსელში რესურსი ვერ მოიძებნა, კეშიდან მოხდება მიწოდება
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // კეშიდან მიწოდება თუ არსებობს
        if (response) {
          return response;
        }
        // თუ არ არის კეშში, ქსელიდან მოთხოვნა
        return fetch(event.request)
          .then((response) => {
            // ყველა წარმატებული მოთხოვნის კეშირება
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            return response;
          });
      })
  );
}); 
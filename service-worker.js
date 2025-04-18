// service-worker.js - კეშირებისა და ოფლაინ მუშაობისთვის

const CACHE_NAME = 'birthdays-app-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/db.js',
  '/utils.js',
  '/fevicon.png',
  '/manifest.json'
];

// Service Worker-ის დაინსტალირება
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

// აქტივაციისას ძველი ქეშების წაშლა
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      );
    })
  );
});

// მოთხოვნების დაჭერა და ქეშიდან მიწოდება, თუ შესაძლებელია
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // არ შევცვალოთ IndexedDB მოთხოვნები
        if (event.request.url.includes('indexeddb')) {
          return fetch(event.request);
        }

        // მოთხოვნის კლონი იმიტომ, რომ ორჯერ გამოვიყენოთ
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // ვამოწმებთ, რომ ვალიდური პასუხია
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // პასუხის კლონი იმიტომ, რომ ორ ადგილას გამოვიყენოთ (body stream)
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
  );
}); 
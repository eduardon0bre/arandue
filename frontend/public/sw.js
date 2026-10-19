/* Aranduê Service Worker - PWA & Push Notifications */

const CACHE_NAME = 'arandue-cache-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Falha parcial no pré-cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// Ativação e limpeza de versões antigas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Estratégia de Fetch inteligente
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Apenas requisições GET com esquemas http/https
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Requisições para API do backend: Rede direta (sem cache estático para dados mutáveis)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'Você está offline. Verifique sua conexão com a internet.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // Assets Estáticos (JS, CSS, Imagens, Fontes): Cache-First com atualização em background
  const isStaticAsset =
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot|ico)$/) ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Atualiza o cache silenciosamente em segundo plano
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        // Se não está no cache, busca na rede e salva
        return fetch(request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
            return networkResponse;
          }
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          return networkResponse;
        });
      })
    );
    return;
  }

  // Navegação e Páginas HTML (SPA): Stale-While-Revalidate com fallback para /index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match('/index.html') || caches.match('/');
          });
        })
    );
    return;
  }

  // Padrão para outros recursos: Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Listener para Notificações Web Push
self.addEventListener('push', (event) => {
  let notificationData = {
    title: 'Aranduê',
    body: 'Você tem uma nova notificação de diária ou oportunidade!',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'arandue-notification',
    data: {
      url: '/'
    }
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      notificationData = {
        title: parsed.title || notificationData.title,
        body: parsed.body || parsed.mensagem || notificationData.body,
        icon: parsed.icon || notificationData.icon,
        badge: parsed.badge || notificationData.badge,
        tag: parsed.tag || notificationData.tag,
        data: {
          url: (parsed.data && parsed.data.url) || parsed.url || '/'
        }
      };
    } catch {
      notificationData.body = event.data.text();
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    data: notificationData.data,
    vibrate: [100, 50, 100],
    actions: [
      { action: 'open', title: 'Abrir App' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Clique na Notificação Push: Abre ou foca a janela do aplicativo
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Se houver uma janela aberta do mesmo host, foca nela e navega
      for (const client of windowClients) {
        if ('focus' in client) {
          if ('navigate' in client && targetUrl) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // Se não houver janela aberta, cria uma nova
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

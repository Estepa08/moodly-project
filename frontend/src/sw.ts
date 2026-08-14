/// <reference lib="webworker" />
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

// SPA-navigation: любой переход (в т.ч. офлайн deep-link при чистом кэше)
// отдаём из precache index.html, чтобы маршруты React открывались всегда.
// ВАЖНО: реальные статические файлы (robots.txt, sitemap.xml, манифест,
// иконки и т.д.) должны исключаться через denylist — иначе браузер с уже
// установленным SW получает вместо них index.html (в т.ч. поисковые боты,
// если когда-либо у них будет активен SW/офлайн-кэш для этого origin, и
// любой пользователь, открывающий эти ссылки напрямую после первого визита).
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('/index.html'), {
    denylist: [
      /^\/robots\.txt$/,
      /^\/sitemap\.xml$/,
      /^\/manifest\.webmanifest$/,
      /^\/icons\//,
      /^\/assets\//,
      /^\/api\//,
    ],
  }),
);

self.addEventListener('push', (event) => {
  let data: { title: string; body: string; url?: string } = { title: 'Moodly', body: '' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.svg',
      badge: '/icons/icon-192.svg',
      data: { url: data.url || '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = (event.notification.data as { url?: string })?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsList) => {
      const matchingClient = clientsList.find(
        (c) => 'url' in c && c.url === urlToOpen && 'focus' in c,
      );
      if (matchingClient) {
        return matchingClient.focus();
      }
      return self.clients.openWindow(urlToOpen);
    }),
  );
});

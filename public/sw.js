// Push only. No offline caching — the feed needs the network anyway.
self.addEventListener('push', (event) => {
  const d = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(d.title || 'Doomly', {
      body: d.body || '',
      icon: '/icon.png',
      badge: '/icon.png',
      tag: d.tag,              // same tag replaces rather than stacks
      data: { url: d.url || '/feed' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/feed'
  event.waitUntil(
    // Focus the tab that's already open before opening another one.
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const open = list.find((c) => c.url.includes(url))
      return open ? open.focus() : clients.openWindow(url)
    }),
  )
})

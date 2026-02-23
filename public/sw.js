// Service Worker para Acompañarte PWA
// Estrategia: Cache First, then Network

const CACHE_NAME = 'acompanarte-v1';
const STATIC_CACHE = 'acompanarte-static-v1';
const DYNAMIC_CACHE = 'acompanarte-dynamic-v1';

// Archivos estáticos a cachear
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-72.png',
  '/icons/icon-96.png',
  '/icons/icon-128.png',
  '/icons/icon-144.png',
  '/icons/icon-152.png',
  '/icons/icon-192.png',
  '/icons/icon-384.png',
  '/icons/icon-512.png',
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Cacheando assets estáticos');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Instalación completada');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Error en instalación:', error);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name.startsWith('acompanarte-') && 
                     name !== STATIC_CACHE && 
                     name !== DYNAMIC_CACHE;
            })
            .map((name) => {
              console.log('[SW] Eliminando cache antiguo:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Activación completada');
        return self.clients.claim();
      })
  );
});

// Estrategia de fetch: Cache First, then Network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const { url, method } = request;

  // Solo manejar GET requests
  if (method !== 'GET') {
    return;
  }

  // Estrategia para archivos estáticos (JS, CSS, imágenes)
  if (url.includes('/assets/') || url.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico)$/)) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            // Retornar del cache y actualizar en segundo plano
            fetch(request)
              .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                  caches.open(DYNAMIC_CACHE)
                    .then((cache) => {
                      cache.put(request, networkResponse.clone());
                    });
                }
              })
              .catch(() => {});
            
            return cachedResponse;
          }

          // Si no está en cache, fetch y cachear
          return fetch(request)
            .then((networkResponse) => {
              if (!networkResponse || networkResponse.status !== 200) {
                return networkResponse;
              }

              const responseToCache = networkResponse.clone();
              caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                  cache.put(request, responseToCache);
                });

              return networkResponse;
            });
        })
        .catch((error) => {
          console.error('[SW] Error en fetch:', error);
          // Retornar página offline si existe
          return caches.match('/offline.html');
        })
    );
    return;
  }

  // Estrategia para navegación (HTML)
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html')
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request);
        })
        .catch(() => {
          return caches.match('/index.html');
        })
    );
    return;
  }

  // Default: Network First
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(DYNAMIC_CACHE)
          .then((cache) => {
            cache.put(request, responseToCache);
          });

        return networkResponse;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Sincronización en segundo plano
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-visitas') {
    console.log('[SW] Sincronizando visitas pendientes...');
    event.waitUntil(syncVisitasPendientes());
  }
});

// Función para sincronizar visitas pendientes
async function syncVisitasPendientes() {
  try {
    const visitasPendientes = JSON.parse(
      localStorage.getItem('visitas_pendientes') || '[]'
    );

    if (visitasPendientes.length === 0) {
      console.log('[SW] No hay visitas pendientes para sincronizar');
      return;
    }

    console.log(`[SW] Sincronizando ${visitasPendientes.length} visitas...`);

    // Simular sincronización (en producción sería una llamada a la API)
    for (const visita of visitasPendientes) {
      console.log('[SW] Sincronizando visita:', visita.id);
      // Aquí iría la llamada real a la API
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Limpiar visitas sincronizadas
    localStorage.setItem('visitas_pendientes', '[]');
    
    // Notificar a los clientes
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        message: 'Visitas sincronizadas correctamente'
      });
    });

    console.log('[SW] Sincronización completada');
  } catch (error) {
    console.error('[SW] Error en sincronización:', error);
  }
}

// Manejo de notificaciones push
self.addEventListener('push', (event) => {
  console.log('[SW] Notificación push recibida');

  const options = {
    body: event.data?.text() || 'Nueva notificación de Acompañarte',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    vibrate: [100, 50, 100],
    data: {
      url: '/'
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir'
      },
      {
        action: 'close',
        title: 'Cerrar'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Acompañarte', options)
  );
});

// Manejo de clicks en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Click en notificación');
  
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      self.clients.openWindow(event.notification.data?.url || '/')
    );
  }
});

// Mensajes desde el cliente
self.addEventListener('message', (event) => {
  console.log('[SW] Mensaje recibido:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'SYNC_VISITAS') {
    self.registration.sync.register('sync-visitas');
  }
});

// Evento de cambio de estado de conexión
self.addEventListener('online', () => {
  console.log('[SW] Conexión recuperada, sincronizando...');
  self.registration.sync.register('sync-visitas');
});

console.log('[SW] Service Worker cargado');

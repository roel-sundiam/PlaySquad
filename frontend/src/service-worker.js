// PlaySquad Service Worker for Push Notifications
const CACHE_NAME = 'playsquad-v1';
const urlsToCache = [
  '/',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png'
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker caching essential resources');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker installation complete');
        return self.skipWaiting(); // Activate immediately
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activation complete');
      return self.clients.claim(); // Take control immediately
    })
  );
});

// Push event - handle push notifications
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);

  let notificationData = {
    title: 'PlaySquad Notification',
    body: 'You have a new notification from PlaySquad',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/icon-72x72.png',
    tag: 'playsquad-notification',
    requireInteraction: false,
    actions: []
  };

  // Parse push data if available
  if (event.data) {
    try {
      const data = event.data.json();
      console.log('Push data received:', data);

      notificationData = {
        ...notificationData,
        title: data.title || notificationData.title,
        body: data.message || notificationData.body,
        tag: data.tag || notificationData.tag,
        data: data, // Store full data for click handling
        actions: getNotificationActions(data.type),
        requireInteraction: data.requireInteraction || false
      };

      // Add type-specific styling
      if (data.type === 'event-cancelled') {
        notificationData.requireInteraction = true;
      }
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }

  const notificationPromise = self.registration.showNotification(
    notificationData.title,
    notificationData
  );

  event.waitUntil(notificationPromise);
});

// Get notification actions based on type
function getNotificationActions(type) {
  const commonActions = [
    {
      action: 'view',
      title: 'View',
      icon: '/assets/icons/icon-72x72.png'
    }
  ];

  switch (type) {
    case 'event-published':
      return [
        ...commonActions,
        {
          action: 'rsvp',
          title: 'RSVP',
          icon: '/assets/icons/icon-72x72.png'
        }
      ];

    case 'event-cancelled':
      return [
        {
          action: 'view',
          title: 'View Details',
          icon: '/assets/icons/icon-72x72.png'
        }
      ];

    case 'join-request-approved':
      return [
        {
          action: 'view-club',
          title: 'View Club',
          icon: '/assets/icons/icon-72x72.png'
        }
      ];

    default:
      return commonActions;
  }
}

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close(); // Close the notification

  const notificationData = event.notification.data;
  const action = event.action;

  // Determine URL to open based on action and notification data
  let urlToOpen = '/';

  if (action === 'view' || !action) {
    // Default action or "View" action
    if (notificationData && notificationData.data) {
      const data = notificationData.data;

      if (data.event && data.event.id) {
        urlToOpen = `/events/${data.event.id}`;
      } else if (data.club && data.club.id) {
        urlToOpen = `/clubs/${data.club.id}`;
      }
    }
  } else if (action === 'rsvp') {
    if (notificationData && notificationData.data && notificationData.data.event) {
      urlToOpen = `/events/${notificationData.data.event.id}`;
    }
  } else if (action === 'view-club') {
    if (notificationData && notificationData.data && notificationData.data.club) {
      urlToOpen = `/clubs/${notificationData.data.club.id}`;
    }
  }

  // Open the URL in the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin)) {
          // Focus existing window and navigate
          client.focus();
          client.navigate(urlToOpen);
          return;
        }
      }

      // Open new window if app is not open
      return clients.openWindow(self.location.origin + urlToOpen);
    })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);

  // Track notification dismissal analytics if needed
  // This could send data back to your analytics service
});

// Background sync for offline functionality (optional)
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event);

  if (event.tag === 'playsquad-sync') {
    event.waitUntil(
      // Perform background sync operations
      // e.g., sync pending notifications, user data, etc.
      Promise.resolve()
    );
  }
});

// Message event - handle messages from main app
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error);
});

console.log('PlaySquad Service Worker loaded successfully');
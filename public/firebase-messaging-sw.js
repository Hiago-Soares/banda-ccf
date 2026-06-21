importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyA_0lw-ayZp3ktyViDAWdypdkFfX3kuD28",
  authDomain: "bmccf-march.firebaseapp.com",
  projectId: "bmccf-march",
  storageBucket: "bmccf-march.firebasestorage.app",
  messagingSenderId: "956206507725",
  appId: "1:956206507725:web:81f5d1cae9d18aaccceb84"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || 'Banda CCF', {
    body: body || '',
    icon: icon || '/logo.png',
    badge: '/logo.png',
    vibrate: [200, 100, 200],
    data: payload.data
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('https://bandamarcial-ccf.vercel.app')
  );
});

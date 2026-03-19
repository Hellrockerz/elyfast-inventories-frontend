importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyDIbJWUwxYj8P5EzO8fwNiaZIbmAWeNklU",
  authDomain: "elyfast-inventory.firebaseapp.com",
  projectId: "elyfast-inventory",
  storageBucket: "elyfast-inventory.firebasestorage.app",
  messagingSenderId: "345402873839",
  appId: "1:345402873839:web:490de17920675daec3481a",
  measurementId: "G-CFQEZVMZBF"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

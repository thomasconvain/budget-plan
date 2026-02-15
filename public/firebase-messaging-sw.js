/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/11.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.8.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyD4kgFudYyiC-Nks4-KeGIb96NGLlFpBrU',
  authDomain: 'budgetplanapp.com',
  projectId: 'budget-plan-2c150',
  storageBucket: 'budget-plan-2c150.appspot.com',
  messagingSenderId: '450979548885',
  appId: '1:450979548885:web:eadcb1b4f77268daf51c5c',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  if (title) {
    self.registration.showNotification(title, {
      body,
      icon: '/favicon.svg',
    });
  }
});

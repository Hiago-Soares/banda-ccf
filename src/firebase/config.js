import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyA_0lw-ayZp3ktyViDAWdypdkFfX3kuD28",
  authDomain: "bmccf-march.firebaseapp.com",
  projectId: "bmccf-march",
  storageBucket: "bmccf-march.firebasestorage.app",
  messagingSenderId: "956206507725",
  appId: "1:956206507725:web:81f5d1cae9d18aaccceb84",
  measurementId: "G-VEVPVN7BHB"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const messaging = getMessaging(app);

export const VAPID_KEY = 'BFaQTo84AyF7aLTvU8IvVSA62Zr-gFWL9X86lSEm2gIp_wAcEZ8bWmt7HQ-SwDIp_AbF5y62e-94RCHOsAvdZWg';

export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      return token;
    }
    return null;
  } catch (e) {
    console.error('Notification error:', e);
    return null;
  }
};

export const onForegroundMessage = (callback) => {
  return onMessage(messaging, callback);
};

export default app;

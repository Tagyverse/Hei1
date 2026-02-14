import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDVKJL9JYVbhiHpBut7AgmTQUUT1jVXGew",
  authDomain: "pixiebloomsin.firebaseapp.com",
  databaseURL: "https://pixiebloomsin-default-rtdb.firebaseio.com",
  projectId: "pixiebloomsin",
  storageBucket: "pixiebloomsin.firebasestorage.app",
  messagingSenderId: "928829690664",
  appId: "1:928829690664:web:491e0b74f319bfa0fb361d",
  measurementId: "G-N7VH1H8J47"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);
export default app;

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAqKLmj6Qfr225TjgCn8-tbt27JWwBgkPQ",
  authDomain: "actividad-api-6abc3.firebaseapp.com",
  projectId: "actividad-api-6abc3",
  storageBucket: "actividad-api-6abc3.firebasestorage.app",
  messagingSenderId: "885209756216",
  appId: "1:885209756216:web:a9fe6eff6e64364cd36ccd",
  measurementId: "G-ZNT1CSHNMB"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
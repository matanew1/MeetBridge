// Quick script to check all mock users
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBPdV1BiL67xJes80Gv_tozl1E1ZAqslbk',
  authDomain: 'meetbridge-b5cdc.firebaseapp.com',
  projectId: 'meetbridge-b5cdc',
  storageBucket: 'meetbridge-b5cdc.firebasestorage.app',
  messagingSenderId: '331612362377',
  appId: '1:331612362377:web:6ad392ab246120d4461858',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function quickCheck() {
  console.log('🔍 Checking mock users...\n');

  const usersRef = collection(db, 'users');
  const q = query(
    usersRef,
    where('email', '>=', 'mock'),
    where('email', '<=', 'mock\uf8ff')
  );
  const snapshot = await getDocs(q);

  console.log(`Found ${snapshot.size} mock users:\n`);

  snapshot.forEach((doc) => {
    const data = doc.data();
    console.log(
      `${data.name}: geohash=${data.geohash}, gender=${data.gender}, age=${data.age}`
    );
  });

  process.exit(0);
}

quickCheck();

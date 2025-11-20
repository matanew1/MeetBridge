import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  deleteUser as deleteAuthUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyBPdV1BiL67xJes80Gv_tozl1E1ZAqslbk',
  authDomain: 'meetbridge-b5cdc.firebaseapp.com',
  projectId: 'meetbridge-b5cdc',
  storageBucket: 'meetbridge-b5cdc.firebasestorage.app',
  messagingSenderId: '331612362377',
  appId: '1:331612362377:web:6ad392ab246120d4461858',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const password = 'Test1234!';

async function deleteMockUser(index: number) {
  const email = `mock${index}@meetbridge.test`;

  try {
    console.log(`\n🔄 Deleting user: ${email}...`);

    // Sign in as the user
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const userId = userCredential.user.uid;

    // Delete Firestore document
    await deleteDoc(doc(db, 'users', userId));
    console.log(`✅ Firestore doc deleted`);

    // Delete Auth user (must be last and user must be currently signed in)
    await deleteAuthUser(userCredential.user);
    console.log(`✅ Auth user deleted: ${email}`);

    return { success: true, email };
  } catch (error: any) {
    if (
      error.code === 'auth/user-not-found' ||
      error.code === 'auth/invalid-credential'
    ) {
      console.log(`⚠️  User not found: ${email}`);
      return { success: true, email, note: 'not found' };
    }
    console.error(`❌ Error deleting ${email}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function deleteAllMockUsers() {
  console.log('🗑️  Starting mock user deletion...\n');

  const results = [];

  for (let i = 1; i <= 100; i++) {
    const result = await deleteMockUser(i);
    results.push(result);

    // Small delay
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log('\n\n📊 Summary:');
  console.log('='.repeat(50));
  const successful = results.filter((r) => r.success).length;
  console.log(`✅ Successfully deleted: ${successful}/20 users`);

  process.exit(0);
}

// Run the script
deleteAllMockUsers().catch(console.error);

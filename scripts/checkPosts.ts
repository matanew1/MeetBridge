// scripts/checkPosts.ts
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// Firebase config (hardcoded for scripts)
const firebaseConfig = {
  apiKey: 'AIzaSyBPdV1BiL67xJes80Gv_tozl1E1ZAqslbk',
  authDomain: 'meetbridge-b5cdc.firebaseapp.com',
  projectId: 'meetbridge-b5cdc',
  storageBucket: 'meetbridge-b5cdc.firebasestorage.app',
  messagingSenderId: '331612362377',
  appId: '1:331612362377:web:6ad392ab246120d4461858',
};

async function checkPosts() {
  console.log('🔍 Checking posts for images...\n');

  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const snapshot = await getDocs(collection(db, 'missed_connections'));
    console.log(`📊 Found ${snapshot.size} posts\n`);

    let postsWithImages = 0;
    let totalImages = 0;

    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      const images = data.images || [];

      if (images.length > 0) {
        postsWithImages++;
        totalImages += images.length;
        console.log(`${index + 1}. Post ${doc.id}:`);
        console.log(`   Images: ${images.length}`);
        console.log(`   Image URLs: ${JSON.stringify(images, null, 2)}`);
        console.log('');
      }
    });

    console.log(`📊 Summary:`);
    console.log(`   Posts with images: ${postsWithImages}/${snapshot.size}`);
    console.log(`   Total images: ${totalImages}`);
  } catch (error) {
    console.error('❌ Error checking posts:', error);
  }
}

// Run the check
checkPosts()
  .then(() => {
    console.log('\n✅ Check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Check failed:', error);
    process.exit(1);
  });

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
  writeBatch,
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
const db = getFirestore(app);

/**
 * Delete a collection in batches
 */
async function deleteCollection(collectionName: string) {
  console.log(`\n🗑️  Starting to delete collection: ${collectionName}`);

  const collectionRef = collection(db, collectionName);
  const batchSize = 500; // Firestore limit
  let deletedCount = 0;

  while (true) {
    const snapshot = await getDocs(collectionRef);

    if (snapshot.empty) {
      console.log(`✅ Collection "${collectionName}" is now empty`);
      break;
    }

    // Use batch for efficient deletion
    const batch = writeBatch(db);
    let batchCount = 0;

    snapshot.docs.forEach((document) => {
      if (batchCount < batchSize) {
        batch.delete(document.ref);
        batchCount++;
        deletedCount++;
      }
    });

    await batch.commit();
    console.log(
      `   Deleted ${batchCount} documents... (Total: ${deletedCount})`
    );

    // If we deleted less than batchSize, we're done
    if (batchCount < batchSize) {
      break;
    }
  }

  console.log(
    `✅ Total deleted from "${collectionName}": ${deletedCount} documents\n`
  );
  return deletedCount;
}

/**
 * Delete subcollections within a parent collection
 */
async function deleteSubcollections(
  parentCollectionName: string,
  subcollectionName: string
) {
  console.log(
    `\n🗑️  Deleting subcollection "${subcollectionName}" from all documents in "${parentCollectionName}"`
  );

  const parentRef = collection(db, parentCollectionName);
  const parentSnapshot = await getDocs(parentRef);

  let totalDeleted = 0;

  for (const parentDoc of parentSnapshot.docs) {
    const subcollectionRef = collection(
      db,
      parentCollectionName,
      parentDoc.id,
      subcollectionName
    );
    const subcollectionSnapshot = await getDocs(subcollectionRef);

    if (!subcollectionSnapshot.empty) {
      const batch = writeBatch(db);
      let batchCount = 0;

      subcollectionSnapshot.docs.forEach((subDoc) => {
        batch.delete(subDoc.ref);
        batchCount++;
        totalDeleted++;
      });

      await batch.commit();
      console.log(
        `   Deleted ${batchCount} messages from conversation ${parentDoc.id}`
      );
    }
  }

  console.log(
    `✅ Total deleted from "${parentCollectionName}/{id}/${subcollectionName}": ${totalDeleted} documents\n`
  );
  return totalDeleted;
}

/**
 * Main function to drop all collections
 */
async function dropAllCollections() {
  console.log('🚨 WARNING: This will DELETE ALL DATA from Firestore!');
  console.log('Collections to be deleted:');
  console.log('  - users');
  console.log('  - matches');
  console.log('  - likes');
  console.log('  - dislikes');
  console.log('  - conversations');
  console.log('  - conversations/{id}/messages (subcollection)');
  console.log('\n⏳ Starting deletion in 3 seconds...\n');

  await new Promise((resolve) => setTimeout(resolve, 3000));

  try {
    const startTime = Date.now();
    let totalDeleted = 0;

    // Delete subcollections first (messages within conversations)
    console.log('📦 Step 1: Deleting subcollections...');
    totalDeleted += await deleteSubcollections('conversations', 'messages');

    // Delete main collections
    console.log('📦 Step 2: Deleting main collections...');
    totalDeleted += await deleteCollection('conversations');
    totalDeleted += await deleteCollection('matches');
    totalDeleted += await deleteCollection('likes');
    totalDeleted += await deleteCollection('dislikes');
    totalDeleted += await deleteCollection('users');

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n✅ ===== DELETION COMPLETE ===== ✅');
    console.log(`📊 Total documents deleted: ${totalDeleted}`);
    console.log(`⏱️  Time taken: ${duration} seconds`);
    console.log(
      '\n💡 Note: Firebase Auth users are NOT deleted (requires Admin SDK)'
    );
    console.log('   To delete Auth users, use Firebase Console or Admin SDK');
  } catch (error) {
    console.error('\n❌ Error during deletion:', error);
    throw error;
  }
}

/**
 * Drop specific collections only
 */
async function dropSpecificCollections(collectionsToDelete: string[]) {
  console.log('🚨 WARNING: This will DELETE the following collections:');
  collectionsToDelete.forEach((col) => console.log(`  - ${col}`));
  console.log('\n⏳ Starting deletion in 3 seconds...\n');

  await new Promise((resolve) => setTimeout(resolve, 3000));

  try {
    const startTime = Date.now();
    let totalDeleted = 0;

    for (const collectionName of collectionsToDelete) {
      // Check if it's a subcollection pattern
      if (collectionName.includes('/')) {
        const [parent, sub] = collectionName.split('/');
        if (sub === 'messages') {
          totalDeleted += await deleteSubcollections(parent, sub);
        }
      } else {
        totalDeleted += await deleteCollection(collectionName);
      }
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n✅ ===== DELETION COMPLETE ===== ✅');
    console.log(`📊 Total documents deleted: ${totalDeleted}`);
    console.log(`⏱️  Time taken: ${duration} seconds`);
  } catch (error) {
    console.error('\n❌ Error during deletion:', error);
    throw error;
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  // No arguments - delete all collections
  dropAllCollections()
    .then(() => {
      console.log('\n🎉 All collections dropped successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to drop collections:', error);
      process.exit(1);
    });
} else {
  // Specific collections provided
  dropSpecificCollections(args)
    .then(() => {
      console.log('\n🎉 Specified collections dropped successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to drop collections:', error);
      process.exit(1);
    });
}

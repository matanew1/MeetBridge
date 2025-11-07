import { readFileSync } from 'fs';
import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const DEFAULT_PROJECT_ID = 'meetbridge-b5cdc';

function initializeFirestore() {
  if (getApps().length > 0) {
    return getFirestore();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || DEFAULT_PROJECT_ID;
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  let credential;

  try {
    if (serviceAccountJson) {
      credential = cert(JSON.parse(serviceAccountJson));
    } else if (serviceAccountPath) {
      const fileContents = readFileSync(serviceAccountPath, 'utf-8');
      credential = cert(JSON.parse(fileContents));
    } else {
      console.log(
        'ℹ️  FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH not provided. Using application default credentials.'
      );
      credential = applicationDefault();
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown credential error';
    console.error(
      '\n❌ Unable to initialize Firebase Admin credentials:',
      message
    );
    console.error(
      '   Provide either FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH environment variables.'
    );
    process.exit(1);
  }

  const app = initializeApp({ credential, projectId });
  console.log(`🔐 Initialized Firebase Admin for project: ${projectId}`);
  return getFirestore(app);
}

const db = initializeFirestore();

/**
 * Delete a collection in batches
 */
async function deleteCollection(collectionName: string) {
  console.log(`\n🗑️  Starting to delete collection: ${collectionName}`);

  const collectionRef = db.collection(collectionName);
  const batchSize = 500; // Firestore limit
  let deletedCount = 0;

  while (true) {
    const snapshot = await collectionRef.limit(batchSize).get();

    if (snapshot.empty) {
      console.log(`✅ Collection "${collectionName}" is now empty`);
      break;
    }

    // Use batch for efficient deletion
    const batch = db.batch();

    snapshot.docs.forEach((document) => {
      batch.delete(document.ref);
      deletedCount++;
    });

    await batch.commit();
    console.log(
      `   Deleted ${snapshot.size} documents... (Total: ${deletedCount})`
    );
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

  const parentRef = db.collection(parentCollectionName);
  const parentSnapshot = await parentRef.get();

  let totalDeleted = 0;

  for (const parentDoc of parentSnapshot.docs) {
    const subcollectionRef = parentDoc.ref.collection(subcollectionName);

    while (true) {
      const subcollectionSnapshot = await subcollectionRef.limit(500).get();

      if (subcollectionSnapshot.empty) {
        break;
      }

      const batch = db.batch();

      subcollectionSnapshot.docs.forEach((subDoc) => {
        batch.delete(subDoc.ref);
        totalDeleted++;
      });

      await batch.commit();
      console.log(
        `   Deleted ${subcollectionSnapshot.size} documents from ${parentDoc.id}/${subcollectionName}`
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

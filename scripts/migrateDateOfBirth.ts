/**
 * Migration Script: Add dateOfBirth to existing users
 *
 * This script updates existing user documents in Firestore to include:
 * - dateOfBirth field (calculated from age if not present)
 * - zodiacSign field (calculated from dateOfBirth)
 *
 * Run with: npm run migrate-dob
 *
 * NOTE: This uses Firebase Client SDK, so you need to be authenticated.
 * Make sure you're logged in with an admin account before running.
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  Timestamp,
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
 * Calculate zodiac sign from date of birth
 */
function calculateZodiacSign(birthDate: Date): string | null {
  const month = birthDate.getMonth() + 1;
  const day = birthDate.getDate();

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini';
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21))
    return 'Scorpio';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21))
    return 'Sagittarius';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19))
    return 'Capricorn';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18))
    return 'Aquarius';
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 'Pisces';

  return null;
}

/**
 * Estimate date of birth from age
 * Uses July 1st of the calculated birth year as default
 */
function estimateDateOfBirth(age: number): Date {
  const currentYear = new Date().getFullYear();
  const birthYear = currentYear - age;
  // Use July 1st as a middle-of-year estimate
  return new Date(birthYear, 6, 1); // Month is 0-indexed, so 6 = July
}

async function migrateUsers() {
  try {
    console.log(
      '🔄 Starting migration: Adding dateOfBirth and zodiacSign to users...\n'
    );

    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);

    if (snapshot.empty) {
      console.log('❌ No users found in database');
      return;
    }

    let totalUsers = 0;
    let updatedUsers = 0;
    let skippedUsers = 0;
    let errorUsers = 0;

    let batch = writeBatch(db);
    const batchSize = 500;
    let batchCount = 0;

    for (const docSnapshot of snapshot.docs) {
      totalUsers++;
      const userData = docSnapshot.data();
      const updates: any = {};
      let needsUpdate = false;

      // Check if dateOfBirth is missing
      if (!userData.dateOfBirth) {
        if (userData.age) {
          // Estimate dateOfBirth from age
          const estimatedDOB = estimateDateOfBirth(userData.age);
          updates.dateOfBirth = Timestamp.fromDate(estimatedDOB);
          needsUpdate = true;
          console.log(
            `📅 User ${docSnapshot.id}: Estimated DOB from age ${
              userData.age
            } -> ${estimatedDOB.toISOString().split('T')[0]}`
          );
        } else {
          console.warn(
            `⚠️  User ${docSnapshot.id}: No age or dateOfBirth found, skipping...`
          );
          skippedUsers++;
          continue;
        }
      }

      // Check if zodiacSign is missing
      if (
        !userData.zodiacSign &&
        (userData.dateOfBirth || updates.dateOfBirth)
      ) {
        const dobToUse = updates.dateOfBirth
          ? updates.dateOfBirth.toDate()
          : userData.dateOfBirth.toDate();

        const zodiac = calculateZodiacSign(dobToUse);
        if (zodiac) {
          updates.zodiacSign = zodiac;
          needsUpdate = true;
          console.log(
            `⭐ User ${docSnapshot.id}: Calculated zodiac sign -> ${zodiac}`
          );
        }
      }

      // Recalculate age if dateOfBirth exists
      if (userData.dateOfBirth || updates.dateOfBirth) {
        const dobToUse = updates.dateOfBirth
          ? updates.dateOfBirth.toDate()
          : userData.dateOfBirth.toDate();

        const today = new Date();
        let age = today.getFullYear() - dobToUse.getFullYear();
        const monthDiff = today.getMonth() - dobToUse.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < dobToUse.getDate())
        ) {
          age--;
        }

        if (age !== userData.age) {
          updates.age = age;
          needsUpdate = true;
          console.log(
            `🔢 User ${docSnapshot.id}: Updated age from ${userData.age} to ${age}`
          );
        }
      }

      if (needsUpdate) {
        const userDocRef = doc(db, 'users', docSnapshot.id);
        batch.update(userDocRef, updates);
        updatedUsers++;
        batchCount++;

        // Commit batch when it reaches the limit
        if (batchCount >= batchSize) {
          await batch.commit();
          console.log(`\n✅ Committed batch of ${batchCount} updates\n`);
          // Create a new batch for the next set of updates
          batch = writeBatch(db);
          batchCount = 0;
        }
      }
    }

    // Commit remaining updates
    if (batchCount > 0) {
      await batch.commit();
      console.log(`\n✅ Committed final batch of ${batchCount} updates\n`);
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   Total users: ${totalUsers}`);
    console.log(`   ✅ Updated: ${updatedUsers}`);
    console.log(`   ⏭️  Skipped: ${skippedUsers}`);
    console.log(`   ❌ Errors: ${errorUsers}`);
    console.log('\n✨ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
migrateUsers()
  .then(() => {
    console.log('\n👋 Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });

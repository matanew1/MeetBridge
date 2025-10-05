// Test geohash query bounds
import { geohashQueryBounds, distanceBetween } from 'geofire-common';

// Your current location from logs
const YOUR_LAT = 32.081271;
const YOUR_LON = 34.89062;

// Mock user locations - NEW 5-500m range with precision 9 geohashes
const mockUsers = [
  { name: 'Sarah', distance: 5, geohash: '' },
  { name: 'Yael', distance: 25, geohash: '' },
  { name: 'Maya', distance: 50, geohash: '' },
  { name: 'Noa', distance: 100, geohash: '' },
  { name: 'Tamar', distance: 200, geohash: '' },
  { name: 'Dan', distance: 10, geohash: '' },
  { name: 'Ori', distance: 75, geohash: '' },
  { name: 'Avi', distance: 150, geohash: '' },
  { name: 'Tom', distance: 300, geohash: '' },
  { name: 'Eitan', distance: 500, geohash: '' },
];

console.log('🔍 Testing Geohash Query Bounds (PRECISION 9)\n');
console.log(`📍 Your Location: ${YOUR_LAT}, ${YOUR_LON}\n`);
console.log(
  '⚠️  This test script needs to be updated to generate mock user coordinates.'
);
console.log('Please run: npm run generate-mock-users instead!\n');

// Test different radiuses - NEW 5-500m range
const radiuses = [50, 100, 250, 500]; // meters

radiuses.forEach((radiusMeters) => {
  const radiusKm = radiusMeters / 1000;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📏 Testing Radius: ${radiusMeters}m (${radiusKm}km)`);
  console.log('='.repeat(60));

  // Get query bounds
  const bounds = geohashQueryBounds([YOUR_LAT, YOUR_LON], radiusKm);

  console.log(`\n🔷 Query Bounds (${bounds.length} ranges):`);
  bounds.forEach((bound, i) => {
    console.log(`   ${i + 1}. ${bound[0]} → ${bound[1]}`);
  });

  // Test which mock users fall within these bounds
  console.log(`\n👥 Mock Users Analysis:`);

  mockUsers.forEach((user) => {
    // Calculate actual distance
    const distance = Math.round(
      distanceBetween([YOUR_LAT, YOUR_LON], [user.lat, user.lon]) * 1000
    );

    // Check if geohash is within any bound
    let inBounds = false;
    let matchedBound = -1;

    for (let i = 0; i < bounds.length; i++) {
      const [start, end] = bounds[i];
      if (user.geohash >= start && user.geohash <= end) {
        inBounds = true;
        matchedBound = i + 1;
        break;
      }
    }

    const withinRadius = distance <= radiusMeters;
    const shouldBeFound = withinRadius && inBounds;

    console.log(`\n   ${user.name}:`);
    console.log(`      Geohash: ${user.geohash}`);
    console.log(`      Distance: ${distance}m`);
    console.log(`      Within radius: ${withinRadius ? '✅' : '❌'}`);
    console.log(
      `      In geohash bounds: ${
        inBounds ? `✅ (bound ${matchedBound})` : '❌'
      }`
    );
    console.log(`      Should be found: ${shouldBeFound ? '✅' : '❌'}`);
  });

  // Summary
  const usersInRadius = mockUsers.filter((u) => {
    const d = Math.round(
      distanceBetween([YOUR_LAT, YOUR_LON], [u.lat, u.lon]) * 1000
    );
    return d <= radiusMeters;
  });

  const usersInBounds = mockUsers.filter((u) => {
    return bounds.some(
      ([start, end]) => u.geohash >= start && u.geohash <= end
    );
  });

  const usersFoundable = usersInRadius.filter((u) => {
    return bounds.some(
      ([start, end]) => u.geohash >= start && u.geohash <= end
    );
  });

  console.log(`\n📊 Summary:`);
  console.log(`   Users within ${radiusMeters}m: ${usersInRadius.length}`);
  console.log(`   Users in geohash bounds: ${usersInBounds.length}`);
  console.log(`   Users that SHOULD be found: ${usersFoundable.length}`);
  console.log(`   Missing: ${usersInRadius.length - usersFoundable.length}`);

  if (usersInRadius.length > usersFoundable.length) {
    console.log(
      `\n   ⚠️ ${
        usersInRadius.length - usersFoundable.length
      } users within radius but NOT in geohash bounds!`
    );
    const missing = usersInRadius.filter((u) => !usersInBounds.includes(u));
    missing.forEach((u) =>
      console.log(`      - ${u.name} (geohash: ${u.geohash})`)
    );
  }
});

console.log('\n\n' + '='.repeat(60));
console.log('🎯 Recommendations:');
console.log('='.repeat(60));

// Check if all users start with same geohash prefix
const geohashPrefixes = mockUsers.map((u) => u.geohash.substring(0, 4));
const uniquePrefixes = [...new Set(geohashPrefixes)];

console.log(`\nGeohash prefix diversity:`);
uniquePrefixes.forEach((prefix) => {
  const count = geohashPrefixes.filter((p) => p === prefix).length;
  console.log(`   ${prefix}: ${count} users`);
});

console.log(
  '\n✅ If all users should be found but geohash bounds exclude them:'
);
console.log('   → The geohash query bounds calculation may need adjustment');
console.log('   → Try using a larger radius or different geohash precision');

console.log('\n✅ If users are in correct bounds but still not showing:');
console.log('   → Check Firestore query syntax');
console.log('   → Check if gender/age filters are blocking them');
console.log('   → Check Firestore indexes');

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Load .env file
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const MONGODB_URI = envVars.MONGODB_URI;

async function checkVerifications() {
  console.log('Checking verification requests...\n');
  
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB\n');

    const db = client.db('auth');
    const verifications = db.collection('verification_requests');
    const users = db.collection('users');

    // Get all verifications
    const allVerifications = await verifications.find().toArray();
    console.log(`Total verification requests: ${allVerifications.length}\n`);

    // Check each verification
    for (const ver of allVerifications) {
      console.log('─'.repeat(60));
      console.log(`Verification ID: ${ver.id}`);
      console.log(`User ID: ${ver.user_id}`);
      console.log(`Status: ${ver.status}`);
      console.log(`Voice Score: ${ver.voice_match_score || 'N/A'}`);
      
      // Find the user
      const user = await users.findOne({ id: ver.user_id });
      if (user) {
        console.log(`✓ User Found: ${user.name} (${user.email})`);
      } else {
        console.log(`✗ User NOT Found for user_id: ${ver.user_id}`);
      }
      console.log('');
    }

    console.log('═'.repeat(60));
    console.log('\nAll Users in Database:');
    const allUsers = await users.find().toArray();
    for (const user of allUsers) {
      console.log(`- ${user.name} | ID: ${user.id} | Email: ${user.email}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\n✓ Disconnected from MongoDB');
  }
}

checkVerifications();

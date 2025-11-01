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
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db('auth');
    
    // Check verification requests
    const verifications = await db.collection('verification_requests').find({}).toArray();
    console.log('📋 Verification Requests:', verifications.length);
    
    if (verifications.length > 0) {
      console.log('\n='.repeat(60));
      verifications.forEach((v, i) => {
        console.log(`\n${i + 1}. Verification Request`);
        console.log('   ID:', v.id);
        console.log('   User ID:', v.user_id);
        console.log('   Status:', v.status);
        console.log('   Voice Score:', v.voice_match_score);
        console.log('   Created:', v.created_at);
      });
    } else {
      console.log('\n⚠️  No verification requests found');
    }
    
    // Check users
    const users = await db.collection('users').find({}).toArray();
    console.log('\n\n👥 Total Users:', users.length);
    
    // Check voice profiles
    const voiceProfiles = await db.collection('voice_profiles').find({}).toArray();
    console.log('🎤 Voice Profiles:', voiceProfiles.length);
    
    // Check documents
    const documents = await db.collection('documents').find({}).toArray();
    console.log('📄 Documents:', documents.length);
    
    await client.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkVerifications();
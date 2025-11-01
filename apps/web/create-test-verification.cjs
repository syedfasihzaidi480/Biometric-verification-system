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

async function createTestVerification() {
  console.log('Creating test verification request...');
  
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('auth');
    const users = db.collection('users');
    const verificationRequests = db.collection('verification_requests');

    // Get a user (use the first regular user, not admin)
    const user = await users.findOne({ 
      role: { $nin: ['admin', 'super_admin'] }
    });

    if (!user) {
      console.log('No regular user found. Creating a test user first...');
      
      const testUserId = `test-user-${Date.now()}`;
      const testAuthUserId = `test-auth-${Date.now()}`;
      
      const testUser = {
        id: testUserId,
        auth_user_id: testAuthUserId,
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-0123',
        date_of_birth: '1990-01-15',
        preferred_language: 'en',
        role: 'user',
        is_approved: false,
        profile_completed: true,
        voice_verified: false,
        face_verified: false,
        document_verified: false,
        admin_approved: false,
        payment_released: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      await users.insertOne(testUser);
      console.log('Test user created:', testUser.email);
      
      // Use the newly created user
      const verificationId = `verification-${Date.now()}`;
      const verification = {
        id: verificationId,
        user_id: testUserId,
        voice_match_score: 0.87,
        liveness_image_url: '/api/placeholder-image.jpg',
        document_url: '/api/placeholder-document.jpg',
        status: 'pending',
        admin_id: null,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      await verificationRequests.insertOne(verification);
      console.log('\n✅ Test verification request created!');
      console.log('Verification ID:', verificationId);
      console.log('User:', testUser.name);
      console.log('Status: pending');
      console.log('\nYou can now see this request in the admin dashboard.');
    } else {
      // Create verification for existing user
      const verificationId = `verification-${Date.now()}`;
      const verification = {
        id: verificationId,
        user_id: user.id,
        voice_match_score: 0.87,
        liveness_image_url: '/api/placeholder-image.jpg',
        document_url: '/api/placeholder-document.jpg',
        status: 'pending',
        admin_id: null,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      await verificationRequests.insertOne(verification);
      console.log('\n✅ Test verification request created!');
      console.log('Verification ID:', verificationId);
      console.log('User:', user.name);
      console.log('Status: pending');
      console.log('\nYou can now see this request in the admin dashboard.');
    }

    // Check total verification requests
    const total = await verificationRequests.countDocuments();
    console.log('\nTotal verification requests in database:', total);

  } catch (error) {
    console.error('Error creating test verification:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

createTestVerification();

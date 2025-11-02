const { MongoClient } = require('mongodb');
const crypto = require('crypto');

const mongoUri = process.env.MONGODB_URI;
const mongoDbName = process.env.MONGODB_DB || 'auth';

// Argon2 hash function (same as used in registration)
async function hashPassword(password) {
  const { hash } = await import('argon2');
  return hash(password);
}

async function createTestUser() {
  const client = new MongoClient(mongoUri);
  
  // User details
  const email = 'fasihzaidi480@gmail.com';
  const password = 'Test123!'; // Change this to your desired password
  const fullName = 'Fasih Zaidi';
  const phone = '+923001234567';
  const pensionNumber = 'PENSION123';
  const dateOfBirth = '1990-01-01';
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(mongoDbName);
    const authUsers = db.collection('auth_users');
    const authAccounts = db.collection('auth_accounts');
    const users = db.collection('users');
    
    // Check if user already exists
    const existingUser = await authUsers.findOne({ email });
    if (existingUser) {
      console.log('\n⚠️  User already exists with email:', email);
      console.log('User ID:', existingUser.id);
      return;
    }
    
    console.log('\n📝 Creating test user...');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Name:', fullName);
    
    // Generate IDs
    const authUserId = crypto.randomUUID();
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    // 1. Create auth_user
    const authUserDoc = {
      id: authUserId,
      name: fullName,
      email,
      emailVerified: null,
      image: null,
      created_at: now,
      updated_at: now,
    };
    await authUsers.insertOne(authUserDoc);
    console.log('✅ Created auth_user');
    
    // 2. Create auth_account with hashed password
    const hashedPassword = await hashPassword(password);
    const authAccountDoc = {
      userId: authUserId,
      provider: 'credentials',
      type: 'credentials',
      providerAccountId: authUserId,
      password: hashedPassword,
      access_token: null,
      expires_at: null,
      refresh_token: null,
      id_token: null,
      scope: null,
      session_state: null,
      token_type: null,
      created_at: now,
      updated_at: now,
    };
    await authAccounts.insertOne(authAccountDoc);
    console.log('✅ Created auth_account with credentials');
    
    // 3. Create user profile
    const userDoc = {
      id: userId,
      auth_user_id: authUserId,
      name: fullName,
      phone,
      pension_number: pensionNumber,
      email,
      date_of_birth: dateOfBirth,
      preferred_language: 'en',
      role: 'user',
      verification_status: 'pending',
      is_active: true,
      created_at: now,
      updated_at: now,
    };
    await users.insertOne(userDoc);
    console.log('✅ Created user profile');
    
    // 4. Create voice profile
    const voiceProfileDoc = {
      id: crypto.randomUUID(),
      user_id: userId,
      enrollment_status: 'not_enrolled',
      enrollment_date: null,
      voice_features: null,
      voice_sample_url: null,
      created_at: now,
      updated_at: now,
    };
    await db.collection('voice_profiles').insertOne(voiceProfileDoc);
    console.log('✅ Created voice profile');
    
    console.log('\n🎉 Test user created successfully!');
    console.log('\n📱 You can now sign in with:');
    console.log('   Email:', email);
    console.log('   Password:', password);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

createTestUser();

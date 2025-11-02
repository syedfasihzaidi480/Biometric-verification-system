const { MongoClient } = require('mongodb');
const crypto = require('crypto');

const mongoUri = process.env.MONGODB_URI;
const mongoDbName = process.env.MONGODB_DB || 'auth';

// Argon2 hash function (same as used in registration)
async function hashPassword(password) {
  const { hash } = await import('argon2');
  return hash(password);
}

async function completeUserSetup() {
  const client = new MongoClient(mongoUri);
  
  // User details (can be overridden via env)
  const email = process.env.EMAIL || 'fasihzaidi480@gmail.com';
  const password = process.env.PASSWORD || 'Test123!'; // Change this to your desired password
  const fullName = process.env.NAME || 'Test User';
  const phone = process.env.PHONE || '+923001234567';
  const pensionNumber = process.env.PENSION || 'PENSION123';
  const dateOfBirth = process.env.DOB || '1990-01-01';
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(mongoDbName);
    const authUsers = db.collection('auth_users');
    const authAccounts = db.collection('auth_accounts');
    const users = db.collection('users');
    const voiceProfiles = db.collection('voice_profiles');
    
    // Find existing auth user
    const authUser = await authUsers.findOne({ email });
    if (!authUser) {
      console.log('\n❌ Auth user not found with email:', email);
      console.log('Please run create-test-user.cjs first');
      return;
    }
    
    console.log('\n✅ Found auth_user:', authUser.id);
    const authUserId = authUser.id;
    const now = new Date().toISOString();
    
    // Check if account exists
    let account = await authAccounts.findOne({ userId: authUserId });
    if (!account) {
      console.log('📝 Creating auth_account with credentials...');
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
      console.log('✅ Created auth_account with password');
    } else if (!account.password) {
      console.log('📝 Updating account with password...');
      const hashedPassword = await hashPassword(password);
      await authAccounts.updateOne(
        { userId: authUserId },
        { $set: { password: hashedPassword, updated_at: now } }
      );
      console.log('✅ Updated account with password');
    } else {
      console.log('✅ Account already has password');
    }
    
    // Check if user profile exists
    let userProfile = await users.findOne({ auth_user_id: authUserId });
    if (!userProfile) {
      console.log('📝 Creating user profile...');
      const userId = crypto.randomUUID();
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
      
      // Create voice profile
      console.log('📝 Creating voice profile...');
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
      await voiceProfiles.insertOne(voiceProfileDoc);
      console.log('✅ Created voice profile');
    } else {
      console.log('✅ User profile already exists');
    }
    
    console.log('\n🎉 User setup completed successfully!');
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

completeUserSetup();

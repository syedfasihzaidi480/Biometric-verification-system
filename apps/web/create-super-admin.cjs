const { MongoClient } = require('mongodb');
const { hash } = require('argon2');
const fs = require('fs');
const path = require('path');

// Load .env file manually
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
const SUPER_ADMIN_EMAIL = 'f219110@cfd.nu.edu.pk';
const SUPER_ADMIN_PASSWORD = 'Fasih@123';
const SUPER_ADMIN_NAME = 'Fasih Zaidi';

async function createSuperAdmin() {
  console.log('Creating super admin account...');
  
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('auth');
    const authUsers = db.collection('auth_users');
    const authAccounts = db.collection('auth_accounts');
    const users = db.collection('users');

    // Check if super admin already exists
    const existing = await authUsers.findOne({ email: SUPER_ADMIN_EMAIL });
    if (existing) {
      console.log('Super admin auth user already exists!');
      const existingUser = await users.findOne({ auth_user_id: existing.id });
      
      if (existingUser) {
        // Update existing user to super_admin
        if (existingUser.role !== 'super_admin' || !existingUser.is_approved) {
          console.log('Updating user to super_admin role...');
          await users.updateOne(
            { auth_user_id: existing.id },
            { 
              $set: { 
                role: 'super_admin',
                is_approved: true,
                updated_at: new Date().toISOString()
              }
            }
          );
          console.log('✅ Updated to super_admin successfully!');
          
          // Update password if needed
          const account = await authAccounts.findOne({ userId: existing.id, provider: 'credentials' });
          if (account) {
            const hashedPassword = await hash(SUPER_ADMIN_PASSWORD);
            await authAccounts.updateOne(
              { userId: existing.id, provider: 'credentials' },
              { $set: { password: hashedPassword } }
            );
            console.log('✅ Password updated!');
          }
          
          const updated = await users.findOne({ auth_user_id: existing.id });
          console.log('Updated user:', updated);
        } else {
          console.log('Super admin already properly configured!');
          console.log('User:', existingUser);
        }
      }
      return;
    }

    const now = new Date().toISOString();
    const authUserId = `super-admin-${Date.now()}`;
    const userId = `user-${Date.now()}`;

    // Hash password
    const hashedPassword = await hash(SUPER_ADMIN_PASSWORD);
    console.log('Password hashed');

    // Create auth_user
    const authUserDoc = {
      id: authUserId,
      name: SUPER_ADMIN_NAME,
      email: SUPER_ADMIN_EMAIL,
      emailVerified: now,
      image: null,
    };
    await authUsers.insertOne(authUserDoc);
    console.log('Created auth_user');

    // Create auth_account
    const authAccountDoc = {
      id: `account-${Date.now()}`,
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
    };
    await authAccounts.insertOne(authAccountDoc);
    console.log('Created auth_account');

    // Create user profile with super_admin role
    const userDoc = {
      id: userId,
      auth_user_id: authUserId,
      name: SUPER_ADMIN_NAME,
      email: SUPER_ADMIN_EMAIL,
      phone: null,
      date_of_birth: null,
      preferred_language: 'en',
      role: 'super_admin',
      is_approved: true,
      profile_completed: true,
      voice_verified: false,
      face_verified: false,
      document_verified: false,
      admin_approved: true,
      payment_released: false,
      created_at: now,
      updated_at: now,
    };
    await users.insertOne(userDoc);
    console.log('Created user profile');

    console.log('\n✅ Super Admin created successfully!');
    console.log('Email:', SUPER_ADMIN_EMAIL);
    console.log('Password:', SUPER_ADMIN_PASSWORD);
    console.log('Role: super_admin');
    console.log('\nYou can now sign in at /admin/signin');

  } catch (error) {
    console.error('Error creating super admin:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

createSuperAdmin();

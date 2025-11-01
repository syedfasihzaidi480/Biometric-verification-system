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
const OLD_EMAIL = 'fasihzaidi480@gmail.com';

async function removeOldSuperAdmin() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('auth');
    const authUsers = db.collection('auth_users');
    const authAccounts = db.collection('auth_accounts');
    const authSessions = db.collection('auth_sessions');
    const users = db.collection('users');
    
    // Find the old super admin
    const oldAuthUser = await authUsers.findOne({ email: OLD_EMAIL });
    
    if (!oldAuthUser) {
      console.log('Old super admin not found with email:', OLD_EMAIL);
      return;
    }
    
    console.log('\nRemoving old super admin:', OLD_EMAIL);
    console.log('Auth User ID:', oldAuthUser.id);
    
    // Delete from all collections
    const deleteResults = {
      users: await users.deleteMany({ auth_user_id: oldAuthUser.id }),
      authUsers: await authUsers.deleteMany({ id: oldAuthUser.id }),
      authAccounts: await authAccounts.deleteMany({ userId: oldAuthUser.id }),
      authSessions: await authSessions.deleteMany({ userId: oldAuthUser.id }),
    };
    
    console.log('\nDeleted:');
    console.log('- Users:', deleteResults.users.deletedCount);
    console.log('- Auth Users:', deleteResults.authUsers.deletedCount);
    console.log('- Auth Accounts:', deleteResults.authAccounts.deletedCount);
    console.log('- Auth Sessions:', deleteResults.authSessions.deletedCount);
    console.log('\n✅ Old super admin removed successfully!');
    
    await client.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

removeOldSuperAdmin();

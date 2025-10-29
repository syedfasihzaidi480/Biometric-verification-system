/**
 * Database Check Script
 * Run this to verify what's in your MongoDB database
 * 
 * Usage: node check-database.js
 */

import { MongoClient } from 'mongodb';

// PASTE YOUR MONGODB_URI HERE
const MONGODB_URI = "mongodb+srv://mamadoukkeita_db_user:y6otEOBIzNIs7iAm@biometricverificationsy.f96ecuj.mongodb.net/?retryWrites=true&w=majority&appName=BiometricVerificationSystem";
const MONGODB_DB = 'auth';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env file');
  process.exit(1);
}

async function checkDatabase() {
  console.log('🔍 Connecting to MongoDB...\n');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(MONGODB_DB);
    
    console.log(`✅ Connected to database: ${MONGODB_DB}\n`);
    console.log('=' .repeat(60));
    
    // Check users collection
    console.log('\n📁 USERS COLLECTION:');
    const users = await db.collection('users').find({}).toArray();
    console.log(`   Count: ${users.length}`);
    if (users.length > 0) {
      users.forEach((user, i) => {
        console.log(`\n   User ${i + 1}:`);
        console.log(`   - ID: ${user.id}`);
        console.log(`   - Name: ${user.name}`);
        console.log(`   - Email: ${user.email}`);
        console.log(`   - Phone: ${user.phone}`);
        console.log(`   - Pension: ${user.pension_number}`);
      });
    }
    
    // Check auth_users collection
    console.log('\n\n📁 AUTH_USERS COLLECTION:');
    const authUsers = await db.collection('auth_users').find({}).toArray();
    console.log(`   Count: ${authUsers.length}`);
    if (authUsers.length > 0) {
      authUsers.forEach((user, i) => {
        console.log(`\n   Auth User ${i + 1}:`);
        console.log(`   - ID: ${user.id}`);
        console.log(`   - Email: ${user.email}`);
        console.log(`   - Name: ${user.name}`);
      });
    }
    
    // Check auth_accounts collection
    console.log('\n\n📁 AUTH_ACCOUNTS COLLECTION:');
    const authAccounts = await db.collection('auth_accounts').find({}).toArray();
    console.log(`   Count: ${authAccounts.length}`);
    if (authAccounts.length > 0) {
      authAccounts.forEach((account, i) => {
        console.log(`\n   Account ${i + 1}:`);
        console.log(`   - User ID: ${account.userId}`);
        console.log(`   - Provider: ${account.provider}`);
        console.log(`   - Has Password: ${account.password ? '✅ YES' : '❌ NO'}`);
        if (account.password) {
          console.log(`   - Password Hash: ${account.password.substring(0, 30)}...`);
        }
      });
    }
    
    // Check voice_profiles collection
    console.log('\n\n📁 VOICE_PROFILES COLLECTION:');
    const voiceProfiles = await db.collection('voice_profiles').find({}).toArray();
    console.log(`   Count: ${voiceProfiles.length}`);
    
    // Check audit_logs collection
    console.log('\n\n📁 AUDIT_LOGS COLLECTION:');
    const auditLogs = await db.collection('audit_logs')
      .find({ action: 'USER_REGISTERED' })
      .toArray();
    console.log(`   Registration Events: ${auditLogs.length}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Database check complete!\n');
    
    // Analysis
    console.log('📊 ANALYSIS:');
    if (users.length > 0 && authUsers.length === 0) {
      console.log('   ⚠️  WARNING: Users exist but no auth_users found!');
      console.log('   → This means registration happened BEFORE the fix');
      console.log('   → Solution: Delete users and re-register');
    } else if (authUsers.length > 0 && authAccounts.length === 0) {
      console.log('   ⚠️  WARNING: Auth users exist but no auth_accounts!');
      console.log('   → Credentials are missing');
      console.log('   → Solution: Delete and re-register');
    } else if (users.length === authUsers.length && authUsers.length === authAccounts.length) {
      console.log('   ✅ All collections are in sync!');
      console.log('   → Sign-in should work');
    } else {
      console.log('   ⚠️  WARNING: Collection counts don\'t match!');
      console.log(`   → users: ${users.length}`);
      console.log(`   → auth_users: ${authUsers.length}`);
      console.log(`   → auth_accounts: ${authAccounts.length}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from database\n');
  }
}

checkDatabase().catch(console.error);

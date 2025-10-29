/**
 * Database Cleanup Script
 * Deletes ALL test data from MongoDB
 * 
 * Usage: node cleanup-database.js
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = "mongodb+srv://mamadoukkeita_db_user:y6otEOBIzNIs7iAm@biometricverificationsy.f96ecuj.mongodb.net/?retryWrites=true&w=majority&appName=BiometricVerificationSystem";
const MONGODB_DB = 'auth';

async function cleanupDatabase() {
  console.log('🧹 Connecting to MongoDB...\n');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(MONGODB_DB);
    
    console.log(`✅ Connected to database: ${MONGODB_DB}\n`);
    console.log('⚠️  WARNING: This will delete ALL test data!\n');
    
    // Delete all collections
    console.log('Deleting from users...');
    const usersResult = await db.collection('users').deleteMany({});
    console.log(`✅ Deleted ${usersResult.deletedCount} users`);
    
    console.log('\nDeleting from auth_users...');
    const authUsersResult = await db.collection('auth_users').deleteMany({});
    console.log(`✅ Deleted ${authUsersResult.deletedCount} auth users`);
    
    console.log('\nDeleting from auth_accounts...');
    const authAccountsResult = await db.collection('auth_accounts').deleteMany({});
    console.log(`✅ Deleted ${authAccountsResult.deletedCount} auth accounts`);
    
    console.log('\nDeleting from voice_profiles...');
    const voiceProfilesResult = await db.collection('voice_profiles').deleteMany({});
    console.log(`✅ Deleted ${voiceProfilesResult.deletedCount} voice profiles`);
    
    console.log('\nDeleting registration audit logs...');
    const auditLogsResult = await db.collection('audit_logs').deleteMany({ 
      action: 'USER_REGISTERED' 
    });
    console.log(`✅ Deleted ${auditLogsResult.deletedCount} audit logs`);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Database cleanup complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Make sure web server is running: npm run dev');
    console.log('   2. Register a NEW account with email and password');
    console.log('   3. Sign in with the same credentials');
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from database\n');
  }
}

cleanupDatabase().catch(console.error);

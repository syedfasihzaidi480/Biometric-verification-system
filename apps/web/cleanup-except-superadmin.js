/**
 * Database Cleanup Script - Keep Super Admin Only
 * Deletes ALL users and their related data EXCEPT the super admin
 * 
 * Usage: node cleanup-except-superadmin.js
 */

import { MongoClient } from 'mongodb';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
function loadEnv() {
  try {
    const envPath = join(__dirname, '.env');
    const envFile = readFileSync(envPath, 'utf8');
    
    envFile.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...values] = trimmedLine.split('=');
        if (key) {
          process.env[key.trim()] = values.join('=').trim();
        }
      }
    });
  } catch (error) {
    console.log('⚠️  Could not load .env file, using environment variables');
  }
}

loadEnv();

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'auth';
const SUPER_ADMIN_EMAIL = 'f219110@cfd.nu.edu.pk';

async function cleanupExceptSuperAdmin() {
  console.log('🧹 Connecting to MongoDB...\n');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(MONGODB_DB);
    
    console.log(`✅ Connected to database: ${MONGODB_DB}\n`);
    console.log('⚠️  WARNING: This will delete ALL user data EXCEPT super admin!\n');
    
    // Step 1: Find the super admin
    console.log('🔍 Finding super admin...');
    const superAdmin = await db.collection('users').findOne({ 
      email: SUPER_ADMIN_EMAIL,
      role: 'super_admin'
    });
    
    if (!superAdmin) {
      console.log('❌ Super admin not found! Please create super admin first.');
      console.log('   Run: node create-super-admin.cjs');
      return;
    }
    
    console.log(`✅ Found super admin: ${superAdmin.email}`);
    console.log(`   Auth User ID: ${superAdmin.auth_user_id}\n`);
    
    const superAdminAuthId = superAdmin.auth_user_id;
    
    // Step 2: Count documents before deletion
    console.log('📊 Current database state:');
    const userCount = await db.collection('users').countDocuments();
    const authUserCount = await db.collection('auth_users').countDocuments();
    const authAccountCount = await db.collection('auth_accounts').countDocuments();
    const voiceProfileCount = await db.collection('voice_profiles').countDocuments();
    const verificationRequestCount = await db.collection('verification_requests').countDocuments();
    const documentCount = await db.collection('documents').countDocuments();
    const auditLogCount = await db.collection('audit_logs').countDocuments();
    const sessionCount = await db.collection('auth_sessions').countDocuments();
    const verificationTokenCount = await db.collection('auth_verification_tokens').countDocuments();
    
    console.log(`   • Users: ${userCount}`);
    console.log(`   • Auth Users: ${authUserCount}`);
    console.log(`   • Auth Accounts: ${authAccountCount}`);
    console.log(`   • Voice Profiles: ${voiceProfileCount}`);
    console.log(`   • Verification Requests: ${verificationRequestCount}`);
    console.log(`   • Documents: ${documentCount}`);
    console.log(`   • Audit Logs: ${auditLogCount}`);
    console.log(`   • Sessions: ${sessionCount}`);
    console.log(`   • Verification Tokens: ${verificationTokenCount}\n`);
    
    // Step 3: Delete all users except super admin
    console.log('🗑️  Deleting users (except super admin)...');
    const usersResult = await db.collection('users').deleteMany({
      auth_user_id: { $ne: superAdminAuthId }
    });
    console.log(`✅ Deleted ${usersResult.deletedCount} users`);
    
    // Step 4: Delete all auth_users except super admin
    console.log('\n🗑️  Deleting auth_users (except super admin)...');
    const authUsersResult = await db.collection('auth_users').deleteMany({
      id: { $ne: superAdminAuthId }
    });
    console.log(`✅ Deleted ${authUsersResult.deletedCount} auth users`);
    
    // Step 5: Delete all auth_accounts except super admin
    console.log('\n🗑️  Deleting auth_accounts (except super admin)...');
    const authAccountsResult = await db.collection('auth_accounts').deleteMany({
      userId: { $ne: superAdminAuthId }
    });
    console.log(`✅ Deleted ${authAccountsResult.deletedCount} auth accounts`);
    
    // Step 6: Delete all voice profiles
    console.log('\n🗑️  Deleting all voice profiles...');
    const voiceProfilesResult = await db.collection('voice_profiles').deleteMany({});
    console.log(`✅ Deleted ${voiceProfilesResult.deletedCount} voice profiles`);
    
    // Step 7: Delete all sessions except super admin
    console.log('\n🗑️  Deleting sessions (except super admin)...');
    const sessionsResult = await db.collection('auth_sessions').deleteMany({
      userId: { $ne: superAdminAuthId }
    });
    console.log(`✅ Deleted ${sessionsResult.deletedCount} sessions`);
    
    // Step 8: Delete all verification tokens
    console.log('\n🗑️  Deleting all verification tokens...');
    const tokensResult = await db.collection('auth_verification_tokens').deleteMany({});
    console.log(`✅ Deleted ${tokensResult.deletedCount} verification tokens`);
    
    // Step 9: Delete all verification requests
    console.log('\n🗑️  Deleting all verification requests...');
    const verificationRequestsResult = await db.collection('verification_requests').deleteMany({});
    console.log(`✅ Deleted ${verificationRequestsResult.deletedCount} verification requests`);
    
    // Step 10: Delete all documents
    console.log('\n🗑️  Deleting all documents...');
    const documentsResult = await db.collection('documents').deleteMany({});
    console.log(`✅ Deleted ${documentsResult.deletedCount} documents`);
    
    // Step 11: Delete audit logs (except super admin actions)
    console.log('\n🗑️  Deleting audit logs (except super admin)...');
    const auditLogsResult = await db.collection('audit_logs').deleteMany({
      user_id: { $ne: superAdmin.id }
    });
    console.log(`✅ Deleted ${auditLogsResult.deletedCount} audit logs`);
    
    // Step 12: Verify remaining data
    console.log('\n📊 Final database state:');
    const remainingUsers = await db.collection('users').countDocuments();
    const remainingAuthUsers = await db.collection('auth_users').countDocuments();
    const remainingAuthAccounts = await db.collection('auth_accounts').countDocuments();
    const remainingVoiceProfiles = await db.collection('voice_profiles').countDocuments();
    const remainingVerificationRequests = await db.collection('verification_requests').countDocuments();
    const remainingDocuments = await db.collection('documents').countDocuments();
    const remainingAuditLogs = await db.collection('audit_logs').countDocuments();
    const remainingSessions = await db.collection('auth_sessions').countDocuments();
    const remainingTokens = await db.collection('auth_verification_tokens').countDocuments();
    
    console.log(`   • Users: ${remainingUsers} (should be 1)`);
    console.log(`   • Auth Users: ${remainingAuthUsers} (should be 1)`);
    console.log(`   • Auth Accounts: ${remainingAuthAccounts} (should be 1+)`);
    console.log(`   • Voice Profiles: ${remainingVoiceProfiles} (should be 0)`);
    console.log(`   • Verification Requests: ${remainingVerificationRequests} (should be 0)`);
    console.log(`   • Documents: ${remainingDocuments} (should be 0)`);
    console.log(`   • Audit Logs: ${remainingAuditLogs}`);
    console.log(`   • Sessions: ${remainingSessions}`);
    console.log(`   • Verification Tokens: ${remainingTokens} (should be 0)\n`);
    
    // Step 13: Show remaining super admin
    const remainingSuperAdmin = await db.collection('users').findOne({ 
      auth_user_id: superAdminAuthId 
    });
    
    console.log('✅ Super Admin preserved:');
    console.log(`   • Name: ${remainingSuperAdmin.name}`);
    console.log(`   • Email: ${remainingSuperAdmin.email}`);
    console.log(`   • Role: ${remainingSuperAdmin.role}`);
    console.log(`   • Approved: ${remainingSuperAdmin.is_approved}`);
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ Database cleanup complete!');
    console.log('\n📝 Summary:');
    console.log(`   • Deleted ${usersResult.deletedCount} users`);
    console.log(`   • Deleted ${authUsersResult.deletedCount} auth users`);
    console.log(`   • Deleted ${authAccountsResult.deletedCount} auth accounts`);
    console.log(`   • Deleted ${voiceProfilesResult.deletedCount} voice profiles`);
    console.log(`   • Deleted ${verificationRequestsResult.deletedCount} verification requests`);
    console.log(`   • Deleted ${documentsResult.deletedCount} documents`);
    console.log(`   • Deleted ${auditLogsResult.deletedCount} audit logs`);
    console.log(`   • Deleted ${sessionsResult.deletedCount} sessions`);
    console.log(`   • Deleted ${tokensResult.deletedCount} verification tokens`);
    console.log('\n🎉 Only super admin remains in the database!');
    console.log('='.repeat(70) + '\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from database\n');
  }
}

// Run with confirmation
console.log('\n⚠️  WARNING: This will delete ALL users and their data EXCEPT super admin!\n');
console.log('Super Admin Email:', SUPER_ADMIN_EMAIL);
console.log('\nPress Ctrl+C within 5 seconds to cancel...\n');

setTimeout(() => {
  cleanupExceptSuperAdmin()
    .then(() => {
      console.log('✨ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}, 5000);

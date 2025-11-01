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

async function createIndexes() {
  console.log('Creating database indexes for better performance...\n');
  
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB\n');

    const db = client.db('auth');

    // Users collection indexes
    console.log('Creating indexes for users collection...');
    const users = db.collection('users');
    await users.createIndex({ id: 1 }, { unique: true });
    await users.createIndex({ email: 1 });
    await users.createIndex({ phone: 1 });
    await users.createIndex({ name: 1 });
    await users.createIndex({ auth_user_id: 1 });
    await users.createIndex({ role: 1 });
    await users.createIndex({ admin_approved: 1 });
    await users.createIndex({ created_at: -1 });
    await users.createIndex({ name: 'text', email: 'text', phone: 'text' }); // Text search
    console.log('✓ Users indexes created\n');

    // Verification requests collection indexes
    console.log('Creating indexes for verification_requests collection...');
    const verificationRequests = db.collection('verification_requests');
    await verificationRequests.createIndex({ id: 1 }, { unique: true });
    await verificationRequests.createIndex({ user_id: 1 });
    await verificationRequests.createIndex({ status: 1 });
    await verificationRequests.createIndex({ created_at: -1 });
    await verificationRequests.createIndex({ admin_id: 1 });
    console.log('✓ Verification requests indexes created\n');

    // Voice profiles collection indexes
    console.log('Creating indexes for voice_profiles collection...');
    const voiceProfiles = db.collection('voice_profiles');
    await voiceProfiles.createIndex({ id: 1 }, { unique: true });
    await voiceProfiles.createIndex({ user_id: 1 }, { unique: true });
    await voiceProfiles.createIndex({ is_enrolled: 1 });
    console.log('✓ Voice profiles indexes created\n');

    // Documents collection indexes
    console.log('Creating indexes for documents collection...');
    const documents = db.collection('documents');
    await documents.createIndex({ id: 1 }, { unique: true });
    await documents.createIndex({ user_id: 1 });
    await documents.createIndex({ type: 1 });
    await documents.createIndex({ uploaded_at: -1 });
    console.log('✓ Documents indexes created\n');

    // Auth users collection indexes
    console.log('Creating indexes for auth_users collection...');
    const authUsers = db.collection('auth_users');
    await authUsers.createIndex({ id: 1 }, { unique: true });
    await authUsers.createIndex({ email: 1 }, { unique: true });
    console.log('✓ Auth users indexes created\n');

    // Auth accounts collection indexes
    console.log('Creating indexes for auth_accounts collection...');
    const authAccounts = db.collection('auth_accounts');
    await authAccounts.createIndex({ userId: 1 });
    await authAccounts.createIndex({ provider: 1 });
    await authAccounts.createIndex({ providerAccountId: 1 });
    await authAccounts.createIndex({ userId: 1, provider: 1 }, { unique: true });
    console.log('✓ Auth accounts indexes created\n');

    // Audit logs collection indexes
    console.log('Creating indexes for audit_logs collection...');
    const auditLogs = db.collection('audit_logs');
    await auditLogs.createIndex({ id: 1 }, { unique: true });
    await auditLogs.createIndex({ user_id: 1 });
    await auditLogs.createIndex({ admin_id: 1 });
    await auditLogs.createIndex({ timestamp: -1 });
    await auditLogs.createIndex({ action: 1 });
    console.log('✓ Audit logs indexes created\n');

    console.log('═'.repeat(60));
    console.log('✅ All indexes created successfully!');
    console.log('═'.repeat(60));
    console.log('\n📈 Performance should be significantly improved now!\n');

    // Show collection stats
    console.log('Collection Statistics:');
    const collections = ['users', 'verification_requests', 'voice_profiles', 'documents'];
    for (const collName of collections) {
      const count = await db.collection(collName).countDocuments();
      console.log(`  ${collName}: ${count} documents`);
    }

  } catch (error) {
    console.error('❌ Error creating indexes:', error.message);
  } finally {
    await client.close();
    console.log('\n✓ Disconnected from MongoDB');
  }
}

createIndexes();

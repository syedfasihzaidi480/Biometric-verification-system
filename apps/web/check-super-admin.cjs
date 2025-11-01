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

async function checkSuperAdmin() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db('auth');
    
    // Get super admin from users collection
    const user = await db.collection('users').findOne({ role: 'super_admin' });
    console.log('Super Admin User:');
    console.log('- Email:', user?.email);
    console.log('- Auth User ID:', user?.auth_user_id);
    console.log('- Role:', user?.role);
    console.log('- Approved:', user?.is_approved);
    console.log('');
    
    // Get auth_user
    const authUser = await db.collection('auth_users').findOne({ id: user?.auth_user_id });
    console.log('Auth User:');
    console.log('- ID:', authUser?.id);
    console.log('- Email:', authUser?.email);
    console.log('');
    
    // Get account with password
    const account = await db.collection('auth_accounts').findOne({ 
      userId: user?.auth_user_id,
      provider: 'credentials'
    });
    console.log('Auth Account:');
    console.log('- User ID:', account?.userId);
    console.log('- Provider:', account?.provider);
    console.log('- Has Password:', !!account?.password);
    console.log('- Password Hash (first 50 chars):', account?.password?.substring(0, 50));
    
    await client.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkSuperAdmin();

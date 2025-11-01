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

async function listAdmins() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db('auth');
    const users = await db.collection('users').find({
      role: { $in: ['admin', 'super_admin'] }
    }).toArray();
    
    console.log('Total admin/super_admin accounts:', users.length);
    console.log('='.repeat(60));
    
    for (let i = 0; i < users.length; i++) {
      const u = users[i];
      console.log(`\n${i + 1}. Email: ${u.email}`);
      console.log(`   Role: ${u.role}`);
      console.log(`   Approved: ${u.is_approved}`);
      console.log(`   Auth User ID: ${u.auth_user_id}`);
      console.log(`   Created: ${u.created_at}`);
    }
    
    await client.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

listAdmins();

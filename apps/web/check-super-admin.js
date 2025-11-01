// Check super admin password hash
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkSuperAdmin() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db(process.env.MONGODB_DB || 'auth');
    
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
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkSuperAdmin();

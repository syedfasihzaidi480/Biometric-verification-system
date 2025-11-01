const { MongoClient } = require('mongodb');

const mongoUri = process.env.MONGODB_URI;
const mongoDbName = process.env.MONGODB_DB || 'auth';

async function checkAuthAccount() {
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(mongoDbName);
    
    // Find auth_user
    const authUser = await db.collection('auth_users').findOne({ 
      email: 'fasihzaidi480@gmail.com' 
    });
    
    console.log('\nAuth User:', authUser);
    
    if (authUser) {
      // Find account
      const account = await db.collection('auth_accounts').findOne({ 
        userId: authUser.id 
      });
      
      console.log('\nAccount:', {
        ...account,
        password: account?.password ? `***HASH (${account.password.length} chars)***` : 'MISSING'
      });
      
      if (!account) {
        console.log('\n⚠️ WARNING: No account found for this user!');
      } else if (!account.password) {
        console.log('\n⚠️ WARNING: Account has no password!');
      } else {
        console.log('\n✅ Account has password hash');
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

checkAuthAccount();

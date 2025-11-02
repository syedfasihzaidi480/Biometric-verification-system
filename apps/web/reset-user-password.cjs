const { MongoClient } = require('mongodb');

const mongoUri = process.env.MONGODB_URI;
const mongoDbName = process.env.MONGODB_DB || 'auth';

async function hashPassword(password) {
  const { hash } = await import('argon2');
  return hash(password);
}

async function resetPassword() {
  const email = process.env.EMAIL;
  const newPassword = process.env.PASSWORD || 'Test123!';

  if (!email) {
    console.error('Please provide EMAIL env, e.g. EMAIL=user@example.com');
    process.exit(1);
  }

  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const db = client.db(mongoDbName);
    const authUsers = db.collection('auth_users');
    const authAccounts = db.collection('auth_accounts');

    const authUser = await authUsers.findOne({ email });
    if (!authUser) {
      console.error('User not found for email:', email);
      process.exit(2);
    }

    const hashed = await hashPassword(newPassword);
    const now = new Date().toISOString();

    const res = await authAccounts.updateOne(
      { userId: authUser.id, provider: 'credentials' },
      { $set: { password: hashed, updated_at: now } }
    );

    if (res.matchedCount === 0) {
      console.error('No credentials account found to update');
      process.exit(3);
    }

    console.log('Password reset successfully for', email);
    console.log('New password:', newPassword);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await client.close();
  }
}

resetPassword();

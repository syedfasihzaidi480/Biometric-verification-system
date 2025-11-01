/**
 * Clear all MongoDB collections
 * WARNING: This will delete ALL data from the database
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

async function clearAllCollections() {
  console.log('🔌 Connecting to MongoDB...');
  console.log('URI:', process.env.MONGODB_URI);
  console.log('Database:', process.env.MONGODB_DB || 'auth');
  
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db(process.env.MONGODB_DB || 'auth');
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    console.log(`📋 Found ${collections.length} collections:\n`);
    
    if (collections.length === 0) {
      console.log('⚠️  No collections found. Database is already empty.\n');
      return;
    }
    
    // List collections before deletion
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`   • ${collection.name}: ${count} documents`);
    }
    
    console.log('\n🗑️  Starting deletion...\n');
    
    // Delete all documents from each collection
    let totalDeleted = 0;
    for (const collection of collections) {
      const collectionName = collection.name;
      const result = await db.collection(collectionName).deleteMany({});
      console.log(`   ✓ Deleted ${result.deletedCount} documents from '${collectionName}'`);
      totalDeleted += result.deletedCount;
    }
    
    console.log(`\n✅ Successfully deleted ${totalDeleted} documents from ${collections.length} collections`);
    console.log('\n📊 Final state:');
    
    // Verify deletion
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`   • ${collection.name}: ${count} documents`);
    }
    
    console.log('\n✨ MongoDB is now clean and ready for fresh data!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB\n');
  }
}

// Run the script
console.log('\n⚠️  WARNING: This will delete ALL data from MongoDB!\n');
console.log('Press Ctrl+C within 3 seconds to cancel...\n');

setTimeout(() => {
  clearAllCollections()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}, 3000);

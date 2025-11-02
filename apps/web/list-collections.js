import { MongoClient } from 'mongodb';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
    console.log('Using environment variables');
  }
}

loadEnv();

async function listCollections() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'auth');
    
    console.log('\n📁 Database Collections:\n');
    
    const collections = await db.listCollections().toArray();
    
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`   • ${col.name}: ${count} documents`);
    }
    
    console.log('\n');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

listCollections();

#!/usr/bin/env node

/**
 * Environment Variable Diagnostic Script
 * Run this to see what's configured in your environment
 */

console.log('\n🔍 Environment Variable Diagnostic\n');
console.log('='.repeat(50));

const checks = [
  { name: 'DATABASE_URL', required: false, expected: 'SHOULD BE EMPTY OR NOT SET' },
  { name: 'MONGODB_URI', required: true, expected: 'mongodb+srv://...' },
  { name: 'MONGODB_DB', required: false, expected: 'auth' },
  { name: 'AUTH_SECRET', required: true, expected: '<secret>' },
  { name: 'AUTH_URL', required: true, expected: 'https://...' },
  { name: 'CLOUDINARY_CLOUD_NAME', required: true, expected: 'dzzaebsfc' },
  { name: 'CLOUDINARY_API_KEY', required: true, expected: '541276445497123' },
  { name: 'CLOUDINARY_API_SECRET', required: true, expected: '<secret>' },
  { name: 'NODE_ENV', required: false, expected: 'production' },
];

let hasIssues = false;

checks.forEach(({ name, required, expected }) => {
  const value = process.env[name];
  const isSet = value !== undefined && value !== '';
  
  let status = '✅';
  let message = 'OK';
  
  if (name === 'DATABASE_URL') {
    // Special case: DATABASE_URL should NOT be set for MongoDB
    if (isSet) {
      status = '❌';
      message = `PROBLEM! Set to: "${value.substring(0, 30)}..." - THIS CAUSES THE NEON ERROR!`;
      hasIssues = true;
    } else {
      status = '✅';
      message = 'Not set (correct for MongoDB)';
    }
  } else if (required && !isSet) {
    status = '❌';
    message = 'MISSING!';
    hasIssues = true;
  } else if (!isSet) {
    status = '⚠️';
    message = `Not set (optional, expected: ${expected})`;
  } else {
    // Mask sensitive values
    const displayValue = name.includes('SECRET') || name.includes('PASSWORD') || name === 'MONGODB_URI'
      ? `${value.substring(0, 20)}...${value.substring(value.length - 10)}`
      : value;
    message = `Set to: ${displayValue}`;
  }
  
  console.log(`\n${status} ${name}`);
  console.log(`   ${message}`);
});

console.log('\n' + '='.repeat(50));

if (hasIssues) {
  console.log('\n❌ ISSUES FOUND!');
  console.log('\n⚠️  CRITICAL: If DATABASE_URL is set, you must remove it from Railway!');
  console.log('   This is causing the Neon PostgreSQL error.\n');
  console.log('📍 Go to: Railway Dashboard → Service → Variables → Delete DATABASE_URL\n');
  process.exit(1);
} else {
  console.log('\n✅ All environment variables look good!\n');
  
  // Test database connection
  if (process.env.MONGODB_URI) {
    console.log('🔌 MongoDB URI is configured');
    console.log('   Database: ' + (process.env.MONGODB_DB || 'auth'));
  }
  
  process.exit(0);
}

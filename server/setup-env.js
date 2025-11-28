import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env');

// Generate random secrets
const jwtSecret = crypto.randomBytes(64).toString('hex');
const jwtRefreshSecret = crypto.randomBytes(64).toString('hex');

console.log('🔐 Generating JWT secrets...\n');

// Read existing .env file
let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
  console.log('✅ Found existing .env file');
} else {
  console.log('⚠️  No .env file found, creating new one...');
}

// Check if secrets already exist
const hasJwtSecret = envContent.includes('JWT_SECRET=');
const hasJwtRefreshSecret = envContent.includes('JWT_REFRESH_SECRET=');

if (hasJwtSecret && hasJwtRefreshSecret) {
  console.log('✅ JWT secrets already exist in .env');
  console.log('   If you want to regenerate them, remove the lines and run this script again.\n');
} else {
  // Add or update secrets
  let updatedContent = envContent;
  
  if (!hasJwtSecret) {
    updatedContent += `\nJWT_SECRET=${jwtSecret}`;
    console.log('✅ Added JWT_SECRET');
  } else {
    console.log('⚠️  JWT_SECRET already exists, skipping...');
  }
  
  if (!hasJwtRefreshSecret) {
    updatedContent += `\nJWT_REFRESH_SECRET=${jwtRefreshSecret}`;
    console.log('✅ Added JWT_REFRESH_SECRET');
  } else {
    console.log('⚠️  JWT_REFRESH_SECRET already exists, skipping...');
  }
  
  // Ensure CLIENT_URL is set
  if (!envContent.includes('CLIENT_URL=')) {
    updatedContent += `\nCLIENT_URL=http://localhost:5173`;
    console.log('✅ Added CLIENT_URL');
  }
  
  // Write back to file
  fs.writeFileSync(envPath, updatedContent.trim() + '\n', 'utf8');
  console.log('\n✅ .env file updated successfully!');
  console.log('   Please restart your server for changes to take effect.\n');
}


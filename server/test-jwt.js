import dotenv from 'dotenv';
import { generateTokens } from './src/utils/jwt.js';

dotenv.config();

console.log('🔐 Testing JWT token generation...\n');

console.log('Environment check:');
console.log('  JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set (' + process.env.JWT_SECRET.substring(0, 20) + '...)' : '❌ Missing');
console.log('  JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET ? '✅ Set (' + process.env.JWT_REFRESH_SECRET.substring(0, 20) + '...)' : '❌ Missing');
console.log('');

try {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set');
  }
  
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET is not set');
  }
  
  const { accessToken, refreshToken } = generateTokens('test-user-id');
  console.log('✅ Token generation successful!');
  console.log('  Access Token:', accessToken.substring(0, 50) + '...');
  console.log('  Refresh Token:', refreshToken.substring(0, 50) + '...');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}


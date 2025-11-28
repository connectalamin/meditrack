import dotenv from 'dotenv';
dotenv.config();

const API_URL = 'http://localhost:5000/api';

async function testLogin() {
  try {
    console.log('🧪 Testing login endpoint...\n');
    
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'demo@meditrack.com',
        password: 'password123'
      })
    });

    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      console.error('❌ Login failed');
      return;
    }
    
    console.log('✅ Login successful!');
    console.log('Access Token:', data.accessToken ? 'Present' : 'Missing');
    console.log('Device Token:', data.deviceToken ? 'Present' : 'Missing');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
  }
}

testLogin();


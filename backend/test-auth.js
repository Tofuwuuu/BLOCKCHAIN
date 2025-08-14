import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3002';

async function testAuth() {
  console.log('🧪 Testing Authentication System...\n');

  try {
    // Test login
    console.log('1. Testing login with admin/admin...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin'
      })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login successful!');
      console.log('User:', loginData.user);
      console.log('Token:', loginData.token.substring(0, 20) + '...');
      
      // Test getting user info with token
      console.log('\n2. Testing get current user...');
      const userResponse = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${loginData.token}`
        }
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        console.log('✅ Get user successful!');
        console.log('User data:', userData);
      } else {
        console.log('❌ Get user failed:', userResponse.status);
      }

      // Test logout
      console.log('\n3. Testing logout...');
      const logoutResponse = await fetch(`${BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${loginData.token}`
        }
      });

      if (logoutResponse.ok) {
        console.log('✅ Logout successful!');
      } else {
        console.log('❌ Logout failed:', logoutResponse.status);
      }

    } else {
      console.log('❌ Login failed:', loginResponse.status);
      const errorData = await loginResponse.json();
      console.log('Error:', errorData);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }

  console.log('\n🎉 Authentication test completed!');
}

testAuth();

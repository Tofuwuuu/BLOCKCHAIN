import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testEndpoints() {
  console.log('🧪 Testing Backend Endpoints...\n');

  const tests = [
    { name: 'Health Check', url: '/health', method: 'GET' },
    { name: 'API Stats', url: '/api/stats', method: 'GET' },
    { name: 'Blockchain Chain', url: '/chain', method: 'GET' },
    { name: 'Peers', url: '/peers', method: 'GET' },
    { name: 'Status', url: '/status', method: 'GET' },
    { name: 'Contracts', url: '/contracts', method: 'GET' },
    { name: 'Suppliers', url: '/api/suppliers', method: 'GET' },
    { name: 'Orders', url: '/api/orders', method: 'GET' },
    { name: 'Inventory', url: '/api/inventory', method: 'GET' },
    { name: 'Products', url: '/api/products', method: 'GET' }
  ];

  for (const test of tests) {
    try {
      console.log(`Testing ${test.name}...`);
      const response = await fetch(`${BASE_URL}${test.url}`, { method: test.method });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${test.name}: SUCCESS (${response.status})`);
        console.log(`   Data: ${JSON.stringify(data).substring(0, 100)}...`);
      } else {
        console.log(`❌ ${test.name}: FAILED (${response.status})`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR - ${error.message}`);
    }
    console.log('');
  }

  // Test authentication
  console.log('Testing Authentication...');
  try {
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin' })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login: SUCCESS');
      console.log(`   User: ${loginData.user.username}`);
    } else {
      console.log('❌ Login: FAILED');
    }
  } catch (error) {
    console.log(`❌ Login: ERROR - ${error.message}`);
  }
}

testEndpoints().catch(console.error);

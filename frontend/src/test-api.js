// Test API connection
const testAPI = async () => {
  try {
    console.log('Testing API connection...');
    
    // Test health endpoint
    const healthResponse = await fetch('/health');
    console.log('Health endpoint:', healthResponse.status, await healthResponse.text());
    
    // Test login endpoint
    const loginResponse = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin'
      })
    });
    console.log('Login endpoint:', loginResponse.status, await loginResponse.text());
    
  } catch (error) {
    console.error('API test failed:', error);
  }
};

// Run test
testAPI();

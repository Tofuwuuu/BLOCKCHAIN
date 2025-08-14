console.log('🧪 Testing Authentication with PowerShell...\n');

// Test health endpoint
console.log('1. Testing health endpoint...');
console.log('Run: Invoke-WebRequest -Uri "http://localhost:3002/health" -Method GET');

// Test login
console.log('\n2. Testing login...');
console.log('Run: Invoke-WebRequest -Uri "http://localhost:3002/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body \'{"username":"admin","password":"admin"}\'');

console.log('\n🎉 Test instructions completed!');
console.log('Make sure the server is running with: node simple-server.js');

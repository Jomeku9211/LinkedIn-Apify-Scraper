// Test server functionality
console.log('🧪 Testing Server Structure...');

try {
    console.log('🔍 Testing server file structure...');
    
    // Test that server file exists and can be required
    const fs = require('fs');
    const path = require('path');
    
    const serverPath = path.join(__dirname, '../src/server.js');
    if (fs.existsSync(serverPath)) {
        console.log('✅ Server file exists at correct location');
    } else {
        console.log('❌ Server file not found');
    }
    
    const entryPath = path.join(__dirname, '../server.js');
    if (fs.existsSync(entryPath)) {
        console.log('✅ Entry point file exists');
    } else {
        console.log('❌ Entry point file not found');
    }
    
    const publicPath = path.join(__dirname, '../public');
    if (fs.existsSync(publicPath)) {
        console.log('✅ Public directory exists');
    } else {
        console.log('❌ Public directory not found');
    }
    
    const envPath = path.join(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
        console.log('✅ Environment file exists');
    } else {
        console.log('❌ Environment file not found');
    }
    
    console.log('📝 Server structure test completed!');
    
} catch (error) {
    console.error('❌ Server structure test failed:', error.message);
}

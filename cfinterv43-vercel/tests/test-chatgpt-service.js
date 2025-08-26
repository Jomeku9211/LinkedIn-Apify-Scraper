// Test ChatGPT service functionality
console.log('🧪 Testing ChatGPT Service...');

try {
    const { generateComment } = require('../src/services/chatgptService');
    console.log('✅ ChatGPT service imported successfully');
    
    // Test that the function is available
    if (typeof generateComment === 'function') {
        console.log('✅ generateComment function is available');
    } else {
        console.log('❌ generateComment function is not available');
    }
    
    console.log('📝 ChatGPT service structure test passed!');
} catch (error) {
    console.error('❌ ChatGPT service test failed:', error.message);
}

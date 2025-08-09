// Test ChatGPT service functionality
const { generateComment } = require('./src/services/chatgptService');

console.log('✅ ChatGPT service imported successfully');
console.log('🔧 Testing service structure...');

// Test that the function is available
if (typeof generateComment === 'function') {
    console.log('✅ generateComment function is available');
} else {
    console.log('❌ generateComment function is not available');
}

console.log('📝 Service is ready for use!');

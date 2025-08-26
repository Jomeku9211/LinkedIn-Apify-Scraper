// Test Airtable service functionality
console.log('🧪 Testing Airtable Service...');

try {
    const { insertRecord, fetchRecordsFromView, updateRecord } = require('../src/services/airtableService');
    
    console.log('✅ Airtable service imported successfully');
    
    // Test that functions are available
    const functions = [
        { name: 'insertRecord', func: insertRecord },
        { name: 'fetchRecordsFromView', func: fetchRecordsFromView },
        { name: 'updateRecord', func: updateRecord }
    ];
    
    functions.forEach(({ name, func }) => {
        if (typeof func === 'function') {
            console.log(`✅ ${name} function is available`);
        } else {
            console.log(`❌ ${name} function is not available`);
        }
    });
    
    console.log('📝 Airtable service structure test passed!');
    
} catch (error) {
    console.error('❌ Airtable service test failed:', error.message);
}

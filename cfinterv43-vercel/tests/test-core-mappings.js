// Test core profile mappings
console.log('🧪 Testing Core Profile Mappings...');

try {
    const { mapApifyResponseToAirtable } = require('../src/utils/apifyDataMapper');
    
    const testProfile = {
        firstName: 'John',
        lastName: 'Doe',
        linkedinUrl: 'https://linkedin.com/in/johndoe',
        headline: 'Software Engineer',
        location: 'San Francisco, CA',
        currentCompany: {
            name: 'Tech Corp',
            position: 'Senior Developer',
            companyUrl: 'https://techcorp.com'
        }
    };
    
    const mapped = mapApifyResponseToAirtable(testProfile);
    
    console.log('🔍 Testing core field mappings:');
    console.log('✅ First Name:', mapped['firstName']);
    console.log('✅ Last Name:', mapped['lastName']);
    console.log('✅ LinkedIn URL:', mapped['linkedinUrl']);
    console.log('✅ Current Company:', mapped['Current Company']);
    console.log('✅ Current Position:', mapped['Current Position']);
    
    // Verify core mappings
    const tests = [
        { field: 'firstName', expected: 'John', actual: mapped['firstName'] },
        { field: 'lastName', expected: 'Doe', actual: mapped['lastName'] },
        { field: 'linkedinUrl', expected: 'https://linkedin.com/in/johndoe', actual: mapped['linkedinUrl'] },
        { field: 'Current Company', expected: 'Tech Corp', actual: mapped['Current Company'] },
        { field: 'Current Position', expected: 'Senior Developer', actual: mapped['Current Position'] }
    ];
    
    let passed = 0;
    let failed = 0;
    
    tests.forEach(test => {
        if (test.actual === test.expected) {
            console.log(`✅ ${test.field} mapping: PASSED`);
            passed++;
        } else {
            console.log(`❌ ${test.field} mapping: FAILED (expected: ${test.expected}, got: ${test.actual})`);
            failed++;
        }
    });
    
    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
    console.log('🎉 Core profile mapping tests completed!');
    
} catch (error) {
    console.error('❌ Core mapping test failed:', error.message);
}

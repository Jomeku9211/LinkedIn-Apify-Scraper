// Test funding field mappings
console.log('🧪 Testing Funding Field Mappings...');

try {
    const { mapApifyResponseToAirtable } = require('../src/utils/apifyDataMapper');
    
    const testData = {
        firstName: 'Test',
        lastName: 'User',
        currentCompany: {
            crunchbaseFundingData: {
                totalFunding: '$25M',
                lastFundingType: 'Series A',
                investors: ['VC Fund 1', 'VC Fund 2', 'Angel Investor']
            }
        }
    };
    
    const mapped = mapApifyResponseToAirtable(testData);
    
    console.log('🔍 Testing funding field extractions:');
    console.log('✅ Company Funding Amount:', mapped['Company Funding Amount']);
    console.log('✅ Funding Round:', mapped['Funding Round']);
    console.log('✅ Investor:', mapped['Investor']);
    
    // Verify mappings
    if (mapped['Company Funding Amount'] === '$25M') {
        console.log('✅ Company Funding Amount mapping: PASSED');
    } else {
        console.log('❌ Company Funding Amount mapping: FAILED');
    }
    
    if (mapped['Funding Round'] === 'Series A') {
        console.log('✅ Funding Round mapping: PASSED');
    } else {
        console.log('❌ Funding Round mapping: FAILED');
    }
    
    if (mapped['Investor'] === 'VC Fund 1, VC Fund 2, Angel Investor') {
        console.log('✅ Investor mapping: PASSED');
    } else {
        console.log('❌ Investor mapping: FAILED');
    }
    
    console.log('🎉 Funding field mapping tests completed!');
    
} catch (error) {
    console.error('❌ Funding mapping test failed:', error.message);
}

// Complete test suite runner
console.log('🧪 Running Complete Test Suite...\n');

const tests = [
    'test-chatgpt-service.js',
    'test-funding-mapping.js', 
    'test-post-mapping.js',
    'test-core-mappings.js',
    'test-airtable-service.js',
    'test-server-structure.js'
];

async function runTest(testFile) {
    return new Promise((resolve) => {
        console.log(`\n📋 Running ${testFile}...`);
        console.log('=' .repeat(50));
        
        const { spawn } = require('child_process');
        const test = spawn('node', [`tests/${testFile}`], { 
            cwd: process.cwd(),
            stdio: 'inherit' 
        });
        
        test.on('close', (code) => {
            if (code === 0) {
                console.log(`✅ ${testFile} completed successfully`);
            } else {
                console.log(`❌ ${testFile} failed with code ${code}`);
            }
            resolve(code === 0);
        });
        
        test.on('error', (error) => {
            console.error(`❌ Error running ${testFile}:`, error.message);
            resolve(false);
        });
    });
}

async function runAllTests() {
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
        const success = await runTest(test);
        if (success) {
            passed++;
        } else {
            failed++;
        }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 TEST SUITE SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Tests Passed: ${passed}`);
    console.log(`❌ Tests Failed: ${failed}`);
    console.log(`📊 Total Tests: ${tests.length}`);
    console.log(`📈 Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);
    
    if (failed === 0) {
        console.log('\n🎉 All tests passed! System is working correctly.');
    } else {
        console.log('\n⚠️  Some tests failed. Please review the output above.');
    }
}

runAllTests().catch(console.error);

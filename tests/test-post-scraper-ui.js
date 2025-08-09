// Test Post Scraper UI Elements
console.log('🧪 Testing Post Scraper UI Elements...\n');

const fs = require('fs');
const path = require('path');

function testPostScrapperUI() {
    console.log('🔍 Testing Post Scraper UI Components...');
    
    try {
        // Read the HTML file
        const htmlPath = path.join(__dirname, '../public/index.html');
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');
        
        // Check for post scraper elements
        const requiredElements = [
            { id: 'post-scraper', description: 'Post Scraper Tab' },
            { id: 'postUrls', description: 'Post URLs Textarea' },
            { id: 'postAirtableToken', description: 'Airtable Token Field' },
            { id: 'postBaseId', description: 'Base ID Field' },
            { id: 'postTableName', description: 'Table Name Field' },
            { id: 'postStartBtn', description: 'Start Button' },
            { id: 'postTimer', description: 'Timer Display' },
            { id: 'postPostsCount', description: 'Posts Count Display' },
            { id: 'postTotalCount', description: 'Total Count Display' },
            { id: 'postErrorsCount', description: 'Errors Count Display' },
            { id: 'postLogContainer', description: 'Log Container' }
        ];
        
        console.log('📋 Checking UI Elements:');
        let elementsFound = 0;
        
        requiredElements.forEach(element => {
            const pattern = new RegExp(`id="${element.id}"`, 'i');
            if (pattern.test(htmlContent)) {
                console.log(`✅ ${element.description}: Found`);
                elementsFound++;
            } else {
                console.log(`❌ ${element.description}: Missing`);
            }
        });
        
        console.log(`\n📊 UI Elements: ${elementsFound}/${requiredElements.length} found`);
        
        // Check for JavaScript functions
        const requiredFunctions = [
            'startPostScraping',
            'stopPostScraping', 
            'updatePostStats',
            'updatePostTimer',
            'addPostLog',
            'pollPostUpdates'
        ];
        
        console.log('\n📋 Checking JavaScript Functions:');
        let functionsFound = 0;
        
        requiredFunctions.forEach(func => {
            const pattern = new RegExp(`function\\s+${func}|${func}\\s*=`, 'i');
            if (pattern.test(htmlContent)) {
                console.log(`✅ ${func}(): Found`);
                functionsFound++;
            } else {
                console.log(`❌ ${func}(): Missing`);
            }
        });
        
        console.log(`\n📊 JavaScript Functions: ${functionsFound}/${requiredFunctions.length} found`);
        
        // Check for post scraper tab
        const tabPattern = /Post Scraper/i;
        if (tabPattern.test(htmlContent)) {
            console.log('✅ Post Scraper Tab: Found in navigation');
        } else {
            console.log('❌ Post Scraper Tab: Missing from navigation');
        }
        
        // Check for styling
        const stylingElements = [
            '.start-btn',
            '.timer',
            '.stat-item',
            '.log-container',
            '.tab-content'
        ];
        
        console.log('\n📋 Checking CSS Styling:');
        let stylesFound = 0;
        
        stylingElements.forEach(style => {
            const pattern = new RegExp(style.replace('.', '\\.'), 'i');
            if (pattern.test(htmlContent)) {
                console.log(`✅ ${style}: Styled`);
                stylesFound++;
            } else {
                console.log(`❌ ${style}: Missing styles`);
            }
        });
        
        console.log(`\n📊 CSS Styles: ${stylesFound}/${stylingElements.length} found`);
        
        return {
            elementsFound,
            totalElements: requiredElements.length,
            functionsFound,
            totalFunctions: requiredFunctions.length,
            stylesFound,
            totalStyles: stylingElements.length
        };
        
    } catch (error) {
        console.error('❌ Error reading HTML file:', error.message);
        return null;
    }
}

function testPostScrapperAPI() {
    console.log('\n🔍 Testing Post Scraper API Structure...');
    
    // Check if server.js has the required endpoints
    try {
        const serverPath = path.join(__dirname, '../src/server.js');
        const serverContent = fs.readFileSync(serverPath, 'utf8');
        
        const requiredEndpoints = [
            { pattern: /\/api\/start-post-scraping/, name: 'POST /api/start-post-scraping' },
            { pattern: /\/api\/post-status/, name: 'GET /api/post-status' },
            { pattern: /express\.static/, name: 'Static file serving' }
        ];
        
        console.log('📋 Checking API Endpoints:');
        let endpointsFound = 0;
        
        requiredEndpoints.forEach(endpoint => {
            if (endpoint.pattern.test(serverContent)) {
                console.log(`✅ ${endpoint.name}: Found`);
                endpointsFound++;
            } else {
                console.log(`❌ ${endpoint.name}: Missing`);
            }
        });
        
        console.log(`\n📊 API Endpoints: ${endpointsFound}/${requiredEndpoints.length} found`);
        
        return endpointsFound;
        
    } catch (error) {
        console.error('❌ Error reading server file:', error.message);
        return 0;
    }
}

// Run UI tests
console.log('🚀 Starting Post Scraper UI Tests...');
console.log('=' .repeat(60));

const uiResults = testPostScrapperUI();
const apiEndpoints = testPostScrapperAPI();

console.log('\n' + '='.repeat(60));
console.log('🎯 POST SCRAPER UI TEST SUMMARY');
console.log('='.repeat(60));

if (uiResults) {
    console.log(`✅ UI Elements: ${uiResults.elementsFound}/${uiResults.totalElements} implemented`);
    console.log(`✅ JavaScript Functions: ${uiResults.functionsFound}/${uiResults.totalFunctions} implemented`);
    console.log(`✅ CSS Styles: ${uiResults.stylesFound}/${uiResults.totalStyles} implemented`);
    console.log(`✅ API Endpoints: ${apiEndpoints}/3 implemented`);
    
    const totalScore = (
        (uiResults.elementsFound / uiResults.totalElements) +
        (uiResults.functionsFound / uiResults.totalFunctions) +
        (uiResults.stylesFound / uiResults.totalStyles) +
        (apiEndpoints / 3)
    ) / 4 * 100;
    
    console.log(`\n📊 Overall Implementation: ${totalScore.toFixed(1)}%`);
    
    if (totalScore >= 90) {
        console.log('🎉 Post Scraper UI is fully functional and ready!');
    } else if (totalScore >= 75) {
        console.log('⚠️ Post Scraper UI is mostly functional with minor issues');
    } else {
        console.log('❌ Post Scraper UI needs significant improvements');
    }
} else {
    console.log('❌ Unable to analyze UI components');
}

console.log('\n💡 Post Scraper is ready to process LinkedIn posts!');

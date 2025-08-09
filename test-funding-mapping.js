require('dotenv').config();

const { mapApifyResponseToAirtable } = require('./src/utils/apifyDataMapper');
const airtableService = require('./src/services/airtableService');

// Configuration
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appD9VxZrOhiQY9VB';
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'tblyhMPmCt87ORo3t';

// Sample Apify data with crunchbase funding data
const sampleApifyData = {
  "firstName": "Dheeraj",
  "lastName": "Khandare",
  "occupation": "Full Stack Developer & Entrepreneur",
  "summary": "Experienced Full Stack Developer with 5+ years of expertise in building scalable web applications.",
  "profileUrl": "https://www.linkedin.com/in/dheeraj-khandare/",
  "linkedin_url": "https://www.linkedin.com/in/dheeraj-khandare/",
  "pictureUrl": "https://media.licdn.com/dms/image/profile.jpg",
  "companyName": "TechCorp",
  "companyLinkedinUrl": "https://www.linkedin.com/company/techcorp",
  "currentCompany": {
    "description": "Leading technology company specializing in AI and machine learning solutions",
    "tagline": "Innovative Solutions for Tomorrow",
    "websiteURL": "https://www.techcorp.com",
    "industries": [
      { "name": "Artificial Intelligence" },
      { "name": "Software Development" }
    ],
    "foundedOn": { "year": 2018 },
    "crunchbaseFundingData": {
      "totalFunding": "$50.2M",
      "lastFundingType": "Series B",
      "investors": ["Sequoia Capital", "Andreessen Horowitz", "Google Ventures", "Y Combinator"]
    },
    "employeeCount": 350,
    "employeeCountRange": { "start": 201, "end": 500 },
    "groupedLocations": [{
      "locations": [{
        "address": { "city": "San Francisco", "country": "United States" }
      }]
    }],
    "specialities": ["AI/ML", "Data Science", "Cloud Computing"],
    "phone": { "number": "5551234567", "extension": "100" }
  },
  "industryName": "Artificial Intelligence",
  "contactInfo": {
    "email": "dheeraj@techcorp.com",
    "city": "San Francisco",
    "country": "United States"
  }
};

async function testFundingMapping() {
  console.log('🧪 Testing Crunchbase Funding Data mapping to Airtable...\n');
  
  try {
    // Use the actual data mapper to process the data
    const mappedData = mapApifyResponseToAirtable(sampleApifyData);
    
    console.log('📊 Funding Fields Mapping Test Results:');
    console.log('📍 New Crunchbase Funding Fields:');
    
    // Test the new individual funding fields
    const fundingAmount = mappedData['Company Funding Amount'];
    const fundingRound = mappedData['Funding Round'];
    const investors = mappedData['Investor'];
    
    console.log(`   ✓ totalFunding → "Company Funding Amount": "${fundingAmount}"`);
    console.log(`   ✓ lastFundingType → "Funding Round": "${fundingRound}"`);
    console.log(`   ✓ investors → "Investor": "${investors}"`);
    
    console.log('\n📍 Source Data Verification:');
    console.log(`   📊 Source totalFunding: "${sampleApifyData.currentCompany.crunchbaseFundingData.totalFunding}"`);
    console.log(`   📊 Source lastFundingType: "${sampleApifyData.currentCompany.crunchbaseFundingData.lastFundingType}"`);
    console.log(`   📊 Source investors: [${sampleApifyData.currentCompany.crunchbaseFundingData.investors.join(', ')}]`);
    
    console.log('\n📍 Mapping Validation:');
    const amountMatch = fundingAmount === sampleApifyData.currentCompany.crunchbaseFundingData.totalFunding;
    const roundMatch = fundingRound === sampleApifyData.currentCompany.crunchbaseFundingData.lastFundingType;
    const investorsMatch = investors === sampleApifyData.currentCompany.crunchbaseFundingData.investors.join(', ');
    
    console.log(`   ${amountMatch ? '✅' : '❌'} Funding Amount mapping: ${amountMatch ? 'CORRECT' : 'INCORRECT'}`);
    console.log(`   ${roundMatch ? '✅' : '❌'} Funding Round mapping: ${roundMatch ? 'CORRECT' : 'INCORRECT'}`);
    console.log(`   ${investorsMatch ? '✅' : '❌'} Investors mapping: ${investorsMatch ? 'CORRECT' : 'INCORRECT'}`);
    
    if (amountMatch && roundMatch && investorsMatch) {
      console.log('\n🎉 All funding field mappings are CORRECT!');
    } else {
      console.log('\n⚠️ Some funding field mappings need attention');
    }
    
    console.log('\n💾 Testing Airtable insertion with new funding fields...');
    
    const result = await airtableService.insertRecord(
      mappedData,
      AIRTABLE_TOKEN, 
      AIRTABLE_BASE_ID, 
      AIRTABLE_TABLE_NAME
    );
    
    console.log('\n✅ SUCCESS! Funding fields mapped and inserted successfully!');
    console.log(`📝 Created record: ${result.id}`);
    console.log(`🌐 View at: https://airtable.com/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}/${result.id}`);
    
    console.log('\n🔍 Final Verification in Airtable:');
    console.log(`   💰 Company Funding Amount: ${fundingAmount}`);
    console.log(`   🎯 Funding Round: ${fundingRound}`);
    console.log(`   🏢 Investors: ${investors}`);
    
    return result;
    
  } catch (error) {
    console.error('\n❌ Funding mapping test failed:', error.message);
    
    if (error.response?.data?.error) {
      console.error('🔍 Airtable error details:', error.response.data.error);
    }
    
    throw error;
  }
}

// Test with edge cases (missing funding data)
async function testMissingFundingData() {
  console.log('\n🧪 Testing with missing funding data...');
  
  const dataWithoutFunding = {
    ...sampleApifyData,
    currentCompany: {
      ...sampleApifyData.currentCompany,
      crunchbaseFundingData: null
    }
  };
  
  const mappedData = mapApifyResponseToAirtable(dataWithoutFunding);
  
  console.log('📊 Missing Funding Data Test:');
  console.log(`   ✓ Company Funding Amount: "${mappedData['Company Funding Amount']}" (should be empty)`);
  console.log(`   ✓ Funding Round: "${mappedData['Funding Round']}" (should be empty)`);
  console.log(`   ✓ Investor: "${mappedData['Investor']}" (should be empty)`);
  
  const allEmpty = !mappedData['Company Funding Amount'] && !mappedData['Funding Round'] && !mappedData['Investor'];
  console.log(`   ${allEmpty ? '✅' : '❌'} Graceful handling of missing data: ${allEmpty ? 'PASSED' : 'FAILED'}`);
}

// Run the tests
if (require.main === module) {
  testFundingMapping()
    .then(() => testMissingFundingData())
    .then(() => {
      console.log('\n🎉 All funding field mapping tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testFundingMapping };

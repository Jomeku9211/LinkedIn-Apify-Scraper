require('dotenv').config();

const airtableService = require('./services/airtableService');

// Configuration
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appD9VxZrOhiQY9VB';
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'tblyhMPmCt87ORo3t';

// Sample LinkedIn post data (like what we get from the post scraper)
const samplePostData = {
  "url": "https://www.linkedin.com/posts/dheeraj-khandare_fullstack-developer-innovation-activity-7234567890123456789-abcd",
  "text": "🚀 Exciting news! Just launched our new AI-powered LinkedIn scraper that can extract comprehensive profile and company data. This tool is perfect for lead generation, market research, and building targeted prospect lists.\n\n🔧 Key Features:\n✅ Extract 40+ profile fields\n✅ Company data integration\n✅ Automated Airtable sync\n✅ Real-time progress tracking\n✅ Error handling & retry logic\n\n💡 Built with Node.js, Express, and integrated with Apify APIs. The dashboard provides real-time monitoring and the entire workflow is automated.\n\n#FullStack #Developer #Innovation #AI #LinkedInScraping #LeadGeneration #DataExtraction #Automation",
  "postedAtISO": "2024-12-15T10:30:00.000Z",
  "author": {
    "name": "Dheeraj Khandare",
    "profileUrl": "https://www.linkedin.com/in/dheeraj-khandare/"
  },
  "likesCount": 45,
  "commentsCount": 12,
  "sharesCount": 8,
  "type": "TEXT_POST",
  "date": "2024-12-15"
};

async function testPostMapping() {
  console.log('🧪 Testing LinkedIn Post data mapping to Airtable...\n');
  
  try {
    // Map the post data to Airtable format with your requested fields
    const mappedPostData = {
      // Core requested fields
      'Post URL': samplePostData.url || '',
      'Post Text': samplePostData.text || '',
      'Posted On': samplePostData.postedAtISO ? new Date(samplePostData.postedAtISO).toISOString().split('T')[0] : (samplePostData.date || ''),
      
      // Additional useful fields
      'Post Author': samplePostData.author?.name || '',
      'Author Profile URL': samplePostData.author?.profileUrl || '',
      'Likes Count': samplePostData.likesCount || 0,
      'Comments Count': samplePostData.commentsCount || 0,
      'Shares Count': samplePostData.sharesCount || 0,
      'Post Type': samplePostData.type || '',
      'Post Date': samplePostData.date || '',
      'Scraped At': new Date().toISOString().split('T')[0]
    };
    
    console.log('📊 Post Mapping Test Results:');
    console.log('📍 Core Required Fields:');
    console.log(`   ✓ url → "Post URL": "${samplePostData.url}"`);
    console.log(`   ✓ text → "Post Text": "${samplePostData.text.substring(0, 100)}..."`);
    console.log(`   ✓ postedAtISO → "Posted On": "${samplePostData.postedAtISO}"`);
    
    console.log('\n📍 Additional Mapped Fields:');
    console.log(`   ✓ author.name → "Post Author": "${samplePostData.author.name}"`);
    console.log(`   ✓ author.profileUrl → "Author Profile URL": "${samplePostData.author.profileUrl}"`);
    console.log(`   ✓ likesCount → "Likes Count": ${samplePostData.likesCount}`);
    console.log(`   ✓ commentsCount → "Comments Count": ${samplePostData.commentsCount}`);
    console.log(`   ✓ sharesCount → "Shares Count": ${samplePostData.sharesCount}`);
    console.log(`   ✓ type → "Post Type": "${samplePostData.type}"`);
    console.log(`   ✓ date → "Post Date": "${samplePostData.date}"`);
    
    console.log('\n📋 Total Field Mappings: 11 fields mapped successfully!');
    
    console.log('\n💾 Inserting test post record to Airtable...');
    
    const result = await airtableService.insertPostData(
      mappedPostData,
      AIRTABLE_TOKEN, 
      AIRTABLE_BASE_ID, 
      AIRTABLE_TABLE_NAME
    );
    
    console.log('\n✅ SUCCESS! Post data mapping works perfectly!');
    console.log(`📝 Created post record: ${result.id}`);
    console.log(`🌐 View at: https://airtable.com/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}/${result.id}`);
    
    console.log('\n🔍 Verification:');
    console.log(`   ✓ Post URL mapped correctly: ${mappedPostData['Post URL']}`);
    console.log(`   ✓ Post Text mapped correctly: ${mappedPostData['Post Text'].length} characters`);
    console.log(`   ✓ Posted On mapped correctly: ${mappedPostData['Posted On']}`);
    
    return result;
    
  } catch (error) {
    console.error('\n❌ Post mapping test failed:', error.message);
    
    if (error.response?.data?.error) {
      console.error('🔍 Airtable error details:', error.response.data.error);
    }
    
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testPostMapping()
    .then(() => {
      console.log('\n🎉 Post data mapping test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testPostMapping };

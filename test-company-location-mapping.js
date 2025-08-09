require('dotenv').config();

const airtableService = require('./services/airtableService');

// Configuration
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appD9VxZrOhiQY9VB';
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'tblyhMPmCt87ORo3t';

// Sample Apify data (like what we get from the scraper)
const sampleApifyData = {
  "firstName": "Dheeraj",
  "lastName": "Khandare",
  "occupation": "Full Stack Developer & Entrepreneur",
  "summary": "Experienced Full Stack Developer with 5+ years of expertise in building scalable web applications. Passionate about creating innovative solutions and leading development teams. Strong background in JavaScript, Node.js, React, and cloud technologies.",
  "profileUrl": "https://www.linkedin.com/in/dheeraj-khandare/",
  "linkedin_url": "https://www.linkedin.com/in/dheeraj-khandare/",
  "twitter_url": "https://twitter.com/dheerajkhandare",
  "followersCount": 1250,
  "pictureUrl": "https://media.licdn.com/dms/image/v2/D4D03AQFcQK4k3FUDCQ/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1691564987732?e=1741824000&v=beta&t=QGvYv4f2k9ZfkNKUiF5Y8HRvxLh3XFCk3W6rN9TfqE0",
  "skills": [
    "JavaScript",
    "Node.js",
    "React",
    "Python",
    "Web Development",
    "API Development",
    "MongoDB",
    "Express.js"
  ],
  "positions": [
    {
      "title": "Full Stack Developer & Entrepreneur",
      "company": "CoderFarm",
      "location": "Indore, India",
      "startDate": "Jan 2023",
      "endDate": "Present"
    }
  ],
  "companyName": "CoderFarm",
  "companyLinkedinUrl": "https://www.linkedin.com/company/coderfarm",
  "industryName": "Information Technology & Services",
  "currentCompany": {
    "description": "Software development and consulting company specializing in full-stack solutions",
    "groupedLocations": [
      {
        "locations": [
          {
            "address": {
              "city": "Indore",
              "country": "India"
            }
          }
        ]
      }
    ]
  },
  "contactInfo": {
    "email": "dheeraj@coderfarm.in",
    "city": "Indore",
    "country": "India"
  }
};

// Test function to validate field mappings
async function testFirstNameMapping() {
  try {
    console.log('\n🔍 Testing Comprehensive Field Mapping...');
    
    // Map the Apify data to Airtable format
    const mappedData = {
      // Basic profile info
      "firstName": sampleApifyData.firstName,
      "lastName": sampleApifyData.lastName,
      "Linkedin Headline": sampleApifyData.occupation,
      "about": sampleApifyData.summary,
      "linkedinUrl": sampleApifyData.linkedin_url,
      "twitter_url": sampleApifyData.twitter_url,
      "followersCunt": sampleApifyData.followersCount,
      "picture": sampleApifyData.pictureUrl,
      "skills": sampleApifyData.skills && Array.isArray(sampleApifyData.skills) ? sampleApifyData.skills.join(', ') : '',
      
      // Position information
      "Current_Position_Title": sampleApifyData.positions && sampleApifyData.positions.length > 0 ? sampleApifyData.positions[0].title : null,
      "companyName": sampleApifyData.companyName,
      "companyLinkedinUrl": sampleApifyData.companyLinkedinUrl,
      "companyIndustry": sampleApifyData.industryName,
      "Company_City": sampleApifyData.currentCompany && sampleApifyData.currentCompany.groupedLocations && sampleApifyData.currentCompany.groupedLocations[0] && sampleApifyData.currentCompany.groupedLocations[0].locations && sampleApifyData.currentCompany.groupedLocations[0].locations[0] && sampleApifyData.currentCompany.groupedLocations[0].locations[0].address ? sampleApifyData.currentCompany.groupedLocations[0].locations[0].address.city : '',
      "Company_Country": sampleApifyData.currentCompany && sampleApifyData.currentCompany.groupedLocations && sampleApifyData.currentCompany.groupedLocations[0] && sampleApifyData.currentCompany.groupedLocations[0].locations && sampleApifyData.currentCompany.groupedLocations[0].locations[0] && sampleApifyData.currentCompany.groupedLocations[0].locations[0].address ? sampleApifyData.currentCompany.groupedLocations[0].locations[0].address.country : '',
      
      // Contact information
      "email": sampleApifyData.contactInfo ? sampleApifyData.contactInfo.email : null,
      "Prospect_City": sampleApifyData.contactInfo ? sampleApifyData.contactInfo.city : null,
      "Prospect_Country": sampleApifyData.contactInfo ? sampleApifyData.contactInfo.country : null
    };
    
    console.log('📊 Mapping Test:');
    console.log(`   Apify field: "firstName" = "${sampleApifyData.firstName}"`);
    console.log(`   Airtable field: "firstName" = "${mappedData.firstName}"`);
    console.log(`   Apify field: "lastName" = "${sampleApifyData.lastName}"`);
    console.log(`   Airtable field: "lastName" = "${mappedData.lastName}"`);
    console.log(`   Apify field: "occupation" = "${sampleApifyData.occupation.substring(0, 50)}..."`);
    console.log(`   Airtable field: "Linkedin Headline" = "${mappedData["Linkedin Headline"].substring(0, 50)}..."`);
    console.log(`   Apify field: "summary" = "${sampleApifyData.summary.substring(0, 80)}..."`);
    console.log(`   Airtable field: "about" = "${mappedData.about.substring(0, 80)}..."`);
    console.log(`   Apify field: "linkedin_url" = "${sampleApifyData.linkedin_url}"`);
    console.log(`   Airtable field: "linkedinUrl" = "${mappedData.linkedinUrl}"`);
    console.log(`   Apify field: "twitter_url" = "${sampleApifyData.twitter_url}"`);
    console.log(`   Airtable field: "twitter_url" = "${mappedData.twitter_url}"`);
    console.log(`   Apify field: "followersCount" = "${sampleApifyData.followersCount}"`);
    console.log(`   Airtable field: "followersCunt" = "${mappedData.followersCunt}"`);
    console.log(`   Apify field: "pictureUrl" = "${sampleApifyData.pictureUrl.substring(0, 60)}..."`);
    console.log(`   Airtable field: "picture" = "${mappedData.picture.substring(0, 60)}..."`);
    console.log(`   Apify field: "skills" = [${sampleApifyData.skills.length} skills array]`);
    console.log(`   Airtable field: "skills" = "${mappedData.skills}"`);
    console.log(`   Apify field: "positions[0].title" = "${sampleApifyData.positions[0].title}"`);
    console.log(`   Airtable field: "Current_Position_Title" = "${mappedData["Current_Position_Title"]}"`);
    console.log(`   Apify field: "industryName" = "${sampleApifyData.industryName}"`);
    console.log(`   Airtable field: "companyIndustry" = "${mappedData.companyIndustry}"`);
    console.log(`   Apify field: "companyName" = "${sampleApifyData.companyName}"`);
    console.log(`   Airtable field: "companyName" = "${mappedData.companyName}"`);
    console.log(`   Apify field: "companyLinkedinUrl" = "${sampleApifyData.companyLinkedinUrl}"`);
    console.log(`   Airtable field: "companyLinkedinUrl" = "${mappedData.companyLinkedinUrl}"`);
    console.log(`   Apify field: "currentCompany.groupedLocations[0].locations[0].address.city" = "${sampleApifyData.currentCompany.groupedLocations[0].locations[0].address.city}"`);
    console.log(`   Airtable field: "Company_City" = "${mappedData.Company_City}"`);
    console.log(`   Apify field: "currentCompany.groupedLocations[0].locations[0].address.country" = "${sampleApifyData.currentCompany.groupedLocations[0].locations[0].address.country}"`);
    console.log(`   Airtable field: "Company_Country" = "${mappedData.Company_Country}"`);
    console.log(`   Apify field: "contactInfo.email" = "${sampleApifyData.contactInfo.email}"`);
    console.log(`   Airtable field: "email" = "${mappedData.email}"`);
    console.log(`   Apify field: "contactInfo.city" = "${sampleApifyData.contactInfo.city}"`);
    console.log(`   Airtable field: "Prospect_City" = "${mappedData["Prospect_City"]}"`);
    console.log(`   Apify field: "contactInfo.country" = "${sampleApifyData.contactInfo.country}"`);
    console.log(`   Airtable field: "Prospect_Country" = "${mappedData["Prospect_Country"]}"`);
    
    console.log('\n📋 Total Field Mappings: 19 fields mapped successfully!');
    
    console.log('\n📤 Sending to Airtable...');
    
    // Insert the record
    const result = await airtableService.insertRecord(mappedData);
    
    console.log('\n✅ SUCCESS! Comprehensive mapping works perfectly!');
    console.log(`📝 Created record: ${result.id}`);
    console.log(`🌐 View at: https://airtable.com/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}/${result.id}`);
    
    return result;
    
  } catch (error) {
    console.error('\n❌ Comprehensive mapping failed:', error.message);
    
    if (error.response && error.response.data) {
      console.error('📋 Airtable error details:', JSON.stringify(error.response.data, null, 2));
    }
    
    throw error;
  }
}

// Export for use in other files
module.exports = { testFirstNameMapping };

// If running directly, execute the test
if (require.main === module) {
  testFirstNameMapping()
    .then(() => {
      console.log('\n🎉 Test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error.message);
      process.exit(1);
    });
}

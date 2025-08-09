// Test script for the new Apify data mapper
const { mapApifyResponseToAirtable, validateAirtableData } = require('./src/utils/apifyDataMapper');

// Real Apify response data (sample from user)
const testApifyData = [{
  "id": "713810865",
  "profileId": "ACoAACqL47EB4pc1pSWkb6agpARRub-44dVV4yA",
  "firstName": "Dheeraj",
  "lastName": "Khandare",
  "occupation": "I help you hire developers who match your tech stack, values & working style — so they perform better, stay longer & feel like part of the team from day one.",
  "publicIdentifier": "dheeraj-khandare",
  "trackingId": "KEA7oiGWSA6lOA9UcaM8+g==",
  "pictureUrl": "https://media.licdn.com/dms/image/v2/D4D03AQG25WVNbjjfXw/profile-displayphoto-shrink_100_100/profile-displayphoto-shrink_100_100/0/1728998794547?e=1757548800&v=beta&t=-QlgHNGjRvbTQe28DIPhqsJesCWVe0eTulwXL2F1v0k",
  "countryCode": "in",
  "geoUrn": "urn:li:fs_geo:101389470",
  "positions": [
    {
      "title": "Founder & CEO",
      "locationName": "Indore, Madhya Pradesh, India",
      "timePeriod": {
        "startDate": {
          "month": 2,
          "year": 2019
        }
      },
      "company": {
        "employeeCountRange": {
          "start": 0,
          "end": 1
        },
        "industries": [
          "Computer Software"
        ],
        "objectUrn": "urn:li:company:82159057",
        "entityUrn": "urn:li:fs_miniCompany:82159057",
        "name": "CoderFarm",
        "showcase": false,
        "active": true,
        "logo": "https://media.licdn.com/dms/image/v2/D4D0BAQHm_9b7YuDqIA/img-crop_100/img-crop_100/0/1715570203442?e=1757548800&v=beta&t=jQFYmOFeqeriKriTrm8gaJs6E0Rfqpp-1lEVtWLwTv4",
        "universalName": "coderfarm"
      },
      "companyName": "CoderFarm"
    }
  ],
  "educations": [
    {
      "degreeName": "Bachelor of Engineering - BE",
      "fieldOfStudy": "Computer Science",
      "schoolName": "Malwa institute of Technology, Nipaniya Byass, Indore"
    }
  ],
  "skills": [
    "Communication",
    "Redux.js",
    "Creativity and Innovation",
    "Productivity Improvement"
  ],
  "headline": "I help you hire developers who match your tech stack, values & working style — so they perform better, stay longer & feel like part of the team from day one.",
  "summary": "👋 Hi, I'm Dheeraj — Founder | Builder | Hiring Optimist\n🚀 What I'm Building\nI'm creating a remote hiring platform for IT startups to find developers who truly align with their mission — not just their tech stack.",
  "industryName": "IT Services and IT Consulting",
  "geoLocationName": "Indore, Madhya Pradesh",
  "geoCountryName": "India",
  "jobTitle": "Founder & CEO",
  "companyName": "CoderFarm",
  "companyPublicId": "coderfarm",
  "companyLinkedinUrl": "https://www.linkedin.com/company/coderfarm",
  "currentCompany": {
    "employeeCount": 15,
    "specialities": [
      "Pre-screening",
      "Customization",
      "Remote Teams"
    ],
    "description": "🚀 Coderfarm | First in Culture-Driven Hiring",
    "tagline": "First in Culture Driven Hiring",
    "websiteUrl": "http://www.coderfarm.in",
    "foundedOn": {
      "year": 2019
    },
    "groupedLocations": [
      {
        "localizedName": "Indore",
        "locations": [
          {
            "address": {
              "country": "IN",
              "geographicArea": "Madhya Pradesh",
              "city": "Indore",
              "postalCode": "452003",
              "line1": "Pardeshipura Main Road"
            }
          }
        ]
      }
    ],
    "industries": [
      {
        "name": "Technology, Information and Internet"
      }
    ]
  },
  "followersCount": 4831,
  "connectionType": 1,
  "contactInfo": {
    "name": "Dheeraj Khandare",
    "first_name": "Dheeraj",
    "last_name": "Khandare",
    "email": "dheeraj@coderfarm.in",
    "title": "Founder & CEO",
    "headline": "Founder & CEO @ Coderfarm",
    "city": "Indore",
    "country": "India",
    "state": "Madhya Pradesh",
    "linkedin_url": "http://www.linkedin.com/in/dheeraj-khandare",
    "linkedin_public_id": "dheeraj-khandare",
    "email_is_verified": "Verified",
    "company_name": "CoderFarm",
    "phone_numbers": [
      {
        "number": "+917314203608",
        "type": "work_hq"
      }
    ],
    "phone_number": "+917314203608"
  }
}];

async function testMapper() {
  console.log('🧪 Testing Apify data mapper with real response...\n');
  
  const profileUrl = 'https://www.linkedin.com/in/dheeraj-khandare/';
  
  try {
    // Test mapping
    const mappedData = mapApifyResponseToAirtable(testApifyData, profileUrl);
    
    console.log('\n📊 MAPPED DATA RESULTS:');
    console.log('='.repeat(50));
    
    // Display mapped data in organized sections
    const sections = {
      'Personal Information': ['firstName', 'lastName', 'linkedinUrl', 'email', 'phone no.'],
      'Professional Details': ['Linkedin Headline', 'Current_Position_Title', 'Designation'],
      'Company Information': ['companyName', 'companyLinkedinUrl', 'website', 'companyIndustry', 'companySize'],
      'Location Data': ['Prospect_Country', 'Prospect_City', 'Country'],
      'Additional Details': ['skills', 'school', 'About', 'followersCount']
    };
    
    Object.entries(sections).forEach(([sectionName, fields]) => {
      console.log(`\n📋 ${sectionName}:`);
      fields.forEach(field => {
        const value = mappedData[field];
        if (value !== undefined && value !== '') {
          console.log(`   ${field}: ${value}`);
        }
      });
    });
    
    // Test validation
    console.log('\n🔍 VALIDATION TEST:');
    console.log('='.repeat(30));
    const isValid = validateAirtableData(mappedData);
    console.log(`Validation result: ${isValid ? '✅ PASSED' : '❌ FAILED'}`);
    
    // Count mapped fields
    const nonEmptyFields = Object.entries(mappedData)
      .filter(([key, value]) => value !== '' && value !== null && value !== undefined && value !== 0);
    
    console.log(`\n📈 MAPPING STATISTICS:`);
    console.log(`Total fields mapped: ${nonEmptyFields.length}`);
    console.log(`Available source data points: ${Object.keys(testApifyData[0]).length}`);
    console.log(`Contact info fields: ${Object.keys(testApifyData[0].contactInfo || {}).length}`);
    
    return mappedData;
    
  } catch (error) {
    console.error('❌ Mapping test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testMapper().then(() => {
  console.log('\n🎉 Mapping test completed!');
}).catch(console.error);

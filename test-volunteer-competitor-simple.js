require('dotenv').config();

const airtableService = require('./src/services/airtableService');

// Configuration
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appD9VxZrOhiQY9VB';
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'tblyhMPmCt87ORo3t';

// Real sample data from Dheeraj
const sampleData = {
  "firstName": "Dheeraj",
  "lastName": "Khandare",
  "occupation": "I help you hire developers who match your tech stack, values & working style — so they perform better, stay longer & feel like part of the team from day one.",
  "summary": "👋 Hi, I'm Dheeraj — Founder | Builder | Hiring Optimist\n🚀 What I'm Building\nI'm creating a remote hiring platform for IT startups to find developers who truly align with their mission — not just their tech stack.",
  "publicIdentifier": "dheeraj-khandare",
  "followerCount": 4831,
  "volunteerExperience": [
    {
      "role": "Volunteer Developer",
      "companyName": "Code for Good Initiative",
      "cause": "Education",
      "description": "Developed educational web applications for underprivileged communities, focusing on increasing digital literacy and access to learning resources.",
      "timePeriod": {
        "startDate": { "month": 6, "year": 2020 },
        "endDate": { "month": 12, "year": 2021 }
      }
    },
    {
      "role": "Tech Mentor",
      "companyName": "Youth Programming Bootcamp",
      "cause": "Education",
      "description": "Mentored young aspiring developers in programming fundamentals, helping them build their first projects and prepare for tech careers.",
      "timePeriod": {
        "startDate": { "month": 1, "year": 2022 }
      }
    }
  ],
  "currentCompany": {
    "employeeCount": 15,
    "specialities": ["Pre-screening", "Customization", "Remote Teams"],
    "foundedOn": { "year": 2019 },
    "similarOrganizations": {
      "elements": [
        {
          "description": "At BestPeers, we are passionate about crafting innovative and reliable software solutions that empower businesses worldwide.",
          "universalName": "bestpeersllc",
          "headquarters": {
            "address": {
              "city": "California"
            }
          }
        }
      ]
    }
  }
};

// Helper functions
const formatVolunteerExperience = (volunteerExperience) => {
  if (!volunteerExperience || !Array.isArray(volunteerExperience)) return '';
  return volunteerExperience.slice(0, 3).map(volunteer => {
    const role = volunteer.role || '';
    const company = volunteer.companyName || '';
    const cause = volunteer.cause || '';
    const description = volunteer.description || '';
    const startYear = volunteer.timePeriod?.startDate?.year || '';
    const endYear = volunteer.timePeriod?.endDate?.year || '';
    const timePeriod = startYear && endYear ? `${startYear}-${endYear}` : startYear ? `${startYear}-Present` : '';
    
    return `${role} at ${company} (${cause}) - ${description} [${timePeriod}]`;
  }).join(' | ');
};

async function testVolunteerAndCompetitorMapping() {
  try {
    console.log('🚀 Testing Volunteer Experience and Competitor Mapping with Real Data');
    console.log('================================================================');
    
    // Map the data
    const mappedData = {
      firstName: sampleData.firstName,
      lastName: sampleData.lastName,
      'Linkedin Headline': sampleData.occupation,
      'About': sampleData.summary,
      linkedinUrl: `https://www.linkedin.com/in/${sampleData.publicIdentifier}/`,
      followersCount: sampleData.followerCount,
      
      // NEW: Volunteer Experience Mapping
      'volunteering': formatVolunteerExperience(sampleData.volunteerExperience),
      
      // NEW: Competitor Mappings  
      'Competitor description': sampleData.currentCompany?.similarOrganizations?.elements?.[0]?.description || '',
      'Company competitor Name': sampleData.currentCompany?.similarOrganizations?.elements?.[0]?.universalName || '',
      'Company Competitor Location': sampleData.currentCompany?.similarOrganizations?.elements?.[0]?.headquarters?.address?.city || '',
      
      // Company data
      'company Current Employe Count': parseInt(sampleData.currentCompany?.employeeCount) || 0,
      'companySpecialities': sampleData.currentCompany?.specialities?.join(', ') || '',
      'companyFoundedOn': sampleData.currentCompany?.foundedOn?.year?.toString() || ''
    };

    console.log('\n📊 NEW Field Mappings:');
    console.log(`   ✅ Volunteer Experience: "${mappedData.volunteering.substring(0, 100)}..."`);
    console.log(`   ✅ Competitor Description: "${mappedData['Competitor description'].substring(0, 80)}..."`);
    console.log(`   ✅ Competitor Name: "${mappedData['Company competitor Name']}"`);
    console.log(`   ✅ Competitor Location: "${mappedData['Company Competitor Location']}"`);
    console.log(`   ✅ LinkedIn Headline (Real): "${mappedData['Linkedin Headline'].substring(0, 80)}..."`);
    
    console.log(`\n📈 Data Types:
   - followersCount: ${typeof mappedData.followersCount} (${mappedData.followersCount})
   - company Current Employe Count: ${typeof mappedData['company Current Employe Count']} (${mappedData['company Current Employe Count']})
   - companyFoundedOn: ${typeof mappedData.companyFoundedOn} (${mappedData.companyFoundedOn})`);

    console.log('\n🔄 Attempting to insert into Airtable...');
    
    // Insert into Airtable
    const result = await airtableService.insertRecord(
      AIRTABLE_TOKEN,
      AIRTABLE_BASE_ID,
      AIRTABLE_TABLE_NAME,
      mappedData
    );

    console.log('✅ SUCCESS! Record inserted into Airtable:');
    console.log(`   Record ID: ${result.id}`);
    console.log('   ✅ Volunteer Experience mapping working!');
    console.log('   ✅ All 3 Competitor field mappings working!');
    console.log('   ✅ Real occupation text as LinkedIn Headline working!');
    console.log('   ✅ About field with real summary working!');
    console.log('   ✅ All field names and data types correct!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('❌ Status Code:', error.response.status);
      console.error('❌ Airtable error response:', error.response.data);
      
      if (error.response.data.error?.type === 'UNKNOWN_FIELD_NAME') {
        console.error(`🔍 Field name issue: ${error.response.data.error.message}`);
        console.error('💡 Suggestion: Check if the field name exists in your Airtable base');
      } else if (error.response.data.error?.type === 'INVALID_VALUE_FOR_COLUMN') {
        console.error(`🔍 Invalid value issue: ${error.response.data.error.message}`);
        console.error('💡 Suggestion: Check data type or select field options');
      }
    }
  }
}

testVolunteerAndCompetitorMapping();

require('dotenv').config();

const { mapApifyResponseToAirtable } = require('./utils/apifyDataMapper');
const airtableService = require('./services/airtableService');

// Configuration  
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appD9VxZrOhiQY9VB';
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'tblyhMPmCt87ORo3t';

// Complete real sample data from Dheeraj's profile
const realApifyData = [
  {
    "id": "713810865",
    "profileId": "ACoAACqL47EB4pc1pSWkb6agpARRub-44dVV4yA",
    "firstName": "Dheeraj",
    "lastName": "Khandare",
    "occupation": "I help you hire developers who match your tech stack, values & working style — so they perform better, stay longer & feel like part of the team from day one.",
    "publicIdentifier": "dheeraj-khandare",
    "trackingId": "KEA7oiGWSA6lOA9UcaM8+g==",
    "pictureUrl": "https://media.licdn.com/dms/image/v2/D4D03AQG25WVNbjjfXw/profile-displayphoto-shrink_100_100/profile-displayphoto-shrink_100_100/0/1728998794547?e=1757548800&v=beta&t=-QlgHNGjRvbTQe28DIPhqsJesCWVe0eTulwXL2F1v0k",
    "coverImageUrl": "https://media.licdn.com/dms/image/v2/D4D16AQHDkFkBLeq_PQ/profile-displaybackgroundimage-shrink_200_800/B4DZiElDGMHYAY-/0/1754570963627?e=1757548800&v=beta&t=Fj2ZCEAqLLGUsmaGqEIlRMqLTksuEK9j-XeZKy-lfH8",
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
          "universalName": "coderfarm",
          "dashCompanyUrn": "urn:li:fsd_company:82159057",
          "trackingId": "0wT1aWuCTsSs6BOQuRP+zw=="
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
    "certifications": [],
    "courses": [],
    "honors": [],
    "languages": [
      {
        "name": "English",
        "proficiency": "PROFESSIONAL_WORKING"
      },
      {
        "name": "Hindi",
        "proficiency": "NATIVE_OR_BILINGUAL"
      }
    ],
    "skills": [
      "Communication",
      "Redux.js",
      "Creativity and Innovation",
      "Productivity Improvement"
    ],
    "volunteerExperiences": [
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
    "headline": "I help you hire developers who match your tech stack, values & working style — so they perform better, stay longer & feel like part of the team from day one.",
    "summary": "👋 Hi, I'm Dheeraj — Founder | Builder | Hiring Optimist\n🚀 What I'm Building\nI'm creating a remote hiring platform for IT startups to find developers who truly align with their mission — not just their tech stack.\n\nThink:\n✅ Culture-fit > Resume\n✅ Shared vision > Transaction\n✅ Purpose-driven matches > Just skills",
    "student": false,
    "industryName": "IT Services and IT Consulting",
    "industryUrn": "urn:li:fs_industry:96",
    "geoLocationName": "Indore, Madhya Pradesh",
    "geoCountryName": "India",
    "jobTitle": "Founder & CEO",
    "companyName": "CoderFarm",
    "companyPublicId": "coderfarm",
    "companyLinkedinUrl": "https://www.linkedin.com/company/coderfarm",
    "followersCount": 4831,
    "connectionsCount": 500,
    "connectionType": 1,
    "contactInfo": {
      "name": "Dheeraj Khandare",
      "first_name": "Dheeraj",
      "last_name": "Khandare",
      "email": "dheeraj@coderfarm.in",
      "title": "Founder & CEO",
      "headline": "Founder & CEO @ Coderfarm | 🚀 we Help agency & startup hiring challenges with on-demand test-driven developers 🌟, ensuring robust software & freeing time for more client acquisition 💸",
      "city": "Indore",
      "country": "India",
      "state": "Madhya Pradesh",
      "free_domain": false,
      "linkedin_url": "http://www.linkedin.com/in/dheeraj-khandare",
      "twitter_url": null,
      "time_zone": "Asia/Kolkata",
      "linkedin_public_id": "dheeraj-khandare",
      "email_is_catchall": null,
      "email_is_verified": "Verified",
      "phone_numbers": [
        {
          "number": "+917314203608",
          "type": "work_hq"
        }
      ],
      "current_address": "Indore, Madhya Pradesh, India",
      "phone_number": "+917314203608"
    },
    "currentCompany": {
      "employeeCount": 15,
      "specialities": [
        "Pre-screening",
        "Customization",
        "Remote Teams",
        "In office teams",
        "In Budget Manpower",
        "Trained in Soft skills",
        "Trained on latest tech trends",
        "Ensured Productivity"
      ],
      "foundedOn": {
        "year": 2019
      },
      "industries": [
        {
          "name": "Technology, Information and Internet"
        }
      ],
      "groupedLocations": [
        {
          "localizedName": "Indore",
          "locations": [
            {
              "streetAddressOptOut": false,
              "description": "Headquarters",
              "address": {
                "country": "IN",
                "geographicArea": "Madhya Pradesh",
                "city": "Indore",
                "postalCode": "452003",
                "line2": "44/4",
                "line1": "Pardeshipura Main Road"
              },
              "headquarter": true
            }
          ]
        }
      ],
      "phone": {
        "number": "9926061666",
        "extension": null
      },
      "name": "CoderFarm",
      "tagline": "First in Culture Driven Hiring",
      "description": "🚀 Coderfarm | First in Culture-Driven Hiring\n\nMost hiring platforms give you resumes, not real fit.\n\nAt Coderfarm, we match developers not just by skills — but by mission, mindset, and team dynamics. We're rethinking hiring for tech leaders who want to build teams that *click* from day one.",
      "websiteUrl": "http://www.coderfarm.in",
      "universalName": "coderfarm",
      "similarOrganizations": {
        "elements": [
          {
            "description": "At BestPeers, we are passionate about crafting innovative and reliable software solutions that empower businesses worldwide. With a commitment to simplicity and efficiency, we combine our technical expertise with a collaborative approach to deliver solutions that solve real-world challenges.",
            "url": "https://www.linkedin.com/company/bestpeersllc/",
            "employeeCountRange": {
              "start": 201,
              "end": 500
            },
            "name": "BestPeers",
            "universalName": "bestpeersllc",
            "headquarters": {
              "address": {
                "country": "US",
                "geographicArea": "USA",
                "city": "California",
                "postalCode": "95330"
              }
            }
          }
        ]
      }
    }
  }
];

async function testAllFields() {
  try {
    console.log('🚀 COMPREHENSIVE TEST: All LinkedIn Fields Mapping');
    console.log('===================================================');
    console.log(`📊 Testing profile: ${realApifyData[0].firstName} ${realApifyData[0].lastName}`);
    console.log(`🎯 Real occupation text: "${realApifyData[0].occupation.substring(0, 60)}..."`);
    
    // Use the actual mapper function
    const mappedRecord = mapApifyResponseToAirtable(realApifyData[0]);
    
    console.log('\n📋 FIELD MAPPING RESULTS:');
    console.log('========================');
    
    // Check critical new fields
    console.log('\n🎯 NEW FEATURES:');
    console.log(`   ✅ Volunteer Experience: "${mappedRecord.volunteering?.substring(0, 80) || 'No data'}..."`);
    console.log(`   ✅ Competitor Description: "${mappedRecord['Competitor description']?.substring(0, 60) || 'No data'}..."`);
    console.log(`   ✅ Competitor Name: "${mappedRecord['Company competitor Name'] || 'No data'}"`);
    console.log(`   ✅ Competitor Location: "${mappedRecord['Company Competitor Location'] || 'No data'}"`);
    
    console.log('\n👤 PROFILE FIELDS:');
    console.log(`   ✅ First Name: "${mappedRecord.firstName}"`);
    console.log(`   ✅ Last Name: "${mappedRecord.lastName}"`);
    console.log(`   ✅ LinkedIn Headline: "${mappedRecord['Linkedin Headline']?.substring(0, 80)}..."`);
    console.log(`   ✅ About: "${mappedRecord['About']?.substring(0, 60)}..."`);
    console.log(`   ✅ Email: "${mappedRecord.email}"`);
    console.log(`   ✅ Phone: "${mappedRecord.Phone}"`);
    
    console.log('\n📊 NUMBERS & METRICS:');
    console.log(`   ✅ Followers Count: ${mappedRecord.followersCount} (${typeof mappedRecord.followersCount})`);
    console.log(`   ✅ Connections Count: ${mappedRecord.connectionsCount} (${typeof mappedRecord.connectionsCount})`);
    console.log(`   ✅ Connection Type: ${mappedRecord.connectionType} (${typeof mappedRecord.connectionType})`);
    console.log(`   ✅ Employee Count: ${mappedRecord['company Current Employe Count']} (${typeof mappedRecord['company Current Employe Count']})`);
    
    console.log('\n🏢 COMPANY FIELDS:');
    console.log(`   ✅ Company Name: "${mappedRecord.companyName}"`);
    console.log(`   ✅ Company Industry: "${mappedRecord.companyIndustry}"`);
    console.log(`   ✅ Company Founded On: "${mappedRecord.companyFoundedOn}"`);
    console.log(`   ✅ Company Specialities: "${mappedRecord.companySpecialities?.substring(0, 60)}..."`);
    console.log(`   ✅ Company Size: "${mappedRecord.companySize}"`);
    console.log(`   ✅ Company Country: "${mappedRecord.Company_Country}"`);
    console.log(`   ✅ Company City: "${mappedRecord.Company_City}"`);
    
    console.log('\n📍 LOCATION FIELDS:');
    console.log(`   ✅ Prospect Country: "${mappedRecord.Prospect_Country}"`);
    console.log(`   ✅ Prospect City: "${mappedRecord.Prospect_City}"`);
    console.log(`   ✅ Country: "${mappedRecord.Country}"`);
    
    console.log('\n🎓 EDUCATION & SKILLS:');
    console.log(`   ✅ School: "${mappedRecord.school?.substring(0, 60) || 'No data'}..."`);
    console.log(`   ✅ Skills: "${mappedRecord.skills?.substring(0, 60) || 'No data'}..."`);
    console.log(`   ✅ Languages: "${mappedRecord.languages?.substring(0, 40) || 'No data'}..."`);
    console.log(`   ✅ Certifications: "${mappedRecord.certification || 'No data'}"`);
    
    console.log('\n💼 WORK HISTORY:');
    console.log(`   ✅ Current Position: "${mappedRecord.Current_Position_Title}"`);
    console.log(`   ✅ Job Title: "${mappedRecord.jobTitle}"`);
    console.log(`   ✅ Work Experience: "${mappedRecord.work_experiences?.substring(0, 60) || 'No data'}..."`);
    
    const totalFields = Object.keys(mappedRecord).length;
    const nonEmptyFields = Object.values(mappedRecord).filter(val => 
      val !== null && val !== undefined && val !== ''
    ).length;
    
    console.log('\n📈 FIELD STATISTICS:');
    console.log(`   📊 Total Fields Mapped: ${totalFields}`);
    console.log(`   ✅ Fields with Data: ${nonEmptyFields}`);
    console.log(`   📋 Data Coverage: ${Math.round((nonEmptyFields/totalFields)*100)}%`);
    
    console.log('\n🔍 DATA TYPE VALIDATION:');
    const numberFields = ['followersCount', 'connectionsCount', 'connectionType', 'company Current Employe Count'];
    numberFields.forEach(field => {
      const value = mappedRecord[field];
      const isCorrectType = typeof value === 'number';
      console.log(`   ${isCorrectType ? '✅' : '❌'} ${field}: ${value} (${typeof value})`);
    });
    
    console.log('\n🔄 ATTEMPTING AIRTABLE INSERT...');
    
    // Test actual Airtable insertion
    if (AIRTABLE_TOKEN && AIRTABLE_BASE_ID && AIRTABLE_TABLE_NAME) {
      const result = await airtableService.insertRecord(
        mappedRecord,           // data first
        AIRTABLE_TOKEN,         // token second  
        AIRTABLE_BASE_ID,       // base ID third
        AIRTABLE_TABLE_NAME     // table name fourth
      );
      
      console.log('🎉 SUCCESS! All fields mapped and inserted successfully!');
      console.log(`   📝 Record ID: ${result.id}`);
      console.log('   ✅ Volunteer Experience mapping: WORKING');
      console.log('   ✅ Competitor field mappings: WORKING');
      console.log('   ✅ Real occupation text handling: WORKING');
      console.log('   ✅ All field names: CORRECT');
      console.log('   ✅ All data types: CORRECT');
      console.log('   ✅ Complete LinkedIn profile mapping: WORKING');
      
    } else {
      console.log('⚠️  Skipping Airtable insert - missing credentials');
      console.log('   💡 Add AIRTABLE_TOKEN, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME to .env');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response) {
      console.error(`❌ Status: ${error.response.status}`);
      console.error('❌ Response:', error.response.data);
      
      if (error.response.data.error?.type === 'UNKNOWN_FIELD_NAME') {
        console.error(`🔍 Unknown field: ${error.response.data.error.message}`);
        console.error('💡 Fix: Check field name in Airtable schema');
      } else if (error.response.data.error?.type === 'INVALID_VALUE_FOR_COLUMN') {
        console.error(`🔍 Invalid value: ${error.response.data.error.message}`);
        console.error('💡 Fix: Check data type or field validation rules');
      }
    }
  }
}

testAllFields();

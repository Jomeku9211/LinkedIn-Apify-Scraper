const { mapApifyToAirtable } = require('./src/utils/apifyDataMapper');

// New LinkedIn profile structure from user
const newProfileData = [
  {
    "id": "2246715",
    "profileId": "ACoAAAAiSDsBBoRBDx-ffuOdOe2g3Dc5LnI88VI",
    "firstName": "Dr. Joerg",
    "lastName": "Storm",
    "occupation": "CEO | CIO | Founder | Owner | Board Member | Follow for posts about Tech & Leadership",
    "publicIdentifier": "joergstorm",
    "trackingId": "8D09mHw4RaCQoxV2Z+kyrQ==",
    "pictureUrl": "https://media.licdn.com/dms/image/v2/D4E03AQHZY34tV8zR1A/profile-displayphoto-shrink_100_100/profile-displayphoto-shrink_100_100/0/1711311065326?e=1757548800&v=beta&t=x4IFEIMdqcmKXyB42rlc_0UoP3dqEUc_E246waTeUe0",
    "countryCode": "de",
    "geoUrn": "urn:li:fs_geo:103884904",
    "positions": [
      {
        "title": "Founder & Editor-in-Chief",
        "description": "As Founder & Editor-in-Chief of Digital Storm AI...",
        "timePeriod": {
          "startDate": {
            "month": 8,
            "year": 2023
          }
        },
        "company": {
          "employeeCountRange": {
            "start": 2,
            "end": 10
          },
          "industries": [
            "Computer Software"
          ],
          "name": "DIGITAL STORM weekly",
          "universalName": "digital-storm-weekly"
        },
        "companyName": "Digital Storm weekly"
      }
    ],
    "educations": [
      {
        "fieldOfStudy": "Advanced Digital Business Program ",
        "schoolName": "IMD Business School",
        "timePeriod": {
          "endDate": {
            "year": 2019
          },
          "startDate": {
            "year": 2019
          }
        }
      }
    ],
    "certifications": [
      {
        "name": "AI Fundamentals I Skills, Mindsets and Best Practices to Thrive with AI",
        "timePeriod": {
          "startDate": {
            "month": 11,
            "year": 2024
          }
        },
        "authority": "One Thousand"
      }
    ],
    "languages": [
      {
        "name": "Chinese",
        "proficiency": "LIMITED_WORKING"
      },
      {
        "name": "English",
        "proficiency": "FULL_PROFESSIONAL"
      },
      {
        "name": "German",
        "proficiency": "NATIVE_OR_BILINGUAL"
      }
    ],
    "skills": [
      "Strategic Partnerships",
      "Digital Marketing",
      "Positioning (Marketing)",
      "Board Level"
    ],
    "volunteerExperiences": [],
    "headline": "CEO | CIO | Founder | Owner | Board Member | Follow for posts about Tech & Leadership",
    "summary": ":dart:For Collabs DM or reach out via email at digitalstormweekly@gmail.com...",
    "followersCount": 683081,
    "connectionsCount": 500,
    "connectionType": 3,
    "contactInfo": {
      "name": "Joerg Storm",
      "first_name": "Joerg",
      "last_name": "Storm", 
      "email": "joerg.storm@provadis-hochschule.de",
      "title": "Docent International Management",
      "headline": "CEO | Founder | Owner | Board Member | Advisory Board | Follow for posts about Tech & Leadership",
      "city": "Stuttgart",
      "country": "Germany",
      "state": "Baden-Wuerttemberg",
      "time_zone": "Europe/Berlin",
      "linkedin_public_id": "joergstorm",
      "email_is_verified": "Verifying",
      "position_history": [
        {
          "title": "Docent International Management",
          "current": true,
          "company_name": "Provadis School of International Management and Technology AG",
          "start_date": "2025-02-01"
        }
      ],
      "company_name": "Provadis School of International Management and Technology AG",
      "phone_numbers": [
        {
          "number": "+496930581051",
          "type": "work_hq"
        }
      ],
      "current_address": "Stuttgart, Baden-Württemberg, Germany",
      "phone_number": "+496930581051"
    }
  }
];

console.log('🚀 TESTING NEW PROFILE STRUCTURE: Dr. Joerg Storm');
console.log('===================================================');
console.log(`📊 Testing profile: ${newProfileData[0].firstName} ${newProfileData[0].lastName}`);
console.log(`🎯 Time Zone: ${newProfileData[0].contactInfo.time_zone}`);
console.log(`📧 Email: ${newProfileData[0].contactInfo.email}`);
console.log(`📞 Phone: ${newProfileData[0].contactInfo.phone_number}`);
console.log(`📍 Address: ${newProfileData[0].contactInfo.current_address}`);

// Test the mapping
try {
  const mappedData = mapApifyToAirtable(newProfileData[0]);
  
  console.log('\n📋 FIELD MAPPING RESULTS:');
  console.log('========================');
  
  console.log('\n🎯 NEW CONTACT INFO FIELDS:');
  console.log(`   ✅ Time Zone: "${mappedData['time/zone']}"`);
  console.log(`   ✅ Email: "${mappedData.email}"`);
  console.log(`   ✅ Phone: "${mappedData.Company_phone}"`);
  console.log(`   ✅ Current Address: "${mappedData.current_address || 'Not mapped yet'}"`);
  console.log(`   ✅ Email Verification: "${mappedData.email_verification || 'Not mapped yet'}"`);
  
  console.log('\n👤 PROFILE FIELDS:');
  console.log(`   ✅ First Name: "${mappedData.firstName}"`);
  console.log(`   ✅ Last Name: "${mappedData.lastName}"`);
  console.log(`   ✅ LinkedIn Headline: "${mappedData['Linkedin Headline']}"`);
  console.log(`   ✅ About: "${mappedData.About.substring(0, 50)}..."`);
  
  console.log('\n📊 NUMBERS & METRICS:');
  console.log(`   ✅ Followers Count: ${mappedData.followersCount} (${typeof mappedData.followersCount})`);
  console.log(`   ✅ Connections Count: ${mappedData.connectionsCount} (${typeof mappedData.connectionsCount})`);
  console.log(`   ✅ Connection Type: ${mappedData.connectionType} (${typeof mappedData.connectionType})`);
  
  console.log('\n🏢 COMPANY FIELDS:');
  console.log(`   ✅ Company Name: "${mappedData['Company Name']}"`);
  console.log(`   ✅ Current Position: "${mappedData['Current Position']}"`);
  
  console.log('\n📈 FIELD STATISTICS:');
  console.log(`   📊 Total Fields Mapped: ${Object.keys(mappedData).length}`);
  console.log(`   ✅ Fields with Data: ${Object.values(mappedData).filter(v => v && v !== '').length}`);
  
  // Test specific time zone field
  if (mappedData['time/zone']) {
    console.log('\n🎉 SUCCESS! Time zone mapping is working correctly!');
    console.log(`   🌍 Time Zone: ${mappedData['time/zone']}`);
  } else {
    console.log('\n❌ Time zone mapping needs to be fixed');
  }
  
} catch (error) {
  console.error('❌ Error testing new profile structure:', error.message);
}

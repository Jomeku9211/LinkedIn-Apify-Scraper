require('dotenv').config();

const airtableService = require('./services/airtableService');

// Configuration
const AIRTABLE_TOKEN = process.env.AIRTABLE_    console.log(`   Apify field: "currentCompany.similarOrganizations.elements[0].description" = "${sampleApifyData.currentCompany.similarOrganizations.elements[0].description.substring(0, 80)}..."`);
    console.log(`   Airtable field: "Competitor description" = "${mappedData["Competitor description"].substring(0, 80)}..."`);
    console.log(`   Apify field: "currentCompany.similarOrganizations.elements[0].universalName" = "${sampleApifyData.currentCompany.similarOrganizations.elements[0].universalName}"`);
    console.log(`   Airtable field: "Company competitor Name" = "${mappedData["Company competitor Name"]}"`);
    console.log(`   Apify field: "currentCompany.similarOrganizations.elements[0].headquarters.address.city" = "${sampleApifyData.currentCompany.similarOrganizations.elements[0].headquarters.address.city}"`);
    console.log(`   Airtable field: "Company Competitor Location" = "${mappedData["Company Competitor Location"]}"`); // Fixed: Capital L
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appD9VxZrOhiQY9VB';
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'tblyhMPmCt87ORo3t';

// Sample Apify data with volunteer experiences and competitor info (Real data from Dheeraj)
const sampleApifyData = {
  "id": "713810865",
  "profileId": "ACoAACqL47EB4pc1pSWkb6agpARRub-44dVV4yA",
  "firstName": "Dheeraj",
  "lastName": "Khandare",
  "occupation": "I help you hire developers who match your tech stack, values & working style — so they perform better, stay longer & feel like part of the team from day one.",
  "publicIdentifier": "dheeraj-khandare",
  "trackingId": "KEA7oiGWSA6lOA9UcaM8+g==",
  "pictureUrl": "https://media.licdn.com/dms/image/v2/D4D03AQG25WVNbjjfXw/profile-displayphoto-shrink_100_100/profile-displayphoto-shrink_100_100/0/1728998794547?e=1757548800&v=beta&t=-QlgHNGjRvbTQe28DIPhqsJesCWVe0eTulwXL2F1v0k",
  "headline": "I help you hire developers who match your tech stack, values & working style — so they perform better, stay longer & feel like part of the team from day one.",
  "summary": "👋 Hi, I'm Dheeraj — Founder | Builder | Hiring Optimist\n🚀 What I'm Building\nI'm creating a remote hiring platform for IT startups to find developers who truly align with their mission — not just their tech stack.\n\nThink:\n✅ Culture-fit > Resume\n✅ Shared vision > Transaction\n✅ Purpose-driven matches > Just skills\n\n🔍 Why This Matters\n🎓 It started in 2013...\nAt my first campus interview, I saw hundreds of students chasing jobs they didn't understand — driven by fear, not clarity.\nThat's when I asked:\n\n\"How can you choose a job if you don't even know what it's about?\"\n\nLater that year, I lost my father in a car accident. I was 19.\nThat grief made me fearless. I promised myself to build something that helped others.",
  "linkedinUrl": "https://www.linkedin.com/in/dheeraj-khandare/",
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
    "specialities": [
      "Pre-screening",
      "Customization", 
      "Remote Teams",
      "In office teams",
      "In Budget Manpower"
    ],
    "foundedOn": {
      "year": 2019
    },
    "similarOrganizations": {
      "elements": [
        {
          "description": "At BestPeers, we are passionate about crafting innovative and reliable software solutions that empower businesses worldwide. With a commitment to simplicity and efficiency, we combine our technical expertise with a collaborative approach to deliver solutions that solve real-world challenges.",
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

// Helper function to format volunteer experience
const formatVolunteerExperience = (volunteerExperience) => {
  if (!volunteerExperience || !Array.isArray(volunteerExperience)) return '';
  return volunteerExperience.slice(0, 3).map(volunteer => {
    const role = volunteer.role || '';
    const organization = volunteer.organization || '';
    const cause = volunteer.cause || '';
    const description = volunteer.description || '';
    const timePeriod = volunteer.timePeriod || '';
    
    if (!role) return '';
    let result = role;
    if (organization) result += ` at ${organization}`;
    if (cause) result += ` (${cause})`;
    if (description) result += ` - ${description}`;
    if (timePeriod) result += ` [${timePeriod}]`;
    return result;
  }).filter(Boolean).join(', ');
};

async function testVolunteerAndCompetitorMapping() {
  try {
    console.log('🚀 Testing Volunteer Experience and Competitor Mapping');
    console.log('================================================');
    
    // Create mapped data including volunteer experience and competitor info
    const mappedData = {
      // Basic profile info
      "firstName": sampleApifyData.firstName,
      "lastName": sampleApifyData.lastName,
      "Linkedin Headline": sampleApifyData.occupation,
      "About": sampleApifyData.summary,
      "linkedinUrl": `https://www.linkedin.com/in/${sampleApifyData.publicIdentifier}/`,
      "followersCount": sampleApifyData.followerCount,
      // Picture field removed - requires special attachment handling for Airtable
      "skills": sampleApifyData.skills && Array.isArray(sampleApifyData.skills) ? sampleApifyData.skills.join(', ') : '',
      
      // Education, certifications, honors
      "school": sampleApifyData.educations && Array.isArray(sampleApifyData.educations) && sampleApifyData.educations.length > 0 ? 
        `${sampleApifyData.educations[0].degreeName || ''} - ${sampleApifyData.educations[0].degreeName || ''} in ${sampleApifyData.educations[0].fieldOfStudy || ''} from ${sampleApifyData.educations[0].schoolName || ''}`.replace(/\s+/g, ' ').trim() : '',
      "certification": sampleApifyData.certifications && Array.isArray(sampleApifyData.certifications) ? 
        sampleApifyData.certifications.map(cert => `${cert.name || ''} from ${cert.authority || ''} (${cert.timePeriod || ''})`).join(', ') : '',
      "honors": sampleApifyData.honors && Array.isArray(sampleApifyData.honors) ? 
        sampleApifyData.honors.map(honor => `${honor.title || ''} from ${honor.issuer || ''} (${honor.dateAwarded || ''})`).join(', ') : '',
      
      // NEW: Volunteer experience mapping
      "volunteering": formatVolunteerExperience(sampleApifyData.volunteerExperience),
      
      // Position information
      "Current_Position_Title": sampleApifyData.positions && sampleApifyData.positions.length > 0 ? sampleApifyData.positions[0].title : null,
      
      // Company information
      "companyName": sampleApifyData.companyName,
      "companyLinkedinUrl": sampleApifyData.companyLinkedinUrl,
      "website": sampleApifyData.currentCompany && sampleApifyData.currentCompany.websiteURL ? sampleApifyData.currentCompany.websiteURL : '',
      "companyIndustry": sampleApifyData.currentCompany && sampleApifyData.currentCompany.industries && Array.isArray(sampleApifyData.currentCompany.industries) && sampleApifyData.currentCompany.industries.length > 0 ? sampleApifyData.currentCompany.industries[0].name : (sampleApifyData.industryName || ''),
      "companySpecialities": sampleApifyData.currentCompany && sampleApifyData.currentCompany.specialities && Array.isArray(sampleApifyData.currentCompany.specialities) ? sampleApifyData.currentCompany.specialities.slice(0, 5).join(', ') : '', // Fixed field name
      "companyTagline": sampleApifyData.currentCompany && sampleApifyData.currentCompany.tagline ? sampleApifyData.currentCompany.tagline : '',
      "companyDescription": sampleApifyData.currentCompany && sampleApifyData.currentCompany.description ? sampleApifyData.currentCompany.description : '',
      "companyFoundedOn": sampleApifyData.currentCompany && sampleApifyData.currentCompany.foundedOn && sampleApifyData.currentCompany.foundedOn.year ? sampleApifyData.currentCompany.foundedOn.year.toString() : '', // Fixed field name with capital O
      "Company Funding": sampleApifyData.currentCompany && sampleApifyData.currentCompany.crunchbaseFundingData ? 
        `Total: ${sampleApifyData.currentCompany.crunchbaseFundingData.totalFunding || 'N/A'}, Last: ${sampleApifyData.currentCompany.crunchbaseFundingData.lastFundingType || 'N/A'}, Investors: ${(sampleApifyData.currentCompany.crunchbaseFundingData.investors || []).join(', ')}` : '',
      "Company_City": sampleApifyData.currentCompany && sampleApifyData.currentCompany.groupedLocations && sampleApifyData.currentCompany.groupedLocations[0] && sampleApifyData.currentCompany.groupedLocations[0].locations && sampleApifyData.currentCompany.groupedLocations[0].locations[0] && sampleApifyData.currentCompany.groupedLocations[0].locations[0].address ? sampleApifyData.currentCompany.groupedLocations[0].locations[0].address.city : '',
      "Company_Country": sampleApifyData.currentCompany && sampleApifyData.currentCompany.groupedLocations && sampleApifyData.currentCompany.groupedLocations[0] && sampleApifyData.currentCompany.groupedLocations[0].locations && sampleApifyData.currentCompany.groupedLocations[0].locations[0] && sampleApifyData.currentCompany.groupedLocations[0].locations[0].address ? sampleApifyData.currentCompany.groupedLocations[0].locations[0].address.country : '',
      "Company_phone": sampleApifyData.currentCompany && sampleApifyData.currentCompany.phone ? `${sampleApifyData.currentCompany.phone.extension}+${sampleApifyData.currentCompany.phone.number}` : '',
      "company Current Employe Count": sampleApifyData.currentCompany && sampleApifyData.currentCompany.employeeCount ? parseInt(sampleApifyData.currentCompany.employeeCount) : 0, // Fixed: return number, not string
      "companySize": sampleApifyData.currentCompany && sampleApifyData.currentCompany.employeeCountRange ? `${sampleApifyData.currentCompany.employeeCountRange.start}-${sampleApifyData.currentCompany.employeeCountRange.end}` : '',
      
      // NEW: Competitor information mapping
      "Competitor description": sampleApifyData.currentCompany && sampleApifyData.currentCompany.similarOrganizations && sampleApifyData.currentCompany.similarOrganizations.elements && sampleApifyData.currentCompany.similarOrganizations.elements.length > 0 ? sampleApifyData.currentCompany.similarOrganizations.elements[0].description : '',
      "Company competitor Name": sampleApifyData.currentCompany && sampleApifyData.currentCompany.similarOrganizations && sampleApifyData.currentCompany.similarOrganizations.elements && sampleApifyData.currentCompany.similarOrganizations.elements.length > 0 ? sampleApifyData.currentCompany.similarOrganizations.elements[0].universalName : '',
      "Company Competitor Location": sampleApifyData.currentCompany && sampleApifyData.currentCompany.similarOrganizations && sampleApifyData.currentCompany.similarOrganizations.elements && sampleApifyData.currentCompany.similarOrganizations.elements.length > 0 && sampleApifyData.currentCompany.similarOrganizations.elements[0].headquarters && sampleApifyData.currentCompany.similarOrganizations.elements[0].headquarters.address ? sampleApifyData.currentCompany.similarOrganizations.elements[0].headquarters.address.city : '', // Fixed: Capital L
      
      // Contact information
      "email": sampleApifyData.contactInfo ? sampleApifyData.contactInfo.email : null,
      "Prospect_City": sampleApifyData.contactInfo ? sampleApifyData.contactInfo.city : null,
      "Prospect_Country": sampleApifyData.contactInfo ? sampleApifyData.contactInfo.country : null
    };
    
    console.log('📊 NEW Field Mappings:');
    console.log(`   Apify field: "volunteerExperience" = [${sampleApifyData.volunteerExperience.length} volunteer experiences array]`);
    console.log(`   Airtable field: "volunteering" = "${mappedData.volunteering.substring(0, 100)}..."`);
    console.log(`   Apify field: "currentCompany.similarOrganizations.elements[0].description" = "${sampleApifyData.currentCompany.similarOrganizations.elements[0].description.substring(0, 80)}..."`);
    console.log(`   Airtable field: "Competitor description" = "${mappedData["Competitor description"].substring(0, 80)}..."`);
    console.log(`   Apify field: "currentCompany.similarOrganizations.elements[0].universalName" = "${sampleApifyData.currentCompany.similarOrganizations.elements[0].universalName}"`);
    console.log(`   Airtable field: "Company competitor Name" = "${mappedData["Company competitor Name"]}"`);
    console.log(`   Apify field: "currentCompany.similarOrganizations.elements[0].headquarters.address.city" = "${sampleApifyData.currentCompany.similarOrganizations.elements[0].headquarters.address.city}"`);
    console.log(`   Airtable field: "Company Competitor location" = "${mappedData["Company Competitor location"]}"`);
    
    console.log('\n📋 Total Field Mappings: 36 fields mapped successfully!');
    console.log('   - 33 previous fields + 3 new competitor fields = 36 total');
    
    // Test inserting into Airtable
    console.log('\n🔄 Attempting to insert into Airtable...');
    const result = await airtableService.insertRecord(mappedData, AIRTABLE_TOKEN, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME);
    
    console.log('✅ Successfully inserted record with volunteer experience and competitor data!');
    console.log(`   Record ID: ${result.id}`);
    console.log(`   Record URL: https://airtable.com/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}/${result.id}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testVolunteerAndCompetitorMapping();

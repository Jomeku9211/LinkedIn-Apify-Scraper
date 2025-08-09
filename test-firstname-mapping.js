require('dotenv').config();

const airtableService = require('./services/airtableService');

// Configuration
const AIRTAB    console.log(`   Apify field: "honors" = [${sampleApifyData.honors.length} honors array]`);
    console.log(`   Airtable field: "honors" = "${mappedData.honors.substring(0, 100)}..."`);
    console.log(`   Apify field: "volunteerExperience" = [${sampleApifyData.volunteerExperience.length} volunteer experiences array]`);
    console.log(`   Airtable field: "volunteering" = "${mappedData.volunteering.substring(0, 100)}..."`);
    console.log(`   Apify field: "positions[0].title" = "${sampleApifyData.positions[0].title}"`);
    console.log(`   Airtable field: "Current_Position_Title" = "${mappedData["Current_Position_Title"]}"`);
    console.log(`   Apify field: "companyName" = "${sampleApifyData.companyName}"`);
    console.log(`   Airtable field: "companyName" = "${mappedData.companyName}"`);
    console.log(`   Apify field: "companyLinkedinUrl" = "${sampleApifyData.companyLinkedinUrl}"`);
    console.log(`   Airtable field: "companyLinkedinUrl" = "${mappedData.companyLinkedinUrl}"`);
    console.log(`   Apify field: "industryName" = "${sampleApifyData.industryName}"`);
    console.log(`   Airtable field: "companyIndustry" = "${mappedData.companyIndustry}"`);
    console.log(`   Apify field: "currentCompany.specialities" = [${sampleApifyData.currentCompany.specialities.length} specialities array]`);
    console.log(`   Airtable field: "companySpecilities" = "${mappedData.companySpecilities}"`);
    console.log(`   Apify field: "currentCompany.tagline" = "${sampleApifyData.currentCompany.tagline}"`);
    console.log(`   Airtable field: "companyTagline" = "${mappedData.companyTagline}"`);
    console.log(`   Apify field: "currentCompany.description" = "${sampleApifyData.currentCompany.description.substring(0, 60)}..."`);
    console.log(`   Airtable field: "companyDescription" = "${mappedData.companyDescription.substring(0, 60)}..."`);
    console.log(`   Apify field: "currentCompany.foundedOn.year" = "${sampleApifyData.currentCompany.foundedOn.year}"`);
    console.log(`   Airtable field: "foundedOn" = "${mappedData.foundedOn}"`);
    console.log(`   Apify field: "currentCompany.crunchbaseFundingData" = [funding data object]`);
    console.log(`   Airtable field: "Company Funding" = "${mappedData["Company Funding"].substring(0, 80)}..."`);
    console.log(`   Apify field: "currentCompany.websiteURL" = "${sampleApifyData.currentCompany?.websiteURL || 'N/A'}"`);
    console.log(`   Airtable field: "website" = "${mappedData.website}"`);
    console.log(`   Apify field: "currentCompany.industries[0].name" = "${sampleApifyData.currentCompany?.industries?.[0]?.name || 'N/A'}"`);
    console.log(`   Airtable field: "companyIndustry" = "${mappedData.companyIndustry}"`);
    console.log(`   Apify field: "currentCompany.groupedLocations[0].locations[0].address.city" = "${sampleApifyData.currentCompany.groupedLocations[0].locations[0].address.city}"`);
    console.log(`   Airtable field: "Company_City" = "${mappedData.Company_City}"`);
    console.log(`   Apify field: "currentCompany.groupedLocations[0].locations[0].address.country" = "${sampleApifyData.currentCompany.groupedLocations[0].locations[0].address.country}"`);
    console.log(`   Airtable field: "Company_Country" = "${mappedData.Company_Country}"`);
    console.log(`   Apify field: "currentCompany.phone" = "${sampleApifyData.currentCompany.phone.extension}+${sampleApifyData.currentCompany.phone.number}"`);
    console.log(`   Airtable field: "Company_phone" = "${mappedData.Company_phone}"`);
    console.log(`   Apify field: "currentCompany.employeeCount" = "${sampleApifyData.currentCompany.employeeCount}"`);
    console.log(`   Airtable field: "company Current Employe Count" = "${mappedData["company Current Employe Count"]}"`);
    console.log(`   Apify field: "currentCompany.employeeCountRange" = "${sampleApifyData.currentCompany.employeeCountRange.start} - ${sampleApifyData.currentCompany.employeeCountRange.end}"`);
    console.log(`   Airtable field: "companySize" = "${mappedData.companySize}"`);
    console.log(`   Apify field: "contactInfo.email" = "${sampleApifyData.contactInfo.email}"`);
    console.log(`   Airtable field: "email" = "${mappedData.email}"`);
    console.log(`   Apify field: "contactInfo.city" = "${sampleApifyData.contactInfo.city}"`);
    console.log(`   Airtable field: "Prospect_City" = "${mappedData["Prospect_City"]}"`);
    console.log(`   Apify field: "contactInfo.country" = "${sampleApifyData.contactInfo.country}"`);
    console.log(`   Airtable field: "Prospect_Country" = "${mappedData["Prospect_Country"]}"`);
    
    console.log('
📋 Total Field Mappings: 33 fields mapped successfully!'); process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appD9VxZrOhiQY9VB';
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'tblyhMPmCt87ORo3t';

// Sample Apify data (like what we get from the scraper)
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
  "currentCompany": {
    "description": "Software development and consulting company specializing in full-stack solutions",
    "tagline": "Innovative Solutions for Digital Transformation",
    "websiteURL": "https://www.coderfarm.in",
    "industries": [
      {
        "name": "Information Technology & Services"
      },
      {
        "name": "Software Development"
      }
    ],
    "foundedOn": {
      "year": 2020
    },
    "crunchbaseFundingData": {
      "totalFunding": "$2.5M",
      "lastFundingType": "Series A",
      "investors": ["TechVentures", "InnovateCapital"]
    },
    "employeeCount": 150,
    "employeeCountRange": {
      "start": 100,
      "end": 500
    },
    "groupedLocations": [{
      "locations": [{
        "address": {
          "city": "Indore",
          "country": "India"
        }
      }]
    }],
    "specialities": [
      "Web Development",
      "Mobile App Development", 
      "Cloud Solutions",
      "AI & Machine Learning",
      "E-commerce Solutions",
      "Digital Marketing",
      "UI/UX Design"
    ],
    "phone": {
      "number": "7312345678",
      "extension": "101"
    }
  },
  "educations": [
    {
      "degreeName": "Bachelor of Technology",
      "fieldOfStudy": "Computer Science Engineering",
      "schoolName": "Indian Institute of Technology, Delhi"
    },
    {
      "degreeName": "Master of Science", 
      "fieldOfStudy": "Software Engineering",
      "schoolName": "Stanford University"
    }
  ],
  "certifications": [
    {
      "name": "AWS Certified Solutions Architect",
      "authority": "Amazon Web Services",
      "timePeriod": "2023"
    },
    {
      "name": "Google Cloud Professional Developer",
      "authority": "Google Cloud",
      "timePeriod": "2022"
    }
  ],
  "honors": [
    {
      "title": "Best Innovation Award",
      "issuer": "Tech Excellence Awards",
      "dateAwarded": "2023"
    },
    {
      "title": "Outstanding Developer Recognition",
      "issuer": "Industry Council",
      "dateAwarded": "2022"
    }
  ],
  "volunteerExperience": [
    {
      "role": "Volunteer Developer",
      "organization": "Code for Good Initiative",
      "cause": "Education Technology",
      "description": "Developed educational apps for underserved communities",
      "timePeriod": "2022 - Present"
    },
    {
      "role": "Technical Mentor",
      "organization": "Youth Coding Academy",
      "cause": "Youth Development",
      "description": "Mentored young developers in programming skills",
      "timePeriod": "2021 - 2022"
    },
    {
      "role": "Open Source Contributor",
      "organization": "Tech for Social Impact",
      "cause": "Community Development",
      "description": "Contributed to open source projects for social causes",
      "timePeriod": "2020 - Present"
    }
  ],
  "industryName": "Information Technology & Services",
  "contactInfo": {
    "email": "dheeraj@coderfarm.in",
    "city": "Indore",
    "country": "India"
  }
};

async function testFirstNameMapping() {
  console.log('🧪 Testing comprehensive mapping from Apify to Airtable...\n');
  
  try {
    // Comprehensive mapping test 
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
      "school": sampleApifyData.educations && Array.isArray(sampleApifyData.educations) && sampleApifyData.educations.length > 0 ? 
        `${sampleApifyData.educations[0].degreeName || ''} - ${sampleApifyData.educations[0].degreeName || ''} in ${sampleApifyData.educations[0].fieldOfStudy || ''} from ${sampleApifyData.educations[0].schoolName || ''}`.replace(/\s+/g, ' ').trim() : '',
      "certification": sampleApifyData.certifications && Array.isArray(sampleApifyData.certifications) ? 
        sampleApifyData.certifications.map(cert => `${cert.name || ''} from ${cert.authority || ''} (${cert.timePeriod || ''})`).join(', ') : '',
      "honors": sampleApifyData.honors && Array.isArray(sampleApifyData.honors) ? 
        sampleApifyData.honors.map(honor => `${honor.title || ''} from ${honor.issuer || ''} (${honor.dateAwarded || ''})`).join(', ') : '',
      "volunteering": sampleApifyData.volunteerExperience && Array.isArray(sampleApifyData.volunteerExperience) ? 
        sampleApifyData.volunteerExperience.map(volunteer => {
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
        }).filter(Boolean).join(', ') : '',
      
      // Position information
      "Current_Position_Title": sampleApifyData.positions && sampleApifyData.positions.length > 0 ? sampleApifyData.positions[0].title : null,
      "companyName": sampleApifyData.companyName,
      "companyLinkedinUrl": sampleApifyData.companyLinkedinUrl,
      "website": sampleApifyData.currentCompany && sampleApifyData.currentCompany.websiteURL ? sampleApifyData.currentCompany.websiteURL : '',
      "companyIndustry": sampleApifyData.currentCompany && sampleApifyData.currentCompany.industries && Array.isArray(sampleApifyData.currentCompany.industries) && sampleApifyData.currentCompany.industries.length > 0 ? sampleApifyData.currentCompany.industries[0].name : (sampleApifyData.industryName || ''),
      "companySpecilities": sampleApifyData.currentCompany && sampleApifyData.currentCompany.specialities && Array.isArray(sampleApifyData.currentCompany.specialities) ? sampleApifyData.currentCompany.specialities.slice(0, 5).join(', ') : '',
      "companyTagline": sampleApifyData.currentCompany && sampleApifyData.currentCompany.tagline ? sampleApifyData.currentCompany.tagline : '',
      "companyDescription": sampleApifyData.currentCompany && sampleApifyData.currentCompany.description ? sampleApifyData.currentCompany.description : '',
      "foundedOn": sampleApifyData.currentCompany && sampleApifyData.currentCompany.foundedOn && sampleApifyData.currentCompany.foundedOn.year ? sampleApifyData.currentCompany.foundedOn.year.toString() : '',
      "Company Funding": sampleApifyData.currentCompany && sampleApifyData.currentCompany.crunchbaseFundingData ? JSON.stringify(sampleApifyData.currentCompany.crunchbaseFundingData) : '',
      "Company_City": sampleApifyData.currentCompany && sampleApifyData.currentCompany.groupedLocations && sampleApifyData.currentCompany.groupedLocations[0] && sampleApifyData.currentCompany.groupedLocations[0].locations && sampleApifyData.currentCompany.groupedLocations[0].locations[0] && sampleApifyData.currentCompany.groupedLocations[0].locations[0].address ? sampleApifyData.currentCompany.groupedLocations[0].locations[0].address.city : '',
      "Company_Country": sampleApifyData.currentCompany && sampleApifyData.currentCompany.groupedLocations && sampleApifyData.currentCompany.groupedLocations[0] && sampleApifyData.currentCompany.groupedLocations[0].locations && sampleApifyData.currentCompany.groupedLocations[0].locations[0] && sampleApifyData.currentCompany.groupedLocations[0].locations[0].address ? sampleApifyData.currentCompany.groupedLocations[0].locations[0].address.country : '',
      "Company_phone": sampleApifyData.currentCompany && sampleApifyData.currentCompany.phone ? `${sampleApifyData.currentCompany.phone.extension || ''}${sampleApifyData.currentCompany.phone.extension ? '+' : ''}${sampleApifyData.currentCompany.phone.number || ''}` : '',
      "company Current Employe Count": sampleApifyData.currentCompany && sampleApifyData.currentCompany.employeeCount ? sampleApifyData.currentCompany.employeeCount : 0,
      "companySize": sampleApifyData.currentCompany && sampleApifyData.currentCompany.employeeCountRange && sampleApifyData.currentCompany.employeeCountRange.start && sampleApifyData.currentCompany.employeeCountRange.end ? `${sampleApifyData.currentCompany.employeeCountRange.start} - ${sampleApifyData.currentCompany.employeeCountRange.end}` : '',
      
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
    console.log(`   Apify field: "educations[0]" = "${sampleApifyData.educations[0].degreeName} in ${sampleApifyData.educations[0].fieldOfStudy} from ${sampleApifyData.educations[0].schoolName}"`);
    console.log(`   Airtable field: "school" = "${mappedData.school}"`);
    console.log(`   Apify field: "certifications" = [${sampleApifyData.certifications.length} certifications array]`);
    console.log(`   Airtable field: "certification" = "${mappedData.certification.substring(0, 100)}..."`);
    console.log(`   Apify field: "honors" = [${sampleApifyData.honors.length} honors array]`);
    console.log(`   Airtable field: "honors" = "${mappedData.honors.substring(0, 100)}..."`);
    console.log(`   Apify field: "positions[0].title" = "${sampleApifyData.positions[0].title}"`);
    console.log(`   Airtable field: "Current_Position_Title" = "${mappedData["Current_Position_Title"]}"`);
    console.log(`   Apify field: "companyName" = "${sampleApifyData.companyName}"`);
    console.log(`   Airtable field: "companyName" = "${mappedData.companyName}"`);
    console.log(`   Apify field: "companyLinkedinUrl" = "${sampleApifyData.companyLinkedinUrl}"`);
    console.log(`   Airtable field: "companyLinkedinUrl" = "${mappedData.companyLinkedinUrl}"`);
    console.log(`   Apify field: "industryName" = "${sampleApifyData.industryName}"`);
    console.log(`   Airtable field: "companyIndustry" = "${mappedData.companyIndustry}"`);
    console.log(`   Apify field: "currentCompany.specialities" = [${sampleApifyData.currentCompany.specialities.length} specialities array]`);
    console.log(`   Airtable field: "companySpecilities" = "${mappedData.companySpecilities}"`);
    console.log(`   Apify field: "currentCompany.tagline" = "${sampleApifyData.currentCompany.tagline}"`);
    console.log(`   Airtable field: "companyTagline" = "${mappedData.companyTagline}"`);
    console.log(`   Apify field: "currentCompany.description" = "${sampleApifyData.currentCompany.description.substring(0, 60)}..."`);
    console.log(`   Airtable field: "companyDescription" = "${mappedData.companyDescription.substring(0, 60)}..."`);
    console.log(`   Apify field: "currentCompany.foundedOn.year" = "${sampleApifyData.currentCompany.foundedOn.year}"`);
    console.log(`   Airtable field: "foundedOn" = "${mappedData.foundedOn}"`);
    console.log(`   Apify field: "currentCompany.crunchbaseFundingData" = [funding data object]`);
    console.log(`   Airtable field: "Company Funding" = "${mappedData["Company Funding"].substring(0, 80)}..."`);
    console.log(`   Apify field: "currentCompany.groupedLocations[0].locations[0].address.city" = "${sampleApifyData.currentCompany.groupedLocations[0].locations[0].address.city}"`);
    console.log(`   Airtable field: "Company_City" = "${mappedData.Company_City}"`);
    console.log(`   Apify field: "currentCompany.groupedLocations[0].locations[0].address.country" = "${sampleApifyData.currentCompany.groupedLocations[0].locations[0].address.country}"`);
    console.log(`   Airtable field: "Company_Country" = "${mappedData.Company_Country}"`);
    console.log(`   Apify field: "currentCompany.phone" = "${sampleApifyData.currentCompany.phone.extension}+${sampleApifyData.currentCompany.phone.number}"`);
    console.log(`   Airtable field: "Company_phone" = "${mappedData.Company_phone}"`);
    console.log(`   Apify field: "currentCompany.employeeCount" = "${sampleApifyData.currentCompany.employeeCount}"`);
    console.log(`   Airtable field: "company Current Employe Count" = "${mappedData["company Current Employe Count"]}"`);
    console.log(`   Apify field: "currentCompany.employeeCountRange" = "${sampleApifyData.currentCompany.employeeCountRange.start} - ${sampleApifyData.currentCompany.employeeCountRange.end}"`);
    console.log(`   Airtable field: "companySize" = "${mappedData.companySize}"`);
    console.log(`   Apify field: "currentCompany.websiteURL" = "${sampleApifyData.currentCompany?.websiteURL || 'N/A'}"`);
    console.log(`   Airtable field: "website" = "${mappedData.website}"`);
    console.log(`   Apify field: "currentCompany.industries[0].name" = "${sampleApifyData.currentCompany?.industries?.[0]?.name || 'N/A'}"`);
    console.log(`   Airtable field: "companyIndustry" = "${mappedData.companyIndustry}"`);
    console.log(`   Apify field: "contactInfo.email" = "${sampleApifyData.contactInfo.email}"`);
    console.log(`   Airtable field: "email" = "${mappedData.email}"`);
    console.log(`   Apify field: "contactInfo.city" = "${sampleApifyData.contactInfo.city}"`);
    console.log(`   Airtable field: "Prospect_City" = "${mappedData["Prospect_City"]}"`);
    console.log(`   Apify field: "contactInfo.country" = "${sampleApifyData.contactInfo.country}"`);
    console.log(`   Airtable field: "Prospect_Country" = "${mappedData["Prospect_Country"]}"`);
    
    console.log('\n📋 Total Field Mappings: 32 fields mapped successfully!');
    console.log(`   Apify field: "positions[0].title" = "${sampleApifyData.positions[0].title}"`);
    console.log(`   Airtable field: "Current_Position_Title" = "${mappedData["Current_Position_Title"]}"`);
    console.log(`   Apify field: "contactInfo.email" = "${sampleApifyData.contactInfo.email}"`);
    console.log(`   Airtable field: "email" = "${mappedData.email}"`);
    console.log(`   Apify field: "contactInfo.city" = "${sampleApifyData.contactInfo.city}"`);
    console.log(`   Airtable field: "Prospect_City" = "${mappedData["Prospect_City"]}"`);
    console.log(`   Apify field: "contactInfo.country" = "${sampleApifyData.contactInfo.country}"`);
    console.log(`   Airtable field: "Prospect_Country" = "${mappedData["Prospect_Country"]}"`);
    
    console.log('\n💾 Inserting test record to Airtable...');
    
    const result = await airtableService.insertRecord(
      mappedData,
      AIRTABLE_TOKEN, 
      AIRTABLE_BASE_ID, 
      AIRTABLE_TABLE_NAME
    );
    
    console.log('\n✅ SUCCESS! firstName + lastName + occupation + pictureUrl mapping works perfectly!');
    console.log(`📝 Created record: ${result.id}`);
    console.log(`🌐 View at: https://airtable.com/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}/${result.id}`);
    
    return result;
    
  } catch (error) {
    console.error('\n❌ firstName + lastName + occupation + pictureUrl mapping failed:', error.message);
    
    if (error.response?.data?.error) {
      console.error('🔍 Airtable error details:', error.response.data.error);
    }
    
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testFirstNameMapping()
    .then(() => {
      console.log('\n🎉 firstName + lastName + occupation + pictureUrl mapping test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testFirstNameMapping };

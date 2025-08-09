/**
 * Comprehensive LinkedIn Profile to Airtable Field Mapper
 * Maps complex LinkedIn profile data to specific Airtable field structure
 */

/**
 * Map LinkedIn profile data to Airtable fields with detailed field handling
 */
function mapProfileToAirtable(profileData, profileUrl) {
  console.log('🗺️ Starting detailed profile mapping for Airtable...');
  
  // Helper function to safely extract nested values
  const safeGet = (obj, path, defaultValue = '') => {
    try {
      return path.split('.').reduce((current, key) => current?.[key], obj) || defaultValue;
    } catch (error) {
      return defaultValue;
    }
  };

  // Helper function to format company size
  const formatCompanySize = (employeeCountRange) => {
    if (!employeeCountRange) return '';
    const { start, end } = employeeCountRange;
    if (start && end) {
      return `${start}-${end}`;
    }
    return '';
  };

  // Helper function to format address
  const formatAddress = (addressObj) => {
    if (!addressObj) return '';
    const parts = [
      addressObj.line1,
      addressObj.line2,
      addressObj.city,
      addressObj.geographicArea,
      addressObj.country,
      addressObj.postalCode
    ].filter(Boolean);
    return parts.join(', ');
  };

  // Helper function to extract company logo URL
  const getCompanyLogoUrl = (logoResolutionResult) => {
    try {
      if (!logoResolutionResult?.vectorImage?.artifacts) return '';
      // Get the 200x200 logo if available, fallback to first available
      const logo200 = logoResolutionResult.vectorImage.artifacts.find(artifact => artifact.width === 200);
      const fallbackLogo = logoResolutionResult.vectorImage.artifacts[0];
      const selectedLogo = logo200 || fallbackLogo;
      
      if (selectedLogo) {
        return `${logoResolutionResult.vectorImage.rootUrl}${selectedLogo.fileIdentifyingUrlPathSegment}`;
      }
      return '';
    } catch (error) {
      console.log('⚠️ Error extracting logo URL:', error.message);
      return '';
    }
  };

  // Helper function to extract experience data
  const formatExperience = (experiences) => {
    if (!experiences || !Array.isArray(experiences)) return '';
    return experiences.slice(0, 3).map(exp => {
      const duration = exp.duration || '';
      return `${exp.title || ''} at ${exp.companyName || ''} (${duration})`;
    }).join(' | ');
  };

  // Helper function to extract skills
  const formatSkills = (skills) => {
    if (!skills || !Array.isArray(skills)) return '';
    return skills.slice(0, 10).map(skill => skill.name || skill).join(', ');
  };

  // Helper function to format phone numbers
  const formatPhoneNumbers = (phoneNumbers) => {
    if (!phoneNumbers || !Array.isArray(phoneNumbers)) return '';
    return phoneNumbers.map(phone => phone.number || phone).join(', ');
  };

  // Helper function to format certifications
  const formatCertifications = (certifications) => {
    if (!certifications || !Array.isArray(certifications)) return '';
    return certifications.slice(0, 3).map(cert => {
      return cert.name || cert.title || cert;
    }).join(', ');
  };

  // Helper function to format volunteering
  const formatVolunteering = (volunteer) => {
    if (!volunteer || !Array.isArray(volunteer)) return '';
    return volunteer.slice(0, 2).map(vol => {
      return `${vol.role || ''} at ${vol.organization || ''}`.trim();
    }).join(', ');
  };

  // Helper function to format honors
  const formatHonors = (honors) => {
    if (!honors || !Array.isArray(honors)) return '';
    return honors.slice(0, 3).map(honor => {
      return honor.title || honor.name || honor;
    }).join(', ');
  };

  // Helper function to get profile picture URL
  const getProfilePictureUrl = (profilePicture) => {
    try {
      if (!profilePicture) return '';
      if (typeof profilePicture === 'string') return profilePicture;
      if (profilePicture.url) return profilePicture.url;
      if (profilePicture.vectorImage?.rootUrl && profilePicture.vectorImage?.artifacts?.[0]) {
        return `${profilePicture.vectorImage.rootUrl}${profilePicture.vectorImage.artifacts[0].fileIdentifyingUrlPathSegment}`;
      }
      return '';
    } catch (error) {
      console.log('⚠️ Error extracting profile picture URL:', error.message);
      return '';
    }
  };

  // Helper function to extract current job start date
  const extractCurrentJobStartDate = (contactInfo) => {
    try {
      if (!contactInfo?.position_history || !Array.isArray(contactInfo.position_history)) return '';
      const currentJob = contactInfo.position_history.find(job => job.current === true);
      if (currentJob?.start_date) {
        return new Date(currentJob.start_date).toISOString().split('T')[0];
      }
      return '';
    } catch (error) {
      return '';
    }
  };

  // Helper function to extract founded year
  const extractFoundedYear = (company) => {
    try {
      if (!company?.foundedOn) return '';
      if (company.foundedOn.year) return company.foundedOn.year.toString();
      return '';
    } catch (error) {
      return '';
    }
  };

  // Helper function to extract employee count
  const extractEmployeeCount = (company) => {
    try {
      if (!company?.employeeCountRange) return 0;
      return company.employeeCountRange.end || company.employeeCountRange.start || 0;
    } catch (error) {
      return 0;
    }
  };

  // Helper function to extract company specialties
  const extractSpecialties = (company) => {
    try {
      if (!company?.specialties || !Array.isArray(company.specialties)) return '';
      return company.specialties.join(', ');
    } catch (error) {
      return '';
    }
  };

  // Helper function to build company details
  const buildCompanyDetails = (company) => {
    try {
      if (!company) return '';
      const details = [];
      if (company.employeeCountRange) {
        details.push(`Size: ${formatCompanySize(company.employeeCountRange)}`);
      }
      if (company.industries?.[0]?.name) {
        details.push(`Industry: ${company.industries[0].name}`);
      }
      if (company.headquarter?.address?.city) {
        details.push(`Location: ${company.headquarter.address.city}`);
      }
      return details.join(' | ');
    } catch (error) {
      return '';
    }
  };

  // Helper function to format education
  const formatEducation = (education) => {
    try {
      if (!education || !Array.isArray(education)) return '';
      return education.slice(0, 2).map(edu => {
        const school = edu.schoolName || edu.school || '';
        const degree = edu.degreeName || edu.degree || '';
        return degree ? `${degree} at ${school}` : school;
      }).filter(Boolean).join(', ');
    } catch (error) {
      return '';
    }
  };

  // Helper function to format languages
  const formatLanguages = (languages) => {
    try {
      if (!languages || !Array.isArray(languages)) return '';
      return languages.map(lang => lang.name || lang).join(', ');
    } catch (error) {
      return '';
    }
  };

  // Helper function to format projects
  const formatProjects = (projects) => {
    try {
      if (!projects || !Array.isArray(projects)) return '';
      return projects.slice(0, 3).map(project => project.title || project.name || project).join(', ');
    } catch (error) {
      return '';
    }
  };

  // Helper function to extract birthday
  const extractBirthday = (contactInfo) => {
    try {
      if (!contactInfo?.birthday) return '';
      return new Date(contactInfo.birthday).toISOString().split('T')[0];
    } catch (error) {
      return '';
    }
  };

  // Helper function to extract domain from URL
  const extractDomainFromUrl = (url) => {
    try {
      if (!url) return '';
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (error) {
      return '';
    }
  };

  // Main mapping object with comprehensive field mapping (110 fields available)
  const airtableData = {
    // Core Personal Information
    'firstName': safeGet(profileData, 'contactInfo.first_name') || safeGet(profileData, 'firstName') || '',
    'lastName': safeGet(profileData, 'contactInfo.last_name') || safeGet(profileData, 'lastName') || '',
    'linkedinUrl': profileUrl || '',
    'email': safeGet(profileData, 'contactInfo.email') || '',
    'phone no.': formatPhoneNumbers(safeGet(profileData, 'contactInfo.phone_numbers')) || safeGet(profileData, 'contactInfo.phone_number') || '',
    
    // LinkedIn Profile Details
    'Linkedin Headline': safeGet(profileData, 'contactInfo.headline') || safeGet(profileData, 'headline') || '',
    'About': safeGet(profileData, 'summary') || safeGet(profileData, 'contactInfo.summary') || '',
    'followersCount': parseInt(safeGet(profileData, 'followersCount', 0)) || 0,
    'connectionType': parseInt(safeGet(profileData, 'connectionType', 0)) || 0,
    'isPremium': safeGet(profileData, 'isPremium') ? 'Yes' : 'No',
    
    // Location Information
    'Prospect_Country': safeGet(profileData, 'contactInfo.country') || '',
    'Prospect_City': safeGet(profileData, 'contactInfo.city') || '',
    'Country': safeGet(profileData, 'contactInfo.country') || '',
    
    // Current Position Information
    'Current_Position_Title': safeGet(profileData, 'contactInfo.title') || '',
    'Designation': safeGet(profileData, 'contactInfo.title') || '',
    'Position_in_Current_company_since': extractCurrentJobStartDate(profileData.contactInfo),
    
    // Company Information
    'companyName': safeGet(profileData, 'company.name') || safeGet(profileData, 'contactInfo.company_name') || '',
    'companyLinkedinUrl': safeGet(profileData, 'company.url') || '',
    'website': safeGet(profileData, 'company.websiteUrl') || '',
    'companyDescription': safeGet(profileData, 'company.description') || '',
    'companyTagline': safeGet(profileData, 'company.tagline') || '',
    'companyIndustry': safeGet(profileData, 'company.industries.0.name') || '',
    'companySize': formatCompanySize(safeGet(profileData, 'company.employeeCountRange')),
    'companyFoundedOn': extractFoundedYear(profileData.company),
    'company Current Employe Count': extractEmployeeCount(profileData.company),
    'Company_Country': safeGet(profileData, 'company.headquarter.address.country') || '',
    'Company_City': safeGet(profileData, 'company.headquarter.address.city') || '',
    'companySpecialities': extractSpecialties(profileData.company),
    'Company Details': buildCompanyDetails(profileData.company),
    
    // Education & Skills
    'school': formatEducation(safeGet(profileData, 'educations') || safeGet(profileData, 'education')),
    'skills': formatSkills(safeGet(profileData, 'skills')),
    'certification': formatCertifications(safeGet(profileData, 'certifications')),
    'languages': formatLanguages(safeGet(profileData, 'languages')),
    
    // Additional Profile Information
    'honors': formatHonors(safeGet(profileData, 'honors')),
    'volunteering': formatVolunteering(safeGet(profileData, 'volunteer')),
    'project': formatProjects(safeGet(profileData, 'projects')),
    'birthday': extractBirthday(profileData.contactInfo),
    
    // Profile Media
    'picture': getProfilePictureUrl(safeGet(profileData, 'profilePicture')),
    'companyLogo': getCompanyLogoUrl(safeGet(profileData, 'company.logoResolutionResult')),
    
    // Email Verification Status
    'emailStatus': safeGet(profileData, 'contactInfo.email') ? 'Found' : 'Not Found',
    'Email Found By mail Vari': safeGet(profileData, 'contactInfo.email') ? 'LinkedIn Scraper' : '',
    
    // Process Management (excluding computed fields)
    'Start process': false,
    'Culture fit from filled': false,
    
    // Default workflow statuses
    'Last Action Stage': 'Lead Imported',
    'Relation Stage': 'Cold Lead',
    'Buying Journey Stage': 'Awareness',
    'Touch point ': 'LinkedIn',
    'emailStatus': 'Not Verified',
    'Hr Status': 'New Lead',
    'Community Status': 'Not Contacted',
    
    // Calculated fields helpers (non-computed)
    'firstName to Find email': safeGet(profileData, 'contactInfo.first_name') || safeGet(profileData, 'firstName') || '',
    'website name for verification': extractDomainFromUrl(safeGet(profileData, 'company.websiteUrl'))
    // Note: Removed 'Entry Date' as it's a computed field in Airtable
  };

  // Clean up empty fields and log mapping results
  const cleanedData = Object.fromEntries(
    Object.entries(airtableData).filter(([key, value]) => {
      // Keep fields with meaningful values (not empty strings, null, undefined, or 0 for optional numeric fields)
      return value !== '' && value !== null && value !== undefined;
    })
  );

  console.log(`🎯 Mapped ${Object.keys(cleanedData).length} fields from LinkedIn profile`);
  console.log('📊 Key mapped fields:', Object.keys(cleanedData).slice(0, 10).join(', '));

  return cleanedData;
}

/**
 * Calculate data quality score based on available information
 */
function calculateDataQuality(profileData) {
  let score = 0;
  const checks = [
    profileData.contactInfo?.email,
    profileData.contactInfo?.first_name,
    profileData.contactInfo?.last_name,
    profileData.contactInfo?.title,
    profileData.company?.name,
    profileData.contactInfo?.phone_number,
    profileData.summary,
    profileData.contactInfo?.city,
    profileData.company?.description,
    profileData.contactInfo?.position_history?.length > 0
  ];

  checks.forEach(check => {
    if (check) score += 10;
  });

  return score;
}

/**
 * Validate required fields before sending to Airtable
 */
function validateAirtableData(data, requiredFields = ['firstName', 'lastName', 'linkedinUrl']) {
  const missingFields = requiredFields.filter(field => !data[field]);
  
  if (missingFields.length > 0) {
    console.log(`⚠️ Missing required fields: ${missingFields.join(', ')}`);
    return false;
  }
  
  console.log('✅ All required fields present');
  return true;
}

module.exports = {
  mapProfileToAirtable,
  validateAirtableData,
  calculateDataQuality
};

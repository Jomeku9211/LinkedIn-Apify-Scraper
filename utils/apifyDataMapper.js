/**
 * Comprehensive Apify LinkedIn Profile Response to Airtable Field Mapper
 * Maps the actual Apify response structure to Airtable fields
 */

/**
 * Helper function to normalize field names for better matching
 * Handles variations in spacing, underscores, and capitalization
 */
function normalizeFieldName(fieldName) {
  return fieldName
    .toLowerCase()
    .replace(/[_\s-]/g, '') // Remove underscores, spaces, hyphens
    .trim();
}

/**
 * Helper function to find matching field name with flexible matching
 */
function findMatchingFieldName(targetField, possibleFields) {
  const normalizedTarget = normalizeFieldName(targetField);
  return possibleFields.find(field => normalizeFieldName(field) === normalizedTarget) || targetField;
}

/**
 * Map Apify LinkedIn profile response to Airtable fields
 * Handles both single object and array responses from Apify
 */
function mapApifyResponseToAirtable(apifyData, profileUrl) {
  console.log('🗺️ Starting detailed Apify response mapping for Airtable...');
  
  if (!apifyData) {
    console.log('❌ No data received from Apify');
    return {};
  }

  // Handle both array and single object responses
  let profile;
  if (Array.isArray(apifyData)) {
    if (apifyData.length === 0) {
      console.log('❌ Empty array received from Apify');
      return {};
    }
    profile = apifyData[0];
    console.log(`📊 Processing profile from array: ${profile.firstName} ${profile.lastName}`);
  } else {
    // Single object response (this is what our scraper actually returns)
    profile = apifyData;
    console.log(`📊 Processing single profile object: ${profile.firstName} ${profile.lastName}`);
  }

  // Helper function to safely extract nested values
  const safeGet = (obj, path, defaultValue = '') => {
    try {
      return path.split('.').reduce((current, key) => current?.[key], obj) || defaultValue;
    } catch (error) {
      return defaultValue;
    }
  };

  // Helper function to format phone numbers from contactInfo
  const formatContactPhones = (contactInfo) => {
    if (!contactInfo) return '';
    
    const phones = [];
    if (contactInfo.phone_number) phones.push(contactInfo.phone_number);
    if (contactInfo.phone_numbers && Array.isArray(contactInfo.phone_numbers)) {
      contactInfo.phone_numbers.forEach(phone => {
        if (phone.number && !phones.includes(phone.number)) {
          phones.push(phone.number);
        }
      });
    }
    return phones.join(', ');
  };

  // Helper function to format profile picture for Airtable attachment field
  const formatProfilePicture = (pictureUrl) => {
    if (!pictureUrl) return null;
    
    // For now, return URL-based attachment - Airtable can fetch from public URLs
    return [{
      url: pictureUrl,
      filename: 'profile_picture.jpg'
    }];
  };

  // Helper function to format skills array
  const formatSkills = (skills) => {
    if (!skills || !Array.isArray(skills)) return '';
    return skills.slice(0, 10).join(', ');
  };

  // Helper function to format languages
  const formatLanguages = (languages) => {
    if (!languages || !Array.isArray(languages)) return '';
    return languages.map(lang => {
      const profLevel = lang.proficiency ? ` (${lang.proficiency.replace('_', ' ')})` : '';
      return `${lang.name}${profLevel}`;
    }).join(', ');
  };

  // Helper function to format education
  const formatEducation = (educations) => {
    if (!educations || !Array.isArray(educations)) return '';
    return educations.slice(0, 2).map(edu => {
      const degree = edu.degreeName || '';
      const field = edu.fieldOfStudy || '';
      const school = edu.schoolName || '';
      if (!degree && !field && !school) return '';
      return `${degree} - ${degree} in field of ${field} from ${school}`.replace(/\s+/g, ' ').trim();
    }).filter(Boolean).join(', ');
  };

  // Helper function to format certifications
  const formatCertifications = (certifications) => {
    if (!certifications || !Array.isArray(certifications)) return '';
    return certifications.slice(0, 3).map(cert => {
      const name = cert.name || cert.title || '';
      const authority = cert.authority || cert.issuer || '';
      const period = cert.timePeriod || cert.dateAwarded || '';
      if (!name) return '';
      let result = name;
      if (authority) result += ` from ${authority}`;
      if (period) result += ` (${period})`;
      return result;
    }).filter(Boolean).join(', ');
  };

  // Helper function to format honors
  const formatHonors = (honors) => {
    if (!honors || !Array.isArray(honors)) return '';
    return honors.slice(0, 3).map(honor => {
      const title = honor.title || honor.name || '';
      const issuer = honor.issuer || honor.authority || '';
      const date = honor.dateAwarded || honor.timePeriod || '';
      if (!title) return '';
      let result = title;
      if (issuer) result += ` from ${issuer}`;
      if (date) result += ` (${date})`;
      return result;
    }).filter(Boolean).join(', ');
  };

  // Helper function to format volunteer experience
  const formatVolunteerExperience = (volunteerExperience) => {
    if (!volunteerExperience || !Array.isArray(volunteerExperience)) return '';
    return volunteerExperience.slice(0, 3).map(volunteer => {
      const role = volunteer.role || volunteer.title || '';
      const organization = volunteer.organization || volunteer.company || '';
      const cause = volunteer.cause || volunteer.focus || '';
      const description = volunteer.description || '';
      const timePeriod = volunteer.timePeriod || volunteer.duration || '';
      
      if (!role) return '';
      let result = role;
      if (organization) result += ` at ${organization}`;
      if (cause) result += ` (${cause})`;
      if (description) result += ` - ${description}`;
      if (timePeriod) result += ` [${timePeriod}]`;
      return result;
    }).filter(Boolean).join(', ');
  };

  // Helper function to format position history
  const formatPositionHistory = (positions) => {
    if (!positions || !Array.isArray(positions)) return '';
    return positions.slice(0, 3).map(pos => {
      const title = pos.title || '';
      const company = pos.companyName || '';
      const startYear = pos.timePeriod?.startDate?.year || '';
      const endYear = pos.timePeriod?.endDate?.year || 'Present';
      return `${title} at ${company} (${startYear}-${endYear})`;
    }).join(' | ');
  };

  // Helper function to get current position start date
  const getCurrentPositionStartDate = (positions) => {
    if (!positions || !Array.isArray(positions)) return '';
    const currentPosition = positions.find(pos => !pos.timePeriod?.endDate);
    if (currentPosition?.timePeriod?.startDate) {
      const { year, month } = currentPosition.timePeriod.startDate;
      return `${year}-${String(month || 1).padStart(2, '0')}-01`;
    }
    return '';
  };

  // Helper function to format company size
  const formatCompanySize = (employeeCountRange) => {
    if (!employeeCountRange) return '';
    const { start, end } = employeeCountRange;
    if (start !== undefined && end !== undefined) {
      return `${start}-${end}`;
    }
    return '';
  };

  // Helper function to extract company specialties
  const formatCompanySpecialties = (currentCompany) => {
    if (!currentCompany?.specialities || !Array.isArray(currentCompany.specialities)) return '';
    return currentCompany.specialities.slice(0, 5).join(', ');
  };

  // Helper function to format company address
  const formatCompanyAddress = (currentCompany) => {
    if (!currentCompany?.groupedLocations?.[0]?.locations?.[0]?.address) return '';
    const addr = currentCompany.groupedLocations[0].locations[0].address;
    const parts = [addr.line1, addr.line2, addr.city, addr.geographicArea, addr.country].filter(Boolean);
    return parts.join(', ');
  };

  // Helper function to format company phone number
  const formatCompanyPhone = (currentCompany) => {
    if (!currentCompany?.phone) return '';
    const { number, extension } = currentCompany.phone;
    if (!number) return '';
    return extension ? `${extension}+${number}` : number;
  };

  // Helper function to get competitor information
  const getCompetitorDescription = (currentCompany) => {
    if (!currentCompany?.similarOrganizations?.elements?.[0]?.description) return '';
    return currentCompany.similarOrganizations.elements[0].description;
  };

  const getCompetitorName = (currentCompany) => {
    if (!currentCompany?.similarOrganizations?.elements?.[0]?.universalName) return '';
    return currentCompany.similarOrganizations.elements[0].universalName;
  };

  const getCompetitorLocation = (currentCompany) => {
    if (!currentCompany?.similarOrganizations?.elements?.[0]?.headquarters?.address?.city) return '';
    return currentCompany.similarOrganizations.elements[0].headquarters.address.city;
  };

  // Helper function to get company logo URL
  const getCompanyLogoUrl = (logoUrl) => {
    if (logoUrl) return logoUrl;
    
    // Try to extract from current company data
    const currentCompany = profile.currentCompany;
    if (currentCompany?.logoResolutionResult?.vectorImage?.artifacts?.[0]) {
      const artifact = currentCompany.logoResolutionResult.vectorImage.artifacts[0];
      const rootUrl = currentCompany.logoResolutionResult.vectorImage.rootUrl || '';
      return `${rootUrl}${artifact.fileIdentifyingUrlPathSegment}`;
    }
    
    // Try from positions
    if (profile.positions?.[0]?.company?.logo) {
      return profile.positions[0].company.logo;
    }
    
    return '';
  };

  // Helper function to format company logo for Airtable attachment field
  const formatCompanyLogo = (logoUrl) => {
    const url = getCompanyLogoUrl(logoUrl);
    if (!url) return null;
    return [{
      url: url,
      filename: 'company_logo.png'
    }];
  };

  // Helper function to extract company website from multiple sources
  const getCompanyWebsite = () => {
    // From current company (check both possible field names)
    if (profile.currentCompany?.websiteURL) return profile.currentCompany.websiteURL;
    if (profile.currentCompany?.websiteUrl) return profile.currentCompany.websiteUrl;
    
    // From positions company data
    if (profile.positions?.[0]?.company?.websiteUrl) return profile.positions[0].company.websiteUrl;
    
    // Try to construct from LinkedIn URL
    if (profile.companyLinkedinUrl) {
      // This would require external lookup, return empty for now
      return '';
    }
    
    return '';
  };

  // Main mapping object with comprehensive field mapping based on actual Apify response
  const airtableData = {
    // Core Personal Information (from root level and contactInfo)
    'firstName': profile.firstName || safeGet(profile, 'contactInfo.first_name') || '',
    'lastName': profile.lastName || safeGet(profile, 'contactInfo.last_name') || '',
    'linkedinUrl': profile.linkedin_url || profileUrl || `https://www.linkedin.com/in/${profile.publicIdentifier}/` || '',
    'twitter_url': profile.twitter_url || '',
    'email': safeGet(profile, 'contactInfo.email') || '',
    'Company_phone': formatContactPhones(profile.contactInfo), // Fixed: Changed to Company_phone for Airtable
    'time/zone': safeGet(profile, 'contactInfo.time_zone') || '', // Time zone from contactInfo
    
    // LinkedIn Profile Details
    'Linkedin Headline': profile.occupation || profile.headline || safeGet(profile, 'contactInfo.headline') || '',
    'About': profile.summary || '',
    'followersCount': parseInt(profile.followersCount) || 0, // Fixed field name to match Airtable
    'connectionType': parseInt(profile.connectionType) || 0,
    
    // Location Information (multiple sources)
    'Prospect_Country': profile.geoCountryName || safeGet(profile, 'contactInfo.country') || '',
    'Prospect_City': profile.geoLocationName?.split(',')[0] || safeGet(profile, 'contactInfo.city') || '',
    'Country': profile.countryCode?.toUpperCase() || profile.geoCountryName || '',
    
    // Current Position Information
    'Current_Position_Title': profile.jobTitle || safeGet(profile, 'contactInfo.title') || '',
    'Designation': profile.jobTitle || safeGet(profile, 'contactInfo.title') || '',
    'Position_in_Current_company_since': getCurrentPositionStartDate(profile.positions),
    
    // Company Information (from multiple sources)
    'companyName': profile.companyName || safeGet(profile, 'contactInfo.company_name') || '',
    'companyLinkedinUrl': profile.companyLinkedinUrl || '',
    'website': getCompanyWebsite(),
    'companyDescription': safeGet(profile, 'currentCompany.description') || '',
    'companyTagline': safeGet(profile, 'currentCompany.tagline') || '',
    'companyIndustry': profile.industryName || safeGet(profile, 'currentCompany.industries.0.name') || '',
    'companySize': formatCompanySize(safeGet(profile, 'currentCompany.employeeCountRange')),
    'companyFoundedOn': safeGet(profile, 'currentCompany.foundedOn.year')?.toString() || '', // Fixed field name
    'Company Funding': safeGet(profile, 'currentCompany.crunchbaseFundingData') ? JSON.stringify(safeGet(profile, 'currentCompany.crunchbaseFundingData')) : '',
    'company Current Employe Count': parseInt(safeGet(profile, 'currentCompany.employeeCount')) || 0,
    'Company_Country': safeGet(profile, 'currentCompany.groupedLocations.0.locations.0.address.country') || '',
    'Company_City': safeGet(profile, 'currentCompany.groupedLocations.0.locations.0.address.city') || '',
    'Company_phone': formatCompanyPhone(profile.currentCompany),
    'companySpecialities': formatCompanySpecialties(profile.currentCompany), // Fixed field name spelling
    'Company Details': formatCompanyAddress(profile.currentCompany),
    
    // Competitor Information
    'Competitor description': getCompetitorDescription(profile.currentCompany),
    'Company competitor Name': getCompetitorName(profile.currentCompany),
    'Company Competitor Location': getCompetitorLocation(profile.currentCompany), // Fixed: Capital L
    
    // Education & Skills
    'school': formatEducation(profile.educations),
    'skills': formatSkills(profile.skills),
    'certification': formatCertifications(profile.certifications),
    'languages': formatLanguages(profile.languages),
    
    // Additional Profile Information
    'honors': formatHonors(profile.honors),
    'volunteering': formatVolunteerExperience(profile.volunteerExperiences), // Fixed: plural field name
    
    // Profile Media
    'Profile Picture': formatProfilePicture(profile.pictureUrl),
    // 'companyLogo': formatCompanyLogo(profile.currentCompany?.logoUrl), // Disabled for now
    
    // Email Verification Status
    // 'emailStatus': safeGet(profile, 'contactInfo.email') ? 'Found via LinkedIn' : 'Not Found', // Removed: not needed
    'Email Found By mail Vari': safeGet(profile, 'contactInfo.email') ? 'LinkedIn Scraper' : '',
    'Found by EMailVerify': safeGet(profile, 'contactInfo.email_is_verified') || '',
    
    // Process Management Fields
    'Start process': false,
    'Culture fit from filled': false,
    
    // Default workflow statuses - Removed: select option issues
    // 'Last Action Stage': 'Lead Imported', // Removed: not needed
    // 'Relation Stage': 'Cold Lead',
    // 'Buying Journey Stage': 'Awareness',
    // 'Touch point ': 'LinkedIn',
    // 'Hr Status': 'New Lead',
    // 'Community Status': 'Not Contacted',
    
    // Additional useful fields from the rich data
    'website': (() => {
      const websiteUrl = getCompanyWebsite();
      if (!websiteUrl) return '';
      
      try {
        return new URL(websiteUrl).hostname;
      } catch (e) {
        console.log(`⚠️ Invalid website URL: ${websiteUrl}`);
        return websiteUrl; // Return the original URL if it's malformed but not empty
      }
    })()
  };

  // Clean up empty fields and log mapping results
  const cleanedData = Object.fromEntries(
    Object.entries(airtableData).filter(([key, value]) => {
      return value !== '' && value !== null && value !== undefined && value !== 0;
    })
  );

  console.log(`🎯 Mapped ${Object.keys(cleanedData).length} fields from Apify LinkedIn response`);
  console.log('📊 Key mapped fields:', Object.keys(cleanedData).slice(0, 15).join(', '));
  
  return cleanedData;
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
  mapApifyResponseToAirtable,
  validateAirtableData
};

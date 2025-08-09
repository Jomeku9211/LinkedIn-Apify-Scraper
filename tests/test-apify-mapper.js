// Test script for the new Apify data mapper
const { mapApifyResponseToAirtable, validateAirtableData } = require('../src/utils/apifyDataMapper');

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
				"provider": "truecaller",
				"type": "work"
			}
		]
	}
}];

// Test function
(function run() {
	console.log('🧪 Testing Apify → Airtable mapper...');
	const mapped = mapApifyResponseToAirtable(testApifyData, 'https://www.linkedin.com/in/dheeraj-khandare');
	const ok = validateAirtableData(mapped, ['firstName', 'lastName', 'linkedinUrl']);
	console.log('✅ Validation:', ok ? 'PASS' : 'FAIL');
	console.log('🔑 Sample keys:', Object.keys(mapped).slice(0, 10).join(', '));
})();

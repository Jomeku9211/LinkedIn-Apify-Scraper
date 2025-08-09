# LinkedIn Profile & Company Scraper

A Node.js script that automatically scrapes LinkedIn profiles and company data using Apify APIs, then stores the results in Airtable.

## Features

- 📊 Reads LinkedIn profile URLs from Google Spreadsheets
- 🔍 Scrapes LinkedIn profiles using Apify LinkedIn Profile Scraper
- 🏢 Automatically finds and scrapes company data from profile information
- 📝 Stores combined data in Airtable
- 🚨 Error handling with webhook notifications
- 🔄 Automatic retry logic for failed requests
- 📋 Progress monitoring with detailed console logs
- 📁 Modular architecture for better maintainability

## Project Structure

```
├── index.js                          # Main execution file
├── package.json                      # Dependencies and scripts
├── .env.example                      # Environment variables template
├── .gitignore                        # Git ignore rules
├── README.md                         # This file
├── scrapers/
│   ├── profileScraper.js             # LinkedIn profile scraping logic
│   └── companyScraper.js             # LinkedIn company scraping logic
├── services/
│   ├── airtableService.js            # Airtable data operations
│   ├── webhookService.js             # Error webhook notifications
│   └── googleSheetsService.js        # Google Sheets data fetching
└── .github/
    └── copilot-instructions.md       # Copilot coding guidelines
```

## Modules Overview

### 🔍 Profile Scraper (`scrapers/profileScraper.js`)
- Handles LinkedIn profile scraping using `curious_coder~linkedin-post-search-scraper`
- Extracts company URLs from profile data
- Includes retry logic and error handling

### 🏢 Company Scraper (`scrapers/companyScraper.js`)
- Handles LinkedIn company scraping using `curious_coder~linkedin-company-scraper`
- Processes company URLs extracted from profiles
- Includes retry logic and error handling

### 📝 Airtable Service (`services/airtableService.js`)
- Manages all Airtable operations
- Formats data for Airtable insertion
- Combines profile and company data

### 🚨 Webhook Service (`services/webhookService.js`)
- Handles error notifications via webhooks
- Sends structured error data to Make.com scenarios

### 📊 Google Sheets Service (`services/googleSheetsService.js`)
- Fetches data from Google Spreadsheets
- Parses CSV data with error handling
- Automatically detects LinkedIn URL columns

## Prerequisites

- Node.js (v14 or higher)
- Apify account with API tokens
- Airtable account with API access
- Google Spreadsheet with LinkedIn URLs (publicly accessible)
- Make.com webhook URL for error notifications

## Installation

1. **Install Node.js** (if not already installed):
   ```bash
   # On macOS using Homebrew
   brew install node
   
   # Or download from https://nodejs.org/
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your actual values:
   - `GOOGLE_SPREADSHEET_URL`: Your Google Spreadsheet CSV export URL
   - `APIFY_PROFILE_TOKEN`: Your Apify API token for profile scraping
   - `APIFY_COMPANY_TOKEN`: Your Apify API token for company scraping
   - `APIFY_COOKIES_JSON`: LinkedIn cookies in JSON format
   - `AIRTABLE_TOKEN`: Your Airtable API token
   - `AIRTABLE_BASE_ID`: Your Airtable base ID
   - `AIRTABLE_TABLE_NAME`: Your Airtable table name
   - `WEBHOOK_URL`: Your Make.com webhook URL for error notifications

## Configuration Setup

### 1. Google Spreadsheet
- Create a Google Spreadsheet with LinkedIn profile URLs
- Make sure the spreadsheet is publicly accessible
- Get the CSV export URL (File > Download > CSV)
- The script will automatically detect columns containing "linkedin", "profile", or "url"

### 2. Apify Setup
- Sign up for Apify account
- Get API tokens for:
  - LinkedIn Profile Scraper (`apify/linkedin-profile-scraper`)
  - LinkedIn Company Profile Scraper (`apify/linkedin-company-profile-scraper`)
- Extract LinkedIn cookies from your browser (li_at, JSESSIONID, etc.)

### 3. Airtable Setup
- Create an Airtable base and table
- Get your API token from Airtable account settings
- Note your base ID and table name

### 4. Webhook Setup
- Create a Make.com scenario for error notifications
- Get the webhook URL for error handling

## Usage

Run the scraper:
```bash
npm start
```

Or for development with auto-restart:
```bash
npm run dev
```

## How It Works

1. **Fetch Data**: Reads LinkedIn URLs from Google Spreadsheet CSV
2. **Profile Scraping**: For each URL, calls Apify LinkedIn Profile Scraper
3. **Company Extraction**: Extracts company URL from profile data
4. **Company Scraping**: Scrapes company information using Apify Company Scraper
5. **Data Combination**: Combines profile and company data
6. **Storage**: Inserts combined data into Airtable
7. **Error Handling**: Sends error notifications to webhook URL

## Data Structure

The script creates Airtable records with the following fields:
- Profile URL
- Full Name
- Title
- Location
- About
- Company Name
- Company URL
- Company Description
- Company Industry
- Company Size
- Scraped At

## Error Handling

- **Retry Logic**: Failed API calls are retried up to 2 times
- **Webhook Notifications**: Errors are sent to Make.com webhook
- **Graceful Failure**: Script continues processing other profiles if one fails
- **Detailed Logging**: Comprehensive console logs for monitoring

## Rate Limiting

- 10-second delay between profile processing
- Configurable retry delays
- Respects Apify and Airtable rate limits

## Troubleshooting

### Common Issues

1. **"npm command not found"**
   - Install Node.js first

2. **"Invalid LinkedIn URL"**
   - Ensure spreadsheet contains valid LinkedIn profile URLs
   - Check column naming (should contain "linkedin", "profile", or "url")

3. **Apify API errors**
   - Verify API tokens are correct
   - Check cookie validity
   - Ensure sufficient Apify credits

4. **Airtable insertion errors**
   - Verify Airtable token and permissions
   - Check base ID and table name
   - Ensure table has matching field names

## License

MIT License

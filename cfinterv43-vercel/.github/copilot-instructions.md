<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# LinkedIn Scraper Project Instructions

This is a Node.js LinkedIn scraping project that integrates with Apify APIs and Airtable. When working on this project:

## Code Style & Patterns
- Use async/await for all asynchronous operations
- Implement proper error handling with try-catch blocks
- Include retry logic for API calls with exponential backoff
- Use modular functions for better code organization
- Add comprehensive console logging for monitoring progress

## API Integration Guidelines
- **Apify APIs**: Always include proper headers and authentication tokens
- **Airtable API**: Use proper field mapping and handle rate limits
- **Webhook Integration**: Send structured error data in JSON format
- **Google Sheets**: Parse CSV data properly and handle empty rows

## Error Handling Strategy
- Implement retry logic (max 2 retries) for failed API calls
- Send error notifications to webhook URL for all failures
- Continue processing remaining records when individual items fail
- Log detailed error information for debugging

## Configuration Management
- Use environment variables for all sensitive data
- Provide clear examples in .env.example
- Validate required configuration at startup
- Use constants for API endpoints and actor IDs

## Data Processing
- Extract company URLs from LinkedIn profile data intelligently
- Combine profile and company data into single records
- Handle missing or incomplete data gracefully
- Add timestamps to all processed records

## Performance Considerations
- Add delays between API calls to respect rate limits
- Process profiles sequentially to avoid overwhelming APIs
- Use appropriate timeouts for long-running operations
- Monitor and log processing progress

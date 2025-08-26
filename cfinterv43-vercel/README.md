# LinkedIn Scraper Dashboard

A comprehensive LinkedIn scraping and automation platform with ChatGPT integration.

## 🚀 Features

- **👤 Profile Scraper**: Extract LinkedIn profile data with Apify integration
- **📄 Post Scraper**: Scrape LinkedIn posts and content  
- **🤖 ChatGPT Agent**: Generate personalized comments using AI
- **📊 Airtable Integration**: Seamless data management and storage
- **🎯 Real-time Dashboard**: Monitor scraping progress and statistics

## 📁 Project Structure

```
├── src/                    # Source code
│   ├── services/          # Business logic services
│   ├── scrapers/          # Scraping modules
│   ├── utils/             # Utility functions
│   └── server.js          # Main application server
├── public/                # Frontend assets
├── config/                # Configuration files
├── tests/                 # Test files
├── docs/                  # Documentation
└── server.js              # Entry point
```

## 🛠️ Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment configuration:
   ```bash
   cp config/.env.example .env
   ```
4. Configure your environment variables in `.env`
5. Start the application:
   ```bash
   npm start
   ```

## 📊 Dashboard

Access the dashboard at: http://localhost:3000

## 🔧 Environment Variables

Required environment variables (copy from `config/.env.example`):

- `AIRTABLE_TOKEN` - Your Airtable API token
- `AIRTABLE_BASE_ID` - Airtable base ID
- `AIRTABLE_TABLE_NAME` - Airtable table name
- `AIRTABLE_VIEW_ID` - Airtable view ID for ChatGPT processing
- `CHATGPT_API_TOKEN` - OpenAI API token
- `CHATGPT_ASSISTANT_ID` - ChatGPT Assistant ID

## 📝 License

MIT License

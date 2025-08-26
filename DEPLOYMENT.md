# Sundai - Deployment Guide

## Vercel Deployment Setup

### 1. Environment Variables

Add these environment variables in your Vercel dashboard:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

Get your OpenAI API key from: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)

### 2. Vercel Configuration

The project includes a `vercel.json` file that:
- Sets up proper API routing from `/api/*` to the handler function
- Configures CORS headers for frontend integration
- Uses Node.js 18.x runtime for the API functions

### 3. Build Settings (Vercel Dashboard)

- **Framework Preset**: Vite
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `dist` (auto-detected) 
- **Install Command**: `npm install` (auto-detected)

### 4. API Endpoints

After deployment, your API will be available at:

```
GET  https://your-app.vercel.app/api/health    - Health check
POST https://your-app.vercel.app/api/analyze   - CSV financial analysis
```

### 5. Frontend Integration

Update your frontend API calls to use the production URL:

```typescript
const apiUrl = process.env.NODE_ENV === 'production' 
  ? 'https://your-app.vercel.app/api'
  : 'http://localhost:8080/api';
```

### 6. Local Development

For local testing of the API:

1. Create `.env.local` file:
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

2. Start Vercel dev server:
```bash
npx vercel dev
```

Or use the regular dev server:
```bash
npm run dev
```

### 7. Testing API Endpoints

Health Check:
```bash
curl https://your-app.vercel.app/api/health
```

CSV Analysis (POST):
```bash
curl -X POST https://your-app.vercel.app/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"csvContent": "date,amount,description\n2024-01-01,100.00,Test transaction"}'
```

## Architecture

```
/api/
├── handler.ts              # Main API router with all endpoints
└── services/
    └── financial-analyzer.ts # OpenAI-powered financial analysis service
```

## Features

- ✅ RESTful API design with proper HTTP methods
- ✅ CORS enabled for frontend integration
- ✅ Comprehensive error handling with structured responses
- ✅ Input validation and sanitization
- ✅ OpenAI integration with batch processing
- ✅ Brazilian financial data support (currency, dates)
- ✅ Rate limiting protection with delays between API calls
- ✅ Structured JSON responses with timestamps
- ✅ Health check endpoint for monitoring

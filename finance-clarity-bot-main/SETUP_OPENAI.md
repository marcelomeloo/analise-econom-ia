# 🤖 OpenAI Integration Setup Guide

This guide explains how to set up OpenAI integration for intelligent financial analysis in your Finance Clarity Bot.

## Prerequisites

1. **OpenAI Account**: Create an account at [platform.openai.com](https://platform.openai.com)
2. **API Key**: Generate an API key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
3. **Credits**: Ensure you have available credits in your OpenAI account

## Setup Instructions

### 1. Environment Configuration

1. **Copy the environment template:**
   ```bash
   cp .env.example .env.local
   ```

2. **Add your OpenAI API key:**
   ```bash
   # .env.local
   VITE_OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

   ⚠️ **Security Note**: Never commit your actual API key to version control!

### 2. Test the Integration

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Prepare a test CSV file** with financial data. Example format:
   ```csv
   Data,Descrição,Valor,Estabelecimento
   2024-01-15,Salário mensal,5000.00,Tech Corp
   2024-01-16,Compras supermercado,-850.00,Supermercado Central
   2024-01-01,Aluguel apartamento,-1200.00,Imobiliária Silva
   ```

3. **Upload and test** the CSV file in the application

## Features

### 🧠 Intelligent Analysis
- **Smart Categorization**: AI automatically categorizes expenses (Alimentação, Moradia, Transporte, etc.)
- **Income/Expense Detection**: Automatically determines transaction types
- **Portuguese Support**: All analysis is done in Portuguese for Brazilian users

### 📊 Financial Insights
- **Automatic Summaries**: AI generates personalized financial summaries
- **Recommendations**: Intelligent suggestions for financial optimization
- **Category Analysis**: Detailed breakdown of spending patterns

### 🔧 Data Processing
- **Flexible CSV Format**: Works with various CSV column names
- **Data Cleaning**: AI handles inconsistent data formats
- **Error Recovery**: Robust error handling for malformed data

### 🚀 Batch Processing (NEW!)
- **No Truncation**: Processes 100% of CSV lines, regardless of size
- **Intelligent Batching**: Divides large CSVs into manageable chunks (30 lines per batch)
- **State Accumulation**: Maintains running totals and category maps across batches
- **Progress Tracking**: Real-time progress bar showing batch processing status
- **Scalable**: Can handle CSVs with hundreds or thousands of transactions

## API Usage & Costs

### Model Used
- **GPT-4o**: Optimized for structured outputs and batch processing
- **Cost**: ~$0.0025 per 1K input tokens, ~$0.01 per 1K output tokens

### Estimated Costs (with Batch Processing)
- **Small CSV (50 transactions)**: ~$0.05 - $0.15 per analysis (2-3 batches)
- **Medium CSV (150 transactions)**: ~$0.15 - $0.45 per analysis (5-6 batches) 
- **Large CSV (500 transactions)**: ~$0.40 - $1.20 per analysis (16-17 batches)
- **Very Large CSV (1000 transactions)**: ~$0.75 - $2.25 per analysis (33-34 batches)

### How Batch Processing Saves Costs
- **Prevents Truncation**: No wasted tokens from incomplete responses
- **Efficient Processing**: Each batch optimized for consistent JSON output
- **Retry Logic**: Failed batches can be retried without reprocessing entire file

### Cost Optimization Tips
1. **Limit file size**: Recommend files under 1000 transactions
2. **Cache results**: Store analysis results to avoid re-processing
3. **Use GPT-3.5**: Switch to `gpt-3.5-turbo` for lower costs (in `src/services/openai.ts`)

## Troubleshooting

### Common Issues

**❌ "API key not configured"**
- Check that your `.env.local` file exists and has the correct API key
- Restart the development server after adding the API key

**❌ "Quota exceeded"**
- Check your OpenAI account usage at [platform.openai.com/usage](https://platform.openai.com/usage)
- Add more credits to your account

**❌ "Response format error"**
- The AI occasionally returns malformed JSON
- The app will show an error message - simply try uploading again

**❌ "File format not supported"**
- Currently only CSV files are fully supported
- Excel support can be added by installing the `xlsx` library

### Debug Mode

Enable console logging to see detailed AI responses:
1. Open browser Developer Tools (F12)
2. Check the Console tab for detailed logs during file processing

## Production Deployment

⚠️ **Important**: For production, implement these security measures:

1. **Backend Proxy**: Create a backend API to handle OpenAI requests
2. **API Key Security**: Store the API key on your backend, never in frontend
3. **Rate Limiting**: Implement request limits to prevent abuse
4. **User Authentication**: Add user accounts and request tracking

### Backend Integration Example

```javascript
// backend/routes/analyze.js
app.post('/api/analyze-csv', async (req, res) => {
  try {
    const { csvContent } = req.body;
    
    // Call OpenAI with your backend API key
    const result = await analyzeCSVWithAI(csvContent);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your OpenAI account has sufficient credits
3. Test with a small, well-formatted CSV file first

---

🚀 **Ready to analyze!** Upload your CSV file and let AI provide intelligent financial insights!

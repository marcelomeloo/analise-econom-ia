# 🤖 Finance Clarity Bot - AI-Powered Financial Analysis

An intelligent financial analysis assistant that uses OpenAI to automatically categorize and analyze your financial data from CSV uploads.

## ✨ Features

- 🧠 **AI-Powered Analysis**: Uses OpenAI GPT-4o for intelligent expense categorization
- 📊 **Smart Categorization**: Automatically categorizes transactions (Alimentação, Moradia, Transporte, etc.)
- 💡 **Personalized Insights**: AI-generated financial recommendations and summaries
- 🇧🇷 **Portuguese Interface**: Fully localized for Brazilian users
- 📈 **Visual Analytics**: Interactive charts and expense breakdowns
- 📁 **CSV Support**: Upload your bank statements or expense reports
- 🚀 **Batch Processing**: Handles large CSV files (1000+ transactions) without truncation
- 📊 **Progress Tracking**: Real-time progress bar during analysis
- ⚡ **Scalable**: From small personal budgets to large business expenses

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- OpenAI API key (get one at [platform.openai.com](https://platform.openai.com))

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <YOUR_GIT_URL>
   cd finance-clarity-bot-main
   npm install
   ```

2. **Set up OpenAI integration:**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your OpenAI API key:
   ```
   VITE_OPENAI_API_KEY=sk-your-api-key-here
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Test with sample data:**
   - Use the included `sample_data.csv` file (20 transactions) for quick testing
   - Try `large_sample_data.csv` (87 transactions) to see batch processing in action
   - Upload either file through the web interface and watch the progress bar

## 📋 How to Use

1. **Upload CSV**: Drag and drop or select your financial CSV file
2. **AI Analysis**: The system uses OpenAI to intelligently analyze your data
3. **View Results**: See categorized transactions and personalized insights
4. **Export**: Download your analyzed data in Excel or PDF format

### CSV Format
Your CSV should contain columns like:
```csv
Data,Descrição,Valor,Estabelecimento
2024-01-15,Salário mensal,5000.00,Tech Corp
2024-01-16,Compras supermercado,-850.00,Supermercado
```

The AI is flexible and works with various column names and formats!

## 🛠 Technologies Used

- **Frontend**: React + TypeScript + Vite
- **UI Components**: shadcn/ui + Tailwind CSS
- **Charts**: Recharts
- **AI Integration**: OpenAI GPT-4
- **File Processing**: Native browser APIs

## 📚 Documentation

- **[OpenAI Setup Guide](SETUP_OPENAI.md)**: Detailed setup instructions
- **[Batch Processing Guide](BATCH_PROCESSING_GUIDE.md)**: How large CSV files are processed
- **[Sample Data](sample_data.csv)**: Small test CSV (20 transactions)
- **[Large Sample Data](large_sample_data.csv)**: Large test CSV (87 transactions)

## Project info

**URL**: https://lovable.dev/projects/316a7b0a-9327-47a2-8161-f4532d829fc4

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/316a7b0a-9327-47a2-8161-f4532d829fc4) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## 💰 Cost Considerations

**OpenAI API Usage (with Batch Processing):**
- Small CSV (50 transactions): ~$0.05 - $0.15 per analysis (2-3 batches)
- Medium CSV (150 transactions): ~$0.15 - $0.45 per analysis (5-6 batches)
- Large CSV (500 transactions): ~$0.40 - $1.20 per analysis (16-17 batches)
- Very Large CSV (1000 transactions): ~$0.75 - $2.25 per analysis (33-34 batches)

**Cost Optimization:**
- **Batch processing** prevents wasted tokens from truncated responses
- Results are cached in browser session
- Switch to GPT-3.5-turbo for lower costs (edit `src/services/openai.ts`)
- For production, use a backend proxy to secure API keys

## 🔒 Security Notes

**Development:**
- API key is stored in `.env.local` (never commit this file!)
- Uses `dangerouslyAllowBrowser: true` for development only

**Production:**
- Implement a backend proxy for OpenAI requests  
- Store API keys securely on the backend
- Add rate limiting and user authentication

## What technologies are used for this project?

This project is built with:

- **Frontend**: React + TypeScript + Vite
- **AI**: OpenAI GPT-4
- **UI**: shadcn-ui + Tailwind CSS
- **Charts**: Recharts
- **File Processing**: Browser FileReader API

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/316a7b0a-9327-47a2-8161-f4532d829fc4) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

# 🚀 How to Run Sundai Financial Analysis

## 🔧 **Local Development**

### 1. **Prerequisites**
```bash
# Make sure you have Node.js installed
node --version  # Should be 18+ 
npm --version   # Should be 9+
```

### 2. **Install Dependencies**
```bash
npm install
```

### 3. **Set Up Environment Variables**
Create `.env.local` file in the root directory:
```bash
# .env.local
OPENAI_API_KEY=your_openai_api_key_here
```

> **Get your OpenAI API key**: https://platform.openai.com/api-keys

### 4. **Start Development Server**
```bash
npm run dev
```

The server will start on:
- **Primary**: http://localhost:8080
- **Fallback**: http://localhost:8081 (if 8080 is busy)

### 5. **Test Your Setup**
1. Open the URL in your browser
2. Check the **API Status** component (should show "Online" with green badge)
3. Upload a sample CSV file to test the full pipeline

---

## 🌐 **Production Deployment (Vercel)**

### 1. **Push to Git**
```bash
git add .
git commit -m "Add Vite+Vercel backend integration"
git push origin main
```

### 2. **Deploy to Vercel**

#### Option A: Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### Option B: Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Connect your GitHub repository
3. Vercel will auto-detect Vite framework
4. Set environment variable: `OPENAI_API_KEY`
5. Deploy!

### 3. **Set Environment Variables**
In Vercel Dashboard → Your Project → Settings → Environment Variables:
```
Name: OPENAI_API_KEY
Value: your_openai_api_key_here
```

### 4. **Test Production**
```bash
# Health check
curl https://your-app.vercel.app/api/health

# Should return: {"status":"ok","uptime":123,...}
```

---

## 🧪 **Testing Different Scenarios**

### **Local API Testing**
```bash
# Test health endpoint
curl http://localhost:8081/api/health

# Test CSV analysis (with sample data)
curl -X POST http://localhost:8081/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "csvContent": "data,valor,empresa,descricao\n2024-01-01,100.00,Supermercado Extra,Compra mensal\n2024-01-02,-20.00,Supermercado Extra,Estorno"
  }'
```

### **File Upload Testing**
1. Visit your running app
2. Upload a CSV file with Brazilian financial data format:
   ```csv
   data,valor,empresa,descricao
   2024-01-01,100.00,Supermercado Extra,Compra mensal
   2024-01-02,69.99,Netflix,Assinatura streaming
   2024-01-03,-20.00,Extra,Estorno compra
   ```
3. Check the analysis results in all three tabs

---

## 🐛 **Troubleshooting**

### **API Shows "Offline"**
1. Check if `OPENAI_API_KEY` is set in `.env.local`
2. Verify the key is valid at [OpenAI Dashboard](https://platform.openai.com/usage)
3. Check console for error messages

### **Port Already in Use**
```bash
# Kill process on port 8080
lsof -ti:8080 | xargs kill -9

# Or use different port
npm run dev -- --port 3000
```

### **Build Errors**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm run build
```

### **CORS Errors in Production**
This should be automatically handled by our `vercel.json` configuration, but if you see CORS errors:
1. Check `vercel.json` headers configuration
2. Verify API routes are working: `https://your-app.vercel.app/api/health`

---

## 📊 **What Should You See**

### **Development Mode**
1. **Homepage**: Financial analysis interface with upload area
2. **API Status**: Green "Online" badge
3. **File Upload**: Drag & drop or click to select CSV
4. **Analysis Results**: Three tabs (General Analysis, Insights, Categorization)

### **Production Mode**
Same as development, but:
- Faster performance
- Server-side OpenAI processing
- Production error handling
- Vercel Functions backend

---

## 🎯 **Quick Start Commands**

```bash
# Complete setup from scratch
git clone your-repo-url
cd sundai
npm install
echo "OPENAI_API_KEY=your_key_here" > .env.local
npm run dev

# Open browser at http://localhost:8080 or 8081
```

## 🚀 **You're Ready!**

Your app is now running with:
- ✅ Vite frontend on localhost:8081
- ✅ Backend API endpoints active  
- ✅ OpenAI integration ready
- ✅ File upload & analysis working
- ✅ Production deployment ready

Just upload a CSV file and watch the magic happen! 🎉

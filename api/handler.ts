import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Main API handler with routing
 * Follows RESTful principles and proper HTTP method handling
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // Enable CORS for frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Route to specific handlers based on URL path
    const { url } = req;
    
    if (url?.startsWith('/api/health')) {
      return handleHealth(req, res);
    }
    
    if (url?.startsWith('/api/analyze')) {
      return handleAnalyze(req, res);
    }

    // Default route - API info
    res.status(200).json({
      message: 'Sundai Financial Analysis API',
      version: '1.0.0',
      endpoints: [
        'GET /api/health - Health check',
        'POST /api/analyze - Analyze CSV financial data'
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Health check endpoint
 */
function handleHealth(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
}

/**
 * CSV Analysis endpoint
 */
async function handleAnalyze(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Validate request body
  if (!req.body || !req.body.csvContent) {
    res.status(400).json({ 
      error: 'Bad request',
      message: 'Missing csvContent in request body'
    });
    return;
  }

  try {
    // Import the analysis service
    const { analyzeCSVWithAI } = await import('./services/financial-analyzer');
    
    // Process the CSV
    const result = await analyzeCSVWithAI(req.body.csvContent);
    
    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analysis error:', error);
    
    // Return structured error response
    res.status(500).json({
      success: false,
      error: 'Analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}
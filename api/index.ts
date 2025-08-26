import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Root API handler - provides API information
 * Accessible at: /api/
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET for root API info
  if (req.method !== 'GET') {
    res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Use GET to access API information'
    });
    return;
  }

  // Return API information
  res.status(200).json({
    message: 'Sundai Financial Analysis API',
    version: '1.0.0',
    endpoints: [
      'GET /api/ - API information (this endpoint)',
      'GET /api/health - Health check',
      'POST /api/analyze - Analyze CSV financial data'
    ],
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
}
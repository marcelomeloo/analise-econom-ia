import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * CSV Analysis endpoint
 * Accessible at: /api/analyze
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST for analysis
  if (req.method !== 'POST') {
    res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Use POST to submit CSV content for analysis'
    });
    return;
  }

  // Validate request body
  if (!req.body || !req.body.csvContent) {
    res.status(400).json({ 
      error: 'Bad request',
      message: 'Missing csvContent in request body',
      example: {
        csvContent: 'Date,Amount,Description\\n2024-01-01,100.00,Test transaction'
      }
    });
    return;
  }

  console.log('📊 Analysis request received, CSV size:', req.body.csvContent.length, 'characters');

  try {
    // Import the analysis service
    const { analyzeCSVWithAI } = await import('./services/financial-analyzer');
    
    // Process the CSV
    console.log('🚀 Starting CSV analysis...');
    const result = await analyzeCSVWithAI(req.body.csvContent);
    
    console.log('✅ Analysis completed successfully');
    
    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
      message: 'CSV analysis completed successfully'
    });

  } catch (error) {
    console.error('❌ Analysis error:', error);
    
    // Return structured error response
    res.status(500).json({
      success: false,
      error: 'Analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString(),
      help: 'Check server logs for detailed error information'
    });
  }
}

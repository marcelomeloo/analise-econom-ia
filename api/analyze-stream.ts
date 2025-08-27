import type { VercelRequest, VercelResponse } from '@vercel/node';
import { analyzeCSVWithAI } from './services/financial-analyzer';

/**
 * CSV Analysis endpoint with Server-Sent Events for progress streaming
 * Accessible at: /api/analyze-stream
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS for SSE
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
      message: 'Use POST to submit CSV content for analysis with progress streaming'
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

  console.log('📊 Analysis request with SSE received, CSV size:', req.body.csvContent.length, 'characters');

  // Set up Server-Sent Events headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Helper function to send SSE events
  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    // Send initial event
    sendEvent('start', {
      message: 'Starting CSV analysis...',
      timestamp: new Date().toISOString()
    });

    console.log('🚀 Starting CSV analysis with progress streaming...');
    
    // Process the CSV with progress callbacks
    const result = await analyzeCSVWithAI(req.body.csvContent, {
      onBatchStart: (batchNumber: number, totalBatches: number) => {
        console.log(`📦 Batch ${batchNumber}/${totalBatches} started`);
        sendEvent('batch_start', {
          current: batchNumber,
          total: totalBatches,
          message: `Processing batch ${batchNumber} of ${totalBatches}...`,
          timestamp: new Date().toISOString()
        });
      },
      onBatchComplete: (batchNumber: number, totalBatches: number, batchResult: any[]) => {
        console.log(`✅ Batch ${batchNumber}/${totalBatches} completed with ${batchResult.length} transactions`);
        sendEvent('batch_complete', {
          current: batchNumber,
          total: totalBatches,
          batchTransactions: batchResult.length,
          message: `Batch ${batchNumber} completed with ${batchResult.length} transactions`,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    console.log('✅ Analysis completed successfully');
    
    // Send completion event with final result
    sendEvent('complete', {
      success: true,
      data: result,
      message: 'Analysis completed successfully',
      timestamp: new Date().toISOString()
    });

    // End the stream
    res.end();

  } catch (error) {
    console.error('❌ Analysis error:', error);
    
    // Send error event
    sendEvent('error', {
      success: false,
      error: 'Analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    });

    // End the stream
    res.end();
  }
}

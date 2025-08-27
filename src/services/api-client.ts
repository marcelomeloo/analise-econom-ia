import { TransactionData, FinancialInsights, GeneralAnalysis } from '@/types/financial';

// API Client for communicating with the Vercel backend
class APIClient {
  private baseURL: string;

  constructor() {
    // Auto-detect API URL based on environment
    this.baseURL = '/api';  // Always use relative path - Vercel handles dev and prod
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<{ status: string; uptime: number; timestamp: string }> {
    const response = await fetch(`${this.baseURL}/health`);
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Analyze CSV content using the backend API
   */
  async analyzeCSV(csvContent: string, progressCallback?: ProgressCallback): Promise<CSVAnalysisResult> {
    console.log('📡 Sending CSV to backend for analysis...');
    
    const response = await fetch(`${this.baseURL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        csvContent: csvContent
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `API request failed: ${response.status} ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Analysis failed');
    }

    console.log('✅ Analysis completed by backend');
    return result.data;
  }

  /**
   * Analyze CSV content with real-time progress using Server-Sent Events
   */
  async analyzeCSVWithProgress(csvContent: string, progressCallback?: ProgressCallback): Promise<CSVAnalysisResult> {
    console.log('📡 Starting CSV analysis with progress streaming...');
    
    return new Promise(async (resolve, reject) => {
      try {
        // Start the streaming request
        const response = await fetch(`${this.baseURL}/analyze-stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
          },
          body: JSON.stringify({
            csvContent: csvContent
          })
        });

        if (!response.ok) {
          throw new Error(`Streaming request failed: ${response.status} ${response.statusText}`);
        }

        if (!response.body) {
          throw new Error('No response body for streaming');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep the last incomplete line

            for (const line of lines) {
              if (line.trim() === '') continue;
              
              if (line.startsWith('event: ')) {
                const eventType = line.substring(7).trim();
                continue;
              }
              
              if (line.startsWith('data: ')) {
                const data = JSON.parse(line.substring(6));
                
                // Handle different event types based on the data structure
                if (data.message?.includes('Starting CSV analysis')) {
                  console.log('🚀 Analysis started:', data.message);
                } else if (data.current && data.total && data.message?.includes('Processing batch')) {
                  console.log(`📦 Batch ${data.current}/${data.total} started`);
                  progressCallback?.onBatchStart?.(data.current, data.total);
                } else if (data.current && data.total && data.batchTransactions !== undefined) {
                  console.log(`✅ Batch ${data.current}/${data.total} completed`);
                  progressCallback?.onBatchComplete?.(data.current, data.total, []);
                } else if (data.success === true && data.data) {
                  console.log('✅ Analysis completed successfully');
                  resolve(data.data);
                  return;
                } else if (data.success === false) {
                  console.error('❌ Analysis error:', data.message);
                  reject(new Error(data.message || 'Analysis failed'));
                  return;
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      } catch (error) {
        console.error('❌ Streaming analysis error:', error);
        reject(new Error(`Streaming analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
  }
}

// Types matching the backend response structure
export interface CSVAnalysisResult {
  transactions: TransactionData[];
  insights: FinancialInsights;
  generalAnalysis: GeneralAnalysis;
  summary: string;
}

// Progress callback interface (for future use with streaming/websockets)
export interface ProgressCallback {
  onBatchStart?: (batchNumber: number, totalBatches: number) => void;
  onBatchComplete?: (batchNumber: number, totalBatches: number, batchResult: TransactionData[]) => void;
}

// File handling utilities
export class FileHandler {
  /**
   * Read CSV file content as text
   */
  static readCSVFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      
      reader.onerror = () => {
        reject(new Error('Erro ao ler o arquivo'));
      };
      
      reader.readAsText(file, 'UTF-8');
    });
  }

  /**
   * Validate if file is supported format
   */
  static validateFileFormat(file: File): boolean {
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const fileName = file.name.toLowerCase();
    return validExtensions.some(ext => fileName.endsWith(ext));
  }

  /**
   * Get file content based on file type
   */
  static async getFileContent(file: File): Promise<string> {
    if (!this.validateFileFormat(file)) {
      throw new Error('Formato de arquivo não suportado. Use .csv, .xlsx ou .xls');
    }

    if (file.name.toLowerCase().endsWith('.csv')) {
      return this.readCSVFile(file);
    } else {
      // For Excel files, we'll need to convert to CSV first
      // For now, let's focus on CSV support
      throw new Error('Suporte para arquivos Excel será adicionado em breve. Por favor, use arquivos CSV.');
    }
  }
}

// Create singleton instance
export const apiClient = new APIClient();

// Export convenience functions to match the old API
export const getFileContent = FileHandler.getFileContent.bind(FileHandler);

export const analyzeCSVWithAI = async (
  csvContent: string, 
  progressCallback?: ProgressCallback
): Promise<CSVAnalysisResult> => {
  return apiClient.analyzeCSVWithProgress(csvContent, progressCallback);
};

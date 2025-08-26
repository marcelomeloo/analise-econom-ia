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
  return apiClient.analyzeCSV(csvContent, progressCallback);
};

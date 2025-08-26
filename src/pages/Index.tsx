import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, BarChart, FileText, AlertCircle, Brain, Flame } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import FileUpload from '@/components/FileUpload';
import CategorizationView from '@/components/CategorizationView';
import InsightsView from '@/components/InsightsView';
import GeneralAnalysisView from '@/components/GeneralAnalysisView';
import { TransactionData, FinancialInsights, GeneralAnalysis } from '@/types/financial';
import { getFileContent, analyzeCSVWithAI } from '@/services/api-client';

const Index = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [insights, setInsights] = useState<FinancialInsights | null>(null);
  const [generalAnalysis, setGeneralAnalysis] = useState<GeneralAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState<{ current: number; total: number } | null>(null);

  const handleFileUpload = async (file: File) => {
    console.log('File uploaded:', file.name);
    setUploadedFile(file);
    setIsProcessing(true);
    setError(null);
    setAiSummary(null);
    setProcessingProgress(null);

    try {
      // Get file content
      console.log('Reading file content...');
      const fileContent = await getFileContent(file);
      console.log('File content length:', fileContent.length);
      
      // Analyze with backend API
      console.log('Analyzing with backend API...');
      setProcessingProgress({ current: 1, total: 1 }); // Show indeterminate progress
      const analysisResult = await analyzeCSVWithAI(fileContent);
      console.log('Analysis completed:', analysisResult);
      
      // Update state with AI-analyzed data
      setTransactions(analysisResult.transactions);
      setInsights(analysisResult.insights);
      setGeneralAnalysis(analysisResult.generalAnalysis);
      setAiSummary(analysisResult.summary);
      
      console.log('Processing completed successfully with backend analysis');
    } catch (err) {
      console.error('Error processing file with backend:', err);
      setError(err instanceof Error ? err.message : 'Erro ao processar arquivo com IA');
    } finally {
      setIsProcessing(false);
      setProcessingProgress(null);
    }
  };

  const handleExport = (format: 'excel' | 'pdf') => {
    // Simulate export functionality
    console.log(`Exporting as ${format}`);
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Análise de Centavos
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Prepare-se para a análise mais brutalmente honesta dos seus gastos. Zero mimimi, só verdades que doem.
          </p>
        </div>

        {/* File Upload Section */}
        {!uploadedFile && (
          <div className="max-w-2xl mx-auto mb-12">
            <FileUpload 
              onFileUpload={handleFileUpload} 
              isUploading={isProcessing}
            />
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {(uploadedFile || isProcessing) && !error && (
          <div className="space-y-8">
            {isProcessing ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <div className="text-center">
                    <p className="text-lg font-medium">Analisando com inteligência artificial...</p>
                    {processingProgress && (
                      <div className="mt-3">
                        <p className="text-sm text-muted-foreground mb-2">
                          Processando batch {processingProgress.current} de {processingProgress.total}
                        </p>
                        <div className="w-64 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${(processingProgress.current / processingProgress.total) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {Math.round((processingProgress.current / processingProgress.total) * 100)}% concluído
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* AI Summary */}
                {aiSummary && (
                  <Card className="p-6 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20 mb-8">
                    <div className="flex items-start space-x-3">
                      <Brain className="h-6 w-6 text-primary mt-0.5" />
                      <div>
                        <h3 className="text-lg font-semibold text-primary mb-2">Análise IA</h3>
                        <p className="text-sm leading-relaxed">{aiSummary}</p>
                      </div>
                    </div>
                  </Card>
                )}
                
                <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8">
                  <TabsTrigger value="general" className="flex items-center space-x-2">
                    <Flame className="h-4 w-4" />
                    <span>Análise Geral</span>
                  </TabsTrigger>
                  <TabsTrigger value="insights" className="flex items-center space-x-2">
                    <BarChart className="h-4 w-4" />
                    <span>Insights</span>
                  </TabsTrigger>
                  <TabsTrigger value="categorization" className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Categorização</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="general">
                  <GeneralAnalysisView analysis={generalAnalysis} />
                </TabsContent>
                
                <TabsContent value="categorization">
                  <CategorizationView transactions={transactions} />
                </TabsContent>
                
                <TabsContent value="insights">
                  <InsightsView insights={insights} transactions={transactions} />
                                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;

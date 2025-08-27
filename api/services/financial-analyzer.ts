import OpenAI from 'openai';

// Initialize OpenAI client with proper server-side configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Server-side environment variable
});

// Types for financial data (moved from src/types to avoid import issues)
export interface TransactionData {
  id: number;
  tipo: 'Entrada' | 'Saída';
  valorCentavos: number;
  categoria: string;
  categoriaPath: string[];
  empresa: string;
  descricao: string;
  data: Date;
}

export interface FinancialInsights {
  totalEntradas: number;
  totalSaidas: number;
  saldo: number;
  maiorCategoria: string;
  menorCategoria: string;
  transacoesPorMes: Record<string, number>;
}

export interface GeneralAnalysis {
  pontuacao_geral: {
    nota: number;
    comentario: string;
  };
  mandou_bem: string;
  mandou_mal: string;
  gasto_frequencia: Array<{
    categoria: string;
    total: number;
    frequencia_transacoes: number;
    ticket_medio: number;
    comentario: string;
  }>;
  dicas_rapidas: Array<{
    categoria: string;
    valor_atual: number;
    frequencia_atual: string;
    valor_meta: number;
    frequencia_meta: string;
    economia: number;
    comentario: string;
  }>;
  outros_gastos: Array<{
    estabelecimento: string;
    total: number;
    comentario: string;
  }>;
  economia_realista: {
    categorias: Array<{
      categoria: string;
      economia: number;
    }>;
    economia_mensal: number;
    economia_anual: number;
  };
  com_isso_voce_podia: string[];
}

export interface CSVAnalysisResult {
  transactions: TransactionData[];
  insights: FinancialInsights;
  generalAnalysis: GeneralAnalysis;
  summary: string;
}

// Interface for batch classification results
interface BatchClassificationResult {
  transactions: {
    id: number;
    tipo: 'Entrada' | 'Saída';
    valorOriginal: string;
    categoria: string;
    empresa: string;
    descricao: string;
    data: string;
  }[];
  batch_summary: string;
}

// Progress callback interface
export interface ProgressCallback {
  onBatchStart?: (batchNumber: number, totalBatches: number) => void;
  onBatchComplete?: (batchNumber: number, totalBatches: number, batchResult: TransactionData[]) => void;
}

/**
 * Parse CSV content into array of rows
 */
const parseCSVContent = (csvContent: string): string[][] => {
  const lines = csvContent.trim().split('\n');
  return lines.map(line => {
    // Simple CSV parsing - can be improved to handle commas inside quotes
    return line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
  });
};

/**
 * Create batches from CSV rows
 */
const createBatches = (rows: string[][], batchSize: number = 30): string[][][] => {
  const batches: string[][][] = [];
  const headers = rows[0];
  const dataRows = rows.slice(1);
  
  for (let i = 0; i < dataRows.length; i += batchSize) {
    const batchRows = dataRows.slice(i, i + batchSize);
    batches.push([headers, ...batchRows]);
  }
  
  return batches;
};

/**
 * Parse Brazilian currency format to cents
 */
const parseValorBrasileiro = (valor: string): number => {
  if (!valor || typeof valor !== 'string') return 0;
  
  // Remove any currency symbols and spaces
  let cleanValue = valor.replace(/[R$\s]/g, '');
  
  // Handle different decimal formats
  if (cleanValue.includes(',') && cleanValue.includes('.')) {
    // Format: 1.234,56 (thousands separator . and decimal ,)
    cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
  } else if (cleanValue.includes(',')) {
    // Format: 1234,56 or 12,34 (decimal comma)
    cleanValue = cleanValue.replace(',', '.');
  }
  // Format: 1234.56 (decimal point) - no change needed
  
  const numValue = parseFloat(cleanValue);
  return Math.round(numValue * 100); // Convert to cents
};

/**
 * Parse Brazilian date format
 */
const parseDateBrasileira = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  
  // Try different date formats
  const formats = [
    /(\d{4}-\d{2}-\d{2})/, // YYYY-MM-DD
    /(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
    /(\d{2})-(\d{2})-(\d{4})/, // DD-MM-YYYY
  ];
  
  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      if (format === formats[0]) {
        return new Date(match[1]);
      } else {
        return new Date(`${match[3]}-${match[2]}-${match[1]}`);
      }
    }
  }
  
  return new Date(dateStr);
};

/**
 * Parse category path from string
 */
const parseCategoriaPath = (categoria: string): string[] => {
  if (!categoria) return ['Outros'];
  return categoria.split(' > ').map(cat => cat.trim());
};

/**
 * Process a single batch with OpenAI (ONLY CLASSIFICATION)
 */
const processBatch = async (
  batchRows: string[][], 
  batchNumber: number,
  totalBatches: number
): Promise<BatchClassificationResult> => {
  const batchCSV = batchRows.map(row => row.join(',')).join('\n');
  
  const prompt = `
Você está classificando transações financeiras. Este é o lote ${batchNumber} de ${totalBatches}.

DADOS DO LOTE:
${batchCSV}

INSTRUÇÕES:
1. Processe TODAS as linhas de dados (ignorando header se repetido)
2. Para cada linha, classifique a transação com:
   - id: número sequencial (começando em ${(batchNumber - 1) * 30 + 1})
   - tipo: "Entrada" ou "Saída" (IMPORTANTE: valores positivos = gastos = Saída; valores negativos = estornos/reembolsos = Entrada)
   - valorOriginal: valor EXATO como aparece no CSV
   - categoria: use categorização precisa baseada no estabelecimento/descrição
   - empresa: nome da empresa/estabelecimento
   - descricao: descrição limpa em português
   - data: converta para formato YYYY-MM-DD

NÃO CALCULE TOTAIS - apenas classifique!

RETORNE APENAS JSON:
{
  "transactions": [
    {
      "id": 1, 
      "tipo": "Saída", 
      "valorOriginal": "69.99", 
      "categoria": "Lazer > Streaming", 
      "empresa": "LinkedIn", 
      "descricao": "Assinatura LinkedIn", 
      "data": "2025-08-03"
    }
  ],
  "batch_summary": "Classificadas X transações"
}`.trim();

  console.log(`Processing batch ${batchNumber}/${totalBatches} with ${batchRows.length - 1} rows...`);
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a financial transaction classifier. Respond ONLY with valid JSON. Do NOT calculate totals - only classify!"
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 3000,
      response_format: { 
        type: "json_object"
      },
    });

    const aiResponse = response.choices[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error(`Empty response from OpenAI for batch ${batchNumber}`);
    }

    console.log(`Response for batch ${batchNumber}:`, aiResponse.substring(0, 200) + '...');
    
    const cleanResponse = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const batchResult = JSON.parse(cleanResponse) as BatchClassificationResult;
    
    // Validate structure
    if (!Array.isArray(batchResult.transactions)) {
      throw new Error('Missing or invalid "transactions" field');
    }

    return batchResult;
  } catch (error) {
    console.error(`Error processing batch ${batchNumber}:`, error);
    throw new Error(`Failed to process batch ${batchNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Convert raw classified transactions to structured TransactionData
 */
const convertToTransactionData = (rawTransactions: BatchClassificationResult['transactions']): TransactionData[] => {
  return rawTransactions
    .filter(raw => {
      // Filter out payment transactions
      const empresa = (raw.empresa || '').toLowerCase();
      const descricao = (raw.descricao || '').toLowerCase();
      
      return !empresa.includes('pagamentos validos normais') && 
             !descricao.includes('pagamentos validos normais');
    })
    .map(raw => {
      // Parse value using Brazilian currency format
      const valorCentavos = parseValorBrasileiro(raw.valorOriginal);
      
      // Preserve signs: positive values = expenses, negative = refunds
      const tipo = valorCentavos < 0 ? 'Entrada' : 'Saída';
      
      // Parse date
      const data = parseDateBrasileira(raw.data);
      
      // Parse hierarchical category
      const categoriaPath = parseCategoriaPath(raw.categoria);
      
      return {
        id: raw.id,
        tipo: tipo as 'Entrada' | 'Saída',
        valorCentavos: Math.abs(valorCentavos), // Keep absolute value for display
        categoria: raw.categoria,
        categoriaPath,
        empresa: raw.empresa || 'Not specified',
        descricao: raw.descricao || 'No description',
        data,
      };
    });
};

/**
 * Aggregate transaction data for insights
 */
const aggregateTransactions = (transactions: TransactionData[]) => {
  let totalEntradasCentavos = 0;
  let totalSaidasCentavos = 0;
  const categorias: Record<string, {
    totalCentavos: number;
    transactionCount: number;
    tipo: 'entrada' | 'saida';
  }> = {};

  // Process each transaction
  transactions.forEach(transaction => {
    if (transaction.tipo === 'Entrada') {
      totalEntradasCentavos += transaction.valorCentavos;
    } else {
      totalSaidasCentavos += transaction.valorCentavos;
    }

    // Aggregate by category
    const catKey = transaction.categoria;
    if (!categorias[catKey]) {
      categorias[catKey] = {
        totalCentavos: 0,
        transactionCount: 0,
        tipo: transaction.tipo === 'Entrada' ? 'entrada' : 'saida'
      };
    }
    
    categorias[catKey].totalCentavos += transaction.valorCentavos;
    categorias[catKey].transactionCount += 1;
  });

  const saldoCentavos = totalEntradasCentavos - totalSaidasCentavos;

  // Create aggregation result
  return {
    totalEntradasCentavos,
    totalSaidasCentavos,
    saldoCentavos,
    categorias: Object.entries(categorias).map(([categoria, data]) => ({
      categoria,
      totalCentavos: data.totalCentavos,
      transactionCount: data.transactionCount,
      tipo: data.tipo,
      categoriaPath: parseCategoriaPath(categoria),
      percentual: (data.totalCentavos / (totalEntradasCentavos + totalSaidasCentavos)) * 100
    })),
    topCategorias: Object.entries(categorias)
      .sort(([,a], [,b]) => b.totalCentavos - a.totalCentavos)
      .slice(0, 5)
      .map(([categoria, data]) => ({
        categoria,
        totalCentavos: data.totalCentavos
      }))
  };
};

/**
 * Generate financial insights from aggregated data
 */
const generateFinancialInsights = (aggregation: ReturnType<typeof aggregateTransactions>): FinancialInsights => {
  const totalEntradas = aggregation.totalEntradasCentavos / 100;
  const totalSaidas = aggregation.totalSaidasCentavos / 100;
  const saldo = aggregation.saldoCentavos / 100;

  const sortedCategorias = aggregation.categorias
    .filter(cat => cat.tipo === 'saida')
    .sort((a, b) => b.totalCentavos - a.totalCentavos);

  const maiorCategoria = sortedCategorias[0]?.categoria || 'N/A';
  const menorCategoria = sortedCategorias[sortedCategorias.length - 1]?.categoria || 'N/A';

  // Simple monthly transactions count (could be enhanced with actual date grouping)
  const transacoesPorMes: Record<string, number> = {
    'Current Month': aggregation.categorias.reduce((sum, cat) => sum + cat.transactionCount, 0)
  };

  return {
    totalEntradas,
    totalSaidas,
    saldo,
    maiorCategoria,
    menorCategoria,
    transacoesPorMes
  };
};

/**
 * Generate general analysis using OpenAI
 */
const generateGeneralAnalysis = async (
  aggregation: ReturnType<typeof aggregateTransactions>,
  totalTransactions: number
): Promise<GeneralAnalysis> => {
  console.log('🎭 Generating general analysis with OpenAI...');

  const topGastos = aggregation.categorias
    .filter(cat => cat.tipo === 'saida' && cat.totalCentavos >= 1000) // >= R$ 10
    .sort((a, b) => b.totalCentavos - a.totalCentavos)
    .slice(0, 10);

  const totalGasto = aggregation.totalSaidasCentavos / 100;
  const saldo = aggregation.saldoCentavos / 100;

  const dadosParaAnalise = {
    total_gasto: totalGasto,
    saldo: saldo,
    total_transacoes: totalTransactions,
    categorias: topGastos.map(cat => ({
      categoria: cat.categoria,
      valor: cat.totalCentavos / 100,
      percentual: cat.percentual,
      transacoes: cat.transactionCount
    }))
  };

  const prompt = `
Generate a financial analysis in Portuguese with a humorous, provocative tone.

DATA:
${JSON.stringify(dadosParaAnalise, null, 2)}

Return ONLY valid JSON with this structure:
{
  "pontuacao_geral": {
    "nota": 1-10,
    "comentario": "sarcastic comment about the score"
  },
  "mandou_bem": "one positive point about spending",
  "mandou_mal": "one embarrassing negative point",
  "gasto_frequencia": [
    {
      "categoria": "category name",
      "total": numeric_value,
      "frequencia_transacoes": integer,
      "ticket_medio": numeric_value,
      "comentario": "sarcastic comment about spending"
    }
  ],
  "dicas_rapidas": [
    {
      "categoria": "category name",
      "valor_atual": numeric_value,
      "frequencia_atual": "current frequency string",
      "valor_meta": numeric_value,
      "frequencia_meta": "target frequency string",
      "economia": savings_value,
      "comentario": "sharp comment about the tip"
    }
  ],
  "outros_gastos": [
    {
      "estabelecimento": "establishment name",
      "total": numeric_value,
      "comentario": "sarcastic comment about this place"
    }
  ],
  "economia_realista": {
    "categorias": [
      {
        "categoria": "category name",
        "economia": numeric_value
      }
    ],
    "economia_mensal": total_monthly_value,
    "economia_anual": total_annual_value
  },
  "com_isso_voce_podia": ["aspirational example 1", "aspirational example 2"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a sarcastic financial analyst. Respond ONLY with valid JSON. Use Brazilian Portuguese and be provocatively humorous."
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 2000,
      response_format: { 
        type: "json_object"
      },
    });

    const aiResponse = response.choices[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('Empty response from OpenAI for general analysis');
    }

    const cleanResponse = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const generalAnalysis = JSON.parse(cleanResponse) as GeneralAnalysis;
    
    // Validate basic structure
    if (!generalAnalysis.pontuacao_geral || !generalAnalysis.gasto_frequencia) {
      throw new Error('Invalid general analysis structure');
    }

    return generalAnalysis;
  } catch (error) {
    console.error('Error in general analysis with OpenAI:', error);
    throw new Error(`General analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Main function: Analyze CSV content using OpenAI with batch processing
 */
export const analyzeCSVWithAI = async (
  csvContent: string, 
  progressCallback?: ProgressCallback
): Promise<CSVAnalysisResult> => {
  console.log('📊 Starting analysis with batch processing...');
  console.log('📝 CSV size:', csvContent.length, 'characters');
  
  // Validate OpenAI API key
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('❌ OPENAI_API_KEY environment variable not set');
  }
  
  try {
    // 1. Parse CSV into rows
    const rows = parseCSVContent(csvContent);
    const totalLines = rows.length - 1; // Exclude header
    console.log('📝 Total lines to process:', totalLines);

    if (totalLines === 0) {
      throw new Error('Empty CSV or header only');
    }

    // 2. Create batches (30 lines per batch to avoid truncation)
    const batches = createBatches(rows, 30);
    console.log('📦 Divided into', batches.length, 'batches');

    const allRawTransactions: BatchClassificationResult['transactions'] = [];
    const batchSummaries: string[] = [];

    // 3. Process each batch sequentially (ONLY CLASSIFICATION)
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`🔄 Classifying batch ${i + 1}/${batches.length}...`);
      
      // Notify batch start
      progressCallback?.onBatchStart?.(i + 1, batches.length);
      
      try {
        const batchResult = await processBatch(batch, i + 1, batches.length);
        
        // Collect classified transactions
        allRawTransactions.push(...batchResult.transactions);
        batchSummaries.push(batchResult.batch_summary);
        
        console.log(`✅ Batch ${i + 1} classified: ${batchResult.transactions.length} transactions`);
        
        // Convert raw transactions to structured data for this batch
        const batchTransactions = convertToTransactionData(batchResult.transactions);
        
        // Notify batch completion
        progressCallback?.onBatchComplete?.(i + 1, batches.length, batchTransactions);
        
        // Small delay to avoid rate limiting
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`❌ Error in batch ${i + 1}:`, error);
        throw new Error(`Failed to classify batch ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log('🎯 All batches classified successfully!');
    console.log('🔧 Converting and calculating totals locally...');

    // 4. Convert raw transactions to structured data
    const allTransactions = convertToTransactionData(allRawTransactions);
    console.log('📊 Total structured transactions:', allTransactions.length);

    // 5. Calculate everything locally using deterministic functions
    const aggregation = aggregateTransactions(allTransactions);
    console.log('💰 Totals calculated:', {
      entradas: aggregation.totalEntradasCentavos / 100,
      saidas: aggregation.totalSaidasCentavos / 100,
      saldo: aggregation.saldoCentavos / 100,
    });

    // 6. Generate insights from aggregated data
    const insights = generateFinancialInsights(aggregation);

    // 7. Generate general analysis with OpenAI
    console.log('🎭 Generating general analysis...');
    const generalAnalysis = await generateGeneralAnalysis(aggregation, allTransactions.length);

    // 8. Create comprehensive summary
    const summary = `Complete analysis of ${allTransactions.length} transactions processed. ` +
      `Current balance: R$ ${insights.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. ` +
      `Main spending category: ${aggregation.topCategorias[0]?.categoria || 'N/A'}.`;

    const result: CSVAnalysisResult = {
      transactions: allTransactions,
      insights,
      generalAnalysis,
      summary
    };

    console.log('🎉 Complete analysis finished with deterministic calculations!');
    console.log(`📈 Summary: ${allTransactions.length} transactions, R$ ${insights.totalEntradas.toFixed(2)} income, R$ ${insights.totalSaidas.toFixed(2)} expenses`);
    
    return result;

  } catch (error) {
    console.error('Error in AI analysis:', error);

    if (error instanceof Error) {
      // Check for specific OpenAI API errors
      if (error.message.includes('API key') || error.message.includes('401')) {
        throw new Error('❌ Invalid OpenAI API key. Check if OPENAI_API_KEY environment variable is set correctly.');
      } 
      
      if (error.message.includes('quota') || error.message.includes('429')) {
        throw new Error('❌ OpenAI API limit exceeded. Check your quota at platform.openai.com/usage');
      } 
      
      if (error.message.includes('billing') || error.message.includes('payment')) {
        throw new Error('❌ OpenAI billing issue. Add a payment method at platform.openai.com/account/billing');
      }
      
      if (error.message.includes('JSON') || error.message.includes('parse')) {
        throw new Error('❌ Error processing AI response. The response is not in expected JSON format. Try again.');
      }
      
      if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new Error('❌ Connection error with OpenAI. Check your internet connection and try again.');
      }

      throw new Error(error.message);
    }

    throw new Error(`❌ Unknown error in AI analysis: ${String(error)}`);
  }
};

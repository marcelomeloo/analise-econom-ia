import OpenAI from 'openai';
import { TransactionData, FinancialInsights, GeneralAnalysis } from '@/types/financial';
import { parseValorBrasileiro, parseDateBrasileira, parseCategoriaPath } from '@/utils/parse';
import { aggregateTransactions, generateFinancialInsights, CategoryAggregate } from '@/utils/aggregate';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, use a backend proxy
});

export interface CSVAnalysisResult {
  transactions: TransactionData[];
  insights: FinancialInsights;
  generalAnalysis: GeneralAnalysis;
  summary: string;
}

// Interface simplificada para resposta de cada batch (só classificação)
interface BatchClassificationResult {
  transactions: {
    id: number;
    tipo: 'Entrada' | 'Saída';
    valorOriginal: string; // Valor original como veio no CSV
    categoria: string; // Categoria com hierarquia se necessário
    empresa: string;
    descricao: string;
    data: string;
  }[];
  batch_summary: string;
}

/**
 * Parse CSV content into array of rows
 */
const parseCSVContent = (csvContent: string): string[][] => {
  const lines = csvContent.trim().split('\n');
  return lines.map(line => {
    // Simple CSV parsing - pode ser melhorado para lidar com vírgulas dentro de aspas
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
 * Process a single batch with OpenAI (ONLY CLASSIFICATION - NO CALCULATIONS)
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
   - valorOriginal: valor EXATO como aparece no CSV (ATENÇÃO aos formatos monetários):
     * Se vier "69.99" → mantenha "69.99" (não "6999.00")
     * Se vier "69,99" → mantenha "69,99" 
     * Se vier "1.234,56" → mantenha "1.234,56"
     * Se vier "1,234.56" → mantenha "1,234.56"
     * NUNCA remova pontos/vírgulas dos decimais
   - categoria: use os EXEMPLOS abaixo como referência para categorização precisa:

   🏠 MORADIA:
   • Mp *Feelsampaltda, Aluguel, Condomínio → "Moradia > Aluguel"
   • IPTU, Taxa condominial → "Moradia > Taxas"
   • Reforma, Móveis → "Moradia > Manutenção"

   🍽️ ALIMENTAÇÃO:
   • Oxxo, Supermercado, Mercado → "Alimentação > Supermercado"
   • Restaurante, Delivery → "Alimentação > Restaurantes"
   • Padaria, Açougue → "Alimentação > Outros"

   🚗 TRANSPORTE:
   • Uber, 99, Cabify → "Transporte > Apps"
   • Gasolina, Álcool → "Transporte > Combustível"
   • Metrô, Ônibus → "Transporte > Público"

   🎯 LAZER:
   • Netflix, Spotify, Prime → "Lazer > Streaming"
   • Cinema, Teatro → "Lazer > Entretenimento"
   • Academia, Esportes → "Lazer > Fitness"

   ⚡ UTILIDADES:
   • Luz, Energia elétrica → "Utilidades > Energia"
   • Água, Saneamento → "Utilidades > Água"
   • Internet, TV → "Utilidades > Telecomunicações"

   🏥 SAÚDE:
   • Farmácia, Drogaria → "Saúde > Farmácia"
   • Médico, Dentista → "Saúde > Consultas"
   • Plano saúde → "Saúde > Plano"

   💰 SALÁRIO:
   • Salário, Pró-labore → "Salário"

   🛒 COMPRAS:
   • Roupas, Calçados → "Compras > Vestuário"
   • Eletrônicos, Celular → "Compras > Eletrônicos"
   • Casa, Utensílios → "Compras > Casa"

   ❓ OUTROS:
   • Se não se encaixar em nenhuma categoria acima → "Outros"
   - empresa: nome da empresa/estabelecimento
   - descricao: descrição limpa em português
   - data: converta para formato YYYY-MM-DD

NÃO CALCULE TOTAIS - apenas classifique!

EXEMPLOS IMPORTANTES - VALORES E SINAIS:
- "Compra mercado,100.00,Extra" → valorOriginal: "100.00", tipo: "Saída"
- "Assinatura,69.99,LinkedIn" → valorOriginal: "69.99", tipo: "Saída" (NÃO "6999.00")  
- "Netflix,15,99,Netflix" → valorOriginal: "15,99", tipo: "Saída"
- "Estorno,-20.50,Extra" → valorOriginal: "-20.50", tipo: "Entrada"
- "Pagamento,500.00,Pagamentos Validos Normais" → IGNORE (não incluir)

REGRA CRÍTICA VALORES:
- 69.99 = sessenta e nove reais e noventa e nove centavos
- NÃO confunda com 6999.00 (seis mil novecentos e noventa e nove)

RETORNE APENAS JSON (EXEMPLOS DE CATEGORIZAÇÃO):
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
    },
    {
      "id": 2, 
      "tipo": "Saída", 
      "valorOriginal": "379.00", 
      "categoria": "Moradia > Aluguel", 
      "empresa": "Oxxo Housi Paraiso", 
      "descricao": "Pagamento moradia", 
      "data": "2025-08-03"
    },
    {
      "id": 3, 
      "tipo": "Entrada", 
      "valorOriginal": "-20.00", 
      "categoria": "Alimentação > Supermercado", 
      "empresa": "Extra", 
      "descricao": "Estorno compra", 
      "data": "2024-01-16"
    }
  ],
  "batch_summary": "Classificadas 3 transações com categorias corretas"
}`.trim();

  console.log(`Processando lote ${batchNumber}/${totalBatches} com ${batchRows.length - 1} linhas...`);
  
  const response = await openai.chat.completions.create({
    model: "gpt-4.1",
    messages: [
      {
        role: "system",
        content: "Você é um classificador de transações financeiras. Responda APENAS com JSON válido. NÃO calcule totais - apenas classifique! ATENÇÃO ESPECIAL: preserve valores monetários EXATAMENTE como aparecem (69.99 é R$69,99, NÃO R$6.999,00)."
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
    throw new Error(`Resposta vazia da OpenAI para lote ${batchNumber}`);
  }

  console.log(`Resposta do lote ${batchNumber}:`, aiResponse.substring(0, 200) + '...');
  
  try {
    const cleanResponse = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const batchResult = JSON.parse(cleanResponse) as BatchClassificationResult;
    
    // Validar estrutura
    if (!Array.isArray(batchResult.transactions)) {
      throw new Error('Campo "transactions" ausente ou inválido');
    }

    return batchResult;
  } catch (parseError) {
    console.error(`Erro ao fazer parse do lote ${batchNumber}:`, parseError);
    console.error('Resposta raw:', aiResponse);
    throw new Error(`Erro ao processar lote ${batchNumber}: ${parseError instanceof Error ? parseError.message : 'Formato inválido'}`);
  }
};

/**
 * Convert raw classified transactions to structured TransactionData with proper parsing
 */
const convertToTransactionData = (rawTransactions: BatchClassificationResult['transactions']): TransactionData[] => {
  return rawTransactions
    .filter(raw => {
      // FILTRAR: Descartar pagamentos da fatura
      const empresa = (raw.empresa || '').toLowerCase();
      const descricao = (raw.descricao || '').toLowerCase();
      
      return !empresa.includes('pagamentos validos normais') && 
             !descricao.includes('pagamentos validos normais');
    })
    .map(raw => {
      // Parse valor usando nossa função que lida com formato brasileiro
      const valorCentavos = parseValorBrasileiro(raw.valorOriginal);
      
      // PRESERVAR SINAIS: 
      // - Valores positivos = gastos/saídas
      // - Valores negativos = reembolsos/estornos = entradas
      const tipo = valorCentavos < 0 ? 'Entrada' : 'Saída';
      
      // Parse da data
      const data = parseDateBrasileira(raw.data);
      
      // Parse da categoria hierárquica
      const categoriaPath = parseCategoriaPath(raw.categoria);
      
      return {
        id: raw.id,
        tipo: tipo as 'Entrada' | 'Saída',
        valorCentavos: Math.abs(valorCentavos), // Manter absoluto para exibição, mas tipo indica sinal
        categoria: raw.categoria,
        categoriaPath,
        empresa: raw.empresa || 'Não informado',
        descricao: raw.descricao || 'Sem descrição',
        data,
      };
    });
};

/**
 * Generate debochada general analysis using OpenAI
 */
const generateGeneralAnalysis = async (
  aggregation: typeof aggregateTransactions extends (...args: any[]) => infer R ? R : never,
  totalTransactions: number
): Promise<GeneralAnalysis> => {
  console.log('🎭 Gerando análise debochada com OpenAI...');

  // Preparar dados para o prompt
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
    outros_gastos: aggregation.categorias.filter(cat => cat.tipo === 'saida' && (cat.categoriaPath.includes('Outros') || cat.categoriaPath.includes('outros'))).map(cat => ({
      categoria: cat.categoria,
      valor: cat.totalCentavos / 100,
      percentual: cat.percentual,
      transacoes: cat.transactionCount
    })),
    categorias: topGastos.map(cat => ({
      categoria: cat.categoria,
      valor: cat.totalCentavos / 100,
      percentual: cat.percentual,
      transacoes: cat.transactionCount
    }))
  };

  const prompt = `
Escreva um texto de análise de gastos pessoais no estilo ENGRAÇADO, POLÊMICO, VIRAL, DEBOCHADO e AGRESSIVO, que seja um verdadeiro TAPA NA CARA.

DADOS DOS GASTOS:
${JSON.stringify(dadosParaAnalise, null, 2)}

ESTRUTURA OBRIGATÓRIA DO OUTPUT:

📊 Pontuação geral:
- Nota de vergonha/maturidade financeira: 1–10
- Comentário debochado sobre essa nota

👍 Mandou bem:
- Um ponto positivo REAL nos gastos

👎 Mandou mal:
- Um ponto negativo VERGONHOSO  

💳 Gasto + Frequência (top 3 + "Outros"):
- Liste os 3 maiores gastos + categoria "Outros" sempre por último
- Ignore categorias com menos de R$ 10
- Para cada: categoria, total, freq. transações, ticket médio, comentário debochado

🔪 Dicas rápidas:
- Máx. 2 dicas por categoria
- Para cada: valor/freq atual, meta, economia, comentário ácido

🏆 Outros gastos:
- "Você não lembra, mas o cartão lembra"
- Top 5 maiores gastos dentro de "Outros"
- Formato: estabelecimento, total, comentário debochado

💥 Economia Realista:
- Some as economias possíveis por categoria
- Total mensal → anual

✨ E com isso você podia...:
- 2 exemplos aspiracionais e engraçados

TOM OBRIGATÓRIO:
- Debochado, ácido e engraçado
- Comparações absurdas, linguagem de internet 
- Provocações geracionais
- Exposed público, não consultoria
- Use piadas atuais e simples
- Referências TV: Ratinho, Regina Volpato, Chaves, Silvio Santos, Faustão, Xuxa, Jornal Nacional
- Piadas sobre namoro, contatinho, preguiça
- Linguagem de internet: "chorando em 4K HDR"

RESPONDA APENAS COM JSON ESTRUTURADO:
{
  "pontuacao_geral": {
    "nota": [1-10],
    "comentario": "comentário debochado sobre a nota"
  },
  "mandou_bem": "ponto positivo real nos gastos",
  "mandou_mal": "ponto negativo vergonhoso",
  "gasto_frequencia": [
    {
      "categoria": "nome da categoria",
      "total": valor_numerico,
      "frequencia_transacoes": numero_inteiro,
      "ticket_medio": valor_numerico,
      "comentario": "deboche agressivo sobre o gasto"
    }
  ],
  "dicas_rapidas": [
    {
      "categoria": "nome categoria",
      "valor_atual": valor_numerico,
      "frequencia_atual": "atual frequência string",
      "valor_meta": valor_numerico,
      "frequencia_meta": "meta frequência string",
      "economia": valor_economia,
      "comentario": "comentário ácido sobre a dica"
    }
  ],
  "outros_gastos": [
    {
      "estabelecimento": "nome do estabelecimento",
      "total": valor_numerico,
      "comentario": "deboche sobre esse local"
    }
  ],
  "economia_realista": {
    "categorias": [
      {
        "categoria": "nome categoria",
        "economia": valor_numerico
      }
    ],
    "economia_mensal": valor_total_mensal,
    "economia_anual": valor_total_anual
  },
  "com_isso_voce_podia": ["exemplo aspiracional 1", "exemplo aspiracional 2"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: "Você é um analista financeiro DEBOCHADO, VIRAL e AGRESSIVO. Responda APENAS com JSON válido. Use humor brasileiro, memes de TV e seja bem agressivo com os gastos da pessoa."
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      temperature: 0.8, // Mais criativo para humor
      max_tokens: 2000,
      response_format: { 
        type: "json_object"
      },
    });

    const aiResponse = response.choices[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('Resposta vazia da OpenAI para análise geral');
    }

    console.log('Resposta da análise geral:', aiResponse.substring(0, 200) + '...');
    
    try {
      const cleanResponse = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      const generalAnalysis = JSON.parse(cleanResponse) as GeneralAnalysis;
      
          // Validar estrutura básica
    if (!generalAnalysis.pontuacao_geral || !generalAnalysis.gasto_frequencia) {
      throw new Error('Estrutura de análise geral inválida');
    }

      return generalAnalysis;
    } catch (parseError) {
      console.error('Erro ao fazer parse da análise geral:', parseError);
      console.error('Resposta raw:', aiResponse);
      throw new Error(`Erro ao processar análise geral: ${parseError instanceof Error ? parseError.message : 'Formato inválido'}`);
    }
  } catch (error) {
    console.error('Erro na análise geral com OpenAI:', error);
    throw new Error(`Falha na análise geral: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
};

// Callback para rastreamento de progresso
export interface ProgressCallback {
  onBatchStart?: (batchNumber: number, totalBatches: number) => void;
  onBatchComplete?: (batchNumber: number, totalBatches: number, batchResult: TransactionData[]) => void;
}

/**
 * Analyze CSV content using OpenAI with batch processing to avoid truncation
 */
export const analyzeCSVWithAI = async (
  csvContent: string, 
  progressCallback?: ProgressCallback
): Promise<CSVAnalysisResult> => {
  console.log('📊 Iniciando análise com processamento em batches...');
  console.log('📝 Tamanho do CSV:', csvContent.length, 'caracteres');
  
  try {
    // 1. Parse CSV into rows
    const rows = parseCSVContent(csvContent);
    const totalLines = rows.length - 1; // Exclude header
    console.log('📝 Total de linhas para processar:', totalLines);

    if (totalLines === 0) {
      throw new Error('CSV vazio ou apenas com cabeçalho');
    }

    // 2. Create batches (30 linhas por batch para evitar truncamento)
    const batches = createBatches(rows, 30);
    console.log('📦 Dividido em', batches.length, 'batches');

    const allRawTransactions: BatchClassificationResult['transactions'] = [];
    const batchSummaries: string[] = [];

    // 3. Process each batch sequentially (ONLY CLASSIFICATION)
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`🔄 Classificando batch ${i + 1}/${batches.length}...`);
      
      // Notify batch start
      progressCallback?.onBatchStart?.(i + 1, batches.length);
      
      try {
        const batchResult = await processBatch(batch, i + 1, batches.length);
        
        // Collect classified transactions
        allRawTransactions.push(...batchResult.transactions);
        batchSummaries.push(batchResult.batch_summary);
        
        console.log(`✅ Batch ${i + 1} classificado: ${batchResult.transactions.length} transações`);
        
        // Notify batch completion - create fake batch result for compatibility
        const fakeBatchResult = {
          transactions: [],
          updated_state: {
            totalEntradas: 0,
            totalSaidas: 0,
            categoriaMap: {},
            transactionCount: allRawTransactions.length,
            processedLines: allRawTransactions.length
          },
          batch_summary: batchResult.batch_summary
        };
        progressCallback?.onBatchComplete?.(i + 1, batches.length, fakeBatchResult as any);
        
        // Small delay to avoid rate limiting
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`❌ Erro no batch ${i + 1}:`, error);
        throw new Error(`Falha ao classificar batch ${i + 1}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }

    console.log('🎯 Todos os batches classificados com sucesso!');
    console.log('🔧 Convertendo e calculando totais localmente...');

    // 4. Convert raw transactions to structured data with proper parsing
    const allTransactions = convertToTransactionData(allRawTransactions);
    console.log('📊 Total de transações estruturadas:', allTransactions.length);

    // 5. Calculate everything locally using our deterministic functions
    const aggregation = aggregateTransactions(allTransactions);
    console.log('💰 Totais calculados:', {
      entradas: aggregation.totalEntradasCentavos / 100,
      saidas: aggregation.totalSaidasCentavos / 100,
      saldo: aggregation.saldoCentavos / 100,
    });

    // 6. Generate insights from aggregated data
    const insights = generateFinancialInsights(aggregation);

    // 7. Generate debochada general analysis with OpenAI
    console.log('🎭 Gerando análise geral debochada...');
    const generalAnalysis = await generateGeneralAnalysis(aggregation, allTransactions.length);

    // 8. Create comprehensive summary
    const summary = `Análise completa de ${allTransactions.length} transações processadas. ` +
      `Saldo atual: R$ ${insights.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. ` +
      `Principal categoria de gasto: ${aggregation.topCategorias[0]?.categoria || 'N/A'}.`;

    const result: CSVAnalysisResult = {
      transactions: allTransactions,
      insights,
      generalAnalysis,
      summary
    };

    console.log('🎉 Análise completa finalizada com cálculos determinísticos!');
    console.log(`📈 Resumo: ${allTransactions.length} transações, R$ ${insights.totalEntradas.toFixed(2)} entradas, R$ ${insights.totalSaidas.toFixed(2)} saídas`);
    
    return result;

  } catch (error) {
    console.error('Erro na análise com OpenAI:', error);

    if (error instanceof Error) {
      // Check for specific OpenAI API errors
      if (error.message.includes('API key') || error.message.includes('401')) {
        throw new Error('❌ Chave da API OpenAI inválida. Verifique se você configurou VITE_OPENAI_API_KEY no arquivo .env.local');
      } 
      
      if (error.message.includes('quota') || error.message.includes('429')) {
        throw new Error('❌ Limite da API OpenAI excedido. Verifique sua cota em platform.openai.com/usage');
      } 
      
      if (error.message.includes('billing') || error.message.includes('payment')) {
        throw new Error('❌ Problema de cobrança OpenAI. Adicione um método de pagamento em platform.openai.com/account/billing');
      }
      
      if (error.message.includes('JSON') || error.message.includes('parse')) {
        throw new Error('❌ Erro ao processar resposta da IA. A resposta não está no formato JSON esperado. Tente novamente.');
      }
      
      if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new Error('❌ Erro de conexão com OpenAI. Verifique sua internet e tente novamente.');
      }

      // Return the specific error message we threw above, or the original message
      throw new Error(error.message);
    }

    throw new Error(`❌ Erro desconhecido na análise com IA: ${String(error)}`);
  }
};

/**
 * Read CSV file content as text
 */
export const readCSVFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result as string;
      resolve(content);
    };
    
    reader.onerror = (e) => {
      reject(new Error('Erro ao ler o arquivo'));
    };
    
    reader.readAsText(file, 'UTF-8');
  });
};

/**
 * Validate if file is supported format
 */
export const validateFileFormat = (file: File): boolean => {
  const validExtensions = ['.csv', '.xlsx', '.xls'];
  const fileName = file.name.toLowerCase();
  return validExtensions.some(ext => fileName.endsWith(ext));
};

/**
 * Get file content based on file type
 */
export const getFileContent = async (file: File): Promise<string> => {
  if (!validateFileFormat(file)) {
    throw new Error('Formato de arquivo não suportado. Use .csv, .xlsx ou .xls');
  }

  if (file.name.toLowerCase().endsWith('.csv')) {
    return readCSVFile(file);
  } else {
    // For Excel files, we'll need to convert to CSV first
    // For now, let's focus on CSV support
    throw new Error('Suporte para arquivos Excel será adicionado em breve. Por favor, use arquivos CSV.');
  }
};

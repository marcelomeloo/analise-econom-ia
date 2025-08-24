/**
 * Testes rápidos para validar que os cálculos estão corretos
 */

import { parseValorBrasileiro, parseDateBrasileira, parseCategoriaPath, testesParseFunctions } from './parse';
import { aggregateTransactions, testeAggregationFunctions } from './aggregate';
import { TransactionData } from '@/types/financial';

/**
 * Exemplo prático de CSV pequeno e validação dos totais COM SINAIS CORRETOS
 */
export const exemploCSVPequeno = `Data,Descrição,Valor,Estabelecimento
15/01/2024,Compra mercado,100.00,Supermercado Extra
16/01/2024,Estorno compra,-20.00,Supermercado Extra
01/01/2024,Aluguel apartamento,1200.00,Imobiliária Silva
05/01/2024,Reembolso combustível,-80.00,Posto Shell
18/01/2024,Uber transporte,25.00,Uber
10/01/2024,Pagamento fatura,500.00,Pagamentos Validos Normais`;

/**
 * Resultados esperados para o CSV de exemplo COM SINAIS PRESERVADOS
 */
export const resultadosEsperados = {
  totalTransacoes: 5, // Excluindo "Pagamentos Validos Normais"
  totalEntradasCentavos: 10000, // 20.00 + 80.00 = 100,00 (estornos/reembolsos)
  totalSaidasCentavos: 132500,  // 100.00 + 1200.00 + 25.00 = 1325,00 (gastos)
  saldoCentavos: -122500,       // 100 - 1325 = -1225,00 (saldo negativo = mais gastos)
  categorias: {
    'alimentacao': 8000,     // 100.00 - 20.00 = 80.00 (gasto líquido)
    'moradia': 120000,       // 1200.00 (só gasto)
    'combustivel': -8000,    // -80.00 (reembolso)
    'transporte': 2500       // 25.00 (gasto)
  }
};

/**
 * Testa o parsing de uma linha CSV simulada
 */
export const testeParseSingleTransaction = () => {
  console.log('🧪 Testando parse de transação única...');
  
  // Simular dados que viriam do LLM
  const rawTransaction = {
    id: 1,
    tipo: 'Entrada' as const,
    valorOriginal: '5.000,00',
    categoria: 'Salário',
    empresa: 'Tech Corp',
    descricao: 'Salário mensal',
    data: '15/01/2024'
  };

  // Parse manual usando nossas funções
  const valorCentavos = parseValorBrasileiro(rawTransaction.valorOriginal);
  const data = parseDateBrasileira(rawTransaction.data);
  const categoriaPath = parseCategoriaPath(rawTransaction.categoria);

  console.log('💰 Valor parseado:', valorCentavos, 'centavos (esperado: 500000)');
  console.log('📅 Data parseada:', data, '(esperado: 2024-01-15)');
  console.log('🏷️ Categoria path:', categoriaPath, '(esperado: ["salario"])');

  // Validar
  const valorOK = valorCentavos === 500000;
  const dataOK = data === '2024-01-15';
  const categoriaOK = JSON.stringify(categoriaPath) === JSON.stringify(['salario']);

  console.log(`✅ Parse de valor: ${valorOK ? 'OK' : 'FALHOU'}`);
  console.log(`✅ Parse de data: ${dataOK ? 'OK' : 'FALHOU'}`);
  console.log(`✅ Parse de categoria: ${categoriaOK ? 'OK' : 'FALHOU'}`);

  return valorOK && dataOK && categoriaOK;
};

/**
 * Testa agregação com dados conhecidos PRESERVANDO SINAIS
 */
export const testeAgregacaoCompleta = () => {
  console.log('🧪 Testando agregação completa COM SINAIS PRESERVADOS...');

  // Dados de teste conhecidos - exemplo real com estornos
  const transactions: TransactionData[] = [
    {
      id: 1,
      tipo: 'Saída', // Gasto
      valorCentavos: 10000, // R$ 100,00
      categoria: 'Alimentação',
      categoriaPath: ['alimentacao'],
      empresa: 'Extra',
      descricao: 'Compra mercado',
      data: '2024-01-15',
    },
    {
      id: 2,
      tipo: 'Entrada', // Estorno (valor negativo original)
      valorCentavos: 2000, // R$ 20,00 
      categoria: 'Alimentação',
      categoriaPath: ['alimentacao'],
      empresa: 'Extra',
      descricao: 'Estorno compra',
      data: '2024-01-16',
    },
    {
      id: 3,
      tipo: 'Saída', // Gasto
      valorCentavos: 120000, // R$ 1.200,00
      categoria: 'Moradia',
      categoriaPath: ['moradia'],
      empresa: 'Imobiliária',
      descricao: 'Aluguel',
      data: '2024-01-01',
    }
  ];

  const aggregation = aggregateTransactions(transactions);

  console.log('📊 Resultados da agregação:');
  console.log('- Total entradas (estornos):', aggregation.totalEntradasCentavos, 'centavos');
  console.log('- Total saídas (gastos):', aggregation.totalSaidasCentavos, 'centavos');
  console.log('- Saldo:', aggregation.saldoCentavos, 'centavos');
  console.log('- Categorias:', aggregation.categorias.length);

  // Validações COM SINAIS CORRETOS
  const entradasOK = aggregation.totalEntradasCentavos === 2000; // Só o estorno
  const saidasOK = aggregation.totalSaidasCentavos === 130000; // 100 + 1200 = 1300,00
  const saldoOK = aggregation.saldoCentavos === -128000; // 20 - 1300 = -1280,00 (saldo negativo)

  console.log(`✅ Total entradas: ${entradasOK ? 'OK' : 'FALHOU'} (${aggregation.totalEntradasCentavos} vs 2000)`);
  console.log(`✅ Total saídas: ${saidasOK ? 'OK' : 'FALHOU'} (${aggregation.totalSaidasCentavos} vs 130000)`);
  console.log(`✅ Saldo: ${saldoOK ? 'OK' : 'FALHOU'} (${aggregation.saldoCentavos} vs -128000)`);

  // Testar categoria alimentação = 100 - 20 = 80 líquido em saídas
  const alimentacaoSaida = aggregation.categorias.find(c => c.categoria === 'alimentacao' && c.tipo === 'saida');
  const alimentacaoEntrada = aggregation.categorias.find(c => c.categoria === 'alimentacao' && c.tipo === 'entrada');
  
  console.log('🏷️ Categoria "alimentacao" saídas:', alimentacaoSaida?.totalCentavos, 'centavos');
  console.log('🏷️ Categoria "alimentacao" entradas:', alimentacaoEntrada?.totalCentavos, 'centavos');

  const categoriaOK = alimentacaoSaida?.totalCentavos === 10000 && alimentacaoEntrada?.totalCentavos === 2000;
  console.log(`✅ Categorias com sinais: ${categoriaOK ? 'OK' : 'FALHOU'}`);

  return entradasOK && saidasOK && saldoOK && categoriaOK;
};

/**
 * Executa todos os testes
 */
export const executarTodosTestes = () => {
  console.log('🚀 Executando todos os testes...\n');
  
  console.log('=== TESTES DE PARSE ===');
  testesParseFunctions();
  
  console.log('\n=== TESTE DE TRANSAÇÃO ÚNICA ===');
  const teste1 = testeParseSingleTransaction();
  
  console.log('\n=== TESTE DE AGREGAÇÃO ===');
  const teste2 = testeAgregacaoCompleta();
  
  console.log('\n=== TESTE DE AGREGAÇÃO (UTILITÁRIO) ===');
  testeAggregationFunctions();
  
  console.log('\n=== RESULTADO FINAL ===');
  const todosOK = teste1 && teste2;
  console.log(`🎯 Todos os testes: ${todosOK ? '✅ PASSARAM' : '❌ FALHARAM'}`);
  
  if (todosOK) {
    console.log('🎉 Sistema pronto para uso! Os cálculos estão corretos e determinísticos.');
  } else {
    console.log('⚠️ Há problemas nos cálculos. Revisar implementação.');
  }
  
  return todosOK;
};

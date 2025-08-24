/**
 * Utilitários para agregação determinística de dados financeiros
 */

import { TransactionData, FinancialInsights, CategoryData, Recommendation } from '@/types/financial';
import { formatarValorBrasileiro } from './parse';

/**
 * Interface para agregações por categoria (com hierarquia)
 */
export interface CategoryAggregate {
  categoria: string;
  categoriaPath: string[];
  totalCentavos: number;
  tipo: 'entrada' | 'saida';
  transactionCount: number;
  percentual: number;
}

/**
 * Interface para agregações mensais
 */
export interface MonthlyAggregate {
  mes: string; // YYYY-MM
  entradasCentavos: number;
  saidasCentavos: number;
  saldoCentavos: number;
  transactionCount: number;
}

/**
 * Resultado completo das agregações
 */
export interface AggregationResult {
  totalEntradasCentavos: number;
  totalSaidasCentavos: number;
  saldoCentavos: number;
  categorias: CategoryAggregate[];
  meses: MonthlyAggregate[];
  topCategorias: CategoryAggregate[];
  mesMaisCaro: string;
}

/**
 * Agregação principal - calcula todos os totais de forma determinística COM SINAIS CORRETOS
 */
export const aggregateTransactions = (transactions: TransactionData[]): AggregationResult => {
  // 1. Totais gerais - PRESERVANDO SINAIS
  // Entradas: valores negativos (reembolsos/estornos) = somar valor absoluto
  // Saídas: valores positivos (gastos) = somar valor absoluto
  const totalEntradasCentavos = transactions
    .filter(t => t.tipo === 'Entrada')
    .reduce((sum, t) => sum + t.valorCentavos, 0);

  const totalSaidasCentavos = transactions
    .filter(t => t.tipo === 'Saída')
    .reduce((sum, t) => sum + t.valorCentavos, 0);

  // Saldo = Entradas (reembolsos) - Saídas (gastos)
  // Se temos mais gastos que reembolsos, saldo negativo
  const saldoCentavos = totalEntradasCentavos - totalSaidasCentavos;

  // 2. Agregação por categoria (com hierarquia)
  const categorias = aggregateByCategory(transactions, totalEntradasCentavos, totalSaidasCentavos);

  // 3. Agregação por mês
  const meses = aggregateByMonth(transactions);

  // 4. Top categorias (maiores gastos)
  const topCategorias = categorias
    .filter(cat => cat.tipo === 'saida')
    .sort((a, b) => b.totalCentavos - a.totalCentavos)
    .slice(0, 5);

  // 5. Mês mais caro
  const mesMaisCaro = meses.length > 0 
    ? meses.sort((a, b) => b.saidasCentavos - a.saidasCentavos)[0].mes
    : new Date().toISOString().substring(0, 7);

  return {
    totalEntradasCentavos,
    totalSaidasCentavos,
    saldoCentavos,
    categorias,
    meses,
    topCategorias,
    mesMaisCaro,
  };
};

/**
 * Agregação por categoria com roll-up hierárquico
 */
const aggregateByCategory = (
  transactions: TransactionData[],
  totalEntradas: number,
  totalSaidas: number
): CategoryAggregate[] => {
  const categoryMap = new Map<string, {
    entrada: number;
    saida: number;
    categoriaPath: string[];
    transactionCount: number;
  }>();

  // Agregar por todos os níveis da hierarquia - COM SINAIS CORRETOS
  transactions.forEach(transaction => {
    const path = transaction.categoriaPath;
    
    // Para cada nível da hierarquia, criar uma entrada
    for (let i = 0; i < path.length; i++) {
      const categoryKey = path.slice(0, i + 1).join(' > ');
      const existing = categoryMap.get(categoryKey) || {
        entrada: 0,
        saida: 0,
        categoriaPath: path.slice(0, i + 1),
        transactionCount: 0,
      };

      // PRESERVAR SINAIS: somar respeitando entrada/saída
      if (transaction.tipo === 'Entrada') {
        existing.entrada += transaction.valorCentavos;
      } else {
        existing.saida += transaction.valorCentavos;
      }
      existing.transactionCount++;

      categoryMap.set(categoryKey, existing);
    }
  });

  // Converter para array de CategoryAggregate
  const result: CategoryAggregate[] = [];

  categoryMap.forEach((values, categoryKey) => {
    // Entrada
    if (values.entrada > 0) {
      result.push({
        categoria: categoryKey,
        categoriaPath: values.categoriaPath,
        totalCentavos: values.entrada,
        tipo: 'entrada',
        transactionCount: values.transactionCount,
        percentual: totalEntradas > 0 ? (values.entrada / totalEntradas) * 100 : 0,
      });
    }

    // Saída
    if (values.saida > 0) {
      result.push({
        categoria: categoryKey,
        categoriaPath: values.categoriaPath,
        totalCentavos: values.saida,
        tipo: 'saida',
        transactionCount: values.transactionCount,
        percentual: totalSaidas > 0 ? (values.saida / totalSaidas) * 100 : 0,
      });
    }
  });

  return result.sort((a, b) => b.totalCentavos - a.totalCentavos);
};

/**
 * Agregação por mês - COM SINAIS PRESERVADOS
 */
const aggregateByMonth = (transactions: TransactionData[]): MonthlyAggregate[] => {
  const monthMap = new Map<string, {
    entradas: number;
    saidas: number;
    count: number;
  }>();

  transactions.forEach(transaction => {
    const mes = transaction.data.substring(0, 7); // YYYY-MM
    const existing = monthMap.get(mes) || { entradas: 0, saidas: 0, count: 0 };

    // PRESERVAR SINAIS: entrada/saída já estão corretamente classificadas
    if (transaction.tipo === 'Entrada') {
      existing.entradas += transaction.valorCentavos;
    } else {
      existing.saidas += transaction.valorCentavos;
    }
    existing.count++;

    monthMap.set(mes, existing);
  });

  return Array.from(monthMap.entries())
    .map(([mes, data]) => ({
      mes,
      entradasCentavos: data.entradas,
      saidasCentavos: data.saidas,
      saldoCentavos: data.entradas - data.saidas, // Entrada - Saída (pode ser negativo se mais gastos)
      transactionCount: data.count,
    }))
    .sort((a, b) => a.mes.localeCompare(b.mes));
};

/**
 * Converte agregações para formato de insights compatível com componentes
 */
export const generateFinancialInsights = (aggregation: AggregationResult): FinancialInsights => {
  // Converter categorias para formato esperado - MELHOR ORDENAÇÃO
  const categoriasSeparadas = {
    entradas: aggregation.categorias
      .filter(cat => cat.tipo === 'entrada')
      .sort((a, b) => b.totalCentavos - a.totalCentavos)
      .slice(0, 10),
    saidas: aggregation.categorias
      .filter(cat => cat.tipo === 'saida')  
      .sort((a, b) => b.totalCentavos - a.totalCentavos)
      .slice(0, 10)
  };

  const categorias: CategoryData[] = [
    ...categoriasSeparadas.saidas, // Saídas primeiro (mais importantes)
    ...categoriasSeparadas.entradas // Depois entradas
  ].map(cat => ({
    nome: cat.categoria,
    valor: cat.totalCentavos / 100, // Converter para reais
    tipo: cat.tipo,
    percentual: Math.round(cat.percentual * 10) / 10, // 1 casa decimal
  }));

  // Gerar recomendações
  const recomendacoes = generateRecommendations(aggregation);

  return {
    totalEntradas: aggregation.totalEntradasCentavos / 100,
    totalSaidas: aggregation.totalSaidasCentavos / 100,
    saldo: aggregation.saldoCentavos / 100,
    categorias,
    recomendacoes,
  };
};

/**
 * Gera recomendações inteligentes baseadas nas agregações
 */
const generateRecommendations = (aggregation: AggregationResult): Recommendation[] => {
  const recomendacoes: Recommendation[] = [];
  
  // 1. Categoria com maior gasto
  if (aggregation.topCategorias.length > 0) {
    const maiorGasto = aggregation.topCategorias[0];
    if (maiorGasto.percentual > 40) {
      recomendacoes.push({
        tipo: 'otimizacao',
        titulo: `Gastos Elevados em ${maiorGasto.categoria}`,
        descricao: `Seus gastos com ${maiorGasto.categoria.toLowerCase()} representam ${maiorGasto.percentual.toFixed(1)}% do total. Considere revisar estes gastos.`,
        impacto: `Economia potencial: ${formatarValorBrasileiro(Math.round(maiorGasto.totalCentavos * 0.15))}/mês`,
      });
    }
  }

  // 2. Análise de saldo
  if (aggregation.saldoCentavos > 0) {
    recomendacoes.push({
      tipo: 'oportunidade',
      titulo: 'Excelente Controle Financeiro',
      descricao: `Saldo positivo de ${formatarValorBrasileiro(aggregation.saldoCentavos)}. Considere investir este valor.`,
      impacto: `Meta de reserva: ${formatarValorBrasileiro(aggregation.totalSaidasCentavos * 3)} (3x gastos mensais)`,
    });
  } else {
    recomendacoes.push({
      tipo: 'alerta',
      titulo: 'Atenção ao Saldo Negativo',
      descricao: `Gastos excedem renda em ${formatarValorBrasileiro(Math.abs(aggregation.saldoCentavos))}.`,
      impacto: 'Urgente: Revise gastos e busque aumentar receita',
    });
  }

  // 3. Análise de tendência mensal
  if (aggregation.meses.length >= 2) {
    const ultimoMes = aggregation.meses[aggregation.meses.length - 1];
    const penultimoMes = aggregation.meses[aggregation.meses.length - 2];
    const crescimentoGastos = ((ultimoMes.saidasCentavos - penultimoMes.saidasCentavos) / penultimoMes.saidasCentavos) * 100;

    if (crescimentoGastos > 15) {
      recomendacoes.push({
        tipo: 'alerta',
        titulo: 'Crescimento de Gastos',
        descricao: `Seus gastos aumentaram ${crescimentoGastos.toFixed(1)}% no último mês.`,
        impacto: 'Monitore tendência e identifique causas do aumento',
      });
    } else if (crescimentoGastos < -10) {
      recomendacoes.push({
        tipo: 'oportunidade',
        titulo: 'Redução de Gastos',
        descricao: `Parabéns! Você reduziu gastos em ${Math.abs(crescimentoGastos).toFixed(1)}% no último mês.`,
        impacto: 'Continue mantendo este controle',
      });
    }
  }

  return recomendacoes.slice(0, 3);
};

/**
 * Exemplo de uso e teste rápido
 */
export const testeAggregationFunctions = () => {
  console.log('🧪 Testando funções de agregação...');

  // Dados de teste
  const transactions: TransactionData[] = [
    {
      id: 1,
      tipo: 'Entrada',
      valorCentavos: 500000, // R$ 5.000,00
      categoria: 'Salário',
      categoriaPath: ['salario'],
      empresa: 'Tech Corp',
      descricao: 'Salário mensal',
      data: '2024-01-15',
    },
    {
      id: 2,
      tipo: 'Saída',
      valorCentavos: 120000, // R$ 1.200,00
      categoria: 'Moradia',
      categoriaPath: ['moradia'],
      empresa: 'Imobiliária',
      descricao: 'Aluguel',
      data: '2024-01-01',
    },
    {
      id: 3,
      tipo: 'Saída',
      valorCentavos: 2500, // R$ 25,00
      categoria: 'Transporte > Apps > Uber',
      categoriaPath: ['transporte', 'apps', 'uber'],
      empresa: 'Uber',
      descricao: 'Corrida',
      data: '2024-01-10',
    },
  ];

  const result = aggregateTransactions(transactions);
  
  console.log('💰 Totais:');
  console.log(`Entradas: ${formatarValorBrasileiro(result.totalEntradasCentavos)}`);
  console.log(`Saídas: ${formatarValorBrasileiro(result.totalSaidasCentavos)}`);
  console.log(`Saldo: ${formatarValorBrasileiro(result.saldoCentavos)}`);
  
  console.log('📊 Categorias:');
  result.categorias.forEach(cat => {
    console.log(`${cat.categoria}: ${formatarValorBrasileiro(cat.totalCentavos)} (${cat.percentual.toFixed(1)}%)`);
  });

  // Verificação de integridade
  const somaEntradas = result.categorias
    .filter(c => c.tipo === 'entrada')
    .reduce((sum, c) => sum + c.totalCentavos, 0);
  
  const somaSaidas = result.categorias
    .filter(c => c.tipo === 'saida')
    .reduce((sum, c) => sum + c.totalCentavos, 0);

  console.log('🔍 Verificação de integridade:');
  console.log(`Soma entradas calculada: ${formatarValorBrasileiro(somaEntradas)} vs Total: ${formatarValorBrasileiro(result.totalEntradasCentavos)}`);
  console.log(`Soma saídas calculada: ${formatarValorBrasileiro(somaSaidas)} vs Total: ${formatarValorBrasileiro(result.totalSaidasCentavos)}`);
  
  return result;
};

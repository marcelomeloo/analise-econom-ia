export interface TransactionData {
  id: number;
  tipo: 'Entrada' | 'Saída';
  valorCentavos: number; // Valor em centavos (inteiro) para evitar erros de arredondamento
  categoria: string; // Display name da categoria (ex: "Transporte > Apps > Uber")
  categoriaPath: string[]; // Path hierárquico normalizado (ex: ["transporte", "apps", "uber"])
  empresa: string;
  descricao: string;
  data: string; // Formato YYYY-MM-DD
}

// Backward compatibility - remover depois que todos os componentes forem atualizados
export interface LegacyTransactionData {
  id: number;
  tipo: 'Entrada' | 'Saída';
  valor: number; // Em reais (float) - deprecated
  categoria: string;
  empresa: string;
  descricao: string;
  data: string;
}

export interface CategoryData {
  nome: string;
  valor: number;
  tipo: 'entrada' | 'saida';
  percentual: number;
}

export interface Recommendation {
  tipo: 'otimizacao' | 'oportunidade' | 'alerta';
  titulo: string;
  descricao: string;
  impacto: string;
}

export interface FinancialInsights {
  totalEntradas: number;
  totalSaidas: number;
  saldo: number;
  categorias: CategoryData[];
  recomendacoes: Recommendation[];
}

export interface ChartData {
  name: string;
  value: number;
  fill: string;
}

export interface MonthlyData {
  mes: string;
  entradas: number;
  saidas: number;
}

// Análise Geral Debochada - ESTRUTURA REESTRUTURADA
export interface GeneralAnalysis {
  pontuacao_geral: {
    nota: number; // 1-10  
    comentario: string;
  };
  mandou_bem: string;
  mandou_mal: string;
  gasto_frequencia: {
    categoria: string;
    total: number;
    frequencia_transacoes: number;
    ticket_medio: number;
    comentario: string;
  }[];
  dicas_rapidas: {
    categoria: string;
    valor_atual: number;
    frequencia_atual: string;
    valor_meta: number;
    frequencia_meta: string;
    economia: number;
    comentario: string;
  }[];
  outros_gastos: {
    estabelecimento: string;
    total: number;
    comentario: string;
  }[];
  economia_realista: {
    categorias: {
      categoria: string;
      economia: number;
    }[];
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

// Raw data from Excel/CSV (flexible field names)
export interface RawTransactionRow {
  [key: string]: any;
}

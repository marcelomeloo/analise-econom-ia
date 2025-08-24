/**
 * Utilitários para parsing de valores financeiros brasileiros
 */

/**
 * Parse de valor monetário brasileiro para centavos (inteiro)
 * Exemplos:
 * - "1.234,56" → 123456
 * - "R$ 99,90" → 9990
 * - "(100,00)" → -10000 (valor negativo)
 * - "-500,75" → -50075
 * - "1234" → 123400 (assume sem centavos)
 */
export const parseValorBrasileiro = (valor: string | number): number => {
  if (typeof valor === 'number') {
    return Math.round(valor * 100);
  }

  if (!valor || typeof valor !== 'string') {
    return 0;
  }

  let valorLimpo = valor.trim();

  // Detectar valor negativo por parênteses
  const isNegativeParentheses = valorLimpo.startsWith('(') && valorLimpo.endsWith(')');
  if (isNegativeParentheses) {
    valorLimpo = valorLimpo.slice(1, -1);
  }

  // Remove símbolos monetários e espaços
  valorLimpo = valorLimpo
    .replace(/R\$?/g, '')
    .replace(/[^\d,.-]/g, '')
    .trim();

  // Detectar sinal negativo
  const isNegative = valorLimpo.startsWith('-') || isNegativeParentheses;
  if (isNegative) {
    valorLimpo = valorLimpo.replace('-', '');
  }

  // DETECTAR FORMATO: vírgula vs ponto como separador decimal
  let separadorDecimal: ',' | '.' | null = null;
  let parteInteira = '';
  let centavos = '';

  // Formato brasileiro: 1.234,56 ou 69,99
  if (valorLimpo.includes(',')) {
    const partes = valorLimpo.split(',');
    if (partes.length === 2 && partes[1].length <= 2) {
      separadorDecimal = ',';
      parteInteira = partes[0].replace(/\./g, ''); // Remove pontos como separador de milhares
      centavos = partes[1].padEnd(2, '0').substring(0, 2);
    }
  }
  // Formato americano: 1,234.56 ou 69.99
  else if (valorLimpo.includes('.')) {
    const partes = valorLimpo.split('.');
    if (partes.length === 2 && partes[1].length <= 2) {
      // Se último grupo tem 1-2 dígitos, é decimal: 69.99
      separadorDecimal = '.';
      parteInteira = partes[0].replace(/,/g, ''); // Remove vírgulas como separador de milhares
      centavos = partes[1].padEnd(2, '0').substring(0, 2);
    } else {
      // Múltiplos pontos = separador milhares: 1.234.567
      separadorDecimal = null;
      parteInteira = valorLimpo.replace(/\./g, '');
      centavos = '00';
    }
  }
  // Sem separadores = valor inteiro
  else {
    separadorDecimal = null;
    parteInteira = valorLimpo;
    centavos = '00';
  }

  const parteInteiraNum = parseInt(parteInteira) || 0;
  const centavosNum = parseInt(centavos) || 0;

  const valorEmCentavos = parteInteiraNum * 100 + centavosNum;
  return isNegative ? -valorEmCentavos : valorEmCentavos;
};

/**
 * Converte centavos para string formatada brasileira
 * Exemplo: 123456 → "R$ 1.234,56"
 */
export const formatarValorBrasileiro = (centavos: number): string => {
  const isNegativo = centavos < 0;
  const valorAbsoluto = Math.abs(centavos);
  
  const reais = Math.floor(valorAbsoluto / 100);
  const centavosRestantes = valorAbsoluto % 100;
  
  const reaisFormatados = reais.toLocaleString('pt-BR');
  const valorFormatado = `R$ ${reaisFormatados},${centavosRestantes.toString().padStart(2, '0')}`;
  
  return isNegativo ? `-${valorFormatado}` : valorFormatado;
};

/**
 * Parse de data brasileira para formato ISO (YYYY-MM-DD)
 */
export const parseDateBrasileira = (data: string): string => {
  if (!data || typeof data !== 'string') {
    return new Date().toISOString().split('T')[0];
  }

  const dataLimpa = data.trim();

  // Já está no formato ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(dataLimpa)) {
    return dataLimpa;
  }

  // Formato brasileiro DD/MM/YYYY ou DD/MM/YY
  const matchBR = dataLimpa.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (matchBR) {
    let [, dia, mes, ano] = matchBR;
    
    // Ajustar ano de 2 dígitos
    if (ano.length === 2) {
      const anoNum = parseInt(ano);
      ano = anoNum < 50 ? `20${ano}` : `19${ano}`;
    }
    
    return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
  }

  // Formato americano MM/DD/YYYY
  const matchUS = dataLimpa.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (matchUS) {
    const [, mes, dia, ano] = matchUS;
    return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
  }

  // Fallback para data atual
  return new Date().toISOString().split('T')[0];
};

/**
 * Normaliza categoria para evitar duplicatas
 * Remove acentos, converte para lowercase, trim
 */
export const normalizeCategoria = (categoria: string): string => {
  if (!categoria || typeof categoria !== 'string') {
    return 'outros';
  }

  return categoria
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, ' ') // Normaliza espaços
    .trim();
};

/**
 * Parse de categoria hierárquica
 * Exemplo: "Transporte > Apps > Uber" → ["transporte", "apps", "uber"]
 */
export const parseCategoriaPath = (categoria: string): string[] => {
  if (!categoria || typeof categoria !== 'string') {
    return ['outros'];
  }

  // Separar por > ou / ou :
  const partes = categoria
    .split(/[>\/:]/)
    .map(parte => normalizeCategoria(parte))
    .filter(parte => parte.length > 0);

  return partes.length > 0 ? partes : ['outros'];
};

/**
 * Testes rápidos das funções de parse
 */
export const testesParseFunctions = () => {
  console.log('🧪 Testando funções de parse...');
  
  // Testes de valores - INCLUINDO FORMATO AMERICANO
  const testesValores = [
    // Formato brasileiro
    ['1.234,56', 123456],
    ['R$ 99,90', 9990],
    ['(100,00)', -10000],
    ['-500,75', -50075],
    ['1234', 123400],
    ['R$ 1.500', 150000],
    // Formato americano - CASOS CRÍTICOS
    ['69.99', 6999],        // LinkedIn: R$ 69,99
    ['15.99', 1599],        // Netflix: R$ 15,99  
    ['379.00', 37900],      // Moradia: R$ 379,00
    ['1,234.56', 123456],   // Formato US com milhares
    ['-20.50', -2050],      // Estorno formato US
  ];

  console.log('💰 Testes de valores:');
  testesValores.forEach(([input, expected]) => {
    const result = parseValorBrasileiro(input as string);
    const status = result === expected ? '✅' : '❌';
    console.log(`${status} ${input} → ${result} (esperado: ${expected})`);
  });

  // Testes de datas
  const testesDatas = [
    ['15/01/2024', '2024-01-15'],
    ['2024-01-15', '2024-01-15'],
    ['01/12/23', '2023-12-01'],
  ];

  console.log('📅 Testes de datas:');
  testesDatas.forEach(([input, expected]) => {
    const result = parseDateBrasileira(input);
    const status = result === expected ? '✅' : '❌';
    console.log(`${status} ${input} → ${result} (esperado: ${expected})`);
  });

  // Testes de categorias
  const testesCategorias: [string, string | string[]][] = [
    ['Alimentação', 'alimentacao'],
    ['Transporte > Apps > Uber', ['transporte', 'apps', 'uber']],
    ['  MORADIA  ', 'moradia'],
  ];

  console.log('🏷️ Testes de categorias:');
  testesCategorias.forEach(([input, expected]) => {
    if (Array.isArray(expected)) {
      const result = parseCategoriaPath(input);
      const status = JSON.stringify(result) === JSON.stringify(expected) ? '✅' : '❌';
      console.log(`${status} ${input} → ${JSON.stringify(result)} (esperado: ${JSON.stringify(expected)})`);
    } else {
      const result = normalizeCategoria(input);
      const status = result === expected ? '✅' : '❌';
      console.log(`${status} ${input} → ${result} (esperado: ${expected})`);
    }
  });
};

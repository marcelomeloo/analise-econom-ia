import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, AlertCircle, Target, DollarSign, PieChart, Brain } from 'lucide-react';
import { PieChart as RechartsPieChart, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Pie } from 'recharts';
import { FinancialInsights, TransactionData } from '@/types/financial';
import { formatarValorBrasileiro } from '@/utils/parse';

interface InsightsViewProps {
  insights: FinancialInsights | null;
  transactions: TransactionData[];
}

const InsightsView = ({ insights, transactions }: InsightsViewProps) => {
  // Show loading or empty state if no insights
  if (!insights) {
    return (
      <div className="text-center py-12">
        <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg text-muted-foreground">
          Nenhum insight disponível ainda.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Carregue um arquivo para gerar análises inteligentes.
        </p>
      </div>
    );
  }

  // Generate chart data from expense categories - EXPANDIDO PARA TOP 8
  const chartData = insights.categorias
    .filter(cat => cat.tipo === 'saida')
    .slice(0, 8)
    .map((cat, index) => ({
      name: cat.nome,
      value: cat.valor,
      fill: [
        'hsl(0 84% 60%)',    // Vermelho
        'hsl(38 92% 50%)',   // Laranja  
        'hsl(158 64% 52%)',  // Verde
        'hsl(204 94% 94%)',  // Azul claro
        'hsl(142 76% 36%)',  // Verde escuro
        'hsl(280 100% 70%)', // Roxo
        'hsl(45 93% 47%)',   // Amarelo
        'hsl(348 83% 47%)'   // Rosa
      ][index % 8]
    }));

  // Generate monthly data (simplified for now - could be enhanced with date analysis)
  const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'short' });
  const monthlyData = [
    { mes: currentMonth, entradas: insights.totalEntradas, saidas: insights.totalSaidas }
  ];

  const COLORS = ['hsl(0 84% 60%)', 'hsl(38 92% 50%)', 'hsl(158 64% 52%)', 'hsl(204 94% 94%)', 'hsl(142 76% 36%)'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Insights Financeiros</h2>
        <Badge variant="secondary" className="px-3 py-1">
          Janeiro 2024
        </Badge>
      </div>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-card shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Entradas</p>
              <p className="text-2xl font-bold text-success">
                R$ {insights.totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-success" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-card shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Saídas</p>
              <p className="text-2xl font-bold text-destructive">
                R$ {insights.totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-destructive" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-card shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Saldo</p>
              <p className="text-2xl font-bold text-primary">
                R$ {insights.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-primary" />
          </div>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-6 bg-gradient-card shadow-card">
          <h3 className="text-lg font-semibold mb-4">Distribuição de Gastos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 bg-gradient-card shadow-card">
          <h3 className="text-lg font-semibold mb-4">Evolução Mensal</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                formatter={(value, name) => [
                  `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
                  name === 'entradas' ? 'Entradas' : 'Saídas'
                ]}
              />
              <Bar dataKey="entradas" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="saidas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <Card className="p-6 bg-gradient-card shadow-card">
        <div className="flex items-center space-x-2 mb-6">
          <PieChart className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Distribuição por Categoria</h3>
        </div>
        
        <div className="space-y-4">
          {insights.categorias.map((categoria, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant={categoria.tipo === 'entrada' ? 'default' : 'destructive'} className="text-xs">
                    {categoria.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                  </Badge>
                  <span className="font-medium">{categoria.nome}</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold">
                    R$ {categoria.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-sm text-muted-foreground ml-2">
                    ({categoria.percentual}%)
                  </span>
                </div>
              </div>
              <Progress 
                value={categoria.percentual} 
                className="h-2" 
              />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default InsightsView;
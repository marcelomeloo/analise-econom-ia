import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, TrendingDown, TrendingUp, Target, DollarSign, AlertCircle, Zap, Receipt } from 'lucide-react';
import { GeneralAnalysis } from '@/types/financial';
import { formatarValorBrasileiro } from '@/utils/parse';

interface GeneralAnalysisViewProps {
  analysis: GeneralAnalysis | null;
}

const GeneralAnalysisView = ({ analysis }: GeneralAnalysisViewProps) => {
  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Flame className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">
          Nenhuma análise disponível
        </h3>
        <p className="text-muted-foreground">
          Faça o upload de um arquivo CSV para ver sua análise debochada
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 📊 Pontuação Geral */}
      <Card className="p-8 bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500 rounded-full">
              <Flame className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-red-700">📊 PONTUAÇÃO GERAL</h2>
              <p className="text-red-600">Nota da vergonha</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-5xl font-black text-red-600">
              {analysis.pontuacao_geral.nota}/10
            </div>
            <div className="text-sm text-red-500">Maturidade Financeira</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border-l-4 border-red-500">
          <p className="text-lg text-gray-800 leading-relaxed font-medium">
            {analysis.pontuacao_geral.comentario}
          </p>
        </div>
      </Card>

      {/* 👍👎 Mandou Bem / Mandou Mal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-500 rounded-full">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-green-700">👍 MANDOU BEM</h3>
          </div>
          <p className="text-green-800 font-medium">{analysis.mandou_bem}</p>
        </Card>

        <Card className="p-6 bg-gradient-to-r from-red-50 to-rose-50 border-red-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-500 rounded-full">
              <TrendingDown className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-red-700">👎 MANDOU MAL</h3>
          </div>
          <p className="text-red-800 font-medium">{analysis.mandou_mal}</p>
        </Card>
      </div>

      {/* 💳 Gasto + Frequência */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-orange-500 rounded-full">
            <DollarSign className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-orange-700">💳 GASTO + FREQUÊNCIA</h3>
        </div>
        <div className="space-y-4">
          {analysis.gasto_frequencia.map((gasto, index) => (
            <div key={index} className="bg-gray-50 p-5 rounded-lg border-l-4 border-orange-400">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800 text-lg mb-1">{gasto.categoria}</h4>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>{gasto.frequencia_transacoes} transações</span>
                    <span>Ticket médio: {formatarValorBrasileiro(Math.round(gasto.ticket_medio * 100))}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatarValorBrasileiro(Math.round(gasto.total * 100))}
                  </div>
                </div>
              </div>
              <p className="text-gray-700 italic font-medium">{gasto.comentario}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* 🔪 Dicas Rápidas */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-500 rounded-full">
            <Target className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-blue-700">🔪 DICAS RÁPIDAS</h3>
        </div>
        <div className="space-y-4">
          {analysis.dicas_rapidas.map((dica, index) => (
            <div key={index} className="bg-blue-50 p-5 rounded-lg border-l-4 border-blue-400">
              <h4 className="font-bold text-blue-800 text-lg mb-3">{dica.categoria}</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div className="bg-white p-3 rounded border-l-2 border-red-400">
                  <div className="text-sm text-gray-600 font-medium">ATUAL:</div>
                  <div className="font-bold text-red-600">
                    {formatarValorBrasileiro(Math.round(dica.valor_atual * 100))} ({dica.frequencia_atual})
                  </div>
                </div>
                <div className="bg-white p-3 rounded border-l-2 border-green-400">
                  <div className="text-sm text-gray-600 font-medium">META:</div>
                  <div className="font-bold text-green-600">
                    {formatarValorBrasileiro(Math.round(dica.valor_meta * 100))} ({dica.frequencia_meta})
                  </div>
                </div>
              </div>

              <div className="bg-green-100 p-3 rounded mb-3">
                <div className="text-sm text-green-700 font-medium">ECONOMIA:</div>
                <div className="text-lg font-bold text-green-700">
                  {formatarValorBrasileiro(Math.round(dica.economia * 100))}/mês
                </div>
              </div>

              <p className="text-blue-700 italic font-medium">{dica.comentario}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* 🏆 Outros Gastos */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-500 rounded-full">
            <Receipt className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-purple-700">🏆 OUTROS GASTOS</h3>
        </div>
        <div className="bg-purple-100 p-4 rounded-lg mb-4 border-l-4 border-purple-500">
          <p className="text-purple-800 italic font-bold text-center">
            "Você não lembra, mas o cartão lembra."
          </p>
        </div>
        <div className="space-y-3">
          {analysis.outros_gastos.map((gasto, index) => (
            <div key={index} className="flex justify-between items-start p-4 bg-purple-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="outline" className="bg-purple-100 text-purple-800 font-bold">
                    {index + 1}
                  </Badge>
                  <p className="font-bold text-purple-800">{gasto.estabelecimento}</p>
                </div>
                <p className="text-sm text-purple-600 italic">{gasto.comentario}</p>
              </div>
              <div className="text-lg font-bold text-purple-700 ml-4">
                {formatarValorBrasileiro(Math.round(gasto.total * 100))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 💥 Economia Realista */}
      <Card className="p-8 bg-gradient-to-r from-green-50 to-teal-50 border-green-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-green-500 rounded-full">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-green-700">💥 ECONOMIA REALISTA</h3>
            <p className="text-green-600">Se você parar de ser teimoso</p>
          </div>
        </div>
        
        <div className="space-y-3 mb-6">
          {analysis.economia_realista.categorias.map((cat, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg border-l-4 border-green-400">
              <span className="font-semibold text-green-800">{cat.categoria}:</span>
              <span className="font-bold text-green-600">
                -{formatarValorBrasileiro(Math.round(cat.economia * 100))}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-green-100 p-6 rounded-lg border-2 border-green-300">
          <div className="text-center">
            <div className="text-sm font-medium text-green-700 mb-2">➡️ TOTAL:</div>
            <div className="text-3xl font-black text-green-600 mb-1">
              {formatarValorBrasileiro(Math.round(analysis.economia_realista.economia_mensal * 100))}/mês
            </div>
            <div className="text-lg font-bold text-green-700">
              → {formatarValorBrasileiro(Math.round(analysis.economia_realista.economia_anual * 100))}/ano
            </div>
          </div>
        </div>
      </Card>

      {/* ✨ E com isso você podia... */}
      <Card className="p-6 bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-yellow-500 rounded-full">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-yellow-700">✨ E COM ISSO VOCÊ PODIA...</h3>
        </div>
        <div className="space-y-4">
          {analysis.com_isso_voce_podia.map((opcao, index) => (
            <div key={index} className="flex items-start gap-4 p-4 bg-white rounded-lg border-l-4 border-yellow-400">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold">
                {index + 1}
              </div>
              <p className="text-yellow-800 font-medium text-lg flex-1">{opcao}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default GeneralAnalysisView;
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpCircle, ArrowDownCircle, Building, Tag } from 'lucide-react';
import { TransactionData } from '@/types/financial';
import { formatarValorBrasileiro } from '@/utils/parse';

interface CategorizationViewProps {
  transactions: TransactionData[];
}

const CategorizationView = ({ transactions }: CategorizationViewProps) => {
  // Show message if no transactions
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">
          Nenhuma transação encontrada no arquivo.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Verifique se o arquivo contém dados válidos.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Categorização Automática</h2>
        <Badge variant="secondary" className="px-3 py-1">
          {transactions.length} transações processadas
        </Badge>
      </div>

      <div className="grid gap-4">
        {transactions.map((transaction) => (
          <Card key={transaction.id} className="p-6 bg-gradient-card shadow-card hover:shadow-elevated transition-all duration-300">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className={`p-2 rounded-lg ${transaction.tipo === 'Entrada' ? 'bg-success/10' : 'bg-destructive/10'}`}>
                  {transaction.tipo === 'Entrada' ? (
                    <ArrowUpCircle className="h-5 w-5 text-success" />
                  ) : (
                    <ArrowDownCircle className="h-5 w-5 text-destructive" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant={transaction.tipo === 'Entrada' ? 'default' : 'destructive'}>
                      {transaction.tipo}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{transaction.data}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-1">{transaction.descricao}</h3>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Building className="h-4 w-4" />
                      <span>{transaction.empresa}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Tag className="h-4 w-4" />
                      <span>{transaction.categoria}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${transaction.tipo === 'Entrada' ? 'text-success' : 'text-destructive'}`}>
                  {transaction.tipo === 'Entrada' ? '+' : '-'}{formatarValorBrasileiro(transaction.valorCentavos)}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CategorizationView;
// src/pages/commissions/RegisterSalePage.tsx
import { SalesRegister } from '../../components/commissions/SalesRegister';
import { CommissionProvider } from '../../contexts/CommissionContext';

export function RegisterSalePage() {
  return (
    // Envolve a página com o Provider, caso o componente SalesRegister necessite do contexto
    <CommissionProvider>
      <div className="container mx-auto p-4 max-w-4xl">
        {/* Cabeçalho da Página */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Registrar Nova Venda
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Preencha os dados abaixo para lançar uma venda e calcular a comissão.
          </p>
        </div>

        {/* Conteúdo Principal: Seu Componente de Formulário */}
        <SalesRegister />
        
      </div>
    </CommissionProvider>
  );
}
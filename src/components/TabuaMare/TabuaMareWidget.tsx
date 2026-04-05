// src/components/TabuaMare/TabuaMareWidget.tsx
import { useTabuaMare } from '../../hooks/useTabuaMare';
import type { MareDia, MareEvento } from '../../types/tabuaMare.types';

interface TabuaMareWidgetProps {
  /** Sigla do estado (ex: 'rn'). Padrão: 'rn' (Rio Grande do Norte). */
  estado?: string;
}

function getMareIcon(tipo: string): string {
  const t = tipo?.toLowerCase() ?? '';
  if (t.includes('alta')) return '🔼';
  if (t.includes('baixa')) return '🔽';
  return '🌊';
}

function getMareColor(tipo: string): string {
  const t = tipo?.toLowerCase() ?? '';
  if (t.includes('alta'))
    return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30';
  if (t.includes('baixa'))
    return 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/30';
  return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700';
}

function HojeCard({ dia }: { dia: MareDia }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {dia.mares.map((mare: MareEvento, i: number) => (
        <div
          key={i}
          className={`rounded-lg px-3 py-2 flex items-center gap-2 ${getMareColor(mare.tipo)}`}
        >
          <span className="text-lg">{getMareIcon(mare.tipo)}</span>
          <div>
            <p className="text-xs font-medium opacity-70">{mare.tipo}</p>
            <p className="font-bold text-sm">{mare.hora}</p>
            <p className="text-xs">{mare.altura}m</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TabuaMareWidget({ estado = 'rn' }: TabuaMareWidgetProps) {
  const hoje = new Date();
  const diaHoje = hoje.getDate();
  const mesAtual = hoje.getMonth() + 1;

  const { data, loading, error, portoId, refetch } = useTabuaMare({
    estado,
    mes: mesAtual,
    dias: `${diaHoje}`,
  });

  const nomeMes = hoje.toLocaleDateString('pt-BR', { month: 'long' });
  const dataFormatada = hoje.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });

  // Extrai o dia de hoje dos dados retornados
  const diaData: MareDia | undefined = (() => {
    if (!data) return undefined;
    const lista = (data as any)?.dados ?? (data as any)?.data?.dados ?? [];
    return lista.find((d: MareDia) => d.dia === diaHoje) ?? lista[0];
  })();

  const nomePorto: string =
    (data as any)?.porto?.nome ??
    (data as any)?.data?.porto?.nome ??
    portoId ??
    '—';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-cyan-500">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            🌊 Tábua de Marés
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{dataFormatada}</p>
        </div>
        <button
          onClick={refetch}
          disabled={loading}
          className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline disabled:opacity-50 transition-opacity"
          title="Atualizar dados"
        >
          {loading ? '⏳' : '🔄'} Atualizar
        </button>
      </div>

      {/* Estado de carregamento */}
      {loading && (
        <div className="flex items-center justify-center py-6 gap-2 text-gray-500 dark:text-gray-400">
          <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Buscando marés...</span>
        </div>
      )}

      {/* Estado de erro */}
      {error && !loading && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-600 dark:text-red-400">⚠️ {error}</p>
          <button
            onClick={refetch}
            className="mt-2 text-xs text-red-700 dark:text-red-300 underline hover:no-underline"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Dados do dia de hoje */}
      {!loading && !error && diaData && (
        <>
          {nomePorto !== '—' && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
              📍 Porto de referência: <span className="font-medium">{nomePorto}</span>
            </p>
          )}
          <HojeCard dia={diaData} />
        </>
      )}

      {/* Sem dados */}
      {!loading && !error && !diaData && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          Nenhum dado disponível para hoje em {nomeMes}.
        </p>
      )}

      {/* Rodapé */}
      <p className="text-xs text-gray-400 dark:text-gray-600 mt-3 text-right">
        Fonte: Marinha do Brasil via{' '}
        <a
          href="https://tabuamare.devtu.qzz.io"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-cyan-500 transition-colors"
        >
          tabuamare.devtu.qzz.io
        </a>
      </p>
    </div>
  );
}
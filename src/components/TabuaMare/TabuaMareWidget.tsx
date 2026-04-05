// src/components/TabuaMare/TabuaMareWidget.tsx

import { useTabuaMare } from '../../hooks/useTabuaMare';
import type { MareEvento } from '../../types/tabuaMare.types';

interface TabuaMareWidgetProps {
  estado?: string;
  portoIdFixo?: string;
}

function getMareIcon(tipo: string): string {
  const t = tipo?.toLowerCase() ?? '';
  if (t.includes('alta') || t.includes('high')) return '🔼';
  if (t.includes('baixa') || t.includes('low')) return '🔽';
  return '🌊';
}

function getMareColor(tipo: string): string {
  const t = tipo?.toLowerCase() ?? '';
  if (t.includes('alta') || t.includes('high'))
    return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30';
  if (t.includes('baixa') || t.includes('low'))
    return 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/30';
  return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700';
}

// Tenta extrair os eventos de maré do dia independente do formato da API
function extrairEventosDoDia(data: any, diaHoje: number): MareEvento[] | null {
  if (!data) return null;

  // Log temporário — remova após confirmar que está funcionando
  console.log('🌊 Resposta da API de marés:', JSON.stringify(data, null, 2));

  // Formatos possíveis que a API pode retornar:
  // 1. { data: [{ dia, mares: [{ hora, altura, tipo }] }] }
  // 2. { data: [{ day, tides: [{ time, height, type }] }] }
  // 3. [{ dia, mares: [...] }]

  const lista: any[] =
    data?.data ?? (Array.isArray(data) ? data : []);

  if (lista.length === 0) return null;

  // Tenta encontrar o dia de hoje, senão pega o primeiro
  const diaObj =
    lista.find((d: any) => d.dia === diaHoje || d.day === diaHoje) ??
    lista[0];

  if (!diaObj) return null;

  // Extrai os eventos (suporta campos em português e inglês)
  const eventos: any[] = diaObj.mares ?? diaObj.tides ?? diaObj.events ?? [];

  return eventos.map((e: any) => ({
    hora: e.hora ?? e.time ?? e.hour ?? '--:--',
    altura: e.altura ?? e.height ?? e.level ?? 0,
    tipo: e.tipo ?? e.type ?? e.kind ?? 'Maré',
  }));
}

export function TabuaMareWidget({ estado = 'rn', portoIdFixo }: TabuaMareWidgetProps) {
  const hoje = new Date();

  const { data, loading, error, portoNome, refetch } = useTabuaMare({
    estado,
    portoIdFixo,
    mes: hoje.getMonth() + 1,
    dias: String(hoje.getDate()),
  });

  const dataFormatada = hoje.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });

  const eventos = extrairEventosDoDia(data, hoje.getDate());

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-cyan-500">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            🌊 Tábua de Marés
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
            {dataFormatada}
          </p>
        </div>
        <button
          onClick={refetch}
          disabled={loading}
          className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline disabled:opacity-50 transition-opacity"
        >
          {loading ? '⏳' : '🔄'} Atualizar
        </button>
      </div>

      {/* Carregando */}
      {loading && (
        <div className="flex items-center justify-center py-6 gap-2 text-gray-500 dark:text-gray-400">
          <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Buscando marés...</span>
        </div>
      )}

      {/* Erro */}
      {error && !loading && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-600 dark:text-red-400">⚠️ {error}</p>
          <button
            onClick={refetch}
            className="mt-2 text-xs text-red-700 dark:text-red-300 underline"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Dados */}
      {!loading && !error && eventos && eventos.length > 0 && (
        <>
          {portoNome && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-2 truncate">
              📍 {portoNome}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            {eventos.map((mare: MareEvento, i: number) => (
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
        </>
      )}

      {/* Formato desconhecido — mostra JSON para debug */}
      {!loading && !error && data && (!eventos || eventos.length === 0) && (
        <details className="mt-2" open>
          <summary className="text-xs text-amber-600 dark:text-amber-400 cursor-pointer font-medium">
            ⚠️ Dados recebidos mas formato inesperado — abra o console (F12) para ver
          </summary>
          <pre className="text-xs mt-2 bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto max-h-48 whitespace-pre-wrap">
            {JSON.stringify(data, null, 2)}
          </pre>
        </details>
      )}

      {/* Sem dados */}
      {!loading && !error && !data && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          Nenhum dado disponível.
        </p>
      )}

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
// src/pages/TabuaDeMarePage.tsx
// Página completa da tábua de marés — mês inteiro, navegação por mês, seletor de porto.

import { useState, useEffect, useCallback } from 'react';
import { buscarTabuaMare, listarPortosPorEstado } from '../services/tabuaMareService';

const PORTO_PADRAO = 'rn04';

interface HoraMare { hour: string; level: number; }
interface DiaData  { day: number; weekday_name: string; hours: HoraMare[]; }
interface MesData  { month: number; month_name: string; days: DiaData[]; }

const MESES_PT = [
  '', 'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];

function fmt(h: string) { return h.slice(0, 5); }
function isAlta(level: number, mean: number) { return level >= mean; }

export function TabuaDeMarePage() {
  const hoje = new Date();

  const [mes,     setMes]     = useState(hoje.getMonth() + 1);
  const [ano,     setAno]     = useState(hoje.getFullYear());
  const [portoId, setPortoId] = useState(PORTO_PADRAO);
  const [portos,  setPortos]  = useState<{ id: string; nome: string }[]>([]);
  const [mesData, setMesData] = useState<MesData | null>(null);
  const [meanLevel, setMeanLevel] = useState(1.5);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // Carrega lista de portos do RN
  useEffect(() => {
    listarPortosPorEstado('rn').then((res: any) => {
      const lista: any[] = res?.data ?? [];
      setPortos(lista.map((p: any) => ({ id: p.id, nome: p.harbor_name ?? p.id })));
    }).catch(() => {});
  }, []);

  // Número de dias do mês atual
  const diasDoMes = new Date(ano, mes, 0).getDate();

  const buscar = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMesData(null);
    try {
      // Busca o mês inteiro: dias "1-{ultimo}"
      const res: any = await buscarTabuaMare(portoId, mes, `1-${diasDoMes}`);
      const porto = res?.data?.[0];
      if (!porto) throw new Error('Nenhum dado encontrado.');

      setMeanLevel(porto.mean_level ?? 1.5);
      const mesObj: MesData = porto.months?.find((m: any) => m.month === mes) ?? porto.months?.[0];
      if (!mesObj) throw new Error('Mês não encontrado na resposta.');
      setMesData(mesObj);
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao buscar dados.');
    } finally {
      setLoading(false);
    }
  }, [portoId, mes, ano]);

  useEffect(() => { buscar(); }, [buscar]);

  const mudarMes = (delta: number) => {
    setMes(m => {
      let nm = m + delta;
      let na = ano;
      if (nm > 12) { nm = 1;  na = ano + 1; }
      if (nm < 1)  { nm = 12; na = ano - 1; }
      setAno(na);
      return nm;
    });
  };

  const hojeStr = `${hoje.getDate()}/${hoje.getMonth() + 1}/${hoje.getFullYear()}`;

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">🌊 Tábua de Marés</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Dados oficiais da Marinha do Brasil
          </p>
        </div>

        {/* Seletor de porto */}
        <select
          value={portoId}
          onChange={e => setPortoId(e.target.value)}
          className="text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        >
          {portos.length === 0 && <option value={PORTO_PADRAO}>RN04 — Porto de Natal</option>}
          {portos.map(p => (
            <option key={p.id} value={p.id}>
              {p.id.toUpperCase()} — {p.nome.split('(')[0].trim()}
            </option>
          ))}
        </select>
      </div>

      {/* Navegação de mês */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg shadow px-4 py-3">
        <button
          onClick={() => mudarMes(-1)}
          className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 flex items-center justify-center font-bold transition-colors"
        >‹</button>

        <div className="text-center">
          <p className="font-bold text-gray-800 dark:text-white text-base">
            {MESES_PT[mes]} {ano}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Porto de referência: {portoId.toUpperCase()} — ~46 km de Tibau do Sul
          </p>
        </div>

        <button
          onClick={() => mudarMes(1)}
          className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 flex items-center justify-center font-bold transition-colors"
        >›</button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16 gap-3 text-gray-500 dark:text-gray-400">
          <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span>Carregando tábua de {MESES_PT[mes]}...</span>
        </div>
      )}

      {/* Erro */}
      {error && !loading && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
          <p className="text-sm text-red-600 dark:text-red-400 mb-2">⚠️ {error}</p>
          <button onClick={buscar} className="text-xs text-red-700 dark:text-red-300 underline">
            Tentar novamente
          </button>
        </div>
      )}

      {/* Tabela do mês */}
      {!loading && !error && mesData && (
        <>
          {/* Legenda */}
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <span className="text-blue-600">▲</span> Maré Alta (≥ {meanLevel.toFixed(2)}m)
            </span>
            <span className="flex items-center gap-1">
              <span className="text-cyan-600">▼</span> Maré Baixa
            </span>
          </div>

          <div className="space-y-2">
            {mesData.days.map((dia) => {
              const dataStr = `${dia.day}/${mes}/${ano}`;
              const eHoje = dataStr === hojeStr;

              return (
                <div
                  key={dia.day}
                  className={`rounded-lg border p-3 transition-colors
                    ${eHoje
                      ? 'border-cyan-400 dark:border-cyan-600 bg-cyan-50 dark:bg-cyan-900/10'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                    }`}
                >
                  {/* Linha do dia */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Data */}
                    <div className="w-20 shrink-0">
                      <p className={`font-bold text-sm ${eHoje ? 'text-cyan-700 dark:text-cyan-300' : 'text-gray-700 dark:text-gray-200'}`}>
                        {eHoje && <span className="text-[10px] font-normal mr-1 bg-cyan-500 text-white px-1 rounded">hoje</span>}
                        {String(dia.day).padStart(2,'0')}/{String(mes).padStart(2,'0')}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 capitalize">
                        {dia.weekday_name}
                      </p>
                    </div>

                    {/* Horários */}
                    <div className="flex flex-wrap gap-2 flex-1">
                      {dia.hours.map((h, hi) => {
                        const alta = isAlta(h.level, meanLevel);
                        return (
                          <div
                            key={hi}
                            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium
                              ${alta
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                : 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300'
                              }`}
                          >
                            <span className="text-sm">{alta ? '▲' : '▼'}</span>
                            <div>
                              <p className="text-[10px] opacity-70 leading-none">{alta ? 'Alta' : 'Baixa'}</p>
                              <p className="font-bold leading-tight">{fmt(h.hour)}</p>
                              <p className="text-[10px] leading-none">{h.level.toFixed(2)}m</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rodapé */}
          <div className="text-xs text-gray-400 dark:text-gray-500 text-right pt-2">
            Fonte: Marinha do Brasil via{' '}
            <a href="https://tabuamare.devtu.qzz.io" target="_blank" rel="noopener noreferrer"
              className="underline hover:text-cyan-500">
              tabuamare.devtu.qzz.io
            </a>
            {' '}· Nível médio: {meanLevel.toFixed(2)}m
          </div>
        </>
      )}
    </div>
  );
}
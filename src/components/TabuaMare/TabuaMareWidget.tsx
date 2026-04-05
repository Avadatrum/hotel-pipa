// src/components/TabuaMare/TabuaMareWidget.tsx
// Card compacto para o Dashboard — mostra ontem, hoje e amanhã em horizontal.
// Botão "Ver mais" navega para /tabua-de-mare (mês completo).

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { buscarTabuaMare } from '../../services/tabuaMareService';

const PORTO_ID   = 'rn04'; // Porto de Natal — mais próximo de Tibau do Sul (~46 km)

interface HoraMare { hour: string; level: number; }

interface DiaCard {
  data: Date;
  label: string;
  horas: HoraMare[];
  meanLevel: number;
  loading: boolean;
  error: boolean;
}

function fmt(h: string) { return h.slice(0, 5); }
function isAlta(level: number, mean: number) { return level >= mean; }

function ptBrDate(d: Date) {
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
}

async function fetchDia(portoId: string, data: Date): Promise<{ horas: HoraMare[]; meanLevel: number }> {
  const res: any = await buscarTabuaMare(portoId, data.getMonth() + 1, String(data.getDate()));
  const porto = res?.data?.[0];
  if (!porto) throw new Error('sem dados');
  const meanLevel: number = porto.mean_level ?? 1.5;
  const mesObj = porto.months?.find((m: any) => m.month === data.getMonth() + 1) ?? porto.months?.[0];
  const diaObj = mesObj?.days?.find((d: any) => d.day === data.getDate()) ?? mesObj?.days?.[0];
  return { horas: diaObj?.hours ?? [], meanLevel };
}

export function TabuaMareWidget() {
  const navigate = useNavigate();
  const hoje = new Date();

  const dias3: { data: Date; label: string }[] = [
    { data: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 1), label: 'Ontem' },
    { data: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()),     label: 'Hoje'  },
    { data: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1), label: 'Amanhã'},
  ];

  const [cards, setCards] = useState<DiaCard[]>(
    dias3.map(d => ({ ...d, horas: [], meanLevel: 1.5, loading: true, error: false }))
  );

  useEffect(() => {
    dias3.forEach((d, i) => {
      fetchDia(PORTO_ID, d.data)
        .then(({ horas, meanLevel }) => {
          setCards(prev => prev.map((c, ci) => ci === i ? { ...c, horas, meanLevel, loading: false } : c));
        })
        .catch(() => {
          setCards(prev => prev.map((c, ci) => ci === i ? { ...c, loading: false, error: true } : c));
        });
    });
  }, []);

  return (
    <div className="space-y-2">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          📍 Ref.: Porto de Natal (~46 km)
        </span>
        <button
          onClick={() => navigate('/tabua-de-mare')}
          className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-medium"
        >
          Ver mais →
        </button>
      </div>

      {/* 3 cards lado a lado */}
      <div className="grid grid-cols-3 gap-2">
        {cards.map((card, ci) => (
          <div
            key={ci}
            className={`rounded-lg border p-2 flex flex-col gap-1 min-h-[90px]
              ${ci === 1
                ? 'border-cyan-400 dark:border-cyan-600 bg-cyan-50 dark:bg-cyan-900/20'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
          >
            {/* Label do dia */}
            <div className="text-center">
              <p className={`text-xs font-bold ${ci === 1 ? 'text-cyan-700 dark:text-cyan-300' : 'text-gray-600 dark:text-gray-300'}`}>
                {card.label}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">{ptBrDate(card.data)}</p>
            </div>

            {/* Loading */}
            {card.loading && (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Erro */}
            {card.error && !card.loading && (
              <p className="text-[10px] text-red-400 text-center flex-1 flex items-center justify-center">
                Sem dados
              </p>
            )}

            {/* Marés */}
            {!card.loading && !card.error && (
              <div className="space-y-0.5">
                {card.horas.map((h, hi) => {
                  const alta = isAlta(h.level, card.meanLevel);
                  return (
                    <div key={hi} className={`flex items-center justify-between rounded px-1 py-0.5 text-[11px]
                      ${alta ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                              : 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300'}`}>
                      <span>{alta ? '▲' : '▼'} {fmt(h.hour)}</span>
                      <span className="font-bold">{h.level.toFixed(1)}m</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
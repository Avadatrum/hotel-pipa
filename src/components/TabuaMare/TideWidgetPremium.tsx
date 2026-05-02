// src/components/TabuaMare/TideWidgetPremium.tsx
import { useState, useEffect } from 'react';
import { buscarTabuaMare } from '../../services/tabuaMareService';

const PORTO_ID = 'rn04';

interface HoraMare {
  hour: string;
  level: number;
}

interface DiaMare {
  data: Date;
  label: string;
  weekday: string;
  horas: HoraMare[];
  meanLevel: number;
  loading: boolean;
  error: boolean;
}

function fmt(h: string) {
  return h.slice(0, 5);
}

function ptBrDate(d: Date) {
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
}

function nowLevel(horas: HoraMare[]): number | null {
  if (!horas.length) return null;
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  let closest: HoraMare | null = null;
  let dist = Infinity;
  horas.forEach((h) => {
    const [hh, mm] = h.hour.split(':').map(Number);
    const d = Math.abs(hh * 60 + mm - mins);
    if (d < dist) { dist = d; closest = h; }
  });
  return closest ? (closest as HoraMare).level : null;
}

export function TideWidgetPremium() {
  const hoje = new Date();

  const [dias, setDias] = useState<DiaMare[]>(
    Array.from({ length: 7 }, (_, i) => {
      const data = new Date(hoje);
      data.setDate(hoje.getDate() + i);
      return {
        data,
        label: i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : `+${i}`,
        weekday: data.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
        horas: [],
        meanLevel: 1.5,
        loading: true,
        error: false,
      };
    })
  );

  const [selectedDay, setSelectedDay] = useState(0);

  useEffect(() => {
    dias.forEach((dia, index) => {
      buscarTabuaMare(PORTO_ID, dia.data.getMonth() + 1, String(dia.data.getDate()))
        .then((res: any) => {
          const porto = res?.data?.[0];
          if (!porto) throw new Error('sem dados');

          const meanLevel = porto.mean_level ?? 1.5;
          const mesObj = porto.months?.find((m: any) => m.month === dia.data.getMonth() + 1);
          const diaObj = mesObj?.days?.find((d: any) => d.day === dia.data.getDate());

          setDias((prev) =>
            prev.map((d, i) =>
              i === index
                ? { ...d, horas: diaObj?.hours ?? [], meanLevel, loading: false }
                : d
            )
          );
        })
        .catch(() => {
          setDias((prev) =>
            prev.map((d, i) =>
              i === index ? { ...d, loading: false, error: true } : d
            )
          );
        });
    });
  }, []);

  const currentDay = dias[selectedDay];

  const levels = currentDay.horas.map((h) => h.level);
  const maxLevel = levels.length ? Math.max(...levels) : 0;
  const minLevel = levels.length ? Math.min(...levels) : 0;
  const range = maxLevel - minLevel || 1;

  const currentLevel = selectedDay === 0 ? nowLevel(currentDay.horas) : null;

  return (
    <div
      className="overflow-hidden rounded-2xl"
      style={{ fontFamily: "'DM Sans', sans-serif", maxWidth: 460, margin: '0 auto', background: '#f5f0e8' }}
    >
      {/* ── Header ── */}
      <div
        className="relative overflow-hidden"
        style={{ background: '#0f4c6e', padding: '22px 24px 18px' }}
      >
        {/* Decorative circles */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{ top: -40, right: -40, width: 180, height: 180, background: 'rgba(255,255,255,0.04)' }}
        />
        <div
          className="absolute rounded-full pointer-events-none"
          style={{ bottom: -60, left: '30%', width: 220, height: 220, background: 'rgba(255,255,255,0.03)' }}
        />

        {/* Top row */}
        <div className="relative flex items-start justify-between mb-4" style={{ zIndex: 1 }}>
          <div>
            <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
              Tábua de Maré
            </p>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: '#fff', lineHeight: 1 }}>
              Praia da Pipa
            </h2>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4, letterSpacing: 1 }}>
              Ref. Natal · RN04
            </p>
          </div>

          <div className="text-right">
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 28, fontWeight: 500, color: '#fff', lineHeight: 1 }}>
              {currentLevel !== null ? `${currentLevel.toFixed(1)}m` : '—'}
            </p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: 1, marginTop: 2 }}>
              agora (m)
            </p>
          </div>
        </div>

        {/* Day selector */}
        <div
          className="relative flex gap-1 overflow-x-auto pb-1"
          style={{ zIndex: 1, scrollbarWidth: 'none' }}
        >
          {dias.map((dia, i) => (
            <button
              key={i}
              onClick={() => setSelectedDay(i)}
              style={{
                flexShrink: 0,
                background: selectedDay === i ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)',
                border: `1px solid ${selectedDay === i ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 10,
                padding: '7px 10px',
                cursor: 'pointer',
                textAlign: 'center',
                minWidth: 48,
                transition: 'all 0.2s',
              }}
            >
              <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>
                {dia.weekday}
              </p>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 16, color: '#fff', fontWeight: 500, lineHeight: 1.2 }}>
                {dia.data.getDate()}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: '20px 24px 24px' }}>
        <p style={{ fontSize: 12, color: '#7a8fa0', marginBottom: 16, textTransform: 'capitalize', letterSpacing: 0.3 }}>
          {ptBrDate(currentDay.data)}
        </p>

        {currentDay.loading ? (
          <div className="flex items-center justify-center" style={{ height: 100 }}>
            <div
              className="rounded-full animate-spin"
              style={{ width: 24, height: 24, border: '2px solid #e8e0d0', borderTopColor: '#1a6896' }}
            />
          </div>
        ) : currentDay.error || !currentDay.horas.length ? (
          <p style={{ textAlign: 'center', color: '#7a8fa0', fontSize: 13, padding: '32px 0' }}>
            Dados indisponíveis para esta data
          </p>
        ) : (
          <>
            {/* Bar chart */}
            <div style={{ height: 80, display: 'flex', alignItems: 'flex-end', gap: 3, marginBottom: 8 }}>
              {currentDay.horas.map((hora, i) => {
                const pct = ((hora.level - minLevel) / range) * 100;
                const isHigh = hora.level >= currentDay.meanLevel;
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '100%',
                        borderRadius: '3px 3px 0 0',
                        height: `${Math.max(pct, 6)}%`,
                        background: isHigh ? '#1a6896' : '#6db8d4',
                        transition: 'height 0.4s cubic-bezier(.4,0,.2,1)',
                      }}
                    />
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#7a8fa0', marginTop: 5, whiteSpace: 'nowrap' }}>
                      {fmt(hora.hour)}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              {[{ label: 'Alta', color: '#1a6896' }, { label: 'Baixa', color: '#6db8d4' }].map(({ label, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#7a8fa0' }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                  <span>{label}</span>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: '#e8e0d0', marginBottom: 16 }} />

            {/* Tide list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {currentDay.horas.map((hora, i) => {
                const isHigh = hora.level >= currentDay.meanLevel;
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: 10,
                      background: isHigh ? '#e8f2f8' : '#f5f0e8',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {/* Arrow icon */}
                      <div
                        style={{
                          width: 20, height: 20, borderRadius: '50%',
                          background: isHigh ? '#1a6896' : '#6db8d4',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <div
                          style={{
                            width: 0, height: 0,
                            borderLeft: '4px solid transparent',
                            borderRight: '4px solid transparent',
                            ...(isHigh
                              ? { borderBottom: '6px solid #fff' }
                              : { borderTop: '6px solid #fff' }),
                          }}
                        />
                      </div>
                      <div>
                        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: '#1a2b3c' }}>
                          {fmt(hora.hour)}
                        </p>
                        <p style={{ fontSize: 11, color: '#7a8fa0' }}>
                          {isHigh ? 'Maré alta' : 'Maré baixa'}
                        </p>
                      </div>
                    </div>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 16, fontWeight: 500, color: '#1a2b3c' }}>
                      {hora.level.toFixed(1)} m
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
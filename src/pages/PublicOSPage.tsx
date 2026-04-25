import { useEffect, useState, useMemo } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import type { ServiceOrder } from '../types/serviceOrder.types';
import { getOSTipoIcon, getOSTipoLabel, formatOSDate } from '../utils/osHelpers';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type FilterStatus = 'todos' | 'aberta' | 'em_andamento';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitial(name: string) {
  return name?.charAt(0).toUpperCase() ?? '?';
}

function useCurrentTime() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function PulsingDot({ color }: { color: string }) {
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      <span
        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${color}`}
      />
      <span className={`relative inline-flex rounded-full h-2 w-2 ${color}`} />
    </span>
  );
}

function Avatar({ name, variant }: { name: string; variant: 'blue' | 'emerald' }) {
  const styles = {
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
  };
  return (
    <span
      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${styles[variant]}`}
    >
      {getInitial(name)}
    </span>
  );
}

// ─── Card de OS ───────────────────────────────────────────────────────────────

function OSCard({ order }: { order: ServiceOrder }) {
  const isAberta = order.status === 'aberta';

  return (
    <article
      className={`
        relative bg-white dark:bg-gray-900 rounded-2xl overflow-hidden
        border transition-all duration-200 active:scale-[0.985]
        ${isAberta
          ? 'border-red-200 dark:border-red-900/60 shadow-[0_2px_12px_rgba(239,68,68,0.1)]'
          : 'border-amber-200 dark:border-amber-900/60 shadow-[0_2px_12px_rgba(245,158,11,0.1)]'
        }
      `}
    >
      {/* Barra lateral colorida */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${
          isAberta ? 'bg-red-500' : 'bg-amber-400'
        }`}
      />

      <div className="pl-5 pr-4 pt-4 pb-4">

        {/* ── Linha 1: número + status + data ─────────────────────────────── */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span
              className={`
                font-mono text-xs font-bold px-2 py-0.5 rounded-md tracking-wide
                ${isAberta
                  ? 'bg-red-50 text-red-600 dark:bg-red-900/40 dark:text-red-400'
                  : 'bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'
                }
              `}
            >
              {order.numero}
            </span>

            <span
              className={`
                flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border
                ${isAberta
                  ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                  : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
                }
              `}
            >
              <PulsingDot color={isAberta ? 'bg-red-500' : 'bg-amber-400'} />
              {isAberta ? 'Aguardando' : 'Em andamento'}
            </span>
          </div>

          <span className="text-[11px] text-gray-400 dark:text-gray-500 tabular-nums">
            {formatOSDate(order.dataCriacao)}
          </span>
        </div>

        {/* ── Linha 2: título ──────────────────────────────────────────────── */}
        <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug mb-1.5">
          {order.titulo}
        </h3>

        {/* ── Linha 3: tipo + local ────────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-3 flex-wrap">
          <span className="flex items-center gap-1">
            <span>{getOSTipoIcon(order.tipo)}</span>
            <span>{getOSTipoLabel(order.tipo)}</span>
          </span>
          <span className="text-gray-300 dark:text-gray-600">•</span>
          <span className="flex items-center gap-1">
            <span>📍</span>
            <span className="font-medium text-gray-600 dark:text-gray-300">{order.local}</span>
          </span>
        </div>

        {/* ── Descrição ────────────────────────────────────────────────────── */}
        <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/60 rounded-xl px-3 py-2.5 leading-relaxed mb-3">
          {order.descricao}
        </p>

        {/* ── Rodapé: pessoas + prazo ──────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Solicitante */}
            <div className="flex items-center gap-1.5">
              <Avatar name={order.solicitanteNome} variant="blue" />
              <span className="text-xs text-gray-500 dark:text-gray-400 max-w-[100px] truncate">
                {order.solicitanteNome}
              </span>
            </div>

            {/* Executor */}
            {order.executorNome && (
              <>
                <span className="text-gray-300 dark:text-gray-600 text-xs">→</span>
                <div className="flex items-center gap-1.5">
                  <Avatar name={order.executorNome} variant="emerald" />
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 max-w-[100px] truncate">
                    {order.executorNome}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Prazo */}
          {order.prazo && (
            <span className="text-[11px] px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium shrink-0">
              ⏰ {formatOSDate(order.prazo)}
            </span>
          )}
        </div>

        {/* ── Observações ──────────────────────────────────────────────────── */}
        {order.observacoes && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
              <span className="mr-1">📝</span>
              {order.observacoes}
            </p>
          </div>
        )}
      </div>
    </article>
  );
}

// ─── Tela de loading ──────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center gap-5 px-6">
      {/* Shimmer cards */}
      <div className="w-full max-w-lg space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
            style={{ opacity: 1 - i * 0.2 }}
          >
            <div className="flex">
              <div className="w-1 bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="flex-1 p-4 space-y-3">
                <div className="flex gap-2">
                  <div className="h-5 w-16 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse" />
                  <div className="h-5 w-24 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse" />
                </div>
                <div className="h-4 w-3/4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                <div className="h-12 bg-gray-50 dark:bg-gray-800/60 rounded-xl animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">
        Carregando ordens de serviço…
      </p>
    </div>
  );
}

// ─── Estado vazio ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div
        className="w-20 h-20 rounded-3xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-5 text-4xl"
        style={{ boxShadow: '0 0 32px rgba(16,185,129,0.15)' }}
      >
        🎉
      </div>
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
        Tudo em dia!
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
        Nenhuma ordem de serviço pendente. Aproveite o dia tranquilo! 😊
      </p>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export function PublicOSPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('todos');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const now = useCurrentTime();

  useEffect(() => {
    const q = query(
      collection(db, 'serviceOrders'),
      where('status', 'in', ['aberta', 'em_andamento']),
      orderBy('ts', 'desc'),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const osList: ServiceOrder[] = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as ServiceOrder),
      );
      setOrders(osList);
      setLoading(false);
      setLastUpdate(new Date());
    });

    return () => unsubscribe();
  }, []);

  const counts = useMemo(() => ({
    abertas: orders.filter((o) => o.status === 'aberta').length,
    emAndamento: orders.filter((o) => o.status === 'em_andamento').length,
    total: orders.length,
  }), [orders]);

  const filtered = useMemo(() =>
    filter === 'todos' ? orders : orders.filter((o) => o.status === filter),
    [orders, filter],
  );

  if (loading) return <LoadingScreen />;

  const FILTERS: { key: FilterStatus; label: string; count: number }[] = [
    { key: 'todos', label: 'Todas', count: counts.total },
    { key: 'aberta', label: 'Aguardando', count: counts.abertas },
    { key: 'em_andamento', label: 'Em andamento', count: counts.emAndamento },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-10">

      {/* ── Header sticky ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-lg mx-auto px-4 pt-4 pb-3">

          {/* Saudação + relógio */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">
                {formatGreeting()} 👋
              </p>
              <h1 className="text-lg font-extrabold text-gray-900 dark:text-white leading-tight">
                Ordens de Serviço
              </h1>
            </div>

            <div className="text-right">
              <p className="text-2xl font-black tabular-nums text-gray-900 dark:text-white leading-none">
                {formatTime(now)}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                sync {formatTime(lastUpdate)}
              </p>
            </div>
          </div>

          {/* Contadores em destaque */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-xl px-3 py-2.5 flex items-center gap-2.5">
              <PulsingDot color="bg-red-500" />
              <div>
                <p className="text-xl font-black text-red-600 dark:text-red-400 leading-none">
                  {counts.abertas}
                </p>
                <p className="text-[11px] text-red-500/70 dark:text-red-400/70 font-medium">
                  Aguardando
                </p>
              </div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/40 rounded-xl px-3 py-2.5 flex items-center gap-2.5">
              <PulsingDot color="bg-amber-400" />
              <div>
                <p className="text-xl font-black text-amber-600 dark:text-amber-400 leading-none">
                  {counts.emAndamento}
                </p>
                <p className="text-[11px] text-amber-500/70 dark:text-amber-400/70 font-medium">
                  Em andamento
                </p>
              </div>
            </div>
          </div>

          {/* Filtros pill */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
            {FILTERS.map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
                  whitespace-nowrap border transition-all duration-150 active:scale-95 shrink-0
                  ${filter === key
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent shadow-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                  }
                `}
              >
                {label}
                <span
                  className={`
                    text-[10px] font-bold px-1.5 py-0.5 rounded-full
                    ${filter === key
                      ? 'bg-white/20 dark:bg-black/20 text-inherit'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                    }
                  `}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Lista ─────────────────────────────────────────────────────────── */}
      <main className="max-w-lg mx-auto px-4 pt-4">
        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {filtered.map((order) => (
              <OSCard key={order.id} order={order} />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 flex items-center justify-center gap-2">
          <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
          <p className="text-[11px] text-gray-300 dark:text-gray-700 font-medium px-2 whitespace-nowrap">
            HPanel • tempo real
          </p>
          <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
        </div>
      </main>
    </div>
  );
}
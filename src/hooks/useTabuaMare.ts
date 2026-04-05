// src/hooks/useTabuaMare.ts

import { useState, useEffect, useCallback } from 'react';
import { buscarTabuaMare, listarPortosPorEstado } from '../services/tabuaMareService';
import type { TabuaMareState } from '../types/tabuaMare.types';

interface UseTabuaMareOptions {
  estado?: string;
  portoIdFixo?: string;
  mes?: number;
  dias?: string;
}

interface UseTabuaMareReturn extends TabuaMareState {
  portoId: string | null;
  portoNome: string | null;
  refetch: () => void;
}

export function useTabuaMare(options: UseTabuaMareOptions = {}): UseTabuaMareReturn {
  const hoje = new Date();
  const {
    estado = 'rn',
    portoIdFixo,
    mes = hoje.getMonth() + 1,
    dias = String(hoje.getDate()),
  } = options;

  const [state, setState] = useState<TabuaMareState>({
    data: null,
    loading: false,
    error: null,
  });
  const [portoId, setPortoId] = useState<string | null>(portoIdFixo ?? null);
  const [portoNome, setPortoNome] = useState<string | null>(null);
  const [fetchTick, setFetchTick] = useState(0);

  // Passo 1: buscar lista de portos e pegar o primeiro
  // Resposta real da API: { data: [{ id, harbor_name, year, ... }], total }
  useEffect(() => {
    if (portoIdFixo) {
      setPortoId(portoIdFixo);
      return;
    }

    listarPortosPorEstado(estado)
      .then((resposta: any) => {
        // A API retorna { data: [...], total: N }
        const lista: any[] = resposta?.data ?? [];

        if (lista.length === 0) {
          setState(prev => ({
            ...prev,
            error: `Nenhum porto encontrado para ${estado.toUpperCase()}.`,
          }));
          return;
        }

        const primeiro = lista[0];
        setPortoId(primeiro.id);
        setPortoNome(primeiro.harbor_name ?? primeiro.id);
      })
      .catch((err: any) => {
        setState(prev => ({
          ...prev,
          error: err?.message ?? 'Erro ao buscar portos.',
        }));
      });
  }, [estado, portoIdFixo]);

  // Passo 2: buscar tábua quando tiver portoId
  const fetchData = useCallback(async () => {
    if (!portoId) return;

    setState({ data: null, loading: true, error: null });

    try {
      const resultado: any = await buscarTabuaMare(portoId, mes, dias);
      setState({ data: resultado, loading: false, error: null });
    } catch (err: any) {
      setState({
        data: null,
        loading: false,
        error: err?.message ?? 'Erro ao buscar tábua de marés.',
      });
    }
  }, [portoId, mes, dias, fetchTick]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => setFetchTick(t => t + 1), []);

  return { ...state, portoId, portoNome, refetch };
}
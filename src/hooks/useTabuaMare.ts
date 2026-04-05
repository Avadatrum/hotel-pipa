// src/hooks/useTabuaMare.ts

import { useState, useEffect, useCallback } from 'react';
import { buscarTabuaPorGeolocalizacao, buscarPortoMaisProximo } from '../services/tabuaMareService';
import type { TabuaMareState } from '../types/tabuaMare.types';

interface UseTabuaMareOptions {
  /** Sigla do estado (ex: 'rn'). Se não informado, busca sem filtrar estado. */
  estado?: string;
  /** Mês desejado (1-12). Padrão: mês atual. */
  mes?: number;
  /** Dias desejados no formato '1-31'. Padrão: todos os dias do mês. */
  dias?: string;
}

interface UseTabuaMareReturn extends TabuaMareState {
  portoId: string | null;
  refetch: () => void;
}

/**
 * Hook que detecta a geolocalização do usuário automaticamente
 * e busca a tábua de marés do porto mais próximo.
 *
 * @example
 * const { data, loading, error } = useTabuaMare({ estado: 'rn' });
 */
export function useTabuaMare(options: UseTabuaMareOptions = {}): UseTabuaMareReturn {
  const {
    estado = 'rn',
    mes = new Date().getMonth() + 1,
    dias = `1-${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()}`,
  } = options;

  const [state, setState] = useState<TabuaMareState>({
    data: null,
    loading: false,
    error: null,
  });
  const [portoId, setPortoId] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [fetchTick, setFetchTick] = useState(0);

  // Detecta geolocalização uma vez ao montar
  useEffect(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocalização não suportada pelo navegador.',
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        setState(prev => ({
          ...prev,
          error: 'Não foi possível obter a localização. Verifique as permissões do navegador.',
        }));
      }
    );
  }, []);

  const fetchData = useCallback(async () => {
    if (!coords) return;

    setState({ data: null, loading: true, error: null });

    try {
      let resultado: any;

      if (estado) {
        resultado = await buscarTabuaPorGeolocalizacao(
          coords.lat,
          coords.lng,
          estado,
          mes,
          dias
        );
      } else {
        // Se não passou estado, busca o porto independente e depois a tábua
        const porto: any = await buscarPortoMaisProximo(coords.lat, coords.lng);
        const portoIdEncontrado: string = porto?.id ?? porto?.data?.id;
        if (!portoIdEncontrado) throw new Error('Porto mais próximo não encontrado.');
        setPortoId(portoIdEncontrado);
        resultado = porto;
      }

      // Extrai o portoId da resposta se disponível
      const idDoPorto =
        resultado?.porto?.id ??
        resultado?.data?.porto?.id ??
        resultado?.id ??
        null;
      if (idDoPorto) setPortoId(idDoPorto);

      setState({ data: resultado?.data ?? resultado, loading: false, error: null });
    } catch (err: any) {
      setState({
        data: null,
        loading: false,
        error: err?.message ?? 'Erro ao buscar dados de maré.',
      });
    }
  }, [coords, estado, mes, dias, fetchTick]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    setFetchTick(t => t + 1);
  }, []);

  return { ...state, portoId, refetch };
}
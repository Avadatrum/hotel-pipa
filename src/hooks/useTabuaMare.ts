// src/hooks/useTabuaMare.ts

import { useState, useEffect, useCallback } from 'react';
import { buscarTabuaMare, listarPortosPorEstado } from '../services/tabuaMareService';
import type { TabuaMareState, TabuaMareResponse, Porto, MareDia, MareEvento } from '../types/tabuaMare.types';

// Interface para o retorno da API
interface TideApiResponse {
  data?: Array<{
    id: string;
    harbor_name: string;
    mean_level?: number;
    months?: Array<{
      month: number;
      days?: Array<{
        day: number;
        weekday_name: string;
        hours: Array<{ hour: string; level: number; }>;
      }>;
    }>;
  }>;
  total?: number;
}

interface TideDayData {
  day: number;
  weekday_name: string;
  hours: Array<{ hour: string; level: number; }>;
  meanLevel?: number;
}

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
  fetchTideData: (portoId: string, year: number, month: number, day: number) => Promise<TideDayData | null>;
  fetchMultipleDays: (portoId: string, startDate: Date, days: number) => Promise<TideDayData[]>;
}

// Função para determinar o tipo da maré baseado na altura e nível médio
function getTideType(level: number, meanLevel: number): 'Alta' | 'Baixa' {
  return level >= meanLevel ? 'Alta' : 'Baixa';
}

// Converte horas da API para o formato MareEvento[]
function convertToMareEventos(hours: Array<{ hour: string; level: number; }>, meanLevel: number): MareEvento[] {
  return hours.map(h => ({
    hora: h.hour.slice(0, 5), // Formata "03:12:00" para "03:12"
    altura: h.level,
    tipo: getTideType(h.level, meanLevel)
  }));
}

// Função auxiliar para converter TideApiResponse para TabuaMareResponse
function convertToTabuaMareResponse(
  apiResponse: TideApiResponse,
  portoId: string,
  portoNome: string,
  mes: number,
  estado: string = 'rn'
): TabuaMareResponse | null {
  const portoData = apiResponse?.data?.[0];
  if (!portoData) return null;

  const portoObj: Porto = {
    id: portoId,
    nome: portoNome,
    estado: estado,
    lat: undefined,
    lng: undefined
  };

  const meanLevel = portoData.mean_level ?? 1.5;
  const monthData = portoData.months?.find((m: any) => m.month === mes);
  const days = monthData?.days || [];
  
  const mareDias: MareDia[] = days.map((day: any) => ({
    dia: day.day,
    mares: convertToMareEventos(day.hours || [], meanLevel)
  }));
  
  return {
    porto: portoObj,
    mes: mes,
    dados: mareDias
  };
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

  // Passo 1: descobrir o portoId listando os portos do estado
  useEffect(() => {
    if (portoIdFixo) {
      setPortoId(portoIdFixo);
      return;
    }

    listarPortosPorEstado(estado)
      .then((resposta: any) => {
        const lista: any[] = resposta?.data ?? [];
        if (lista.length === 0) {
          setState(prev => ({ ...prev, error: `Nenhum porto encontrado para ${estado.toUpperCase()}.` }));
          return;
        }
        const primeiro = lista[0];
        setPortoId(primeiro.id);
        setPortoNome(primeiro.harbor_name ?? primeiro.id);
      })
      .catch((err: any) => {
        setState(prev => ({ ...prev, error: err?.message ?? 'Erro ao buscar portos.' }));
      });
  }, [estado, portoIdFixo]);

  // Função para buscar dados de uma data específica
  // O parâmetro 'year' não é usado na API atual, mas mantido na assinatura
  const fetchTideData = useCallback(async (
    portoIdParam: string,
    _year: number, // Prefixado com _ para indicar que não é usado intencionalmente
    month: number,
    day: number
  ): Promise<TideDayData | null> => {
    try {
      const response = await buscarTabuaMare(portoIdParam, month, String(day));
      const result = response as TideApiResponse;
      const porto = result?.data?.[0];
      
      if (porto) {
        const mesObj = porto.months?.find((m: any) => m.month === month);
        const diaObj = mesObj?.days?.find((d: any) => d.day === day);
        
        if (diaObj?.hours && diaObj.hours.length > 0) {
          return {
            day: day,
            weekday_name: diaObj.weekday_name,
            hours: diaObj.hours,
            meanLevel: porto.mean_level
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar dados da maré:', error);
      throw error;
    }
  }, []);

  // Função para buscar múltiplos dias consecutivos
  const fetchMultipleDays = useCallback(async (
    portoIdParam: string,
    startDate: Date,
    days: number
  ): Promise<TideDayData[]> => {
    const promises: Promise<void>[] = [];
    const results: TideDayData[] = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      
      const promise = fetchTideData(portoIdParam, year, month, day)
        .then((data: TideDayData | null) => {
          if (data) results.push(data);
        })
        .catch((err: Error) => {
          console.error(`Erro ao buscar dia ${day}/${month}:`, err);
        });
      
      promises.push(promise);
    }
    
    await Promise.all(promises);
    return results;
  }, [fetchTideData]);

  // Passo 2: buscar tábua de maré quando tiver portoId
  const fetchData = useCallback(async () => {
    if (!portoId) return;
    setState({ data: null, loading: true, error: null });
    try {
      const response = await buscarTabuaMare(portoId, mes, dias);
      const apiResponse = response as TideApiResponse;
      const nomeNaResposta = apiResponse?.data?.[0]?.harbor_name;
      if (nomeNaResposta) setPortoNome(nomeNaResposta);
      
      // Converte para o formato esperado pelo TabuaMareState
      const convertedData = convertToTabuaMareResponse(
        apiResponse, 
        portoId, 
        nomeNaResposta || portoId, 
        mes,
        estado
      );
      setState({ data: convertedData, loading: false, error: null });
    } catch (err: any) {
      setState({ data: null, loading: false, error: err?.message ?? 'Erro ao buscar tábua de marés.' });
    }
  }, [portoId, mes, dias, estado, fetchTick]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => setFetchTick(t => t + 1), []);

  return { 
    ...state, 
    portoId, 
    portoNome, 
    refetch,
    fetchTideData,
    fetchMultipleDays
  };
}
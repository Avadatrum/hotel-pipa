// src/hooks/useApartmentActions.ts
import { useState } from 'react';
import { doCheckin, doCheckout, adjustItem } from '../services/apartmentService';

export function useApartmentActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função de check-in
  const handleCheckin = async (aptNumber: number, guestName: string, pax: number) => {
    setLoading(true);
    setError(null);
    try {
      if (!guestName.trim()) {
        throw new Error('Nome do hóspede é obrigatório');
      }
      if (pax < 1) {
        throw new Error('Selecione a quantidade de hóspedes');
      }
      await doCheckin(aptNumber, guestName, pax);
      return { success: true };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer check-in');
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  // Função de check-out
  const handleCheckout = async (aptNumber: number, lostTowels: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await doCheckout(aptNumber, lostTowels);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer check-out');
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  // Função para ajustar fichas/toalhas
  const handleAdjust = async (aptNumber: number, item: 'chips' | 'towels', delta: number, currentValue: number) => {
    setLoading(true);
    try {
      const newValue = await adjustItem(aptNumber, item, delta, currentValue);
      return newValue;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao ajustar');
      return currentValue;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    handleCheckin,
    handleCheckout,
    handleAdjust
  };
}
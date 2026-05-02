// src/hooks/useGuestGuide.ts

import { useState, useEffect } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { validateGuestToken, getGuideConfig } from '../services/guestGuideService';
import type { GuestToken, GuestGuideConfig } from '../types/guestGuide.types';
import type { Apartment } from '../types';

interface GuestGuideData {
  token: GuestToken | null;
  apartment: Apartment | null;
  config: GuestGuideConfig | null;
  loading: boolean;
  error: string | null;
}

export function useGuestGuide(aptNumber: number, token: string) {
  const [data, setData] = useState<GuestGuideData>({
    token: null,
    apartment: null,
    config: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    let unsubscribeApt: (() => void) | undefined;

    async function loadGuestGuide() {
      try {
        // 1. Validar o token
        const tokenData = await validateGuestToken(aptNumber, token);
        
        if (!tokenData) {
          setData(prev => ({
            ...prev,
            loading: false,
            error: 'Link inválido ou expirado. Peça um novo link na recepção.'
          }));
          return;
        }

        // 2. Buscar configuração do guia
        const config = await getGuideConfig();

        // 3. Buscar apartamento (getDoc em vez de onSnapshot para evitar problemas de permissão)
        const aptRef = doc(db, 'apartments', String(aptNumber));
        
        try {
          const aptSnap = await getDoc(aptRef);
          
          if (!aptSnap.exists()) {
            setData(prev => ({
              ...prev,
              loading: false,
              error: 'Apartamento não encontrado.'
            }));
            return;
          }

          const aptData = aptSnap.data() as Apartment;
          
          if (!aptData.occupied) {
            setData(prev => ({
              ...prev,
              loading: false,
              error: 'Este guia não está mais disponível. Obrigado pela estadia!'
            }));
            return;
          }

          // Verifica se o nome do hóspede confere
          if (aptData.guest !== tokenData.guestName) {
            setData(prev => ({
              ...prev,
              loading: false,
              error: 'Hóspede não corresponde. Solicite um novo link na recepção.'
            }));
            return;
          }

          setData({
            token: tokenData,
            apartment: aptData,
            config,
            loading: false,
            error: null
          });

          // 4. Tenta iniciar listener em tempo real (opcional, se falhar já tem dados)
          try {
            unsubscribeApt = onSnapshot(aptRef, (docSnap) => {
              if (docSnap.exists()) {
                const updatedData = docSnap.data() as Apartment;
                if (updatedData.occupied) {
                  setData(prev => ({
                    ...prev,
                    apartment: updatedData
                  }));
                } else {
                  setData(prev => ({
                    ...prev,
                    error: 'Check-out realizado. Obrigado pela estadia! 👋'
                  }));
                }
              }
            }, (err) => {
              // Se falhar o tempo real, não faz nada (já temos os dados iniciais)
              console.warn('Tempo real indisponível:', err);
            });
          } catch (listenerError) {
            console.warn('Não foi possível iniciar listener:', listenerError);
          }

        } catch (aptError) {
          console.error('Erro ao buscar apartamento:', aptError);
          setData(prev => ({
            ...prev,
            loading: false,
            error: 'Erro ao carregar informações do apartamento.'
          }));
        }

      } catch (error) {
        console.error('Erro ao carregar guia:', error);
        setData(prev => ({
          ...prev,
          loading: false,
          error: 'Erro ao carregar o guia. Tente novamente.'
        }));
      }
    }

    loadGuestGuide();

    return () => {
      if (unsubscribeApt) {
        unsubscribeApt();
      }
    };
  }, [aptNumber, token]);

  return data;
}
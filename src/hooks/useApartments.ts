// src/hooks/useApartments.ts
import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import type { Apartment } from '../types';

// Lista de todos os apartamentos do hotel
const ALL_APARTMENTS = [
  1, 2, 3, 4, 5, 6, 7,   // Frente Mar
  8,                      // Suite Premium Frente Mar
  10, 11, 12,            // Luxo Frente Mar
  21, 22, 23, 24, 25, 26, 27, 28, 29,  // Suite Premium Vista Parcial
  31, 32, 33, 34, 35,    // Vista Parcial do Mar
  41, 42, 43, 44, 45, 46, 47  // Vista Jardim
];

// Mapa de blocos
const blockMap: Record<number, string> = {
  1: 'Frente Mar', 2: 'Frente Mar', 3: 'Frente Mar', 4: 'Frente Mar',
  5: 'Frente Mar', 6: 'Frente Mar', 7: 'Frente Mar',
  8: 'Suite Premium Frente Mar',
  10: 'Luxo Frente Mar', 11: 'Luxo Frente Mar', 12: 'Luxo Frente Mar',
  21: 'Suite Premium Vista Parcial', 22: 'Suite Premium Vista Parcial',
  23: 'Suite Premium Vista Parcial', 24: 'Suite Premium Vista Parcial',
  25: 'Suite Premium Vista Parcial', 26: 'Suite Premium Vista Parcial',
  27: 'Suite Premium Vista Parcial', 28: 'Suite Premium Vista Parcial',
  29: 'Suite Premium Vista Parcial',
  31: 'Vista Parcial do Mar', 32: 'Vista Parcial do Mar',
  33: 'Vista Parcial do Mar', 34: 'Vista Parcial do Mar',
  35: 'Vista Parcial do Mar',
  41: 'Vista Jardim', 42: 'Vista Jardim', 43: 'Vista Jardim',
  44: 'Vista Jardim', 45: 'Vista Jardim', 46: 'Vista Jardim',
  47: 'Vista Jardim'
};

// Estado inicial de um apartamento vazio
const defaultApartment: Apartment = {
  occupied: false,
  pax: 0,
  towels: 0,
  chips: 0,
  block: '',
  guest: ''
};

// Hook personalizado para gerenciar os apartamentos
export function useApartments() {
  // Estado que guarda todos os apartamentos
  const [apartments, setApartments] = useState<Record<number, Apartment>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vamos escutar mudanças em cada apartamento
    const unsubscribes: (() => void)[] = [];

    ALL_APARTMENTS.forEach(aptNumber => {
      // Referência ao documento no Firebase
      const aptRef = doc(db, 'apartments', String(aptNumber));
      
      // Escuta mudanças em tempo real
      const unsubscribe = onSnapshot(aptRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          // Se o documento existe, usa os dados
          const data = docSnapshot.data() as Apartment;
          setApartments(prev => ({
            ...prev,
            [aptNumber]: {
              ...data,
              block: blockMap[aptNumber] // adiciona o bloco
            }
          }));
        } else {
          // Se não existe, cria com dados padrão
          setApartments(prev => ({
            ...prev,
            [aptNumber]: {
              ...defaultApartment,
              block: blockMap[aptNumber]
            }
          }));
        }
        setLoading(false);
      });
      
      unsubscribes.push(unsubscribe);
    });

    // Quando o componente desmontar, para de escutar
    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, []); // Array vazio = executa só uma vez

  return { apartments, loading };
}
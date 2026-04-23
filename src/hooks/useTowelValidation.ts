// src/hooks/useTowelValidation.ts
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import type { TowelSignature } from '../types';

interface UseTowelValidationResult {
  data: TowelSignature | null;
  loading: boolean;
  error: string;
}

// ATUALIZADO: Agora recebe aptNumber e token
export function useTowelValidation(aptNumber: number, token: string): UseTowelValidationResult {
  const [data, setData] = useState<TowelSignature | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const validate = async () => {
      if (!token || aptNumber <= 0) {
        setError('Token ou apartamento inválido');
        setLoading(false);
        return;
      }

      try {
        console.log(`🔍 useTowelValidation: Buscando apt ${aptNumber}, token ${token}`);
        
        // Busca DIRETA no apartamento específico (muito mais rápido que o loop)
        const docRef = doc(db, 'apartments', String(aptNumber), 'towelSignatures', token);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          console.log('❌ Documento não encontrado');
          setError('QR Code inválido ou expirado.');
          setLoading(false);
          return;
        }

        const signatureData = docSnap.data() as TowelSignature;
        
        // Validação de expiração
        const now = new Date();
        const expiresAt = new Date(signatureData.expiresAt);

        if (expiresAt < now) {
          console.log('❌ Token expirado');
          setError('Este QR Code expirou. Peça um novo ao recepcionista.');
          setLoading(false);
          return;
        }

        // Validação de uso
        if (signatureData.used) {
          console.log('❌ Token já usado');
          setError('Este QR Code já foi utilizado.');
          setLoading(false);
          return;
        }

        console.log('✅ Token válido:', signatureData);
        setData(signatureData);
        setLoading(false);

      } catch (err) {
        console.error('🔥 Erro ao validar:', err);
        setError('Erro de conexão. Tente novamente.');
        setLoading(false);
      }
    };

    validate();
  }, [aptNumber, token]);

  return { data, loading, error };
}
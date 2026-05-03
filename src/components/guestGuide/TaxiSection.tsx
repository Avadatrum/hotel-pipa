// src/components/guestGuide/TaxiSection.tsx

import { useState } from 'react';
import { requestTaxi } from '../../services/taxiService';
import { TaxiIcon } from './icons';
import type { GuideLanguage } from '../../types/guestGuide.types';

interface TaxiSectionProps {
  aptNumber: number;
  guestName: string;
  phone?: string;
  language: GuideLanguage;
}

const LABELS: Record<GuideLanguage, { section: string; button: string; subtitle: string; requested: string; message: string; loading: string }> = {
  pt: {
    section: 'Transporte',
    button: 'Chamar Táxi',
    subtitle: 'Toque para solicitar',
    requested: 'Táxi Solicitado!',
    message: 'A recepção foi notificada e já está providenciando seu táxi.',
    loading: 'Solicitando...'
  },
  es: {
    section: 'Transporte',
    button: 'Pedir Taxi',
    subtitle: 'Toque para solicitar',
    requested: '¡Taxi Solicitado!',
    message: 'La recepción ha sido notificada y ya está organizando su taxi.',
    loading: 'Solicitando...'
  },
  en: {
    section: 'Transport',
    button: 'Call a Taxi',
    subtitle: 'Tap to request',
    requested: 'Taxi Requested!',
    message: 'Reception has been notified and is arranging your taxi.',
    loading: 'Requesting...'
  }
};

export function TaxiSection({ aptNumber, guestName, phone, language }: TaxiSectionProps) {
  const [requested, setRequested] = useState(false);
  const [loading, setLoading] = useState(false);
  const labels = LABELS[language];

  const handleRequest = async () => {
    setLoading(true);
    try {
      const success = await requestTaxi(aptNumber, guestName, phone);
      if (success) {
        setRequested(true);
      } else {
        alert(language === 'pt' ? 'Você já possui uma solicitação em andamento.' : 'You already have a pending request.');
      }
    } catch (error) {
      console.error(`Erro ao solicitar táxi: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  if (requested) {
    return (
      <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-200 text-center mb-4">
        <div className="text-5xl mb-3">🚕</div>
        <h3 className="text-lg font-bold text-emerald-800 mb-2">{labels.requested}</h3>
        <p className="text-sm text-emerald-600">{labels.message}</p>
      </div>
    );
  }

  return (
    <button
      onClick={handleRequest}
      disabled={loading}
      className="w-full bg-yellow-400 hover:bg-yellow-500 rounded-3xl p-5 shadow-lg hover:shadow-xl transition-all active:scale-[0.99] group border-2 border-yellow-300 disabled:opacity-70 mb-4"
    >
      <div className="flex items-center gap-4">
        <div className="bg-black/10 p-3 rounded-2xl">
          <TaxiIcon className="w-8 h-8" />
        </div>
        <div className="text-left flex-1">
          <span className="font-extrabold text-stone-800 text-lg block">{labels.button}</span>
          <span className="text-xs font-bold text-stone-600 uppercase">{labels.subtitle}</span>
        </div>
      </div>
      {loading && (
        <div className="flex items-center justify-center gap-2 mt-3">
          <div className="w-4 h-4 border-2 border-stone-700 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-stone-700">{labels.loading}</span>
        </div>
      )}
    </button>
  );
}
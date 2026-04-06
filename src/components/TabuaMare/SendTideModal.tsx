// src/components/TabuaMare/SendTideModal.tsx

import { useState } from 'react';
import { useApartments } from '../../hooks/useApartments';
import type { Language } from '../../utils/tideMessageFormatter';

interface HoraMare { hour: string; level: number; }
interface DiaData { day: number; weekday_name: string; hours: HoraMare[]; }

interface SendTideModalProps {
  isOpen: boolean;
  onClose: () => void;
  tideData: DiaData | null;
  mes: number;
  ano: number;
  portoNome: string;
  portoId: string;
  meanLevel: number;
}

interface ApartmentWithPhone {
  number: number;
  guest: string;
  phone: string;
  block: string;
}

function cleanPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (!cleaned.startsWith('55') && cleaned.length <= 11) {
    cleaned = '55' + cleaned;
  }
  return cleaned;
}

export function SendTideModal({
  isOpen,
  onClose,
  tideData,
  mes,
  ano,
  portoNome,
  portoId,
  meanLevel
}: SendTideModalProps) {
  const { apartments, loading: loadingApartments } = useApartments();
  const [selectedApt, setSelectedApt] = useState<ApartmentWithPhone | null>(null);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [language, setLanguage] = useState<Language>('pt');

  const apartmentsWithPhone: ApartmentWithPhone[] = Object.entries(apartments)
    .filter(([_, apt]) => apt.occupied && apt.guest && apt.phone && apt.phone.trim() !== '')
    .map(([number, apt]) => ({
      number: parseInt(number),
      guest: apt.guest,
      phone: apt.phone!,
      block: apt.block
    }));

  const filteredApartments = apartmentsWithPhone.filter(apt => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return apt.number.toString().includes(term) || 
           apt.guest.toLowerCase().includes(term);
  });

  const handleSend = async () => {
    if (!selectedApt || !tideData) return;
    
    setSending(true);
    
    try {
      const { formatTideMessage } = await import('../../utils/tideMessageFormatter');
      
      const message = formatTideMessage({
        guestName: selectedApt.guest,
        aptNumber: selectedApt.number,
        diaData: tideData,
        mes,
        ano,
        portoNome,
        portoId,
        meanLevel,
        language
      });
      
      const cleanPhone = cleanPhoneNumber(selectedApt.phone);
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
      
      window.open(whatsappUrl, '_blank');
      
      setTimeout(() => {
        onClose();
        setSelectedApt(null);
        setLanguage('pt');
        setSending(false);
      }, 500);
      
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setSending(false);
      alert('Erro ao enviar mensagem. Tente novamente.');
    }
  };

  const formatPhoneDisplay = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const languageLabels = {
    pt: 'Português',
    es: 'Español',
    en: 'English'
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col animate-slide-up">
        
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">
            Enviar Tábua de Maré
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Info da maré */}
          {tideData && (
            <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-lg p-3 border border-cyan-200 dark:border-cyan-800">
              <p className="text-sm font-medium text-cyan-800 dark:text-cyan-200">
                Data: {tideData.day}/{mes}/{ano}
              </p>
              <p className="text-xs text-cyan-600 dark:text-cyan-300 mt-1">
                {portoNome} ({portoId.toUpperCase()})
              </p>
            </div>
          )}
          
          {/* Seletor de idioma */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Idioma / Language
            </label>
            <div className="flex gap-2">
              {(['pt', 'es', 'en'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`flex-1 py-2 rounded-lg border transition-colors ${
                    language === lang
                      ? 'bg-cyan-600 text-white border-cyan-600'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  {languageLabels[lang]}
                </button>
              ))}
            </div>
          </div>
          
          {/* Busca */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Buscar apartamento
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nº do apto ou nome do hóspede"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          {/* Lista de apartamentos */}
          {loadingApartments ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredApartments.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {apartmentsWithPhone.length === 0 ? (
                <>
                  <p className="mb-2">Nenhum apartamento ocupado com telefone cadastrado</p>
                  <p className="text-xs">Faça check-in com telefone para enviar a tábua de maré</p>
                </>
              ) : (
                <p>Nenhum apartamento encontrado para "{searchTerm}"</p>
              )}
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredApartments.map((apt) => (
                <button
                  key={apt.number}
                  onClick={() => setSelectedApt(apt)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedApt?.number === apt.number
                      ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/30 ring-2 ring-cyan-500/50'
                      : 'border-gray-200 dark:border-gray-700 hover:border-cyan-300 dark:hover:border-cyan-700 bg-white dark:bg-gray-800'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-gray-800 dark:text-white">
                        Apartamento {apt.number}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {apt.guest}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {apt.block}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-green-600 dark:text-green-400 font-mono">
                        {formatPhoneDisplay(apt.phone)}
                      </p>
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500 mt-1" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSend}
            disabled={!selectedApt || sending || !tideData}
            className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                Enviar WhatsApp ({languageLabels[language]})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
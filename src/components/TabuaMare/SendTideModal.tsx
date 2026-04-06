// src/components/TabuaMare/SendTideModal.tsx

import { useState, useEffect } from 'react';
import { useApartments } from '../../hooks/useApartments';
import { buscarTabuaMare } from '../../services/tabuaMareService';
import type { Language, TideMessageOptions, TideMessageMultipleOptions } from '../../utils/tideMessageFormatter';
import { formatTideMessage, formatMultipleDaysMessage } from '../../utils/tideMessageFormatter';

interface HoraMare { hour: string; level: number; }
interface DiaData { day: number; weekday_name: string; hours: HoraMare[]; }

// Interface para a resposta da API
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

type SendType = 'single' | 'multiple';
type DateType = 'today' | 'specific';

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
  
  // Novos estados
  const [sendType, setSendType] = useState<SendType>('single');
  const [dateType, setDateType] = useState<DateType>('today');
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [customTideData, setCustomTideData] = useState<DiaData | null>(null);
  const [multipleDaysData, setMultipleDaysData] = useState<DiaData[]>([]);
  const [loadingCustomData, setLoadingCustomData] = useState(false);
  const [meanLevelCache, setMeanLevelCache] = useState<number>(meanLevel);

  // Reset states quando modal abre/fecha
  useEffect(() => {
    if (!isOpen) {
      setSendType('single');
      setDateType('today');
      setCustomTideData(null);
      setMultipleDaysData([]);
      setSelectedApt(null);
      setLanguage('pt');
      setSearchTerm('');
    } else {
      // Atualiza o meanLevel quando o modal abre
      setMeanLevelCache(meanLevel);
    }
  }, [isOpen, meanLevel]);

  // Buscar dados do dia específico
  const fetchSpecificDay = async () => {
    if (dateType === 'today') {
      setCustomTideData(tideData);
      setMeanLevelCache(meanLevel);
      return;
    }

    setLoadingCustomData(true);
    try {
      const response = await buscarTabuaMare(portoId, selectedMonth, String(selectedDay));
      // Cast explícito para TideApiResponse
      const result = response as TideApiResponse;
      const porto = result?.data?.[0];
      
      if (porto) {
        const meanLvl = porto.mean_level ?? meanLevel;
        setMeanLevelCache(meanLvl);
        
        const mesObj = porto.months?.find((m: any) => m.month === selectedMonth);
        const diaObj = mesObj?.days?.find((d: any) => d.day === selectedDay);
        
        if (diaObj?.hours && diaObj.hours.length > 0) {
          setCustomTideData({
            day: selectedDay,
            weekday_name: diaObj.weekday_name || getWeekdayName(selectedYear, selectedMonth, selectedDay),
            hours: diaObj.hours
          });
        } else {
          alert('Nenhum dado de maré encontrado para esta data');
          setCustomTideData(null);
        }
      } else {
        alert('Nenhum dado encontrado para esta data');
        setCustomTideData(null);
      }
    } catch (error) {
      console.error('Erro ao buscar data específica:', error);
      alert('Erro ao buscar dados da maré para esta data');
      setCustomTideData(null);
    } finally {
      setLoadingCustomData(false);
    }
  };

  // Buscar próximos 3 dias
  const fetchNextThreeDays = async () => {
    setLoadingCustomData(true);
    try {
      const today = new Date();
      const promises: Promise<void>[] = [];
      const daysData: DiaData[] = [];
      let lastMeanLevel = meanLevelCache;
      
      for (let i = 0; i < 3; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        const promise = buscarTabuaMare(portoId, month, String(day))
          .then((response) => {
            // Cast explícito para TideApiResponse
            const result = response as TideApiResponse;
            const porto = result?.data?.[0];
            if (porto) {
              if (porto.mean_level) lastMeanLevel = porto.mean_level;
              
              const mesObj = porto.months?.find((m: any) => m.month === month);
              const diaObj = mesObj?.days?.find((d: any) => d.day === day);
              
              if (diaObj?.hours && diaObj.hours.length > 0) {
                daysData.push({
                  day: day,
                  weekday_name: diaObj.weekday_name || getWeekdayName(year, month, day),
                  hours: diaObj.hours
                });
              }
            }
          })
          .catch((err: Error) => {
            console.error(`Erro ao buscar dia ${day}/${month}:`, err);
          });
        
        promises.push(promise);
      }
      
      await Promise.all(promises);
      
      if (daysData.length === 0) {
        alert('Não foi possível obter dados dos próximos dias');
        setMultipleDaysData([]);
      } else {
        setMultipleDaysData(daysData);
        setMeanLevelCache(lastMeanLevel);
      }
    } catch (error) {
      console.error('Erro ao buscar próximos dias:', error);
      alert('Erro ao buscar dados dos próximos dias');
      setMultipleDaysData([]);
    } finally {
      setLoadingCustomData(false);
    }
  };

  // Função auxiliar para obter nome do dia da semana
  const getWeekdayName = (year: number, month: number, day: number): string => {
    const date = new Date(year, month - 1, day);
    const weekdays = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
    return weekdays[date.getDay()];
  };

  // Efeito para buscar dados quando o tipo ou data mudar
  useEffect(() => {
    if (!isOpen || !portoId) return;
    
    if (sendType === 'single') {
      fetchSpecificDay();
    } else {
      fetchNextThreeDays();
    }
  }, [sendType, dateType, selectedDay, selectedMonth, selectedYear, isOpen, portoId]);

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
    if (!selectedApt) return;
    
    if (sendType === 'single' && !customTideData) {
      alert('Dados da maré não disponíveis');
      return;
    }
    
    if (sendType === 'multiple' && multipleDaysData.length === 0) {
      alert('Dados dos próximos dias não disponíveis');
      return;
    }
    
    setSending(true);
    
    try {
      let message: string;
      
      if (sendType === 'single' && customTideData) {
        // Envio de dia único
        const singleOptions: TideMessageOptions = {
          guestName: selectedApt.guest,
          aptNumber: selectedApt.number,
          diaData: customTideData,
          mes: dateType === 'today' ? mes : selectedMonth,
          ano: dateType === 'today' ? ano : selectedYear,
          portoNome,
          portoId,
          meanLevel: meanLevelCache,
          language
        };
        message = formatTideMessage(singleOptions);
      } else if (sendType === 'multiple' && multipleDaysData.length > 0) {
        // Envio de múltiplos dias
        const multipleOptions: TideMessageMultipleOptions = {
          guestName: selectedApt.guest,
          aptNumber: selectedApt.number,
          tideDataList: multipleDaysData,
          startDate: { mes: new Date().getMonth() + 1, ano: new Date().getFullYear() },
          portoNome,
          portoId,
          meanLevel: meanLevelCache,
          language
        };
        message = formatMultipleDaysMessage(multipleOptions);
      } else {
        throw new Error('Nenhum dado de maré disponível');
      }
      
      const cleanPhone = cleanPhoneNumber(selectedApt.phone);
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
      
      window.open(whatsappUrl, '_blank');
      
      setTimeout(() => {
        onClose();
        setSelectedApt(null);
        setLanguage('pt');
        setSendType('single');
        setDateType('today');
        setCustomTideData(null);
        setMultipleDaysData([]);
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
    pt: '🇧🇷 Português',
    es: '🇪🇸 Español',
    en: '🇺🇸 English'
  };

  const getDisplayData = () => {
    if (sendType === 'single') {
      if (dateType === 'today') {
        const today = new Date();
        return `Hoje (${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()})`;
      } else {
        return `${selectedDay}/${selectedMonth}/${selectedYear}`;
      }
    } else {
      return `Próximos 3 dias (a partir de hoje)`;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col animate-slide-up">
        
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">
            🌊 Enviar Tábua de Maré
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Tipo de envio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              📌 Tipo de envio
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setSendType('single')}
                className={`flex-1 py-2 rounded-lg border transition-colors ${
                  sendType === 'single'
                    ? 'bg-cyan-600 text-white border-cyan-600'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-100'
                }`}
              >
                📅 Dia específico
              </button>
              <button
                onClick={() => setSendType('multiple')}
                className={`flex-1 py-2 rounded-lg border transition-colors ${
                  sendType === 'multiple'
                    ? 'bg-cyan-600 text-white border-cyan-600'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-100'
                }`}
              >
                📆 Próximos 3 dias
              </button>
            </div>
          </div>

          {/* Configurações para dia específico */}
          {sendType === 'single' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  📅 Selecionar data
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDateType('today')}
                    className={`flex-1 py-2 rounded-lg border transition-colors ${
                      dateType === 'today'
                        ? 'bg-cyan-600 text-white border-cyan-600'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    Hoje
                  </button>
                  <button
                    onClick={() => setDateType('specific')}
                    className={`flex-1 py-2 rounded-lg border transition-colors ${
                      dateType === 'specific'
                        ? 'bg-cyan-600 text-white border-cyan-600'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    Data específica
                  </button>
                </div>
              </div>

              {dateType === 'specific' && (
                <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Dia</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={selectedDay}
                      onChange={(e) => setSelectedDay(Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-sm bg-white dark:bg-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Mês</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Math.min(12, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-sm bg-white dark:bg-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Ano</label>
                    <input
                      type="number"
                      min="2020"
                      max="2030"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Math.min(2030, Math.max(2020, parseInt(e.target.value) || 2024)))}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-sm bg-white dark:bg-gray-700"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Info da maré selecionada */}
          {!loadingCustomData && (
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-lg p-3 border border-cyan-200 dark:border-cyan-800">
              <p className="text-sm font-medium text-cyan-800 dark:text-cyan-200">
                {sendType === 'single' ? '📅 Data selecionada:' : '📆 Período selecionado:'}
              </p>
              <p className="text-xs text-cyan-600 dark:text-cyan-300 mt-1 font-mono">
                {getDisplayData()}
              </p>
              <p className="text-xs text-cyan-600 dark:text-cyan-300 mt-1">
                📍 {portoNome} ({portoId.toUpperCase()})
              </p>
              {sendType === 'multiple' && multipleDaysData.length > 0 && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                  ✅ {multipleDaysData.length} dias disponíveis para envio
                </p>
              )}
              {sendType === 'single' && customTideData && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                  ✅ Dados carregados com sucesso
                </p>
              )}
            </div>
          )}

          {loadingCustomData && (
            <div className="flex justify-center py-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Carregando dados da maré...</span>
            </div>
          )}
          
          {/* Seletor de idioma */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              🌐 Idioma / Language
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
          
          {/* Busca de apartamento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              🔍 Buscar apartamento
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
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
              {apartmentsWithPhone.length === 0 ? (
                <>
                  <p className="mb-2">🏠 Nenhum apartamento ocupado com telefone cadastrado</p>
                  <p className="text-xs">Faça check-in com telefone para enviar a tábua de maré</p>
                </>
              ) : (
                <p>🔍 Nenhum apartamento encontrado para "{searchTerm}"</p>
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
                        📱 {formatPhoneDisplay(apt.phone)}
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
            disabled={
              !selectedApt || 
              sending || 
              loadingCustomData ||
              (sendType === 'single' && !customTideData) ||
              (sendType === 'multiple' && multipleDaysData.length === 0)
            }
            className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                📤 Enviar WhatsApp ({languageLabels[language]})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
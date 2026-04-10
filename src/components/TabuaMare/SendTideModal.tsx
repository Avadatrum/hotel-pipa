// src/components/TabuaMare/SendTideModal.tsx
import { useState, useEffect } from 'react';
import { useApartments } from '../../hooks/useApartments';
import { buscarTabuaMare } from '../../services/tabuaMareService';
import type { Language, TideMessageOptions, TideMessageMultipleOptions } from '../../utils/tideMessageFormatter';
import { formatTideMessage, formatMultipleDaysMessage } from '../../utils/tideMessageFormatter';

interface HoraMare { hour: string; level: number; }
interface DiaData { day: number; weekday_name: string; hours: HoraMare[]; }

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
type Step = 1 | 2 | 3;

function cleanPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
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

  const [step, setStep] = useState<Step>(1);
  const [sendType, setSendType] = useState<SendType>('single');
  const [dateType, setDateType] = useState<DateType>('today');
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [customTideData, setCustomTideData] = useState<DiaData | null>(null);
  const [multipleDaysData, setMultipleDaysData] = useState<DiaData[]>([]);
  const [loadingCustomData, setLoadingCustomData] = useState(false);
  const [meanLevelCache, setMeanLevelCache] = useState<number>(meanLevel);
  const [previewMessage, setPreviewMessage] = useState<string>('');

  // Reset states quando modal abre/fecha
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setSendType('single');
      setDateType('today');
      setCustomTideData(null);
      setMultipleDaysData([]);
      setSelectedApt(null);
      setLanguage('pt');
      setSearchTerm('');
      setPreviewMessage('');
    } else {
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
            const result = response as TideApiResponse;
            const porto = result?.data?.[0];
            if (porto) {
              if (porto.mean_level) lastMeanLevel = porto.mean_level;
              const mesObj = porto.months?.find((m: any) => m.month === month);
              const diaObj = mesObj?.days?.find((d: any) => d.day === day);
              if (diaObj?.hours && diaObj.hours.length > 0) {
                daysData.push({
                  day,
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

  const getWeekdayName = (year: number, month: number, day: number): string => {
    const date = new Date(year, month - 1, day);
    const weekdays = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
    return weekdays[date.getDay()];
  };

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
    return apt.number.toString().includes(term) || apt.guest.toLowerCase().includes(term);
  });

  // Gera a prévia da mensagem ao avançar para o passo 3
  const buildPreviewMessage = (): string => {
    if (!selectedApt) return '';
    if (sendType === 'single' && customTideData) {
      const options: TideMessageOptions = {
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
      return formatTideMessage(options);
    }
    if (sendType === 'multiple' && multipleDaysData.length > 0) {
      const options: TideMessageMultipleOptions = {
        guestName: selectedApt.guest,
        aptNumber: selectedApt.number,
        tideDataList: multipleDaysData,
        startDate: { mes: new Date().getMonth() + 1, ano: new Date().getFullYear() },
        portoNome,
        portoId,
        meanLevel: meanLevelCache,
        language
      };
      return formatMultipleDaysMessage(options);
    }
    return '';
  };

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2 && selectedApt) {
      const msg = buildPreviewMessage();
      setPreviewMessage(msg);
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
  };

  const handleSend = async () => {
    if (!selectedApt || !previewMessage) return;
    setSending(true);
    try {
      const cleanPhone = cleanPhoneNumber(selectedApt.phone);
      const encodedMessage = encodeURIComponent(previewMessage);
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
      setTimeout(() => {
        onClose();
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
    if (cleaned.length === 11) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    if (cleaned.length === 10) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    return phone;
  };

  const canAdvanceFromStep1 = !loadingCustomData && (
    sendType === 'multiple' ? multipleDaysData.length > 0 : !!customTideData
  );

  const canAdvanceFromStep2 = !!selectedApt;

  const languageLabels: Record<Language, string> = {
    pt: '🇧🇷 PT',
    es: '🇪🇸 ES',
    en: '🇺🇸 EN'
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md flex flex-col animate-slide-up overflow-hidden border border-gray-100 dark:border-gray-800">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-white leading-none">Enviar tábua de maré</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{portoNome} — {portoId.toUpperCase()}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1 px-5 pt-4">
          {([1, 2, 3] as Step[]).map((s) => (
            <div
              key={s}
              className={`flex-1 h-0.5 rounded-full transition-colors duration-300 ${
                s <= step ? 'bg-cyan-500' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 max-h-[60vh]">

          {/* Step 1 — Configuração */}
          {step === 1 && (
            <>
              <div>
                <p className="text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Período</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['single', 'multiple'] as SendType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setSendType(type)}
                      className={`py-2.5 px-3 rounded-xl border text-left transition-all ${
                        sendType === type
                          ? 'border-cyan-400 bg-cyan-50 dark:bg-cyan-900/20'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <p className={`text-sm font-medium ${sendType === type ? 'text-cyan-700 dark:text-cyan-300' : 'text-gray-700 dark:text-gray-200'}`}>
                        {type === 'single' ? 'Dia específico' : 'Próximos 3 dias'}
                      </p>
                      <p className={`text-[11px] mt-0.5 ${sendType === type ? 'text-cyan-500 dark:text-cyan-400' : 'text-gray-400 dark:text-gray-500'}`}>
                        {type === 'single' ? 'hoje ou outra data' : 'a partir de hoje'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {sendType === 'single' && (
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Data</p>
                  <div className="flex gap-2 mb-3">
                    {(['today', 'specific'] as DateType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => setDateType(type)}
                        className={`flex-1 py-2 rounded-xl border text-sm transition-all ${
                          dateType === type
                            ? 'border-cyan-400 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300'
                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        {type === 'today' ? 'Hoje' : 'Outra data'}
                      </button>
                    ))}
                  </div>

                  {dateType === 'specific' && (
                    <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      {[
                        { label: 'Dia', value: selectedDay, min: 1, max: 31, onChange: (v: number) => setSelectedDay(v) },
                        { label: 'Mês', value: selectedMonth, min: 1, max: 12, onChange: (v: number) => setSelectedMonth(v) },
                        { label: 'Ano', value: selectedYear, min: 2020, max: 2030, onChange: (v: number) => setSelectedYear(v) },
                      ].map(({ label, value, min, max, onChange }) => (
                        <div key={label}>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-1">{label}</p>
                          <input
                            type="number"
                            min={min}
                            max={max}
                            value={value}
                            onChange={(e) => onChange(Math.min(max, Math.max(min, parseInt(e.target.value) || min)))}
                            className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div>
                <p className="text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Idioma</p>
                <div className="flex gap-2">
                  {(['pt', 'es', 'en'] as Language[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`flex-1 py-2 rounded-xl border text-sm transition-all ${
                        language === lang
                          ? 'border-cyan-400 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      {languageLabels[lang]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status da maré */}
              {loadingCustomData ? (
                <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Carregando dados da maré...</p>
                </div>
              ) : (
                <div className={`p-3 rounded-xl border text-sm ${
                  canAdvanceFromStep1
                    ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                }`}>
                  <p className={`font-medium ${canAdvanceFromStep1 ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {canAdvanceFromStep1 ? '✓ Dados carregados' : '✗ Dados indisponíveis'}
                  </p>
                  <p className="text-xs mt-0.5 text-gray-400 dark:text-gray-500">
                    {sendType === 'multiple'
                      ? `${multipleDaysData.length} dia(s) disponível(is) para envio`
                      : customTideData
                        ? `${customTideData.weekday_name}, ${customTideData.day}/${dateType === 'today' ? mes : selectedMonth}`
                        : 'Nenhum dado encontrado para a data selecionada'
                    }
                  </p>
                </div>
              )}
            </>
          )}

          {/* Step 2 — Seleção do hóspede */}
          {step === 2 && (
            <>
              <div>
                <p className="text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Hóspede</p>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome ou número do apto..."
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 mb-3"
                />

                {loadingApartments ? (
                  <div className="flex justify-center py-8">
                    <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : filteredApartments.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                    {apartmentsWithPhone.length === 0
                      ? 'Nenhum apartamento ocupado com telefone cadastrado'
                      : `Nenhum resultado para "${searchTerm}"`
                    }
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
                    {filteredApartments.map((apt) => (
                      <button
                        key={apt.number}
                        onClick={() => setSelectedApt(apt)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all ${
                          selectedApt?.number === apt.number
                            ? 'border-cyan-400 bg-cyan-50 dark:bg-cyan-900/20'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className={`text-sm font-medium ${selectedApt?.number === apt.number ? 'text-cyan-700 dark:text-cyan-300' : 'text-gray-800 dark:text-white'}`}>
                              Apto {apt.number} — {apt.block}
                            </p>
                            <p className={`text-xs mt-0.5 ${selectedApt?.number === apt.number ? 'text-cyan-500 dark:text-cyan-400' : 'text-gray-400 dark:text-gray-500'}`}>
                              {apt.guest}
                            </p>
                          </div>
                          <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                            {formatPhoneDisplay(apt.phone)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Step 3 — Prévia da mensagem */}
          {step === 3 && (
            <div>
              <p className="text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Prévia da mensagem</p>
              <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap font-mono leading-relaxed max-h-72 overflow-y-auto">
                {previewMessage}
              </div>
              <div className="flex items-center gap-2 mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 text-xs font-medium text-gray-500 dark:text-gray-300">
                  {selectedApt?.guest.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">{selectedApt?.guest}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">{selectedApt ? formatPhoneDisplay(selectedApt.phone) : ''}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                A mensagem será aberta no WhatsApp para confirmar o envio.
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-4 border-t border-gray-100 dark:border-gray-800">
          {step === 1 ? (
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancelar
            </button>
          ) : (
            <button
              onClick={handleBack}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              ← Voltar
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={
                (step === 1 && (!canAdvanceFromStep1 || loadingCustomData)) ||
                (step === 2 && !canAdvanceFromStep2)
              }
              className="flex-1 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Próximo →
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={sending}
              className="flex-1 py-2 bg-[#25D366] text-white rounded-xl text-sm font-medium hover:bg-[#20bd5a] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="white" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.138.564 4.144 1.546 5.879L0 24l6.32-1.504A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" fillRule="evenodd" clipRule="evenodd"/>
                  </svg>
                  Enviar WhatsApp
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
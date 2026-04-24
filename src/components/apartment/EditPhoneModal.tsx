// src/components/apartment/EditPhoneModal.tsx
import { useState, useEffect, useCallback, useId } from 'react';
import { formatPhoneNumber } from '../../utils/phoneFormatter';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface EditPhoneModalProps {
  isOpen: boolean;
  aptNumber: number;
  guest?: string;
  currentPhone?: string;
  currentChips?: number;
  currentTowels?: number;
  currentPax?: number;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (
    phone: string,
    countryCode: string,
    chips?: number,
    towels?: number,
    pax?: number,
  ) => void;
}

// ─── Sub-componente: Contador de quantidade ───────────────────────────────────

interface QuantityControlProps {
  label: string;
  emoji: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  ariaLabel?: string;
}

function QuantityControl({ label, emoji, value, onChange, min = 0, ariaLabel }: QuantityControlProps) {
  const id = useId();

  return (
    <div className="flex items-center justify-between py-1">
      <label htmlFor={id} className="text-sm text-gray-600 dark:text-gray-400 select-none">
        {emoji} {label}
      </label>
      <div className="flex items-center gap-2" role="group" aria-label={ariaLabel ?? label}>
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`Diminuir ${label}`}
          className="
            w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-600
            bg-white dark:bg-gray-700
            text-gray-700 dark:text-gray-200
            flex items-center justify-center
            hover:bg-red-50 hover:border-red-300 hover:text-red-600
            dark:hover:bg-red-900/30 dark:hover:border-red-700 dark:hover:text-red-400
            disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white
            transition-all duration-150 active:scale-95 text-base font-bold
          "
        >
          −
        </button>
        <span
          id={id}
          className="font-bold text-base w-7 text-center tabular-nums dark:text-white"
          aria-live="polite"
          aria-atomic="true"
        >
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          aria-label={`Aumentar ${label}`}
          className="
            w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-600
            bg-white dark:bg-gray-700
            text-gray-700 dark:text-gray-200
            flex items-center justify-center
            hover:bg-green-50 hover:border-green-300 hover:text-green-600
            dark:hover:bg-green-900/30 dark:hover:border-green-700 dark:hover:text-green-400
            transition-all duration-150 active:scale-95 text-base font-bold
          "
        >
          +
        </button>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function EditPhoneModal({
  isOpen,
  aptNumber,
  guest,
  currentPhone,
  currentChips,
  currentTowels,
  currentPax,
  loading,
  onClose,
  onConfirm,
}: EditPhoneModalProps) {
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+55');
  const [chips, setChips] = useState(currentChips ?? 0);
  const [towels, setTowels] = useState(currentTowels ?? 0);
  const [pax, setPax] = useState(currentPax ?? 1);

  // Sincroniza estado com props ao abrir o modal
  useEffect(() => {
    if (!isOpen) return;

    if (currentPhone) {
      const spaceIndex = currentPhone.indexOf(' ');
      if (spaceIndex !== -1) {
        setCountryCode(currentPhone.slice(0, spaceIndex));
        setPhone(currentPhone.slice(spaceIndex + 1));
      } else {
        setCountryCode('+55');
        setPhone(currentPhone);
      }
    } else {
      setCountryCode('+55');
      setPhone('');
    }

    setChips(currentChips ?? 0);
    setTowels(currentTowels ?? 0);
    setPax(currentPax ?? 1);
  }, [isOpen, currentPhone, currentChips, currentTowels, currentPax]);

  // Fecha com Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const handlePaxChange = useCallback(
    (num: number) => {
      const confirmChange = chips !== num
        ? window.confirm(`Alterar para ${num} hóspede(s)?\nAs fichas serão ajustadas para ${num}.`)
        : false;

      setPax(num);
      if (confirmChange) setChips(num);
    },
    [chips],
  );

  const handlePhoneChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setPhone(formatPhoneNumber(e.target.value)),
    [],
  );

  const handleCountryCodeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setCountryCode(e.target.value),
    [],
  );

  const handleSubmit = useCallback(() => {
    onConfirm(phone, countryCode, chips, towels, pax);
  }, [chips, countryCode, onConfirm, pax, phone, towels]);

  if (!isOpen) return null;

  const PAX_OPTIONS = [1, 2, 3, 4, 5, 6] as const;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="
        bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm
        shadow-xl ring-1 ring-black/5 dark:ring-white/10
        max-h-[90dvh] overflow-y-auto overscroll-contain
        animate-[slide-up_0.2s_ease-out]
      ">
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-3">
          <div>
            <h2
              id="edit-modal-title"
              className="text-base font-bold text-gray-900 dark:text-white"
            >
              Editar Apto {aptNumber}
            </h2>
            {guest && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Hóspede: <span className="font-medium text-gray-700 dark:text-gray-300">{guest}</span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="
              -mt-0.5 -mr-0.5 p-1.5 rounded-lg text-gray-400
              hover:text-gray-600 dark:hover:text-gray-200
              hover:bg-gray-100 dark:hover:bg-gray-700
              transition-colors
            "
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-5 pb-5 space-y-4">

          {/* Seção: Nº de Hóspedes */}
          <section aria-labelledby="pax-label">
            <p id="pax-label" className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              👥 Número de hóspedes
            </p>
            <div className="grid grid-cols-6 gap-1.5">
              {PAX_OPTIONS.map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handlePaxChange(num)}
                  aria-pressed={pax === num}
                  className={`
                    h-9 rounded-lg text-sm font-semibold border transition-all duration-150 active:scale-95
                    ${pax === num
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200 dark:shadow-blue-900'
                      : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600'
                    }
                  `}
                >
                  {num}
                </button>
              ))}
            </div>
          </section>

          {/* Seção: Fichas e Toalhas */}
          <section
            aria-labelledby="items-label"
            className="rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3"
          >
            <p id="items-label" className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              🎫 Fichas & Toalhas
            </p>

            <div className="space-y-1 divide-y divide-gray-100 dark:divide-gray-700/60">
              <QuantityControl
                label="Fichas"
                emoji="🎫"
                value={chips}
                onChange={setChips}
                ariaLabel="Controle de fichas"
              />
              <QuantityControl
                label="Toalhas"
                emoji="🧺"
                value={towels}
                onChange={setTowels}
                ariaLabel="Controle de toalhas"
              />
            </div>

            <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-500 leading-snug">
              ⚠️ Ajuste manual apenas para correções. Use os botões do card para operações normais.
            </p>
          </section>

          {/* Seção: Telefone */}
          <section aria-labelledby="phone-label">
            <label
              id="phone-label"
              className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 block"
            >
              📱 WhatsApp
              <span className="ml-1 text-[10px] font-normal normal-case text-gray-400 dark:text-gray-500">
                (opcional)
              </span>
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={countryCode}
                onChange={handleCountryCodeChange}
                aria-label="Código do país"
                placeholder="+55"
                className="
                  w-[72px] border border-gray-200 dark:border-gray-600 rounded-xl
                  px-3 py-2.5 text-sm text-center
                  bg-white dark:bg-gray-700
                  text-gray-900 dark:text-white
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  transition-shadow
                "
              />
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                aria-label="Número de telefone"
                placeholder="(84) 9 0000-0000"
                className="
                  flex-1 border border-gray-200 dark:border-gray-600 rounded-xl
                  px-3 py-2.5 text-sm
                  bg-white dark:bg-gray-700
                  text-gray-900 dark:text-white
                  placeholder:text-gray-400 dark:placeholder:text-gray-500
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  transition-shadow
                "
              />
            </div>
          </section>

          {/* Ações */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="
                flex-1 py-2.5 rounded-xl text-sm font-medium
                border border-gray-200 dark:border-gray-600
                text-gray-700 dark:text-gray-200
                hover:bg-gray-50 dark:hover:bg-gray-700
                disabled:opacity-40
                transition-colors
              "
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="
                flex-1 py-2.5 rounded-xl text-sm font-semibold
                bg-blue-600 hover:bg-blue-700 active:bg-blue-800
                text-white
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
                flex items-center justify-center gap-2
              "
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Salvando…
                </>
              ) : (
                'Salvar'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
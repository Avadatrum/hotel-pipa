import { useState } from 'react';
import type { Apartment } from '../types';
import { useApartmentActions } from '../hooks/useApartmentActions';
import { ApartmentHistoryModal } from './ApartmentHistoryModal';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../contexts/AuthContext';

interface ApartmentCardProps {
  aptNumber: number;
  data: Apartment;
  onSuccess?: () => void;
}

export function ApartmentCard({ aptNumber, data, onSuccess }: ApartmentCardProps) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [pax, setPax] = useState(1);
  const [lostTowels, setLostTowels] = useState(0);
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+55'); // NOVO: código do país digitado
  const [pendingCheckinData, setPendingCheckinData] = useState<{ guestName: string; pax: number; phone: string; countryCode: string } | null>(null);
  
  const { loading, handleCheckin, handleCheckout, handleAdjust } = useApartmentActions();

  // Função para formatar número de telefone
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const limitedNumbers = numbers.slice(0, 11);
    
    if (limitedNumbers.length <= 2) {
      return limitedNumbers;
    } else if (limitedNumbers.length <= 6) {
      return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2)}`;
    } else if (limitedNumbers.length <= 10) {
      return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2, 6)}-${limitedNumbers.slice(6)}`;
    } else {
      return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2, 7)}-${limitedNumbers.slice(7, 11)}`;
    }
  };

  // Função para limpar o código do país (ex: +55 -> 55)
  const cleanCountryCode = (code: string) => {
    return code.replace(/\D/g, '');
  };
  
  // Função para gerar mensagem em Português
  const getPortugueseMessage = (guestName: string, aptNumber: number, userName: string) => {
    return `Prezado(a) ${guestName},

Seja muito bem-vindo(a) ao Hotel da Pipa. É um prazer recebê-lo(a) e desejamos uma estadia marcada por conforto e tranquilidade.

Segue abaixo algumas informações importantes para sua hospedagem:

Apartamento: ${aptNumber}

Serviço de limpeza: Realizado diariamente de 9h às 18h. Nossas camareiras sempre anunciam a presença antes de entrar no apartamento.

Política antitabagismo: Todos os apartamentos são exclusivamente para não fumantes.

Café da manhã: Servido em nosso restaurante das 8h às 10h30.

Convidamos nossos hóspedes a desfrutarem do chá da tarde, servido diariamente das 16h às 17h.

Restaurante: Funcionamento das 12h às 20h, com encerramento da cozinha às 19h.

Wi-Fi:
Rede: Hotel da Pipa
Senha: paraiso20

Informações importantes:
- Disponibilizamos 1 toalha de piscina por hóspede, por diária. Toalhas extras possuem custo adicional de R$ 10,00 por unidade.
- Não é permitida a entrada de alimentos e bebidas externos nas áreas da piscina e restaurante.
- Não é permitido o uso de som externo. Nos apartamentos, solicitamos manter volume moderado, respeitando o silêncio após as 22h.
- O acesso aos apartamentos é exclusivo para hóspedes. Para uso da piscina ou restaurante por visitantes, favor consultar a recepção (consumo mínimo de R$ 150,00 por pessoa).
- Check-out até às 12h.
- Em caso de danos ou extravios de itens do apartamento, os valores correspondentes serão cobrados no check-out.

Nossa equipe permanece à disposição para auxiliá-lo(a) sempre que necessário. Desejamos uma excelente estadia.

Atenciosamente,
${userName}`;
  };

  // Função para gerar mensagem em Espanhol
  const getSpanishMessage = (guestName: string, aptNumber: number, userName: string) => {
    return `Estimado(a) ${guestName},

Sea muy bienvenido(a) al Hotel da Pipa. Es un placer recibirle y deseamos que su estancia esté marcada por la comodidad y la tranquilidad.

A continuación, algunas informaciones importantes para su hospedaje:

Apartamento: ${aptNumber}

Servicio de limpieza: Realizado diariamente de 9h a 18h. Nuestras camareras siempre anuncian su presencia antes de entrar al apartamento.

Política antitabaco: Todos los apartamentos son exclusivamente para no fumadores.

Desayuno: Servido en nuestro restaurante de 8h a 10h30.

Invitamos a nuestros huéspedes a disfrutar del té de la tarde, servido diariamente de 16h a 17h.

Restaurante: Funcionamiento de 12h a 20h, con cierre de la cocina a las 19h.

Wi-Fi:
Red: Hotel da Pipa
Contraseña: paraiso20

Informaciones importantes:
- Disponemos de 1 toalla de piscina por huésped, por día. Toallas adicionales tienen un costo adicional de R$ 10,00 por unidad.
- No se permite la entrada de alimentos y bebidas externos en las áreas de la piscina y restaurante.
- No se permite el uso de sonido externo. En los apartamentos, solicitamos mantener volumen moderado, respetando el silencio después de las 22h.
- El acceso a los apartamentos es exclusivo para huéspedes. Para el uso de la piscina o restaurante por visitantes, por favor consulte la recepción (consumo mínimo de R$ 150,00 por persona).
- Check-out hasta las 12h.
- En caso de daños o extravío de artículos del apartamento, los valores correspondientes serán cobrados en el check-out.

Nuestro equipo permanece a su disposición para ayudarle siempre que sea necesario. Le deseamos una excelente estancia.

Atentamente,
${userName}`;
  };

  // Função para enviar mensagem WhatsApp
  const sendWhatsAppMessage = (phoneNumber: string, countryCodeValue: string, guestName: string, aptNumber: number, language: 'pt' | 'es') => {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const cleanCode = cleanCountryCode(countryCodeValue);
    const fullPhone = `${cleanCode}${cleanPhone}`;
    
    if (!fullPhone || fullPhone.length < 10) {
      return false;
    }
    
    const userName = user?.name || (language === 'pt' ? 'Equipe Hotel da Pipa' : 'Equipo Hotel da Pipa');
    
    const message = language === 'pt' 
      ? getPortugueseMessage(guestName, aptNumber, userName)
      : getSpanishMessage(guestName, aptNumber, userName);
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${fullPhone}?text=${encodedMessage}`, '_blank');
    
    return true;
  };

  // Função para iniciar conversa no WhatsApp (telefone clicável)
  const startWhatsAppConversation = (fullPhoneNumber: string) => {
    const cleanPhone = fullPhoneNumber.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      showToast('Número de telefone inválido', 'warning');
      return;
    }
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const onCheckin = async () => {
    if (!guestName.trim()) {
      showToast('Digite o nome do hóspede', 'warning');
      return;
    }
    
    if (phone.trim()) {
      const cleanPhone = phone.replace(/\D/g, '');
      const cleanCode = cleanCountryCode(countryCode);
      
      if (cleanPhone.length < 10) {
        showToast('Digite um telefone válido (mínimo 10 dígitos)', 'warning');
        return;
      }
      
      if (!cleanCode || cleanCode.length < 2) {
        showToast('Digite um código de país válido (ex: +55 para Brasil)', 'warning');
        return;
      }
    }
    
    if (phone && phone.trim()) {
      setPendingCheckinData({ 
        guestName, 
        pax, 
        phone, 
        countryCode 
      });
      setShowLanguageModal(true);
    } else {
      const result = await handleCheckin(aptNumber, guestName, pax, '');
      if (result.success) {
        showToast(`Check-in realizado! Apto ${aptNumber} - ${guestName}`, 'success');
        setShowCheckinModal(false);
        setGuestName('');
        setPax(1);
        setPhone('');
        setCountryCode('+55');
        onSuccess?.();
      } else {
        showToast(`Erro no check-in: ${result.error}`, 'error');
      }
    }
  };

  const confirmCheckinWithLanguage = async (language: 'pt' | 'es') => {
    if (!pendingCheckinData) return;
    
    const { guestName, pax, phone, countryCode } = pendingCheckinData;
    
    // Salva o telefone completo com código do país
    const fullPhone = `${countryCode} ${phone}`;
    const result = await handleCheckin(aptNumber, guestName, pax, fullPhone);
    
    if (result.success) {
      showToast(`Check-in realizado! Apto ${aptNumber} - ${guestName}`, 'success');
      
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length >= 10) {
        sendWhatsAppMessage(phone, countryCode, guestName, aptNumber, language);
        showToast(`Mensagem de boas-vindas enviada (${language === 'pt' ? 'Português' : 'Español'})!`, 'info');
      }
      
      setShowLanguageModal(false);
      setShowCheckinModal(false);
      setGuestName('');
      setPax(1);
      setPhone('');
      setCountryCode('+55');
      setPendingCheckinData(null);
      onSuccess?.();
    } else {
      showToast(`Erro no check-in: ${result.error}`, 'error');
    }
  };

  const onCheckout = async () => {
    const result = await handleCheckout(aptNumber, lostTowels);
    if (result.success) {
      if (lostTowels > 0) {
        showToast(`Check-out realizado! ${lostTowels} toalha(s) registrada(s) como perda`, 'warning');
      } else {
        showToast(`Check-out realizado! Apto ${aptNumber} liberado`, 'success');
      }
      setShowCheckoutModal(false);
      setLostTowels(0);
      onSuccess?.();
    } else {
      const errorMsg = 'error' in result ? result.error : 'Erro desconhecido';
      showToast(`Erro no check-out: ${errorMsg}`, 'error');
    }
  };

  const onAdjust = async (item: 'chips' | 'towels', delta: number) => {
    const currentValue = item === 'chips' ? data.chips : data.towels;
    const newValue = await handleAdjust(aptNumber, item, delta, currentValue);
    
    const messages = {
      chips: { up: 'Ficha adicionada', down: 'Ficha retirada' },
      towels: { up: 'Toalha entregue', down: 'Toalha devolvida' }
    };
    
    const action = delta > 0 ? 'up' : 'down';
    showToast(`${messages[item][action]} - Total: ${newValue}`, 'info');
  };

  return (
    <>
      <div className={`
        border rounded-lg p-3 transition-all hover:shadow-md
        ${data.occupied 
          ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30' 
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
        }
      `}>
        <div className="flex justify-between items-start mb-2">
          <span className="text-xl font-bold text-gray-700 dark:text-gray-200">
            {aptNumber}
          </span>
          <span className={`
            w-2 h-2 rounded-full
            ${data.occupied ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}
          `} />
        </div>
        
        {data.occupied && data.guest && (
          <div className="text-xs text-gray-600 dark:text-gray-300 truncate mb-1">
            {data.guest}
          </div>
        )}
        
        {/* Telefone clicável - mostra o número salvo */}
        {data.occupied && data.phone && (
          <button
            onClick={() => startWhatsAppConversation(data.phone!)}
            className="text-xs text-green-600 dark:text-green-400 truncate mb-1 flex items-center gap-1 hover:text-green-700 dark:hover:text-green-300 transition-colors"
            title="Clique para conversar no WhatsApp"
          >
            {data.phone}
          </button>
        )}
        
        <div className="flex items-center gap-1 mb-2">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {data.block}
          </div>
          {data.occupied && (
            <div className="flex gap-1 ml-auto">
              {data.towels > 0 && (
                <span className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300 px-1.5 py-0.5 rounded-full" title={`${data.towels} toalha(s)`}>
                  Toalhas: {data.towels}
                </span>
              )}
              {data.chips > 0 && (
                <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 px-1.5 py-0.5 rounded-full" title={`${data.chips} ficha(s)`}>
                  Fichas: {data.chips}
                </span>
              )}
            </div>
          )}
        </div>

        {data.occupied && (
          <div className="space-y-1 mb-2">
            <div className="flex items-center justify-between text-xs">
              <span className="dark:text-gray-300">Fichas</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onAdjust('chips', -1)}
                  disabled={loading || data.chips === 0}
                  className="w-7 h-7 bg-red-500 text-white rounded disabled:opacity-50 hover:bg-red-600 transition-colors text-sm"
                >
                  -
                </button>
                <span className="font-bold w-6 text-center text-base dark:text-white">{data.chips}</span>
                <button
                  onClick={() => onAdjust('chips', 1)}
                  disabled={loading}
                  className="w-7 h-7 bg-green-500 text-white rounded disabled:opacity-50 hover:bg-green-600 transition-colors text-sm"
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="dark:text-gray-300">Toalhas</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onAdjust('towels', -1)}
                  disabled={loading || data.towels === 0}
                  className="w-7 h-7 bg-red-500 text-white rounded disabled:opacity-50 hover:bg-red-600 transition-colors text-sm"
                >
                  -
                </button>
                <span className="font-bold w-6 text-center text-base dark:text-white">{data.towels}</span>
                <button
                  onClick={() => onAdjust('towels', 1)}
                  disabled={loading}
                  className="w-7 h-7 bg-green-500 text-white rounded disabled:opacity-50 hover:bg-green-600 transition-colors text-sm"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}

        {!data.occupied ? (
          <button
            onClick={() => setShowCheckinModal(true)}
            disabled={loading}
            className="w-full mt-2 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
          >
            Check-in
          </button>
        ) : (
          <button
            onClick={() => {
              setLostTowels(data.towels);
              setShowCheckoutModal(true);
            }}
            disabled={loading}
            className="w-full mt-2 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
          >
            Check-out
          </button>
        )}

        <button
          onClick={() => setShowHistoryModal(true)}
          className="w-full mt-1 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          Histórico
        </button>
      </div>

      {/* Modal de Check-in - Versão simplificada com código do país digitado */}
      {showCheckinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-5 w-full max-w-sm mx-auto animate-slide-up">
            <h2 className="text-lg font-bold mb-3 text-gray-800 dark:text-white">Check-in Apto {aptNumber}</h2>
            
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nome do hóspede *</label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Digite o nome"
                autoFocus
              />
            </div>
            
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Telefone (WhatsApp) 
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">opcional</span>
              </label>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-20 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                  placeholder="+55"
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                  className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="(84) 99999-9999"
                />
              </div>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Digite o código do país (ex: +55) e o número com DDD
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Número de hóspedes</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(num => (
                  <button
                    key={num}
                    onClick={() => setPax(num)}
                    className={`flex-1 py-2 rounded-lg border transition-colors ${
                      pax === num 
                        ? 'bg-blue-600 text-white border-blue-600' 
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowCheckinModal(false);
                  setPhone('');
                  setCountryCode('+55');
                }}
                className="flex-1 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={onCheckin}
                disabled={loading || !guestName.trim()}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
              >
                {loading ? 'Processando...' : 'Confirmar Check-in'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para escolher idioma */}
      {showLanguageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-5 w-full max-w-sm mx-auto animate-slide-up">
            <h2 className="text-lg font-bold mb-3 text-gray-800 dark:text-white">Escolha o idioma da mensagem</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Selecione o idioma para enviar a mensagem de boas-vindas para {pendingCheckinData?.guestName}:
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => confirmCheckinWithLanguage('pt')}
                className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Português
              </button>
              <button
                onClick={() => confirmCheckinWithLanguage('es')}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Español
              </button>
            </div>
            
            <button
              onClick={() => {
                setShowLanguageModal(false);
                setPendingCheckinData(null);
              }}
              className="w-full mt-3 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Check-out */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-5 w-full max-w-sm mx-auto animate-slide-up">
            <h2 className="text-lg font-bold mb-3 text-gray-800 dark:text-white">Check-out Apto {aptNumber}</h2>
            
            <div className="mb-4 space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Hóspede: <strong className="dark:text-white">{data.guest}</strong>
              </p>
              {data.phone && (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Telefone: <strong className="dark:text-white">{data.phone}</strong>
                </p>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Fichas restantes: <strong className="dark:text-white">{data.chips}</strong>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Toalhas com hóspede: <strong className="dark:text-white">{data.towels}</strong>
              </p>
              
              <label className="block text-sm font-medium mt-3 mb-1 text-gray-700 dark:text-gray-300">
                Toalhas não devolvidas (perdas):
              </label>
              <input
                type="number"
                value={lostTowels}
                onChange={(e) => setLostTowels(Math.min(Math.max(0, parseInt(e.target.value) || 0), data.towels))}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                min="0"
                max={data.towels}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Máximo: {data.towels} toalhas
              </p>
            </div>
            
            {lostTowels > 0 && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-400">
                  Serão registradas {lostTowels} toalha(s) como PERDA.
                </p>
              </div>
            )}
            
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="flex-1 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={onCheckout}
                disabled={loading}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
              >
                {loading ? 'Processando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Histórico */}
      <ApartmentHistoryModal
        isOpen={showHistoryModal}
        aptNumber={aptNumber}
        guestName={data.guest}
        blockName={data.block}
        onClose={() => setShowHistoryModal(false)}
      />
    </>
  );
}
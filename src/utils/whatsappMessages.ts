// utils/whatsappMessages.ts

type Language = 'pt' | 'es' | 'en';

// Template base das mensagens
const getBaseMessage = (guestName: string, aptNumber: number, userName: string) => ({
  pt: `Prezado(a) ${guestName},

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
${userName}`,

  es: `Estimado(a) ${guestName},

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
${userName}`,

  en: `Dear ${guestName},

Welcome to Hotel da Pipa. It's a pleasure to have you here, and we wish you a stay filled with comfort and tranquility.

Below is some important information for your stay:

Apartment: ${aptNumber}

Housekeeping service: Daily from 9am to 6pm. Our housekeepers always announce themselves before entering the apartment.

No-smoking policy: All apartments are strictly non-smoking.

Breakfast: Served in our restaurant from 8am to 10:30am.

We invite our guests to enjoy afternoon tea, served daily from 4pm to 5pm.

Restaurant: Open from 12pm to 8pm, with the kitchen closing at 7pm.

Wi-Fi:
Network: Hotel da Pipa
Password: paraiso20

Important information:
- We provide 1 pool towel per guest, per day. Extra towels cost R$ 10.00 each.
- Outside food and drinks are not allowed in the pool and restaurant areas.
- External speakers are not allowed. In the apartments, please keep the volume moderate and respect the quiet hours after 10pm.
- Access to the apartments is exclusively for guests. For visitors wishing to use the pool or restaurant, please check with reception (minimum consumption of R$ 150.00 per person).
- Check-out is until 12pm.
- In case of damage or loss of apartment items, the corresponding amounts will be charged at check-out.

Our team is always available to assist you whenever needed. We wish you an excellent stay.

Sincerely,
${userName}`
});

/**
 * Obtém a mensagem no idioma selecionado
 */
export const getWhatsAppMessage = (
  language: Language,
  guestName: string,
  aptNumber: number,
  userName: string
): string => {
  const messages = getBaseMessage(guestName, aptNumber, userName);
  return messages[language];
};

/**
 * Envia mensagem WhatsApp - SEM validação de tamanho mínimo
 */
export const sendWhatsAppMessage = (
  phoneNumber: string,
  countryCode: string,
  guestName: string,
  aptNumber: number,
  language: Language,
  userName: string
): boolean => {
  // Remove caracteres não numéricos
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const cleanCode = countryCode.replace(/\D/g, '');
  const fullPhone = `${cleanCode}${cleanPhone}`;
  
  // Mesmo que o número seja curto, tenta enviar
  // O WhatsApp vai mostrar erro se o número for inválido
  const message = getWhatsAppMessage(language, guestName, aptNumber, userName);
  const encodedMessage = encodeURIComponent(message);
  window.open(`https://wa.me/${fullPhone}?text=${encodedMessage}`, '_blank');
  
  return true;
};

/**
 * Inicia conversa no WhatsApp - SEM validação de tamanho mínimo
 */
export const startWhatsAppConversation = (fullPhoneNumber: string): boolean => {
  // Remove caracteres não numéricos
  const cleanPhone = fullPhoneNumber.replace(/\D/g, '');
  
  // Tenta abrir mesmo com número curto
  // O WhatsApp vai lidar com a validação
  window.open(`https://wa.me/${cleanPhone}`, '_blank');
  return true;
};
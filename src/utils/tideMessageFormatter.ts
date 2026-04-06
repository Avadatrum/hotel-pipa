// src/utils/tideMessageFormatter.ts

interface HoraMare { hour: string; level: number; }
interface DiaData { day: number; weekday_name: string; hours: HoraMare[]; }

export type Language = 'pt' | 'es' | 'en';

function fmtHour(h: string): string {
  return h.slice(0, 5);
}

function getTideType(level: number, mean: number, lang: Language): string {
  const isHigh = level >= mean;
  
  const translations = {
    pt: { high: 'Alta', low: 'Baixa' },
    es: { high: 'Alta', low: 'Baja' },
    en: { high: 'High', low: 'Low' }
  };
  
  return isHigh ? translations[lang].high : translations[lang].low;
}

// Interface para um único dia
export interface TideMessageOptions {
  guestName: string;
  aptNumber: number;
  diaData: DiaData;
  mes: number;
  ano: number;
  portoNome: string;
  portoId: string;
  meanLevel: number;
  language: Language;
}

// Interface para múltiplos dias
export interface TideMessageMultipleOptions {
  guestName: string;
  aptNumber: number;
  tideDataList: DiaData[];
  startDate: { mes: number; ano: number };
  portoNome: string;
  portoId: string;
  meanLevel: number;
  language: Language;
}

// Função para formatar mensagem de um único dia (mantida original)
export function formatTideMessage(options: TideMessageOptions): string {
  const {
    guestName,
    aptNumber,
    diaData,
    mes,
    ano,
    portoNome,
    portoId,
    meanLevel,
    language
  } = options;

  const dataStr = `${diaData.day}/${mes}/${ano}`;
  const weekday = diaData.weekday_name.charAt(0).toUpperCase() + diaData.weekday_name.slice(1);
  
  const translations = {
    pt: {
      title: ' Tábua de Maré - Hotel da Pipa',
      greeting: `Olá ${guestName} do apartamento ${aptNumber}!`,
      forecast: ` Previsão de marés para *${weekday}, ${dataStr}* no ${portoNome}:`,
      reference: `Referência: ${portoNome} (${portoId.toUpperCase()})`,
      meanLevel: ` Nível médio: ${meanLevel.toFixed(2)}m`,
      enjoy: ' Aproveite o dia na praia!',
      footer: ' Dados oficiais da Marinha do Brasil',
      tideTable: ' Horários e Alturas:'
    },
    es: {
      title: ' Tabla de Mareas - Hotel da Pipa',
      greeting: `¡Hola ${guestName} del apartamento ${aptNumber}!`,
      forecast: ` Previsión de mareas para *${weekday}, ${dataStr}* en ${portoNome}:`,
      reference: ` Referencia: ${portoNome} (${portoId.toUpperCase()})`,
      meanLevel: ` Nivel medio: ${meanLevel.toFixed(2)}m`,
      enjoy: ' ¡Disfruta el día en la playa!',
      footer: ' Datos oficiales de la Marina de Brasil',
      tideTable: ' Horarios y Alturas:'
    },
    en: {
      title: ' Tide Table - Hotel da Pipa',
      greeting: `Hello ${guestName} from apartment ${aptNumber}!`,
      forecast: ` Tide forecast for *${weekday}, ${dataStr}* at ${portoNome}:`,
      reference: ` Reference: ${portoNome} (${portoId.toUpperCase()})`,
      meanLevel: ` Mean level: ${meanLevel.toFixed(2)}m`,
      enjoy: ' Enjoy your day at the beach!',
      footer: ' Official data from the Brazilian Navy',
      tideTable: ' Times and Heights:'
    }
  };
  
  const t = translations[language];
  
  const lines: string[] = [
    t.title,
    ``,
    t.greeting,
    ``,
    t.forecast,
    ``,
    t.tideTable,
  ];
  
  diaData.hours.forEach((mare) => {
    const tipo = getTideType(mare.level, meanLevel, language);
    const hora = fmtHour(mare.hour);
    const altura = mare.level.toFixed(2);
    lines.push(`  • ${tipo}: ${hora} - ${altura}m`);
  });
  
  lines.push(
    ``,
    t.reference,
    t.meanLevel,
    ``,
    t.enjoy,
    ``,
    t.footer
  );
  
  return lines.join('\n');
}

// NOVA FUNÇÃO: Formatar mensagem para múltiplos dias (próximos 3 dias)
export function formatMultipleDaysMessage(options: TideMessageMultipleOptions): string {
  const {
    guestName,
    aptNumber,
    tideDataList,
    startDate,
    portoNome,
    portoId,
    meanLevel,
    language
  } = options;

  const translations = {
    pt: {
      title: ' Previsão de Marés - Hotel da Pipa',
      greeting: `Olá ${guestName} do apartamento ${aptNumber}!`,
      intro: ` Previsão para os próximos ${tideDataList.length} dias em ${portoNome}:`,
      reference: ` Referência: ${portoNome} (${portoId.toUpperCase()})`,
      meanLevel: ` Nível médio de referência: ${meanLevel.toFixed(2)}m`,
      tideSchedule: ' Horários e Alturas:',
      enjoy: ' Acompanhe as marés para planejar suas atividades na praia!',
      footer: ' Dados oficiais da Marinha do Brasil',
      daySeparator: '─'.repeat(35)
    },
    es: {
      title: ' Pronóstico de Mareas - Hotel da Pipa',
      greeting: `¡Hola ${guestName} del apartamento ${aptNumber}!`,
      intro: ` Pronóstico para los próximos ${tideDataList.length} días en ${portoNome}:`,
      reference: ` Referencia: ${portoNome} (${portoId.toUpperCase()})`,
      meanLevel: ` Nivel medio de referencia: ${meanLevel.toFixed(2)}m`,
      tideSchedule: ' Horarios y Alturas:',
      enjoy: ' ¡Sigue las mareas para planificar tus actividades en la playa!',
      footer: ' Datos oficiales de la Marina de Brasil',
      daySeparator: '─'.repeat(35)
    },
    en: {
      title: ' Tide Forecast - Hotel da Pipa',
      greeting: `Hello ${guestName} from apartment ${aptNumber}!`,
      intro: ` Forecast for the next ${tideDataList.length} days at ${portoNome}:`,
      reference: ` Reference: ${portoNome} (${portoId.toUpperCase()})`,
      meanLevel: ` Reference mean level: ${meanLevel.toFixed(2)}m`,
      tideSchedule: ' Times and Heights:',
      enjoy: ' Follow the tides to plan your beach activities!',
      footer: ' Official data from the Brazilian Navy',
      daySeparator: '─'.repeat(35)
    }
  };
  
  const t = translations[language];
  
  let message = `${t.title}\n\n`;
  message += `${t.greeting}\n\n`;
  message += `${t.intro}\n\n`;
  
  tideDataList.forEach((tideData, index) => {
    // CORREÇÃO: Removida a variável currentDate que não era usada
    const dateStr = `${tideData.day}/${startDate.mes}/${startDate.ano}`;
    const weekday = tideData.weekday_name.charAt(0).toUpperCase() + tideData.weekday_name.slice(1);
    
    message += ` *${weekday}, ${dateStr}*\n`;
    message += `${t.tideSchedule}\n`;
    
    tideData.hours.forEach((mare) => {
      const tipo = getTideType(mare.level, meanLevel, language);
      const hora = fmtHour(mare.hour);
      const altura = mare.level.toFixed(2);
      message += `  • ${tipo}: ${hora} - ${altura}m\n`;
    });
    
    if (index < tideDataList.length - 1) {
      message += `\n${t.daySeparator}\n\n`;
    }
  });
  
  message += `\n${t.reference}\n`;
  message += `${t.meanLevel}\n\n`;
  message += `${t.enjoy}\n\n`;
  message += `${t.footer}`;
  
  return message;
}

// Função utilitária para determinar se deve usar single ou multiple
export function formatTideMessageAuto(
  params: TideMessageOptions | TideMessageMultipleOptions
): string {
  if ('tideDataList' in params && Array.isArray(params.tideDataList)) {
    return formatMultipleDaysMessage(params);
  } else if ('diaData' in params) {
    return formatTideMessage(params as TideMessageOptions);
  }
  throw new Error('Parâmetros inválidos: forneça diaData ou tideDataList');
}
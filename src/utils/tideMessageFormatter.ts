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
  
  // Traduções
  const translations = {
    pt: {
      title: 'Tábua de Maré - Hotel da Pipa',
      greeting: `Olá ${guestName} do apartamento ${aptNumber}!`,
      forecast: `Previsão de marés para *${weekday}, ${dataStr}* no ${portoNome}:`,
      reference: `Referência: ${portoNome} (${portoId.toUpperCase()})`,
      meanLevel: `Nível médio: ${meanLevel.toFixed(2)}m`,
      enjoy: 'Aproveite o dia na praia!',
      footer: 'Dados oficiais da Marinha do Brasil'
    },
    es: {
      title: 'Tabla de Mareas - Hotel da Pipa',
      greeting: `¡Hola ${guestName} del apartamento ${aptNumber}!`,
      forecast: `Previsión de mareas para *${weekday}, ${dataStr}* en ${portoNome}:`,
      reference: `Referencia: ${portoNome} (${portoId.toUpperCase()})`,
      meanLevel: `Nivel medio: ${meanLevel.toFixed(2)}m`,
      enjoy: '¡Disfruta el día en la playa!',
      footer: 'Datos oficiales de la Marina de Brasil'
    },
    en: {
      title: 'Tide Table - Hotel da Pipa',
      greeting: `Hello ${guestName} from apartment ${aptNumber}!`,
      forecast: `Tide forecast for *${weekday}, ${dataStr}* at ${portoNome}:`,
      reference: `Reference: ${portoNome} (${portoId.toUpperCase()})`,
      meanLevel: `Mean level: ${meanLevel.toFixed(2)}m`,
      enjoy: 'Enjoy your day at the beach!',
      footer: 'Official data from the Brazilian Navy'
    }
  };
  
  const t = translations[language];
  
  // Linhas da mensagem
  const lines: string[] = [
    t.title,
    ``,
    t.greeting,
    ``,
    t.forecast,
    ``,
  ];
  
  // Adiciona cada horário de maré
  diaData.hours.forEach((mare) => {
    const tipo = getTideType(mare.level, meanLevel, language);
    const hora = fmtHour(mare.hour);
    const altura = mare.level.toFixed(2);
    lines.push(`${tipo}: ${hora} - ${altura}m`);
  });
  
  // Adiciona rodapé com informações
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

// Versão resumida para mensagens mais curtas (opcional)
export function formatTideMessageShort(options: TideMessageOptions): string {
  const {
    guestName,
    aptNumber,
    diaData,
    mes,
    ano,
    portoNome,
    meanLevel,
    language
  } = options;

  const dataStr = `${diaData.day}/${mes}/${ano}`;
  
  const tides = diaData.hours.map((mare) => {
    const tipo = getTideType(mare.level, meanLevel, language);
    const hora = fmtHour(mare.hour);
    const altura = mare.level.toFixed(1);
    return `${tipo} ${hora} (${altura}m)`;
  }).join(' | ');
  
  const translations = {
    pt: { prefix: `Marés ${dataStr} - ${portoNome}` },
    es: { prefix: `Mareas ${dataStr} - ${portoNome}` },
    en: { prefix: `Tides ${dataStr} - ${portoNome}` }
  };
  
  const greetings = {
    pt: `Olá ${guestName} (Apto ${aptNumber})!`,
    es: `¡Hola ${guestName} (Apto ${aptNumber})!`,
    en: `Hello ${guestName} (Apt ${aptNumber})!`
  };
  
  const enjoy = {
    pt: 'Bom dia de praia!',
    es: '¡Buen día de playa!',
    en: 'Have a great beach day!'
  };
  
  return `${translations[language].prefix}\n\n${greetings[language]}\n\n${tides}\n\n${enjoy[language]}`;
}
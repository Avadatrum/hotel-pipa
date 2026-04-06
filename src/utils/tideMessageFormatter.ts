// src/utils/tideMessageFormatter.ts

interface HoraMare { hour: string; level: number; }
interface DiaData { day: number; weekday_name: string; hours: HoraMare[]; }

function fmtHour(h: string): string {
  return h.slice(0, 5);
}

function isAlta(level: number, mean: number): boolean {
  return level >= mean;
}

function getTideIcon(level: number, mean: number): string {
  return isAlta(level, mean) ? '🌕' : '🌑';
}

function getTideType(level: number, mean: number): string {
  return isAlta(level, mean) ? 'Alta' : 'Baixa';
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
  distanciaKm?: number; // Mantido como opcional para compatibilidade
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
    distanciaKm = 46
  } = options;

  const dataStr = `${diaData.day}/${mes}/${ano}`;
  const weekday = diaData.weekday_name.charAt(0).toUpperCase() + diaData.weekday_name.slice(1);
  
  // Linhas da mensagem
  const lines: string[] = [
    `🌊 *Tábua de Maré - Hotel da Pipa*`,
    ``,
    `Olá ${guestName} do apartamento ${aptNumber}!`,
    ``,
    `Previsão de marés para *${weekday}, ${dataStr}* no ${portoNome}:`,
    ``,
  ];
  
  // Adiciona cada horário de maré
  diaData.hours.forEach((mare) => {
    const icon = getTideIcon(mare.level, meanLevel);
    const tipo = getTideType(mare.level, meanLevel);
    const hora = fmtHour(mare.hour);
    const altura = mare.level.toFixed(2);
    lines.push(`${icon} *${tipo}*: ${hora} - ${altura}m`);
  });
  
  // Adiciona rodapé com informações (incluindo a distância)
  lines.push(
    ``,
    `📍 *Referência:* ${portoNome} (${portoId.toUpperCase()})`,
    `📏 *Distância da Pipa:* ~${distanciaKm} km`,
    `📊 *Nível médio:* ${meanLevel.toFixed(2)}m`,
    ``,
    `🏖️ *Aproveite o dia na praia!*`,
    ``,
    `_Dados oficiais da Marinha do Brasil_`
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
    distanciaKm = 46
  } = options;

  const dataStr = `${diaData.day}/${mes}/${ano}`;
  
  const tides = diaData.hours.map((mare) => {
    const icon = getTideIcon(mare.level, meanLevel);
    const tipo = getTideType(mare.level, meanLevel);
    const hora = fmtHour(mare.hour);
    const altura = mare.level.toFixed(1);
    return `${icon} ${tipo} ${hora} (${altura}m)`;
  }).join(' | ');
  
  return `🌊 *Marés ${dataStr}* - ${portoNome} (${distanciaKm}km da Pipa)\n\nOlá ${guestName} (Apto ${aptNumber})!\n\n${tides}\n\n🏖️ Bom dia de praia!`;
}
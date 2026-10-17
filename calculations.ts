import { Bet, BetStatus, BankMetrics, DayStats } from '../types';

export const STATUSES: BetStatus[] = [
  'Pendiente',
  'Verde',
  'Media Ganancia',
  'Rojo',
  'Media Pérdida',
  'Devuelto',
];

export const STATUS_COLORS: Record<
  BetStatus,
  { hex: string; textColor: string; textClass?: string }
> = {
  'Verde': {
    hex: '#22e58b',
    textColor: '#ffffff',
  },
  'Media Ganancia': {
    hex: '#65c99a',
    textColor: '#ffffff',
  },
  'Rojo': {
    hex: '#ff555f',
    textColor: '#ffffff',
  },
  'Media Pérdida': {
    hex: '#ff9b72',
    textColor: '#ffffff',
  },
  'Devuelto': {
    hex: '#93c5fd',
    textColor: '#09090b',
  },
  'Pendiente': {
    hex: '#ffd43b',
    textColor: '#09090b',
  },
};

export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getNowTimeString(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/** Formats numbers matching the screenshot: 150,00 or 1448,13 (using comma as decimal separator) */
export function formatNumber(val: number, decimals: number = 2): string {
  const num = Number(val || 0);
  return num.toLocaleString('es-UY', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: false, // In screenshot 1000,00 and 1448,13 don't have thousands dots
  });
}

export function formatMoney(val: number, currency: string = ''): string {
  const formatted = formatNumber(val, 2);
  return currency.trim() ? `${currency} ${formatted}` : formatted;
}

export function formatOdds(val: number): string {
  const num = Number(val || 0);
  // Show up to 3 decimals with comma
  const str = num.toFixed(3).replace('.', ',');
  return str.endsWith(',000') ? num.toFixed(2).replace('.', ',') : str;
}

export function formatPct(val: number): string {
  const num = Number(val || 0);
  const formatted = num.toLocaleString('es-UY', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    useGrouping: false,
  });
  return `${formatted} %`;
}

export function calcProfit(bet: Bet): number {
  const stake = Number(bet.stake) || 0;
  const odds = Number(bet.odds) || 0;

  switch (bet.status) {
    case 'Verde':
      return stake * (odds - 1);
    case 'Media Ganancia':
      return (stake * (odds - 1)) / 2;
    case 'Rojo':
      return -stake;
    case 'Media Pérdida':
      return -stake / 2;
    case 'Devuelto':
      return 0;
    case 'Pendiente':
    default:
      return 0;
  }
}

export function isSettled(bet: Bet): boolean {
  return bet.status !== 'Pendiente';
}

export function getStatsForBets(list: Bet[]): DayStats {
  let won = 0;
  let halfWon = 0;
  let lost = 0;
  let halfLost = 0;
  let returned = 0;
  let pending = 0;
  let staked = 0;
  let profit = 0;

  for (const b of list) {
    staked += Number(b.stake) || 0;
    profit += calcProfit(b);
    switch (b.status) {
      case 'Verde':
        won++;
        break;
      case 'Media Ganancia':
        halfWon++;
        break;
      case 'Rojo':
        lost++;
        break;
      case 'Media Pérdida':
        halfLost++;
        break;
      case 'Devuelto':
        returned++;
        break;
      case 'Pendiente':
      default:
        pending++;
        break;
    }
  }

  return {
    won,
    halfWon,
    lost,
    halfLost,
    returned,
    pending,
    total: list.length,
    staked,
    profit,
  };
}

export function getBankMetrics(allBets: Bet[], initialBank: number, targetDate: string): BankMetrics {
  const start = Number(initialBank) || 0;

  // Previous days cumulative profit
  const prevProfit = allBets
    .filter((b) => b.date < targetDate)
    .reduce((sum, b) => sum + calcProfit(b), 0);

  const startOfDay = start + prevProfit;

  const targetDayBets = allBets.filter((b) => b.date === targetDate);
  const dayProfit = targetDayBets
    .filter(isSettled)
    .reduce((sum, b) => sum + calcProfit(b), 0);

  const inPlay = targetDayBets
    .filter((b) => b.status === 'Pendiente')
    .reduce((sum, b) => sum + (Number(b.stake) || 0), 0);

  const current = startOfDay + dayProfit;
  const available = current - inPlay;

  const totalDayStaked = targetDayBets.reduce((sum, b) => sum + (Number(b.stake) || 0), 0);
  const roi = totalDayStaked > 0 ? (dayProfit / totalDayStaked) * 100 : 0;

  return {
    initial: start,
    startOfDay,
    dayProfit,
    current,
    roi,
    inPlay,
    available,
  };
}

export function generateCSV(bets: Bet[], targetDate?: string): string {
  const headers = [
    'Fecha',
    'Hora',
    'Apuesta',
    'Mercado',
    'Cuota',
    'Apostado',
    'Estado',
    'Ganancia',
    'Notas',
  ];

  const filtered = targetDate ? bets.filter((b) => b.date === targetDate) : bets;
  const rows = filtered.map((b) => [
    b.date,
    b.time || '',
    b.event,
    b.market || '',
    formatOdds(b.odds),
    formatNumber(b.stake),
    b.status,
    formatNumber(calcProfit(b)),
    b.notes || '',
  ]);

  const csvRows = [headers, ...rows].map((row) =>
    row.map((val) => `"${String(val ?? '').replace(/"/g, '""')}"`).join(';')
  );

  return '\ufeff' + csvRows.join('\r\n');
}

export function downloadFile(content: BlobPart, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

export type BetStatus =
  | 'Pendiente'
  | 'Verde'
  | 'Media Ganancia'
  | 'Rojo'
  | 'Media Pérdida'
  | 'Devuelto';

export interface Bet {
  id: string;
  event: string;
  market: string;
  odds: number;
  stake: number;
  status: BetStatus;
  date: string; // 'YYYY-MM-DD'
  time: string; // 'HH:mm'
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AppSettings {
  theme: 'dark' | 'light';
  initialBank: number;
  currency: string;
}

export interface AppDatabase {
  bets: Bet[];
  settings: AppSettings;
}

export interface DayStats {
  won: number;
  halfWon: number;
  lost: number;
  halfLost: number;
  returned: number;
  pending: number;
  total: number;
  staked: number;
  profit: number;
}

export interface BankMetrics {
  initial: number;
  startOfDay: number;
  dayProfit: number;
  current: number;
  roi: number;
  inPlay: number;
  available: number;
}

import { AppDatabase, Bet } from '../types';
import { getTodayString } from './calculations';

const STORAGE_KEY = 'quantbet_v1';

export function loadDatabase(): AppDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.bets)) {
        return {
          bets: parsed.bets,
          settings: {
            theme: parsed.settings?.theme === 'light' ? 'light' : 'dark',
            initialBank: Number(parsed.settings?.initialBank) ?? 1000,
            currency: parsed.settings?.currency || '',
          },
        };
      }
    }
  } catch (err) {
    console.error('Error loading QuantBet from localStorage:', err);
  }

  // Initial starter data matching the user's screenshot
  const today = getTodayString();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  const sampleBets: Bet[] = [
    // Historical bet from yesterday to establish Bank Inicio del Día = 1448.13 (1000 + 448.13)
    {
      id: 'bet-prev-1',
      event: 'Historial acumulado · Balance previo',
      market: 'Acumulado días anteriores',
      odds: 2.12,
      stake: 400,
      status: 'Verde',
      date: yesterday,
      time: '21:00',
      notes: 'Rendimiento anterior consolidado',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    // The exact bet from the screenshot
    {
      id: 'bet-today-1',
      event:
        'FC Kawasaki Frontale vs Shimizu S-Pulse - Total Menos de (3.5) + FC Tokyo vs Kyoto Sanga - Ambos equipos anotarán. Sí',
      market: 'Combinada de Fútbol',
      odds: 2.505,
      stake: 150,
      status: 'Verde',
      date: today,
      time: '00:31',
      notes: '',
      createdAt: new Date().toISOString(),
    },
  ];

  const defaultDb: AppDatabase = {
    bets: sampleBets,
    settings: {
      theme: 'dark',
      initialBank: 1000,
      currency: '',
    },
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultDb));
  } catch {
    // Ignore initial save error
  }

  return defaultDb;
}

export function saveDatabase(db: AppDatabase): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    return true;
  } catch (err) {
    console.error('Error saving QuantBet to localStorage:', err);
    return false;
  }
}

export function clearDatabase(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Error clearing localStorage:', err);
  }
}

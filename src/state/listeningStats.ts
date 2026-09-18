import { getDB } from './db';
import type { ListeningDay } from '../drive/types';

export type { ListeningDay };

export interface DashboardStats {
  todayMinutes: number;
  weekMinutes: number;
  streak: number;
  monthFilesCompleted: number;
  bySource: Record<string, number>;
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function emptyDay(date: string): ListeningDay {
  return { date, totalMinutes: 0, bySource: {}, filesCompleted: 0 };
}

async function updateToday(mutate: (day: ListeningDay) => void): Promise<void> {
  const db = await getDB();
  const date = dayKey(new Date());
  const day = (await db.get('listeningLog', date)) ?? emptyDay(date);
  mutate(day);
  await db.put('listeningLog', day, date);
}

export async function logListeningTime(sourceFolder: string, seconds: number): Promise<void> {
  if (seconds <= 0 || !sourceFolder) return;
  const minutes = seconds / 60;
  await updateToday((day) => {
    day.totalMinutes += minutes;
    day.bySource[sourceFolder] = (day.bySource[sourceFolder] ?? 0) + minutes;
  });
}

export async function logFileCompleted(): Promise<void> {
  await updateToday((day) => { day.filesCompleted += 1; });
}

export async function getAllListeningDays(): Promise<ListeningDay[]> {
  const db = await getDB();
  return db.getAll('listeningLog');
}

export function computeStats(days: ListeningDay[]): DashboardStats {
  const today = dayKey(new Date());
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  const weekAgoStr = dayKey(weekAgo);
  const monthPrefix = today.slice(0, 7);

  let todayMinutes = 0;
  let weekMinutes = 0;
  let monthFilesCompleted = 0;
  const bySource: Record<string, number> = {};
  const datesWithListening = new Set<string>();

  for (const day of days) {
    if (day.date === today) todayMinutes = day.totalMinutes;
    if (day.date >= weekAgoStr) weekMinutes += day.totalMinutes;
    if (day.date.startsWith(monthPrefix)) monthFilesCompleted += day.filesCompleted;
    for (const [src, min] of Object.entries(day.bySource)) {
      bySource[src] = (bySource[src] ?? 0) + min;
    }
    if (day.totalMinutes > 0) datesWithListening.add(day.date);
  }

  // Série : jours consécutifs jusqu'à aujourd'hui (ou hier si rien encore aujourd'hui)
  let streak = 0;
  const cursor = new Date();
  if (!datesWithListening.has(today)) cursor.setDate(cursor.getDate() - 1);
  while (datesWithListening.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { todayMinutes, weekMinutes, streak, monthFilesCompleted, bySource };
}

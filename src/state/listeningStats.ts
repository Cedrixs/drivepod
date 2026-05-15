import { getDB } from './db';

export interface ListeningDay {
  date: string;
  totalMinutes: number;
  bySource: Record<string, number>;
  filesCompleted: number;
}

export interface DashboardStats {
  todayMinutes: number;
  weekMinutes: number;
  streak: number;
  monthFilesCompleted: number;
  bySource: Record<string, number>;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function logListeningTime(sourceFolder: string, seconds: number): Promise<void> {
  if (seconds <= 0 || !sourceFolder) return;
  const db = await getDB();
  const date = todayStr();
  const existing = await db.get('listeningLog', date) as ListeningDay | undefined;
  const day: ListeningDay = existing ?? { date, totalMinutes: 0, bySource: {}, filesCompleted: 0 };
  const minutes = seconds / 60;
  day.totalMinutes += minutes;
  day.bySource[sourceFolder] = (day.bySource[sourceFolder] ?? 0) + minutes;
  await db.put('listeningLog', day, date);
}

export async function logFileCompleted(_sourceFolder: string): Promise<void> {
  const db = await getDB();
  const date = todayStr();
  const existing = await db.get('listeningLog', date) as ListeningDay | undefined;
  const day: ListeningDay = existing ?? { date, totalMinutes: 0, bySource: {}, filesCompleted: 0 };
  day.filesCompleted += 1;
  await db.put('listeningLog', day, date);
}

export async function getAllListeningDays(): Promise<ListeningDay[]> {
  const db = await getDB();
  return db.getAll('listeningLog') as Promise<ListeningDay[]>;
}

export function computeStats(days: ListeningDay[]): DashboardStats {
  const today = todayStr();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  const weekAgoStr = weekAgo.toISOString().slice(0, 10);
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

  // Streak: consecutive days ending today (or yesterday if nothing today yet)
  let streak = 0;
  const cursor = new Date();
  // If no listening today, start from yesterday
  if (!datesWithListening.has(today)) cursor.setDate(cursor.getDate() - 1);
  while (datesWithListening.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { todayMinutes, weekMinutes, streak, monthFilesCompleted, bySource };
}

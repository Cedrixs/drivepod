import { useState, useEffect } from 'react';
import { getAllListeningDays, computeStats } from '../state/listeningStats';
import type { DashboardStats } from '../state/listeningStats';

function fmt(minutes: number): string {
  const m = Math.round(minutes);
  if (m < 1) return '0 min';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r > 0 ? `${h}h ${r}m` : `${h}h`;
}

function StatCard({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div className="bg-white/5 rounded-xl p-4">
      <p className="text-xs text-white/40 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

export function Dashboard(): React.JSX.Element {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    void getAllListeningDays().then((days) => setStats(computeStats(days)));
  }, []);

  if (!stats) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const sources = Object.entries(stats.bySource).sort((a, b) => b[1] - a[1]);
  const maxMin = sources[0]?.[1] ?? 1;

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Top stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Aujourd'hui" value={fmt(stats.todayMinutes)} />
        <StatCard label="Cette semaine" value={fmt(stats.weekMinutes)} />
        <StatCard label="Série" value={stats.streak > 0 ? `${stats.streak} jour${stats.streak > 1 ? 's' : ''}` : '—'} />
        <StatCard label="Terminés ce mois" value={String(stats.monthFilesCompleted)} />
      </div>

      {/* Source breakdown */}
      {sources.length > 0 && (
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Par source</p>
          <div className="space-y-3">
            {sources.map(([src, min]) => (
              <div key={src}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white/70">{src}</span>
                  <span className="text-white/40">{fmt(min)}</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full">
                  <div
                    className="h-full bg-accent rounded-full"
                    style={{ width: `${Math.round((min / maxMin) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.weekMinutes === 0 && (
        <p className="text-center text-sm text-white/30 py-8">
          Commencez à écouter pour voir vos statistiques
        </p>
      )}
    </div>
  );
}

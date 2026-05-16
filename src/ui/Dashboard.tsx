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
    <div style={{
      background: 'var(--surface-1)', border: '1px solid var(--border-1)',
      borderRadius: 'var(--r-lg)', padding: '14px 16px',
    }}>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 500, color: 'var(--text-4)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
        {label}
      </p>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 600, color: 'var(--text-1)', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </p>
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
      <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const sources = Object.entries(stats.bySource).sort((a, b) => b[1] - a[1]);
  const maxMin = sources[0]?.[1] ?? 1;

  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <StatCard label="Aujourd'hui" value={fmt(stats.todayMinutes)} />
        <StatCard label="Cette semaine" value={fmt(stats.weekMinutes)} />
        <StatCard label="Série" value={stats.streak > 0 ? `${stats.streak}j` : '—'} />
        <StatCard label="Terminés / mois" value={String(stats.monthFilesCompleted)} />
      </div>

      {/* Source breakdown */}
      {sources.length > 0 && (
        <div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 500, color: 'var(--text-4)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>
            Par source
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {sources.map(([src, min]) => (
              <div key={src}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>{src}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>{fmt(min)}</span>
                </div>
                <div style={{ height: 3, background: 'var(--surface-3)', borderRadius: 2, overflow: 'hidden' }}>
                  <div
                    style={{ height: '100%', background: 'var(--accent)', borderRadius: 2, width: `${Math.round((min / maxMin) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.weekMinutes === 0 && (
        <p style={{ textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-4)', padding: '32px 0' }}>
          Commencez à écouter pour voir vos statistiques
        </p>
      )}
    </div>
  );
}

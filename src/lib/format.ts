// Helpers d'affichage partagés par toute l'UI (auparavant dupliqués dans
// FileList, PlayerBar, PlayerFull, CapturesList, Dashboard, Settings).

// 90 -> "1:30", 3661 -> "1:01:01", valeurs invalides -> "0:00"
export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

// Durée lisible en minutes : 0.4 -> null, 42 -> "42 min", 125 -> "2h 5m"
export function formatMinutes(minutes: number): string | null {
  const m = Math.round(minutes);
  if (m < 1) return null;
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r > 0 ? `${h}h ${r}m` : `${h}h`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// "Articles" -> "ART." : cote de bibliothèque affichée dans le player
export function abbrev(name: string): string {
  return name.slice(0, 3).toUpperCase() + '.';
}

export function stripMp3(fileName: string): string {
  return fileName.replace(/\.mp3$/i, '');
}

export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return count > 1 ? pluralForm : singular;
}

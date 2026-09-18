// Notifications éphémères, sans dépendance React : n'importe quel module
// (hooks, player, main.tsx) peut en émettre ; le composant Toaster s'abonne.

export type ToastKind = 'info' | 'success' | 'error';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
  action?: ToastAction;
  durationMs: number;
}

export interface ToastOptions {
  kind?: ToastKind;
  action?: ToastAction;
  durationMs?: number;
}

type Listener = (toasts: readonly Toast[]) => void;

const DEFAULT_DURATION_MS: Record<ToastKind, number> = { info: 4_000, success: 4_000, error: 6_000 };
// Au-delà, le plus ancien est retiré : la pile ne doit pas masquer le contenu
const MAX_VISIBLE = 3;

let toasts: readonly Toast[] = [];
let nextId = 1;
const listeners = new Set<Listener>();
const timers = new Map<number, ReturnType<typeof setTimeout>>();

function publish(next: readonly Toast[]): void {
  toasts = next;
  for (const l of listeners) l(toasts);
}

export function dismissToast(id: number): void {
  const timer = timers.get(id);
  if (timer) { clearTimeout(timer); timers.delete(id); }
  if (toasts.some((t) => t.id === id)) publish(toasts.filter((t) => t.id !== id));
}

export function showToast(message: string, options: ToastOptions = {}): number {
  const kind = options.kind ?? 'info';
  const id = nextId++;
  const durationMs = options.durationMs ?? DEFAULT_DURATION_MS[kind];
  const entry: Toast = { id, kind, message, action: options.action, durationMs };

  const next = [...toasts, entry];
  while (next.length > MAX_VISIBLE) {
    const evicted = next.shift();
    if (evicted) dismissToast(evicted.id);
  }
  publish(next);

  if (durationMs > 0) {
    timers.set(id, setTimeout(() => dismissToast(id), durationMs));
  }
  return id;
}

export const toast = {
  info: (message: string, options: Omit<ToastOptions, 'kind'> = {}): number => showToast(message, { ...options, kind: 'info' }),
  success: (message: string, options: Omit<ToastOptions, 'kind'> = {}): number => showToast(message, { ...options, kind: 'success' }),
  error: (message: string, options: Omit<ToastOptions, 'kind'> = {}): number => showToast(message, { ...options, kind: 'error' }),
  dismiss: dismissToast,
};

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function getToasts(): readonly Toast[] {
  return toasts;
}

// Pour les tests
export function clearAllToasts(): void {
  for (const t of toasts) {
    const timer = timers.get(t.id);
    if (timer) clearTimeout(timer);
  }
  timers.clear();
  publish([]);
}

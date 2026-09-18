// Traitement minimal du Markdown produit par le pipeline TTS : on veut du
// texte brut pour les résumés et les captures, pas un rendu fidèle.

export function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/#{1,6}\s+[^\n]*/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\n+/g, ' ')
    .trim();
}

// Les premières phrases du texte, pour l'aperçu en tête de player
export function extractSummary(markdown: string, maxSentences = 4): string {
  const sentences = stripMarkdown(markdown)
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 10);
  return sentences.slice(0, maxSentences).join(' ').trim();
}

// Fenêtre de mots autour de la position d'écoute (proportionnelle à la durée)
export function extractPassage(markdown: string, position: number, duration: number, windowWords = 50): string {
  const words = stripMarkdown(markdown).split(/\s+/).filter((w) => w.length > 0);
  if (!words.length) return '';
  const ratio = duration > 0 ? Math.min(1, position / duration) : 0;
  const center = Math.floor(ratio * words.length);
  return words
    .slice(Math.max(0, center - windowWords), Math.min(words.length, center + windowWords))
    .join(' ');
}

export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Aujourd'hui";
  }
  if (diffDays === 1) {
    return 'Il y a 1 jour';
  }
  if (diffDays < 7) {
    return `Il y a ${diffDays} jours`;
  }

  const day = date.getDate();
  const month = date.toLocaleDateString('fr-FR', { month: 'short' });

  return `${day} ${month}.`;
}


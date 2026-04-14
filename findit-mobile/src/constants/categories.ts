export const CATEGORIES = [
  { value: 'cles', label: 'Clés', icon: '🔑' },
  { value: 'electronique', label: 'Électronique', icon: '📱' },
  { value: 'vetements', label: 'Vêtements', icon: '👕' },
  { value: 'papiers', label: 'Papiers & Documents', icon: '📄' },
  { value: 'animaux', label: 'Animaux', icon: '🐾' },
  { value: 'sac', label: 'Sac & Bagages', icon: '🎒' },
  { value: 'bijoux', label: 'Bijoux & Accessoires', icon: '💍' },
  { value: 'autre', label: 'Autre', icon: '📦' },
] as const;

export type CategoryValue = (typeof CATEGORIES)[number]['value'];

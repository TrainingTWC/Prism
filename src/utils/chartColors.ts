export const getChartPalette = () => {
  // Prefer CSS variables if available in browser; fall back to hex values for SSR/tests
  const primary = (typeof window !== 'undefined' && getComputedStyle(document.documentElement).getPropertyValue('--color-primary')) || '#6C63FF';
  const secondary = (typeof window !== 'undefined' && getComputedStyle(document.documentElement).getPropertyValue('--color-secondary')) || '#4DD0E1';
  const palette = [
    primary.trim() || '#6C63FF',
    secondary.trim() || '#4DD0E1',
    '#22c55e', // green
    '#eab308', // yellow
    '#ef4444'  // red
  ];
  return palette;
};

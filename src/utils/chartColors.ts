const readVar = (name: string, fallback: string) => {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name);
  return v ? v.trim() : fallback;
};

export const getChartPalette = () => {
  const primary = readVar('--color-primary', '#6C63FF');
  const secondary = readVar('--color-secondary', '#4DD0E1');
  return [primary, secondary, '#22c55e', '#eab308', '#ef4444'];
};

// small helper to convert hex (#rrggbb) to rgba with given alpha
export const hexToRgba = (hex: string, alpha = 1) => {
  if (!hex) return `rgba(0,0,0,${alpha})`;
  const h = hex.replace('#', '').trim();
  if (h.length === 3) {
    const r = parseInt(h[0] + h[0], 16);
    const g = parseInt(h[1] + h[1], 16);
    const b = parseInt(h[2] + h[2], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (h.length === 6) {
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  // if it's already rgb/rgba or other format, try to return it as-is
  return hex;
};

export const getChartPaletteWithAlpha = (alpha = 1) => {
  return getChartPalette().map(c => hexToRgba(c, alpha));
};

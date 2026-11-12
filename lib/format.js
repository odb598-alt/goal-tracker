export const nfr = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });
export const nf1 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
export const fmt = (n) => nfr.format(n);
export const money = (n) => fmt(n) + ' $';
export const round2 = (n) => Math.round(n * 100) / 100;
export const plural = (n, one, many) => (n >= 2 ? many : one);
export const pad = (n) => String(n).padStart(2, '0');
export const toStr = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
export const parseDate = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (s, n) => { const d = parseDate(s); d.setDate(d.getDate() + n); return toStr(d); };
export const todayStr = () => toStr(new Date());
export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
export const dateLong = (s) => cap(new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(parseDate(s)));
export const dateShort = (s) => new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(parseDate(s));
export function pctOf(total, goal) {
  if (!(goal > 0)) return 0;
  if (total >= goal) return 100;
  return Math.floor((total / goal) * 1000) / 10;
}
export const pctText = (p) => (Number.isInteger(p) ? String(p) : p.toFixed(1).replace('.', ',')) + ' %';
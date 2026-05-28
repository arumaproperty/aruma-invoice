export function fmtIDR(n: number): string {
  return 'IDR ' + n.toLocaleString('id-ID');
}

export function fmtDate(d: string): string {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function buildInvoiceNumber(counter: number): string {
  const year = new Date().getFullYear();
  return `ARU-${year}-${String(counter).padStart(3, '0')}`;
}

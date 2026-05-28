'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Invoice } from '@/types/invoice';
import { fmtIDR, fmtDate } from '@/lib/format';

export default function InvoiceHistory() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/invoices')
      .then(r => r.json())
      .then(data => { setInvoices(data.reverse()); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ background: '#f2f2f0', minHeight: '100vh' }}>
      <div className="history-page">
        <Link href="/" className="history-back">← New Invoice</Link>
        <h1>Invoice History</h1>
        <div className="sub">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</div>

        {loading && <div style={{ fontSize: 13, color: '#999' }}>Loading…</div>}

        {!loading && invoices.length === 0 && (
          <div style={{ fontSize: 13, color: '#999' }}>No invoices saved yet.</div>
        )}

        {!loading && invoices.length > 0 && (
          <table className="history-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client</th>
                <th>Issued</th>
                <th>Due</th>
                <th>Total</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id}>
                  <td style={{ fontWeight: 600 }}>{inv.invoiceNumber || '—'}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{inv.billTo || '—'}</div>
                    {inv.billCompany && <div style={{ fontSize: 11, color: '#888' }}>{inv.billCompany}</div>}
                  </td>
                  <td style={{ color: '#666' }}>{fmtDate(inv.dateIssued)}</td>
                  <td style={{ color: '#666' }}>{fmtDate(inv.dateDue)}</td>
                  <td style={{ fontWeight: 600 }}>{inv.total ? fmtIDR(inv.total) : '—'}</td>
                  <td>
                    <span className={`status-chip ${inv.status}`}>{inv.status}</span>
                  </td>
                  <td>
                    <Link href={`/?id=${inv.id}`} className="history-link">Open →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

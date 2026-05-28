import { Resend } from 'resend';
import { Invoice } from '@/types/invoice';
import { fmtIDR, fmtDate } from '@/lib/format';

export async function sendInvoiceEmail(invoice: Invoice): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const html = buildEmailHTML(invoice);

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'Aruma Properties <invoice@arumaproperty.com>',
    to: invoice.billEmail,
    subject: `Invoice ${invoice.invoiceNumber} — Aruma Properties`,
    html,
  });
}

function buildEmailHTML(invoice: Invoice): string {
  const DUE_LABELS: Record<string, string> = {
    signing: 'Due on signing',
    '15days': 'Due within 15 days',
    annual: 'Annual payment',
  };

  let total = 0;
  const itemsHTML = invoice.items.map(item => {
    const amt = parseFloat(item.amount) || 0;
    total += amt;
    const lines = item.desc.split('\n').filter(Boolean);
    const dueLabel = item.due ? DUE_LABELS[item.due] : '';
    return `
      <tr>
        <td style="padding:10px 0 10px;font-size:13px;color:#444;border-bottom:1px solid #f0f0f0;vertical-align:top;line-height:1.6;">
          <strong>${lines[0] ?? ''}</strong>
          ${lines.slice(1).map(l => `<br>${l}`).join('')}
          ${dueLabel ? `<br><span style="display:inline-block;font-size:11px;padding:2px 8px;border-radius:8px;background:#f0f0f0;color:#666;margin-top:4px;">${dueLabel}</span>` : ''}
        </td>
        <td style="padding:10px 0 10px;font-size:13px;color:#1a1a1a;font-weight:600;text-align:right;white-space:nowrap;border-bottom:1px solid #f0f0f0;vertical-align:top;">
          ${amt ? fmtIDR(amt) : '—'}
        </td>
      </tr>`;
  }).join('');

  let totalPaid = 0;
  const paidHTML = invoice.paidItems.map(p => {
    const amt = parseFloat(p.amount) || 0;
    totalPaid += amt;
    return `
      <tr>
        <td style="padding:6px 0;font-size:12px;color:#888;font-style:italic;">Less: ${p.desc || 'Payment received'}</td>
        <td style="padding:6px 0;font-size:12px;color:#888;text-align:right;">${amt ? `(${fmtIDR(amt)})` : '—'}</td>
      </tr>`;
  }).join('');

  const balance = Math.max(0, total - totalPaid);
  const termsHTML = invoice.terms.map(t => `<li style="margin-bottom:4px;">${t}</li>`).join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f2f2f0;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;">
  <div style="max-width:640px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background:#1a1a1a;padding:28px 36px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#fff;opacity:0.5;margin-bottom:4px;">Aruma Properties</div>
      <div style="font-size:22px;font-weight:700;color:#fff;">Invoice ${invoice.invoiceNumber}</div>
    </div>
    <!-- Meta -->
    <div style="padding:24px 36px 0;display:flex;justify-content:space-between;border-bottom:1px solid #f0f0f0;padding-bottom:20px;">
      <div>
        <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#bbb;margin-bottom:4px;">Bill To</div>
        <div style="font-size:14px;font-weight:600;color:#1a1a1a;">${invoice.billTo || '—'}</div>
        ${invoice.billCompany ? `<div style="font-size:12px;color:#666;">${invoice.billCompany}</div>` : ''}
        ${invoice.billNpwp ? `<div style="font-size:12px;color:#888;">NPWP: ${invoice.billNpwp}</div>` : ''}
      </div>
      <div style="text-align:right;">
        <div style="font-size:11px;color:#888;">Issued: ${fmtDate(invoice.dateIssued)}</div>
        <div style="font-size:11px;color:#888;margin-top:4px;">Due: ${fmtDate(invoice.dateDue)}</div>
      </div>
    </div>
    <!-- Items table -->
    <div style="padding:0 36px;">
      <table style="width:100%;border-collapse:collapse;margin-top:20px;">
        <tr>
          <td style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#1a1a1a;padding-bottom:8px;border-bottom:2px solid #1a1a1a;">Description</td>
          <td style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#1a1a1a;padding-bottom:8px;border-bottom:2px solid #1a1a1a;text-align:right;">Amount</td>
        </tr>
        ${itemsHTML}
        ${paidHTML}
      </table>
      <!-- Summary -->
      <div style="margin-top:16px;border-top:2px solid #1a1a1a;padding-top:12px;">
        ${invoice.paidItems.length > 0 ? `
        <div style="display:flex;justify-content:space-between;font-size:12px;color:#666;padding:4px 0;">
          <span>Subtotal</span><span>${fmtIDR(total)}</span>
        </div>` : ''}
        <div style="display:flex;justify-content:space-between;font-size:15px;font-weight:700;color:#1a1a1a;padding:8px 0;background:#f7f7f5;padding:8px 12px;border-radius:4px;margin-top:8px;">
          <span>Balance Due</span><span>${fmtIDR(balance)}</span>
        </div>
      </div>
    </div>
    <!-- Terms -->
    ${invoice.terms.length > 0 ? `
    <div style="padding:20px 36px;border-top:1px solid #f0f0f0;margin-top:20px;">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#1a1a1a;margin-bottom:8px;">Terms & Conditions</div>
      <ul style="padding-left:16px;margin:0;font-size:12px;color:#555;line-height:1.7;">${termsHTML}</ul>
    </div>` : ''}
    <!-- Footer -->
    <div style="background:#f7f7f5;padding:20px 36px;margin-top:8px;text-align:center;">
      <div style="font-size:11px;color:#999;">Aruma Properties · Bali, Indonesia</div>
      <div style="font-size:10px;color:#bbb;margin-top:4px;">This is an automated invoice. Please reply to this email for any queries.</div>
    </div>
  </div>
</body>
</html>`;
}

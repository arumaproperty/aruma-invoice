import { Resend } from 'resend';
import { Invoice } from '@/types/invoice';
import { fmtIDR, fmtDate } from '@/lib/format';

const LOGO_URL = 'https://aruma-invoice.vercel.app/logo.png';

export async function sendInvoiceEmail(invoice: Invoice): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const html = buildEmailHTML(invoice);

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'Aruma Properties <invoice@arumaproperty.com>',
    to: invoice.billEmail,
    replyTo: 'info@arumaproperty.com',
    subject: `Invoice ${invoice.invoiceNumber} — Aruma Properties`,
    html,
  });

  if (error) {
    throw new Error(`Resend error: ${JSON.stringify(error)}`);
  }
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
    const badgeBg  = item.due === 'signing' ? '#e8f4e8' : '#fff3e0';
    const badgeClr = item.due === 'signing' ? '#2a6e2a' : '#b85c00';
    return `
      <tr>
        <td style="padding:10px 0;font-size:8pt;color:#444;border-bottom:0.3pt solid #e8e8e8;vertical-align:top;line-height:1.65;">
          <span style="font-weight:600;color:#1a1a1a;">${lines[0] ?? ''}</span>
          ${lines.slice(1).map(l => `<br><span style="color:#666;">${l}</span>`).join('')}
          ${dueLabel ? `<br><span style="display:inline-block;font-size:7pt;padding:1px 6px;border-radius:8px;background:${badgeBg};color:${badgeClr};margin-top:4px;font-weight:600;">${dueLabel}</span>` : ''}
        </td>
        <td style="padding:10px 0;font-size:8pt;color:#1a1a1a;font-weight:600;text-align:right;white-space:nowrap;border-bottom:0.3pt solid #e8e8e8;vertical-align:top;width:38mm;">
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
        <td style="padding:7px 0;font-size:7.5pt;color:#888;font-style:italic;border-bottom:0.3pt solid #f0f0f0;">Less: ${p.desc || 'Payment received'}</td>
        <td style="padding:7px 0;font-size:7.5pt;color:#888;text-align:right;border-bottom:0.3pt solid #f0f0f0;">${amt ? `(${fmtIDR(amt)})` : '—'}</td>
      </tr>`;
  }).join('');

  const balance = Math.max(0, total - totalPaid);
  const termsHTML = invoice.terms.map(t => `<li style="margin-bottom:5px;color:#555;font-size:7.5pt;">${t}</li>`).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#e5e5e3;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:4px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.13);">

    <!-- Top: Logo + Invoice Meta -->
    <div style="padding:20px 28px 16px;border-bottom:0.4pt solid #1a1a1a;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="vertical-align:top;">
            <img src="${LOGO_URL}" alt="Aruma" style="height:40px;display:block;margin-bottom:10px;">
            <div style="font-size:7pt;color:#555;line-height:1.8;">
              PT Aruma Rezeki Bersama<br>
              Jl. Kayu Tulang No. 82, Canggu<br>
              Kuta Utara, Kab. Badung, Bali
            </div>
          </td>
          <td style="vertical-align:top;text-align:right;">
            <div style="font-size:8pt;font-weight:700;color:#1a1a1a;">${invoice.invoiceNumber}</div>
            <div style="font-size:7.5pt;color:#444;line-height:2;margin-top:4px;">
              Issued: ${fmtDate(invoice.dateIssued)}<br>
              Due: ${fmtDate(invoice.dateDue)}
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Bill To -->
    <div style="padding:14px 28px 14px;border-bottom:0.3pt solid #e8e8e8;">
      <div style="font-size:7.5pt;font-weight:700;color:#1a1a1a;margin-bottom:3px;">Bill To</div>
      <div style="font-size:7.5pt;color:#444;line-height:1.8;">
        ${invoice.billTo || '—'}
        ${invoice.billCompany ? `<br>${invoice.billCompany}` : ''}
        ${invoice.billNpwp ? `<br>NPWP: ${invoice.billNpwp}` : ''}
      </div>
    </div>

    <!-- Line Items Table -->
    <div style="padding:0 28px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="font-size:7pt;font-weight:700;color:#1a1a1a;padding:10px 0 7px;border-bottom:0.4pt solid #1a1a1a;">Description</td>
          <td style="font-size:7pt;font-weight:700;color:#1a1a1a;padding:10px 0 7px;border-bottom:0.4pt solid #1a1a1a;text-align:right;width:38mm;">Amount</td>
        </tr>
        ${itemsHTML || `<tr><td colspan="2" style="padding:14px 0;font-size:7.5pt;color:#bbb;text-align:center;border-bottom:0.3pt solid #e8e8e8;">—</td></tr>`}
        ${paidHTML}
      </table>
    </div>

    <!-- Summary -->
    <div style="padding:10px 28px 20px;border-top:0.4pt solid #1a1a1a;margin-top:4px;">
      ${invoice.paidItems.length > 0 ? `
      <table style="width:100%;border-collapse:collapse;margin-bottom:2px;">
        <tr>
          <td style="font-size:7.5pt;color:#555;padding:3px 0;">Subtotal</td>
          <td style="font-size:7.5pt;color:#555;text-align:right;padding:3px 0;font-weight:600;">${fmtIDR(total)}</td>
        </tr>
      </table>` : ''}
      <table style="width:100%;border-collapse:collapse;margin-top:6px;">
        <tr>
          <td style="background:#f7f7f5;padding:10px 12px;border-radius:2pt;">
            <span style="font-size:8.5pt;font-weight:700;color:#1a1a1a;">Balance Due</span>
          </td>
          <td style="background:#f7f7f5;padding:10px 12px;border-radius:2pt;text-align:right;">
            <span style="font-size:8.5pt;font-weight:700;color:#1a1a1a;">${fmtIDR(balance)}</span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Terms -->
    ${invoice.terms.length > 0 ? `
    <div style="padding:14px 28px;border-top:0.3pt solid #e8e8e8;">
      <div style="font-size:7.5pt;font-weight:700;color:#1a1a1a;margin-bottom:6px;">Terms &amp; Conditions</div>
      <ul style="padding-left:14px;margin:0;line-height:1.7;">${termsHTML}</ul>
    </div>` : ''}

    <!-- Bank Details -->
    <div style="padding:14px 28px;border-top:0.4pt solid #e8e8e8;margin-top:auto;">
      <table style="border-collapse:collapse;">
        <tr>
          <td style="font-size:7pt;color:#888;padding:2px 0;width:90px;">Bank</td>
          <td style="font-size:7pt;font-weight:700;color:#1a1a1a;padding:2px 0;">Bank Mandiri</td>
        </tr>
        <tr>
          <td style="font-size:7pt;color:#888;padding:2px 0;">Account</td>
          <td style="font-size:7pt;font-weight:700;color:#1a1a1a;padding:2px 0;">PT. Aruma Rezeki Bersama</td>
        </tr>
        <tr>
          <td style="font-size:7pt;color:#888;padding:2px 0;">No.</td>
          <td style="font-size:7pt;font-weight:700;color:#1a1a1a;padding:2px 0;">175-00-0398918-2</td>
        </tr>
        <tr>
          <td style="font-size:7pt;color:#888;padding:2px 0;">Swift</td>
          <td style="font-size:7pt;font-weight:700;color:#1a1a1a;padding:2px 0;">BMRIIDJAXXX</td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div style="padding:12px 28px;border-top:0.4pt solid #e8e8e8;text-align:center;">
      <div style="font-size:7pt;color:#aaa;">PT Aruma Rezeki Bersama &nbsp;·&nbsp; Bali, Indonesia</div>
      <div style="font-size:6.5pt;color:#ccc;margin-top:3px;">Please reply to this email for any questions regarding this invoice.</div>
    </div>

  </div>
</body>
</html>`;
}

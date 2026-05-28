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
    return `
      <tr>
        <td style="padding:12px 0;font-size:13px;color:#444;border-bottom:1px solid #f0f0f0;vertical-align:top;line-height:1.6;">
          <span style="font-weight:600;color:#1a1a1a;">${lines[0] ?? ''}</span>
          ${lines.slice(1).map(l => `<br><span style="color:#666;">${l}</span>`).join('')}
          ${dueLabel ? `<br><span style="display:inline-block;font-size:11px;padding:2px 8px;border-radius:8px;background:#f0f0f0;color:#666;margin-top:5px;">${dueLabel}</span>` : ''}
        </td>
        <td style="padding:12px 0;font-size:13px;color:#1a1a1a;font-weight:700;text-align:right;white-space:nowrap;border-bottom:1px solid #f0f0f0;vertical-align:top;">
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
        <td style="padding:8px 0;font-size:12px;color:#888;font-style:italic;border-bottom:1px solid #f5f5f5;">Less: ${p.desc || 'Payment received'}</td>
        <td style="padding:8px 0;font-size:12px;color:#888;text-align:right;border-bottom:1px solid #f5f5f5;">${amt ? `(${fmtIDR(amt)})` : '—'}</td>
      </tr>`;
  }).join('');

  const balance = Math.max(0, total - totalPaid);
  const termsHTML = invoice.terms.map(t => `<li style="margin-bottom:6px;color:#555;">${t}</li>`).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f2f2f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

    <!-- Header: Logo + Invoice number -->
    <div style="background:#1a1a1a;padding:28px 36px;display:table;width:100%;box-sizing:border-box;">
      <div style="display:table-cell;vertical-align:middle;">
        <img src="${LOGO_URL}" alt="Aruma" style="height:36px;display:block;">
      </div>
      <div style="display:table-cell;vertical-align:middle;text-align:right;">
        <div style="font-size:10px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.45);margin-bottom:4px;">Invoice</div>
        <div style="font-size:20px;font-weight:700;color:#fff;letter-spacing:0.02em;">${invoice.invoiceNumber}</div>
      </div>
    </div>

    <!-- Bill To + Dates -->
    <div style="background:#fafafa;padding:20px 36px;border-bottom:1px solid #ebebeb;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="vertical-align:top;width:55%;">
            <div style="font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#bbb;margin-bottom:5px;">Bill To</div>
            <div style="font-size:14px;font-weight:700;color:#1a1a1a;">${invoice.billTo || '—'}</div>
            ${invoice.billCompany ? `<div style="font-size:12px;color:#666;margin-top:2px;">${invoice.billCompany}</div>` : ''}
            ${invoice.billNpwp ? `<div style="font-size:11px;color:#999;margin-top:2px;">NPWP: ${invoice.billNpwp}</div>` : ''}
          </td>
          <td style="vertical-align:top;text-align:right;">
            <div style="font-size:11px;color:#999;margin-bottom:4px;">Date Issued</div>
            <div style="font-size:13px;font-weight:600;color:#1a1a1a;margin-bottom:10px;">${fmtDate(invoice.dateIssued)}</div>
            <div style="font-size:11px;color:#999;margin-bottom:4px;">Due Date</div>
            <div style="font-size:13px;font-weight:600;color:#1a1a1a;">${fmtDate(invoice.dateDue)}</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Line Items -->
    <div style="padding:8px 36px 0;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#bbb;padding:12px 0 8px;border-bottom:1.5px solid #1a1a1a;">Description</td>
          <td style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#bbb;padding:12px 0 8px;border-bottom:1.5px solid #1a1a1a;text-align:right;">Amount</td>
        </tr>
        ${itemsHTML || `<tr><td colspan="2" style="padding:16px 0;font-size:12px;color:#bbb;text-align:center;">No items</td></tr>`}
        ${paidHTML}
      </table>
    </div>

    <!-- Summary -->
    <div style="padding:12px 36px 24px;">
      ${invoice.paidItems.length > 0 ? `
      <table style="width:100%;border-collapse:collapse;margin-bottom:4px;">
        <tr>
          <td style="font-size:12px;color:#888;padding:4px 0;">Subtotal</td>
          <td style="font-size:12px;color:#888;text-align:right;padding:4px 0;">${fmtIDR(total)}</td>
        </tr>
      </table>` : ''}
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="background:#f7f7f5;padding:12px 14px;border-radius:6px;">
            <span style="font-size:13px;font-weight:700;color:#1a1a1a;">Balance Due</span>
          </td>
          <td style="background:#f7f7f5;padding:12px 14px;border-radius:6px;text-align:right;">
            <span style="font-size:16px;font-weight:700;color:#1a1a1a;">${fmtIDR(balance)}</span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Bank Details -->
    <div style="padding:16px 36px;border-top:1px solid #ebebeb;border-bottom:${invoice.terms.length > 0 ? '1px solid #ebebeb' : 'none'};">
      <div style="font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#bbb;margin-bottom:10px;">Payment Details</div>
      <table style="border-collapse:collapse;">
        <tr>
          <td style="font-size:12px;color:#888;padding:2px 0;width:100px;">Bank</td>
          <td style="font-size:12px;font-weight:600;color:#1a1a1a;padding:2px 0;">Bank Mandiri</td>
        </tr>
        <tr>
          <td style="font-size:12px;color:#888;padding:2px 0;">Account Name</td>
          <td style="font-size:12px;font-weight:600;color:#1a1a1a;padding:2px 0;">PT. Aruma Rezeki Bersama</td>
        </tr>
        <tr>
          <td style="font-size:12px;color:#888;padding:2px 0;">Account No.</td>
          <td style="font-size:12px;font-weight:600;color:#1a1a1a;padding:2px 0;">175-00-0398918-2</td>
        </tr>
        <tr>
          <td style="font-size:12px;color:#888;padding:2px 0;">Swift Code</td>
          <td style="font-size:12px;font-weight:600;color:#1a1a1a;padding:2px 0;">BMRIIDJAXXX</td>
        </tr>
      </table>
    </div>

    <!-- Terms -->
    ${invoice.terms.length > 0 ? `
    <div style="padding:16px 36px;border-bottom:1px solid #ebebeb;">
      <div style="font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#bbb;margin-bottom:10px;">Terms &amp; Conditions</div>
      <ul style="padding-left:16px;margin:0;font-size:12px;line-height:1.7;">${termsHTML}</ul>
    </div>` : ''}

    <!-- Footer -->
    <div style="padding:18px 36px;background:#f7f7f5;text-align:center;">
      <div style="font-size:11px;color:#aaa;">PT Aruma Rezeki Bersama &nbsp;·&nbsp; Jl. Kayu Tulang No. 82, Canggu, Bali</div>
      <div style="font-size:10px;color:#ccc;margin-top:4px;">Please reply to this email for any questions regarding this invoice.</div>
    </div>

  </div>
</body>
</html>`;
}

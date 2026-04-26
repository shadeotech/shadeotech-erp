const BRAND_HEADER = `
  <div style="background:#1e3a5f;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:24px;">Shadeotech</h1>
  </div>
`

const BRAND_FOOTER = `
  <div style="background:#f3f4f6;padding:16px;border-radius:0 0 8px 8px;text-align:center;border:1px solid #e5e7eb;border-top:0;">
    <p style="margin:0;font-size:12px;color:#6b7280;">Shadeotech &mdash; Window Treatment Specialists</p>
    <p style="margin:4px 0 0;font-size:12px;color:#6b7280;">concierge@shadeotech.com</p>
  </div>
`

export interface TemplateVars {
  customerName?: string
  quoteNumber?: string
  invoiceNumber?: string
  amount?: string
  dueDate?: string
  portalLink?: string
  customBody?: string
}

export interface EmailTemplate {
  id: string
  label: string
  subject: string
  html: (vars: TemplateVars) => string
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'follow_up',
    label: 'Follow Up',
    subject: 'Following up on your inquiry — Shadeotech',
    html: ({ customerName = 'there' }) => `
<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#1f2937;max-width:600px;margin:0 auto;padding:24px;">
${BRAND_HEADER}
<div style="background:#ffffff;padding:24px;border:1px solid #e5e7eb;border-top:0;">
  <p>Hi ${customerName},</p>
  <p>Thank you for your interest in Shadeotech window treatments. We wanted to follow up and see if you have any questions or if there's anything we can help you with.</p>
  <p>We'd love to schedule a free in-home consultation to help you find the perfect solution for your space.</p>
  <p>Feel free to reply to this email or give us a call — we're happy to help.</p>
  <p style="margin-top:24px;">Warm regards,<br/><strong>The Shadeotech Team</strong></p>
</div>
${BRAND_FOOTER}
</body></html>`,
  },
  {
    id: 'quote_reminder',
    label: 'Quote Reminder',
    subject: 'Your quote from Shadeotech is ready',
    html: ({ customerName = 'there', quoteNumber = '', amount = '', portalLink = '' }) => `
<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#1f2937;max-width:600px;margin:0 auto;padding:24px;">
${BRAND_HEADER}
<div style="background:#ffffff;padding:24px;border:1px solid #e5e7eb;border-top:0;">
  <p>Hi ${customerName},</p>
  <p>This is a friendly reminder that your quote${quoteNumber ? ` <strong>${quoteNumber}</strong>` : ''} from Shadeotech is still available for your review.</p>
  ${amount ? `<p><strong>Quote Total:</strong> ${amount}</p>` : ''}
  <p>If you have any questions about the quote or would like to make any changes, please don't hesitate to reach out.</p>
  ${portalLink ? `<p style="text-align:center;margin:24px 0;"><a href="${portalLink}" style="background:#1e3a5f;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">View Your Quote</a></p>` : ''}
  <p style="margin-top:24px;">Warm regards,<br/><strong>The Shadeotech Team</strong></p>
</div>
${BRAND_FOOTER}
</body></html>`,
  },
  {
    id: 'invoice_reminder',
    label: 'Invoice Reminder',
    subject: 'Invoice reminder from Shadeotech',
    html: ({ customerName = 'there', invoiceNumber = '', amount = '', dueDate = '', portalLink = '' }) => `
<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#1f2937;max-width:600px;margin:0 auto;padding:24px;">
${BRAND_HEADER}
<div style="background:#ffffff;padding:24px;border:1px solid #e5e7eb;border-top:0;">
  <p>Hi ${customerName},</p>
  <p>This is a friendly reminder that you have an outstanding invoice${invoiceNumber ? ` (<strong>${invoiceNumber}</strong>)` : ''} from Shadeotech.</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0;">
    ${invoiceNumber ? `<tr><td style="padding:8px;border:1px solid #e5e7eb;color:#6b7280;">Invoice Number</td><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">${invoiceNumber}</td></tr>` : ''}
    ${amount ? `<tr><td style="padding:8px;border:1px solid #e5e7eb;color:#6b7280;">Amount Due</td><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">${amount}</td></tr>` : ''}
    ${dueDate ? `<tr><td style="padding:8px;border:1px solid #e5e7eb;color:#6b7280;">Due Date</td><td style="padding:8px;border:1px solid #e5e7eb;">${dueDate}</td></tr>` : ''}
  </table>
  ${portalLink ? `<p style="text-align:center;margin:24px 0;"><a href="${portalLink}" style="background:#1e3a5f;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Pay Now</a></p>` : ''}
  <p>If you have already made your payment, please disregard this notice. If you have any questions, please contact us.</p>
  <p style="margin-top:24px;">Warm regards,<br/><strong>The Shadeotech Team</strong></p>
</div>
${BRAND_FOOTER}
</body></html>`,
  },
  {
    id: 'general',
    label: 'General Message',
    subject: '',
    html: ({ customerName = 'there', customBody = '' }) => `
<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#1f2937;max-width:600px;margin:0 auto;padding:24px;">
${BRAND_HEADER}
<div style="background:#ffffff;padding:24px;border:1px solid #e5e7eb;border-top:0;">
  <p>Hi ${customerName},</p>
  ${customBody ? customBody.split('\n').map(line => `<p>${line}</p>`).join('') : '<p></p>'}
  <p style="margin-top:24px;">Warm regards,<br/><strong>The Shadeotech Team</strong></p>
</div>
${BRAND_FOOTER}
</body></html>`,
  },
]

export function getTemplate(id: string): EmailTemplate | undefined {
  return EMAIL_TEMPLATES.find(t => t.id === id)
}

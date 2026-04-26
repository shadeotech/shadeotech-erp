import { sendEmail } from './email'

interface AlertItem {
  name: string
  quantity: number
  threshold: number
  type: 'fabric' | 'cassette' | 'component'
}

export async function checkLowStock(item: AlertItem): Promise<void> {
  if (item.quantity > item.threshold) return

  const mailbox = process.env.COMPANY_MAILBOX
  if (!mailbox) {
    console.warn(`[inventory] Low stock: ${item.name} (qty: ${item.quantity}, threshold: ${item.threshold})`)
    return
  }

  const typeLabel = item.type.charAt(0).toUpperCase() + item.type.slice(1)

  await sendEmail({
    to: mailbox,
    subject: `Low Stock Alert — ${item.name}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px">
        <h2 style="color:#dc2626">⚠️ Low Stock Alert</h2>
        <p>The following inventory item has reached a low stock level:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr style="background:#f3f4f6">
            <td style="padding:8px 12px;font-weight:600">Item</td>
            <td style="padding:8px 12px">${item.name}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;font-weight:600">Type</td>
            <td style="padding:8px 12px">${typeLabel}</td>
          </tr>
          <tr style="background:#f3f4f6">
            <td style="padding:8px 12px;font-weight:600">Current Qty</td>
            <td style="padding:8px 12px;color:#dc2626;font-weight:600">${item.quantity}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;font-weight:600">Threshold</td>
            <td style="padding:8px 12px">${item.threshold}</td>
          </tr>
        </table>
        <p>Please create a purchase order to restock this item.</p>
      </div>
    `,
    text: `Low Stock Alert: ${item.name} (${typeLabel}) — Current qty: ${item.quantity}, Threshold: ${item.threshold}. Please create a purchase order.`,
  })
}

export function getFabricThreshold(fabric: { lowStockThreshold?: number }): number {
  return fabric.lowStockThreshold ?? 10
}

export const CASSETTE_THRESHOLD = 20
export const COMPONENT_THRESHOLD = 50

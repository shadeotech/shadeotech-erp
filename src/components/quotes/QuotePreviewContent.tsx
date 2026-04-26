'use client'
import { formatCurrency } from '@/lib/utils'
import type { Quote } from '@/stores/quotesStore'
import { useQuoteOptionsStore } from '@/stores/quoteOptionsStore'

interface CustomerDetails {
  email?: string
  phone?: string
  street?: string
  city?: string
  town?: string
  postcode?: string
  country?: string
}

interface QuotePreviewContentProps {
  quote: Quote
  customerDetails: CustomerDetails | null
  excludeMeasurements?: boolean
}

const HARD_WIRED_TYPES = ['AC 110 V', 'AC 110V Motor']
const RECHARGEABLE_TYPES = ['Motorized', 'Battery Powered', 'Battery powered motor', 'Wand Motor']

function resolveAddonName(name: string, items: Quote['items']): string {
  if (!name.toLowerCase().includes('motor') || name.toLowerCase().includes('uni')) return name
  const hasHardWired = items.some((i) => HARD_WIRED_TYPES.includes(i.controlType || ''))
  const hasRechargeable = items.some((i) => RECHARGEABLE_TYPES.includes(i.controlType || ''))
  if (hasRechargeable && !hasHardWired) return 'Rechargeable Motor'
  if (hasHardWired && !hasRechargeable) return 'Hard Wired Motor'
  return name
}

function isMotorizedItem(controlType: string | undefined): boolean {
  if (!controlType) return false
  const ct = controlType.toLowerCase()
  return ct.includes('motor') || ct.includes('battery') || ct.includes('ac 12') || ct.includes('ac 110')
}

export default function QuotePreviewContent({ quote, customerDetails, excludeMeasurements = false }: QuotePreviewContentProps) {
  const hasAnyMotorizedItem = quote.items.some((i) => isMotorizedItem(i.controlType))
  const termsAndConditions = useQuoteOptionsStore((s) => s.termsAndConditions)

  return (
    <div className="bg-white text-gray-900 p-8 text-[13px]">
      {/* Header: Company left, logo center, customer right */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold mb-3">Estimate</h2>
          <div className="text-xs leading-relaxed text-gray-700">
            <p>Address: 3333 Earhart Dr, Unit 240,</p>
            <p>Carrollton, TX, 75006, USA</p>
            <p>Tel: 469-499-3322</p>
            <p>Fax: 469-499-3323</p>
            <p>Email: info@shadeotech.com</p>
            <p>Web: www.shadeotech.com</p>
          </div>
        </div>
        <div className="flex-shrink-0 mx-4">
          <img
            src="/images/logo.png"
            alt="Logo"
            className="h-14 w-auto object-contain"
            style={{ background: 'transparent' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        </div>
        <div className="text-right text-xs leading-relaxed text-gray-700">
          <p><span className="font-semibold">Name:</span> {quote.customerName}</p>
          {customerDetails?.email && (
            <p><span className="font-semibold">Email:</span> {customerDetails.email}</p>
          )}
          {customerDetails?.phone && (
            <p><span className="font-semibold">Phone:</span> {customerDetails.phone}</p>
          )}
          {quote.sideMark && (
            <p><span className="font-semibold">Side Mark:</span> {quote.sideMark}</p>
          )}
          <p><span className="font-semibold">Date:</span> {new Date(quote.createdAt).toDateString()}</p>
          {quote.expiryDate && (
            <p><span className="font-semibold">Valid Until:</span> {new Date(quote.expiryDate).toDateString()}</p>
          )}
        </div>
      </div>

      {/* Bill To / Ship To */}
      {(customerDetails?.street || quote.shipToStreet) && (
        <div className="flex gap-8 mb-6 text-xs">
          {customerDetails?.street && (
            <div className="flex-1">
              <p className="font-bold text-gray-900 mb-1 border-b border-gray-300 pb-1">Bill To</p>
              <p className="text-gray-700">{quote.customerName}</p>
              <p className="text-gray-700">{[customerDetails.street, customerDetails.city, customerDetails.town, customerDetails.postcode, customerDetails.country].filter(Boolean).join(', ')}</p>
              {customerDetails.email && <p className="text-gray-700">{customerDetails.email}</p>}
              {customerDetails.phone && <p className="text-gray-700">{customerDetails.phone}</p>}
            </div>
          )}
          {quote.shipToStreet && quote.deliveryMethod !== 'PICK_UP' && (
            <div className="flex-1">
              <p className="font-bold text-gray-900 mb-1 border-b border-gray-300 pb-1">
                {quote.deliveryMethod === 'INSTALLED' ? 'Installation Address' : 'Ship To'}
              </p>
              <p className="text-gray-700">{[quote.shipToStreet, quote.shipToCity, quote.shipToState, quote.shipToPostcode, quote.shipToCountry].filter(Boolean).join(', ')}</p>
            </div>
          )}
        </div>
      )}

      {/* Line Items Table */}
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-y-2 border-gray-800">
            <th className="py-2 px-2 text-left font-bold w-8">SL</th>
            <th className="py-2 px-2 text-left font-bold">Name</th>
            <th className="py-2 px-2 text-center font-bold w-12">QTY</th>
            <th className="py-2 px-2 text-right font-bold w-[100px]">Unit Suggested Price</th>
            <th className="py-2 px-2 text-right font-bold w-[100px]">Suggested Price</th>
            <th className="py-2 px-2 text-right font-bold w-[90px]">Unit Price ($)</th>
            <th className="py-2 px-2 text-right font-bold w-[90px]">Total Price ($)</th>
          </tr>
        </thead>
        <tbody>
          {quote.items.map((item, index) => {
            const beforeDiscount = item.basePrice
              ? Math.round(item.basePrice * 1.5)
              : Math.round(item.unitPrice * 1.5)
            const suggestedTotal = beforeDiscount * (item.quantity || 1)

            const fmtDim = (v: number) => {
              const whole = Math.floor(v)
              const frac = +(v - whole).toFixed(4)
              return frac > 0 ? `${whole}, ${frac}` : `${whole}`
            }

            const details: string[] = []
            if (!excludeMeasurements && item.width) details.push(`Width: ${fmtDim(item.width)}`)
            if (!excludeMeasurements && item.length) details.push(`Length: ${fmtDim(item.length)}`)
            if (item.controlType) details.push(`Control Type:${item.controlType.toLowerCase()}`)
            if (item.controlType && (item.controlType.toLowerCase().includes('motor') || item.controlType.toLowerCase().includes('battery'))) {
              details.push(`Motor Name: ${item.controlType}`)
            }
            if (item.controlChainSide) details.push(`Position: ${item.controlChainSide}`)
            if (item.controlChain) details.push(`Remote: ${item.controlChain}`)
            if (item.productName) {
              const fabricPart = item.productName.includes(' - ') ? item.productName.split(' - ').slice(1).join(' - ') : item.productName
              details.push(`Fabric: ${fabricPart}`)
            }
            if (item.mountType) details.push(`Mount Type: ${item.mountType}`)
            if (item.cassetteType) details.push(`Cassette: ${item.cassetteType}`)
            if (item.cassetteColor) details.push(`Cassette Color: ${item.cassetteColor}`)
            if (item.brackets) details.push(`Brackets: ${item.brackets}`)
            if (item.brackets2) details.push(`Bracket Option: ${item.brackets2}`)
            const isMotorized = item.controlType && (
              item.controlType.toLowerCase().includes('motor') ||
              item.controlType.toLowerCase().includes('battery') ||
              item.controlType.toLowerCase().includes('ac 12') ||
              item.controlType.toLowerCase().includes('ac 110')
            )
            if (isMotorized && quote.addOns?.some((a) => a.name?.toLowerCase().includes('hub'))) details.push('Shadoe Smart Hub')
            if (isMotorized && item.solarPanel === 'Yes') details.push('Solar Panel')
            if (isMotorized && quote.addOns?.some((a) => a.name?.toLowerCase().includes('charger'))) details.push('Plug in Charger')
            if (item.springAssist) details.push('Spring Assist')
            if (item.bottomRailType) details.push(`Bottom Rail: ${item.bottomRailType}`)
            if (item.bottomRailColor) details.push(`Bottom Rail Color: ${item.bottomRailColor}`)
            if (item.sideChannel === 'Yes') details.push(`Side Channel: ${item.sideChannelColor || 'Yes'}`)
            if (item.bottomRailSealType) details.push(`Seal Type: ${item.bottomRailSealType}`)
            if (item.roll) details.push(`Roll: ${item.roll}`)
            if (item.roomType) details.push(`Room Type: ${item.roomType}`)
            if (item.stacks) details.push(`Stacks: ${item.stacks}`)
            if (item.fabricWrap && item.fabricWrap !== 'none') details.push(`Fabric Wrap: ${item.fabricWrap === 'same' ? 'Same as cassette' : 'Other'}`)

            const titleParts = [
              item.category?.toUpperCase(),
              item.subcategory ? `${item.subcategory.toUpperCase()}` : '',
              item.subSubcategory ? ` ${item.subSubcategory.toUpperCase()}` : '',
            ].filter(Boolean)

            return (
              <tr key={item.id || index} className="border-b border-gray-200 align-top">
                <td className="py-2 px-2 font-semibold">{index + 1}</td>
                <td className="py-2 px-2">
                  <p className="font-bold text-xs">{titleParts.join('- ')}</p>
                  {details.length > 0 && (
                    <div className="mt-0.5 text-[11px] text-gray-700 leading-relaxed">
                      {details.map((d, i) => (
                        <p key={i}>• {d}</p>
                      ))}
                    </div>
                  )}
                  {(item.fabricImage || item.cassetteImage || (item.fabricWrap === 'other' && item.fabricWrapImage)) && (
                    <div className="mt-1.5 flex gap-2">
                      {item.fabricImage && (
                        <div className="text-center">
                          <img src={item.fabricImage} alt="Fabric" className="h-14 w-14 rounded border border-gray-200 object-cover" crossOrigin="anonymous" />
                          <p className="text-[10px] text-gray-500 mt-0.5">Fabric</p>
                        </div>
                      )}
                      {item.cassetteImage && (
                        <div className="text-center">
                          <img src={item.cassetteImage} alt="Cassette" className="h-14 w-14 rounded border border-gray-200 object-cover" crossOrigin="anonymous" />
                          <p className="text-[10px] text-gray-500 mt-0.5">Cassette</p>
                        </div>
                      )}
                      {item.fabricWrap === 'other' && item.fabricWrapImage && (
                        <div className="text-center">
                          <img src={item.fabricWrapImage} alt="Wrap Fabric" className="h-14 w-14 rounded border border-gray-200 object-cover" crossOrigin="anonymous" />
                          <p className="text-[10px] text-gray-500 mt-0.5">Wrap Fabric</p>
                        </div>
                      )}
                    </div>
                  )}
                </td>
                <td className="py-2 px-2 text-center">{item.quantity || 1}</td>
                <td className="py-2 px-2 text-right">{beforeDiscount.toLocaleString()}</td>
                <td className="py-2 px-2 text-right">{suggestedTotal.toLocaleString()}</td>
                <td className="py-2 px-2 text-right">{(item.unitPrice || 0).toLocaleString()}</td>
                <td className="py-2 px-2 text-right">{(item.totalPrice || 0).toLocaleString()}</td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="border-y-2 border-gray-800 font-bold">
            <td className="py-2 px-2" />
            <td className="py-2 px-2" />
            <td className="py-2 px-2 text-center">
              {quote.items.reduce((s, i) => s + (i.quantity || 1), 0)}
            </td>
            <td className="py-2 px-2" />
            <td className="py-2 px-2 text-right">
              S.Grand: {quote.items.reduce((s, i) => {
                const bp = i.basePrice ? Math.round(i.basePrice * 1.5) : Math.round(i.unitPrice * 1.5)
                return s + bp * (i.quantity || 1)
              }, 0).toLocaleString()}
            </td>
            <td className="py-2 px-2" />
            <td className="py-2 px-2 text-right">
              Grand: {quote.items.reduce((s, i) => s + (i.totalPrice || 0), 0).toLocaleString()}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Add-ons / Upgrades */}
      {quote.addOns && quote.addOns.length > 0 && (
        <div className="mt-4 text-xs">
          <p className="font-bold mb-1">Upgrades:</p>
          {quote.addOns
            .filter((ao) => {
              // Hide Solar Panel add-on if no motorized items exist
              if (ao.name?.toLowerCase().includes('solar') && !hasAnyMotorizedItem) return false
              return true
            })
            .map((ao, idx) => (
              <p key={idx} className="text-gray-700">
                {resolveAddonName(ao.name, quote.items)}: {formatCurrency(ao.pricePerFabric)} × {ao.quantity != null && ao.quantity > 0 ? ao.quantity : ao.fabricCount} = {formatCurrency(ao.total)}
              </p>
            ))}
        </div>
      )}

      {/* Totals */}
      <div className="flex justify-end mt-4">
        <div className="w-64 text-xs space-y-1">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-semibold">{formatCurrency(quote.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax ({quote.taxRate}%):</span>
            <span className="font-semibold">{formatCurrency(quote.taxAmount)}</span>
          </div>
          <div className="border-t border-gray-800 pt-1 flex justify-between font-bold text-sm">
            <span>Total:</span>
            <span>{formatCurrency(quote.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {quote.notes && (
        <div className="mt-4 text-xs text-gray-600">
          <p className="font-bold text-gray-800 mb-1">Notes:</p>
          <p className="whitespace-pre-wrap">{quote.notes}</p>
        </div>
      )}

      {/* Terms & Conditions */}
      <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-600">
        <p className="font-bold text-gray-800 mb-2">Terms &amp; Conditions:</p>
        <ol className="space-y-1 list-none pl-0">
          {termsAndConditions.split('\n').filter(Boolean).map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ol>
      </div>
    </div>
  )
}

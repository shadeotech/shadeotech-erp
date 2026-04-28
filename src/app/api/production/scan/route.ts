import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import ProductionOrder from '@/lib/models/ProductionOrder'
import InventoryFabric from '@/lib/models/InventoryFabric'
import InventoryComponent from '@/lib/models/InventoryComponent'
import { verifyAuth } from '@/lib/auth'
import { SCAN_STATIONS, STAGE_ORDER } from '@/constants/productionStages'

function parseQR(raw: string): Record<string, string> {
  const fields: Record<string, string> = {}
  for (const line of raw.trim().split('\n')) {
    const idx = line.indexOf(':')
    if (idx > 0) fields[line.substring(0, idx)] = line.substring(idx + 1)
  }
  return fields
}

function buildSpecSheet(stationId: string, item: any, order: any) {
  switch (stationId) {
    case 'production_check':
      return {
        title: 'Production Check — Full Spec Review',
        sections: [
          {
            label: 'Dimensions',
            fields: [
              { label: 'Width', value: item.width, highlight: true },
              { label: 'Drop', value: item.length, highlight: true },
              { label: 'Mount', value: item.mount },
            ],
          },
          {
            label: 'Materials',
            fields: [
              { label: 'Product', value: item.product },
              { label: 'Fabric', value: item.fabric, highlight: true },
              { label: 'Collection', value: item.collection || '—' },
              { label: 'Cassette', value: item.cassetteTypeColor || '—' },
              { label: 'Bottom Rail', value: item.bottomRail || '—' },
              { label: 'Operation', value: item.operation },
            ],
          },
          {
            label: 'Order Info',
            fields: [
              { label: 'Customer', value: order.customerName },
              { label: 'Side Mark', value: order.sideMark || '—' },
              { label: 'Area / Room', value: item.area || '—' },
              { label: 'Notes', value: order.notes || '—' },
            ],
          },
        ],
      }

    case 'components_cut':
      return {
        title: 'Components Station — Metal & Hardware',
        sections: [
          {
            label: 'Cut Dimensions (Inches)',
            fields: [
              { label: 'Tube Width', value: item.width, highlight: true },
              { label: 'Hem Bar Width', value: item.width, highlight: true },
              { label: 'Drop', value: item.length, highlight: true },
            ],
          },
          {
            label: 'Components Required',
            fields: [
              { label: 'Cassette Type', value: item.cassetteTypeColor || '—' },
              { label: 'Bottom Rail', value: item.bottomRail || '—' },
              { label: 'Side Guide / Chain', value: item.sideChain || '—' },
              { label: 'Brackets', value: item.brackets || '—' },
            ],
          },
        ],
      }

    case 'fabric_cut':
      return {
        title: 'Fabric Cutting — Precise Cut Required',
        sections: [
          {
            label: 'Cut Dimensions (Inches)',
            fields: [
              { label: 'Cut Width', value: item.width, highlight: true },
              { label: 'Cut Drop', value: item.length, highlight: true },
            ],
          },
          {
            label: 'Fabric Details',
            fields: [
              { label: 'Fabric Name', value: item.fabric, highlight: true },
              { label: 'Collection', value: item.collection || '—' },
              { label: 'Mount Type', value: item.mount || '—' },
            ],
          },
        ],
      }

    case 'assembly':
      return {
        title: 'Assembly Bench — Build Instructions',
        sections: [
          {
            label: 'Control',
            fields: [
              { label: 'Control Type', value: item.operation, highlight: true },
              { label: 'Control Side', value: item.controlSide || '—', highlight: true },
            ],
          },
          ...(item.operation === 'MOTORIZED'
            ? [{
                label: 'Motor Details',
                fields: [
                  { label: 'Motor', value: item.motor || '—', highlight: true },
                  { label: 'Motor Type / SKU', value: item.motorType || '—' },
                  { label: 'Remote Control', value: item.remoteControl || '—' },
                  { label: 'Remote No.', value: item.remoteNumber || '—' },
                  { label: 'Channel #', value: item.channelNumber || '—' },
                  { label: 'Smart Hub', value: item.smartAccessoriesType || '—' },
                ],
              }]
            : [{
                label: 'Manual Control',
                fields: [
                  { label: 'Cord / Chain', value: item.cordChain || '—', highlight: true },
                  { label: 'Cord Color', value: item.cordChainColor || '—' },
                ],
              }]),
          {
            label: 'Hardware',
            fields: [
              { label: 'Bracket Type', value: item.brackets || '—' },
              { label: 'Cassette', value: item.cassetteTypeColor || '—' },
              { label: 'Bottom Rail', value: item.bottomRail || '—' },
            ],
          },
        ],
      }

    case 'qc':
      return {
        title: 'Quality Control — All Points Must Pass',
        isQC: true,
        sections: [
          {
            label: 'Verification Spec',
            fields: [
              { label: 'Width', value: item.width, highlight: true },
              { label: 'Drop', value: item.length, highlight: true },
              { label: 'Product', value: item.product },
              { label: 'Fabric', value: item.fabric },
              { label: 'Operation', value: item.operation },
              { label: 'Control Side', value: item.controlSide || '—' },
            ],
          },
        ],
      }

    case 'packing':
      return {
        title: 'Packing Station',
        sections: [
          {
            label: 'Package Requirements',
            fields: [
              { label: 'Product', value: item.product, highlight: true },
              { label: 'Width', value: item.width, highlight: true },
              { label: 'Drop', value: item.length, highlight: true },
              { label: 'Area / Room', value: item.area || '—' },
              { label: 'Special Instructions', value: item.mount || '—' },
            ],
          },
          {
            label: 'Order Info',
            fields: [
              { label: 'Customer', value: order.customerName },
              { label: 'Order No.', value: order.orderNumber },
              { label: 'Delivery Method', value: order.deliveryMethod || 'INSTALLATION' },
              { label: 'Side Mark', value: order.sideMark || '—' },
            ],
          },
        ],
      }

    case 'outbound':
      return {
        title: 'Outbound / Dispatch',
        sections: [
          {
            label: 'Dispatch Info',
            fields: [
              { label: 'Customer', value: order.customerName, highlight: true },
              { label: 'Delivery Method', value: order.deliveryMethod || 'INSTALLATION', highlight: true },
              { label: 'Order No.', value: order.orderNumber },
              { label: 'Install Date', value: order.installationDate ? new Date(order.installationDate).toLocaleDateString() : '—' },
              { label: 'Side Mark', value: order.sideMark || '—' },
            ],
          },
          {
            label: 'Item',
            fields: [
              { label: 'Area / Room', value: item.area || '—' },
              { label: 'Product', value: item.product },
              { label: 'Size', value: `${item.width} × ${item.length}` },
              { label: 'Operation', value: item.operation },
            ],
          },
        ],
      }

    default:
      return { title: 'Unknown Station', sections: [] }
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    const body = await request.json()
    const { qrCode, stationId, action = 'scan', qcPassed } = body

    if (!qrCode || !stationId) {
      return NextResponse.json({ error: 'qrCode and stationId are required' }, { status: 400 })
    }

    const station = SCAN_STATIONS.find(s => s.id === stationId)
    if (!station) return NextResponse.json({ error: 'Unknown station ID' }, { status: 400 })

    const fields = parseQR(qrCode)
    const orderNumber = fields['ORDER']
    const itemId = fields['ITEM_ID']
    const area = fields['AREA']

    if (!orderNumber) {
      return NextResponse.json({ error: 'Invalid QR — missing ORDER field' }, { status: 400 })
    }

    const order = await ProductionOrder.findOne({ orderNumber }).lean() as any
    if (!order) return NextResponse.json({ error: `Order "${orderNumber}" not found` }, { status: 404 })

    let item: any = null
    if (itemId) item = order.items.find((i: any) => i._id?.toString() === itemId)
    if (!item && area && area !== '—') item = order.items.find((i: any) => i.area === area)
    if (!item && order.items.length === 1) item = order.items[0]

    if (!item) {
      return NextResponse.json({ error: 'Could not identify item from QR code — scan label again or use a newer label' }, { status: 404 })
    }

    const spec = buildSpecSheet(stationId, item, order)
    const stageAlreadyDone = (item.itemStages || []).some((s: any) => s.stage === station.stage)

    if (action === 'scan') {
      return NextResponse.json({
        order: {
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          sideMark: order.sideMark,
          deliveryMethod: order.deliveryMethod,
        },
        item: {
          _id: item._id?.toString(),
          area: item.area,
          product: item.product,
          qty: item.qty,
          width: item.width,
          length: item.length,
        },
        currentStage: item.currentItemStage || 'RECEIVED',
        itemStages: (item.itemStages || []).map((s: any) => ({
          stage: s.stage,
          completedAt: s.completedAt,
          stationId: s.stationId,
          completedByName: s.completedByName,
        })),
        stageAlreadyDone,
        spec,
        station: { id: station.id, label: station.label, stage: station.stage, color: station.color },
      })
    }

    if (action === 'complete') {
      if (station.id === 'qc' && !qcPassed) {
        return NextResponse.json({ error: 'All QC checklist items must be passed before completing this stage' }, { status: 400 })
      }

      // Use the native MongoDB collection directly — bypasses Mongoose validation
      // and middleware entirely, so no schema constraints can block the write.
      const col = ProductionOrder.collection

      const stageEntry = {
        stage: station.stage,
        completedAt: new Date(),
        stationId,
        completedBy: auth.userId,
        completedByName: auth.email,
      }

      // 1 — push stage entry + set currentItemStage on the matched item
      await col.updateOne(
        { orderNumber, 'items._id': item._id },
        {
          $push: { 'items.$.itemStages': stageEntry } as any,
          $set:  { 'items.$.currentItemStage': station.stage },
        }
      )

      // 2 — advance order-level status + stageCompletions + activity (one round trip)
      const newStageIndex     = STAGE_ORDER.indexOf(station.stage)
      const currentStatusIndex = STAGE_ORDER.indexOf(order.status as any)
      const shouldAdvance      = newStageIndex > currentStatusIndex

      const pushDoc: Record<string, any> = {
        activity: {
          action: `Stage: ${station.label}`,
          user: auth.userId,
          userName: auth.email,
          timestamp: new Date(),
          details: `Item "${item.area || item.product}" completed at ${station.label}`,
        },
      }
      const setDoc: Record<string, any> = {}

      if (shouldAdvance) {
        pushDoc.stageCompletions = {
          status: station.stage,
          completedBy: auth.email || auth.userId,
          completedAt: new Date(),
        }
        setDoc.status = station.stage
      }

      const orderUpdate: Record<string, any> = { $push: pushDoc }
      if (Object.keys(setDoc).length) orderUpdate.$set = setDoc

      await col.updateOne({ orderNumber }, orderUpdate)

      // 3 — inventory deduction (best-effort)
      if (station.deductsInventory === 'fabric' && item.fabric) {
        await InventoryFabric.findOneAndUpdate(
          { name: { $regex: new RegExp(item.fabric.trim(), 'i') } },
          { $inc: { quantity: -1 } }
        ).catch(() => {})
      }
      if (station.deductsInventory === 'components') {
        await InventoryComponent.findOneAndUpdate(
          { name: { $regex: new RegExp(item.cassetteTypeColor?.split(',')[0]?.trim() || 'cassette', 'i') } },
          { $inc: { quantity: -1 } }
        ).catch(() => {})
      }

      return NextResponse.json({ success: true, stage: station.stage })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('[/api/production/scan] error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg || 'Internal server error' }, { status: 500 })
  }
}

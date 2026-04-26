import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import PurchaseOrder from '@/lib/models/PurchaseOrder';
import InventoryFabric from '@/lib/models/InventoryFabric';
import InventoryCassette from '@/lib/models/InventoryCassette';
import InventoryComponent from '@/lib/models/InventoryComponent';
import { verifyAuth } from '@/lib/auth';
import { checkLowStock, getFabricThreshold, CASSETTE_THRESHOLD, COMPONENT_THRESHOLD } from '@/lib/inventoryAlerts';
import mongoose from 'mongoose';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authPayload = await verifyAuth(request);
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const id = params.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }
    await connectDB();
    const po = await PurchaseOrder.findById(id);
    if (!po) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      items: receiveItems,
      invoiceDate,
      invoiceNo,
      invoiceFileUrl,
      receivedBy,
      notes,
    } = body;

    if (!receiveItems || !Array.isArray(receiveItems)) {
      return NextResponse.json({ error: 'items array is required' }, { status: 400 });
    }

    for (const ri of receiveItems) {
      const lineIndex = ri.lineIndex;
      if (lineIndex === undefined || lineIndex < 0 || lineIndex >= po.items.length) continue;

      const line = po.items[lineIndex];
      if (ri.qtyReceived !== undefined) line.qtyReceived = Number(ri.qtyReceived) || 0;
      if (ri.fullyReceived !== undefined) line.fullyReceived = ri.fullyReceived === true || ri.fullyReceived === 'Yes';
      if (ri.forceClosed !== undefined) line.forceClosed = ri.forceClosed === true;
      if (invoiceDate) line.invoiceDate = new Date(invoiceDate);
      if (invoiceNo) line.invoiceNo = String(invoiceNo).trim();
      if (invoiceFileUrl) line.invoiceFileUrl = String(invoiceFileUrl).trim();
      if (receivedBy) line.receivedBy = String(receivedBy).trim();
      if (notes) line.lineNotes = String(notes).trim();

      // Increment physical inventory when fully received
      if ((line.fullyReceived || line.forceClosed) && line.itemId && line.qtyReceived > 0) {
        const qty = line.qtyReceived;
        const itemId = line.itemId.toString();
        const itemType = (line.itemType || '').toLowerCase();

        if (itemType === 'fabric') {
          const fabric = await InventoryFabric.findById(itemId);
          if (fabric) {
            fabric.quantity += qty;
            await fabric.save();
            checkLowStock({ name: fabric.name, quantity: fabric.quantity, threshold: getFabricThreshold(fabric), type: 'fabric' }).catch(console.error);
          }
        } else if (itemType === 'cassette') {
          const cassette = await InventoryCassette.findById(itemId);
          if (cassette) {
            cassette.quantity += qty;
            await cassette.save();
            checkLowStock({ name: `${cassette.type} ${cassette.color}`, quantity: cassette.quantity, threshold: CASSETTE_THRESHOLD, type: 'cassette' }).catch(console.error);
          }
        } else if (itemType === 'component' || itemType === 'option') {
          const component = await InventoryComponent.findById(itemId);
          if (component) {
            component.quantity += qty;
            await component.save();
            checkLowStock({ name: component.name, quantity: component.quantity, threshold: COMPONENT_THRESHOLD, type: 'component' }).catch(console.error);
          }
        }
      }
    }

    // Recalculate overall status
    const allDone = po.items.every(line => line.fullyReceived || line.forceClosed);
    const anyReceived = po.items.some(line => line.qtyReceived > 0 || line.fullyReceived);
    if (allDone) {
      po.status = 'FULLY_RECEIVED';
    } else if (anyReceived) {
      po.status = 'PARTIALLY_RECEIVED';
    }

    await po.save();

    return NextResponse.json({
      purchaseOrder: {
        _id: po._id.toString(),
        poNumber: po.poNumber,
        supplier: po.supplier,
        orderDate: po.orderDate,
        status: po.status,
        notes: po.notes || '',
        items: po.items.map((item: any) => ({
          _id: item._id?.toString(),
          itemType: item.itemType,
          itemId: item.itemId?.toString() || undefined,
          itemName: item.itemName,
          itemCode: item.itemCode || '',
          unitType: item.unitType || 'Each',
          qtyOrdered: item.qtyOrdered ?? 0,
          qtyReceived: item.qtyReceived ?? 0,
          fullyReceived: item.fullyReceived ?? false,
          forceClosed: item.forceClosed ?? false,
          invoiceDate: item.invoiceDate || undefined,
          invoiceNo: item.invoiceNo || '',
          invoiceFileUrl: item.invoiceFileUrl || undefined,
          receivedBy: item.receivedBy || '',
          lineNotes: item.lineNotes || '',
        })),
        updatedAt: po.updatedAt,
      },
    });
  } catch (error) {
    console.error('Purchase order receive POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import PurchaseOrder from '@/lib/models/PurchaseOrder';
import InventoryFabric from '@/lib/models/InventoryFabric';
import InventoryCassette from '@/lib/models/InventoryCassette';
import InventoryComponent from '@/lib/models/InventoryComponent';
import { verifyAuth } from '@/lib/auth';
import mongoose from 'mongoose';

function toApi(doc: any) {
  return {
    _id: doc._id.toString(),
    poNumber: doc.poNumber,
    supplier: doc.supplier,
    orderDate: doc.orderDate,
    status: doc.status,
    notes: doc.notes || '',
    items: (doc.items || []).map((item: any) => ({
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
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function getInventoryModel(itemType: string) {
  switch (itemType?.toLowerCase()) {
    case 'fabric': return InventoryFabric;
    case 'cassette': return InventoryCassette;
    case 'component': return InventoryComponent;
    default: return null;
  }
}

export async function PATCH(
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
    const doc = await PurchaseOrder.findById(id);
    if (!doc) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
    }
    const body = await request.json();

    if (body.supplier !== undefined) doc.supplier = String(body.supplier).trim();
    if (body.orderDate !== undefined) doc.orderDate = new Date(body.orderDate);
    if (body.notes !== undefined) doc.notes = body.notes ? String(body.notes).trim() : undefined;
    if (body.status !== undefined) doc.status = body.status;

    if (body.items !== undefined) {
      // Snapshot old qtyReceived before overwrite
      const oldReceived = new Map<string, number>(
        (doc.items as any[]).map((item: any) => [
          item._id?.toString(),
          item.qtyReceived ?? 0,
        ])
      );

      doc.items = body.items;

      // For each item with a delta in qtyReceived, update the linked inventory
      const inventoryUpdates: Promise<any>[] = [];
      for (const newItem of doc.items as any[]) {
        const prevQty = oldReceived.get(newItem._id?.toString()) ?? 0;
        const delta = (newItem.qtyReceived ?? 0) - prevQty;
        if (delta > 0 && newItem.itemId && mongoose.Types.ObjectId.isValid(newItem.itemId)) {
          const Model = getInventoryModel(newItem.itemType);
          if (Model) {
            inventoryUpdates.push(
              Model.findByIdAndUpdate(newItem.itemId, { $inc: { quantity: delta } })
            );
          }
        }
      }
      if (inventoryUpdates.length > 0) {
        await Promise.all(inventoryUpdates);
      }

      // Auto-update PO status based on received quantities
      const allItems = doc.items as any[];
      const allFullyReceived = allItems.every(
        (item: any) => item.fullyReceived || item.forceClosed
      );
      const anyReceived = allItems.some((item: any) => (item.qtyReceived ?? 0) > 0);
      if (allFullyReceived && allItems.length > 0) {
        doc.status = 'FULLY_RECEIVED';
      } else if (anyReceived && doc.status === 'SENT') {
        doc.status = 'PARTIALLY_RECEIVED';
      }
    }

    await doc.save();
    return NextResponse.json({ purchaseOrder: toApi(doc.toObject()) });
  } catch (error) {
    console.error('Purchase order PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authPayload = await verifyAuth(_request);
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const id = params.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }
    await connectDB();
    const doc = await PurchaseOrder.findById(id);
    if (!doc) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
    }
    if (doc.status !== 'DRAFT') {
      return NextResponse.json({ error: 'Only DRAFT purchase orders can be deleted' }, { status: 400 });
    }
    await PurchaseOrder.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Purchase order DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

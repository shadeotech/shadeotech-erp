import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import PurchaseOrder from '@/lib/models/PurchaseOrder';
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
    if (body.items !== undefined) doc.items = body.items;
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

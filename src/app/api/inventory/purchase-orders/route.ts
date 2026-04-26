import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import PurchaseOrder from '@/lib/models/PurchaseOrder';
import { verifyAuth } from '@/lib/auth';

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

async function generatePoNumber(): Promise<string> {
  const last = await PurchaseOrder.findOne({}).sort({ createdAt: -1 }).select('poNumber').lean() as any;
  if (!last?.poNumber) return 'PO-0001';
  const match = last.poNumber.match(/PO-(\d+)/);
  const next = match ? parseInt(match[1], 10) + 1 : 1;
  return `PO-${String(next).padStart(4, '0')}`;
}

export async function GET(request: NextRequest) {
  try {
    const authPayload = await verifyAuth(request);
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const query = statusFilter ? { status: statusFilter } : {};
    const items = await PurchaseOrder.find(query).sort({ orderDate: -1 }).lean();
    return NextResponse.json({ purchaseOrders: items.map(toApi) });
  } catch (error) {
    console.error('Purchase orders GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authPayload = await verifyAuth(request);
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    const body = await request.json();
    const { supplier, orderDate, notes, items } = body;
    if (!supplier?.trim()) {
      return NextResponse.json({ error: 'Supplier is required' }, { status: 400 });
    }
    const poNumber = await generatePoNumber();
    const doc = await PurchaseOrder.create({
      poNumber,
      supplier: supplier.trim(),
      orderDate: orderDate ? new Date(orderDate) : new Date(),
      notes: notes?.trim() || undefined,
      status: 'DRAFT',
      items: (items || []).map((item: any) => ({
        itemType: item.itemType || 'Component',
        itemId: item.itemId || undefined,
        itemName: item.itemName?.trim() || '',
        itemCode: item.itemCode?.trim() || undefined,
        unitType: item.unitType?.trim() || 'Each',
        qtyOrdered: Number(item.qtyOrdered) || 0,
        qtyReceived: 0,
        fullyReceived: false,
        forceClosed: false,
      })),
    });
    return NextResponse.json({ purchaseOrder: toApi(doc.toObject()) }, { status: 201 });
  } catch (error) {
    console.error('Purchase orders POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

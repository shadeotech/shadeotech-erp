import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import InventoryComponent from '@/lib/models/InventoryComponent';
import { verifyAuth } from '@/lib/auth';

function toApi(doc: any) {
  return {
    _id: doc._id.toString(),
    name: doc.name,
    type: doc.type || '',
    quantity: doc.quantity ?? 0,
    unit: doc.unit || 'pieces',
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function GET(request: NextRequest) {
  try {
    const authPayload = await verifyAuth(request);
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    const items = await InventoryComponent.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ components: items.map(toApi) });
  } catch (error) {
    console.error('Inventory components GET error:', error);
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
    const { name, type, quantity, unit } = body;
    const doc = await InventoryComponent.create({
      name: name?.trim() || '',
      type: type?.trim() || '',
      quantity: typeof quantity === 'number' ? quantity : Number(quantity) || 0,
      unit: unit?.trim() || 'pieces',
    });
    return NextResponse.json({ component: toApi(doc.toObject()) }, { status: 201 });
  } catch (error) {
    console.error('Inventory components POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

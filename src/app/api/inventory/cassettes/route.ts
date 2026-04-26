import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import InventoryCassette from '@/lib/models/InventoryCassette';
import { verifyAuth } from '@/lib/auth';

function toApi(doc: any) {
  return {
    _id: doc._id.toString(),
    type: doc.type,
    color: doc.color || '',
    specs: doc.specs || '',
    quantity: doc.quantity ?? 0,
    image: doc.image,
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
    const items = await InventoryCassette.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ cassettes: items.map(toApi) });
  } catch (error) {
    console.error('Inventory cassettes GET error:', error);
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
    const { type, color, specs, quantity, image } = body;
    const doc = await InventoryCassette.create({
      type: type === 'Round' ? 'Round' : 'Square',
      color: color?.trim() || '',
      specs: specs?.trim() || '',
      quantity: typeof quantity === 'number' ? quantity : Number(quantity) || 0,
      image: image?.trim() || undefined,
    });
    return NextResponse.json({ cassette: toApi(doc.toObject()) }, { status: 201 });
  } catch (error) {
    console.error('Inventory cassettes POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

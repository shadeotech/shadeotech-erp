import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import InventoryComponent from '@/lib/models/InventoryComponent';
import { verifyAuth } from '@/lib/auth';
import mongoose from 'mongoose';

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
    const doc = await InventoryComponent.findById(id);
    if (!doc) {
      return NextResponse.json({ error: 'Component not found' }, { status: 404 });
    }
    const body = await request.json();
    if (body.name !== undefined) doc.name = String(body.name).trim();
    if (body.type !== undefined) doc.type = String(body.type).trim();
    if (body.quantity !== undefined) doc.quantity = typeof body.quantity === 'number' ? body.quantity : Number(body.quantity) || 0;
    if (body.unit !== undefined) doc.unit = String(body.unit).trim() || 'pieces';
    await doc.save();
    return NextResponse.json({ component: toApi(doc.toObject()) });
  } catch (error) {
    console.error('Inventory component PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authPayload = await verifyAuth(req);
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const id = params.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }
    await connectDB();
    const doc = await InventoryComponent.findByIdAndDelete(id);
    if (!doc) {
      return NextResponse.json({ error: 'Component not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Inventory component DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

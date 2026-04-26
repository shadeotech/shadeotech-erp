import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import InventoryCassette from '@/lib/models/InventoryCassette';
import { verifyAuth } from '@/lib/auth';
import mongoose from 'mongoose';

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
    const doc = await InventoryCassette.findById(id);
    if (!doc) {
      return NextResponse.json({ error: 'Cassette not found' }, { status: 404 });
    }
    const body = await request.json();
    if (body.type !== undefined) doc.type = body.type === 'Round' ? 'Round' : 'Square';
    if (body.color !== undefined) doc.color = String(body.color).trim();
    if (body.specs !== undefined) doc.specs = String(body.specs).trim();
    if (body.quantity !== undefined) doc.quantity = typeof body.quantity === 'number' ? body.quantity : Number(body.quantity) || 0;
    if (body.image !== undefined) doc.image = body.image ? String(body.image).trim() : undefined;
    await doc.save();
    return NextResponse.json({ cassette: toApi(doc.toObject()) });
  } catch (error) {
    console.error('Inventory cassette PATCH error:', error);
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
    const doc = await InventoryCassette.findByIdAndDelete(id);
    if (!doc) {
      return NextResponse.json({ error: 'Cassette not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Inventory cassette DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

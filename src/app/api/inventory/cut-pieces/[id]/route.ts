import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import InventoryCutPiece from '@/lib/models/InventoryCutPiece';
import { verifyAuth } from '@/lib/auth';
import mongoose from 'mongoose';

function toApi(doc: any) {
  return {
    _id: doc._id.toString(),
    fabric: doc.fabric || '',
    fabricId: doc.fabricId?.toString() || undefined,
    label: doc.label || '',
    width: doc.width ?? 0,
    length: doc.length ?? 0,
    quantity: doc.quantity ?? 1,
    unit: doc.unit || 'mm',
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
    const doc = await InventoryCutPiece.findById(id);
    if (!doc) {
      return NextResponse.json({ error: 'Cut piece not found' }, { status: 404 });
    }
    const body = await request.json();
    if (body.fabric !== undefined) doc.fabric = String(body.fabric).trim();
    if (body.fabricId !== undefined) doc.set('fabricId', body.fabricId || undefined);
    if (body.label !== undefined) doc.label = body.label ? String(body.label).trim() : undefined;
    if (body.width !== undefined) doc.width = typeof body.width === 'number' ? body.width : Number(body.width) || 0;
    if (body.length !== undefined) doc.length = typeof body.length === 'number' ? body.length : Number(body.length) || 0;
    if (body.quantity !== undefined) doc.quantity = Number(body.quantity) || 1;
    if (body.unit !== undefined) doc.unit = body.unit ? String(body.unit).trim() : 'mm';
    await doc.save();
    return NextResponse.json({ cutPiece: toApi(doc.toObject()) });
  } catch (error) {
    console.error('Inventory cut-piece PATCH error:', error);
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
    const doc = await InventoryCutPiece.findByIdAndDelete(id);
    if (!doc) {
      return NextResponse.json({ error: 'Cut piece not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Inventory cut-piece DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

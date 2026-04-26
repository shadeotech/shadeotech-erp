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

export async function GET(
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
    const items = await InventoryCutPiece.find({ fabricId: id }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ cutPieces: items.map(toApi) });
  } catch (error) {
    console.error('Fabric cut-pieces GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authPayload = await verifyAuth(request);
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const fabricId = params.id;
    if (!fabricId || !mongoose.Types.ObjectId.isValid(fabricId)) {
      return NextResponse.json({ error: 'Invalid fabric ID' }, { status: 400 });
    }
    await connectDB();
    const body = await request.json();
    const { fabric, label, width, length, quantity, unit } = body;
    const doc = await InventoryCutPiece.create({
      fabric: fabric?.trim() || '',
      fabricId,
      label: label?.trim() || undefined,
      width: typeof width === 'number' ? width : Number(width) || 0,
      length: typeof length === 'number' ? length : Number(length) || 0,
      quantity: quantity !== undefined ? Number(quantity) || 1 : 1,
      unit: unit?.trim() || 'mm',
    });
    return NextResponse.json({ cutPiece: toApi(doc.toObject()) }, { status: 201 });
  } catch (error) {
    console.error('Fabric cut-pieces POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

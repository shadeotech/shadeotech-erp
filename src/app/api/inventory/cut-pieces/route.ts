import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import InventoryCutPiece from '@/lib/models/InventoryCutPiece';
import { verifyAuth } from '@/lib/auth';

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

export async function GET(request: NextRequest) {
  try {
    const authPayload = await verifyAuth(request);
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    const items = await InventoryCutPiece.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ cutPieces: items.map(toApi) });
  } catch (error) {
    console.error('Inventory cut-pieces GET error:', error);
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
    const { fabric, fabricId, label, width, length, quantity, unit } = body;
    const doc = await InventoryCutPiece.create({
      fabric: fabric?.trim() || '',
      fabricId: fabricId || undefined,
      label: label?.trim() || undefined,
      width: typeof width === 'number' ? width : Number(width) || 0,
      length: typeof length === 'number' ? length : Number(length) || 0,
      quantity: quantity !== undefined ? Number(quantity) || 1 : 1,
      unit: unit?.trim() || 'mm',
    });
    return NextResponse.json({ cutPiece: toApi(doc.toObject()) }, { status: 201 });
  } catch (error) {
    console.error('Inventory cut-pieces POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

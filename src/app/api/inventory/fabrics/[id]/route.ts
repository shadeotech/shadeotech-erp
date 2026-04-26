import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import InventoryFabric from '@/lib/models/InventoryFabric';
import { verifyAuth } from '@/lib/auth';
import { checkLowStock, getFabricThreshold } from '@/lib/inventoryAlerts';
import mongoose from 'mongoose';

function toApi(doc: any) {
  return {
    _id: doc._id.toString(),
    name: doc.name,
    collection: doc.collection || '',
    width: doc.width ?? 0,
    quantity: doc.quantity ?? 0,
    product: doc.product || '',
    specs: doc.specs || '',
    image: doc.image,
    fabricCode: doc.fabricCode || '',
    colorName: doc.colorName || '',
    colorCode: doc.colorCode || '',
    isDuo: doc.isDuo ?? false,
    duoSpecs: doc.duoSpecs || '',
    lowStockThreshold: doc.lowStockThreshold ?? 10,
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
    const doc = await InventoryFabric.findById(id);
    if (!doc) {
      return NextResponse.json({ error: 'Fabric not found' }, { status: 404 });
    }
    const body = await request.json();
    if (body.name !== undefined) doc.name = String(body.name).trim();
    if (body.collection !== undefined) doc.set('collection', body.collection ? String(body.collection).trim() : undefined);
    if (body.width !== undefined) doc.width = typeof body.width === 'number' ? body.width : Number(body.width) || 0;
    if (body.quantity !== undefined) doc.quantity = typeof body.quantity === 'number' ? body.quantity : Number(body.quantity) || 0;
    if (body.product !== undefined) doc.product = body.product ? String(body.product).trim() : undefined;
    if (body.specs !== undefined) doc.specs = body.specs ? String(body.specs).trim() : undefined;
    if (body.image !== undefined) doc.image = body.image ? String(body.image).trim() : undefined;
    if (body.fabricCode !== undefined) doc.fabricCode = body.fabricCode ? String(body.fabricCode).trim() : undefined;
    if (body.colorName !== undefined) doc.colorName = body.colorName ? String(body.colorName).trim() : undefined;
    if (body.colorCode !== undefined) doc.colorCode = body.colorCode ? String(body.colorCode).trim() : undefined;
    if (body.isDuo !== undefined) doc.isDuo = body.isDuo === true || body.isDuo === 'true';
    if (body.duoSpecs !== undefined) doc.duoSpecs = body.duoSpecs ? String(body.duoSpecs).trim() : undefined;
    if (body.lowStockThreshold !== undefined) doc.lowStockThreshold = Number(body.lowStockThreshold) || 10;
    await doc.save();

    // Check low stock after quantity update
    if (body.quantity !== undefined) {
      checkLowStock({
        name: doc.name,
        quantity: doc.quantity,
        threshold: getFabricThreshold(doc),
        type: 'fabric',
      }).catch(console.error);
    }

    return NextResponse.json({ fabric: toApi(doc.toObject()) });
  } catch (error) {
    console.error('Inventory fabric PATCH error:', error);
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
    const doc = await InventoryFabric.findByIdAndDelete(id);
    if (!doc) {
      return NextResponse.json({ error: 'Fabric not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Inventory fabric DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import InventoryFabric from '@/lib/models/InventoryFabric';
import { verifyAuth } from '@/lib/auth';

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

export async function GET(request: NextRequest) {
  try {
    const authPayload = await verifyAuth(request);
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    const items = await InventoryFabric.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ fabrics: items.map(toApi) });
  } catch (error) {
    console.error('Inventory fabrics GET error:', error);
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
    const {
      name, collection, width, quantity, product, specs, image,
      fabricCode, colorName, colorCode, isDuo, duoSpecs, lowStockThreshold,
    } = body;
    const doc = await InventoryFabric.create({
      name: name?.trim() || '',
      collection: collection?.trim() || undefined,
      width: typeof width === 'number' ? width : Number(width) || 0,
      quantity: typeof quantity === 'number' ? quantity : Number(quantity) || 0,
      product: product?.trim() || undefined,
      specs: specs?.trim() || undefined,
      image: image?.trim() || undefined,
      fabricCode: fabricCode?.trim() || undefined,
      colorName: colorName?.trim() || undefined,
      colorCode: colorCode?.trim() || undefined,
      isDuo: isDuo === true || isDuo === 'true',
      duoSpecs: duoSpecs?.trim() || undefined,
      lowStockThreshold: lowStockThreshold !== undefined ? Number(lowStockThreshold) || 10 : 10,
    });
    return NextResponse.json({ fabric: toApi(doc.toObject()) }, { status: 201 });
  } catch (error) {
    console.error('Inventory fabrics POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

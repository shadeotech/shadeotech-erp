import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { INVENTORY_PRODUCTS } from '@/constants';

export async function GET(request: NextRequest) {
  try {
    const authPayload = await verifyAuth(request);
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { products: [...INVENTORY_PRODUCTS] },
      { status: 200 }
    );
  } catch (error) {
    console.error('Inventory products GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

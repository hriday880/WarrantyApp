import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id: productId } = resolvedParams;
    const { latitude, longitude } = await req.json();

    const dbUser = await prisma.user.findUnique({ where: { id: session.id } });
    if (!dbUser) {
      return NextResponse.json({ error: 'User session invalid or expired' }, { status: 401 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        scans: {
          orderBy: { scannedAt: 'asc' },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const isFirstScan = product.scans.length === 0;

    const scan = await prisma.scanHistory.create({
      data: {
        productId,
        userId: session.id,
        latitude,
        longitude,
        isFirstScan,
      },
    });

    if (isFirstScan) {
      // Award points to the user who scanned it first
      await prisma.user.update({
        where: { id: session.id },
        data: {
          creditPoints: {
            increment: product.creditPoints,
          },
        },
      });
    }

    // Refresh the product to get the new scans list
    const updatedProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        scans: {
          orderBy: { scannedAt: 'asc' },
        },
      },
    });

    return NextResponse.json({ product: updatedProduct, scan, isFirstScan });
  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id: productId } = resolvedParams;

    const dbUser = await prisma.user.findUnique({ where: { id: session.id } });
    if (!dbUser) {
      return NextResponse.json({ error: 'User session invalid or expired' }, { status: 401 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        scans: {
          orderBy: { scannedAt: 'asc' },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

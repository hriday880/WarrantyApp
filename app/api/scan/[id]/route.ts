import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({ where: { id: session.id } });
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }
    if (dbUser.isBanned) {
      return NextResponse.json({ error: 'Your account has been banned. Please contact support.' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { id: productId } = resolvedParams;
    const { latitude, longitude } = await req.json();

    const transactionResult = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
        include: {
          scans: {
            orderBy: { scannedAt: 'asc' },
          },
        },
      });

      if (!product) {
        throw new Error('PRODUCT_NOT_FOUND');
      }

      const isFirstScan = product.scans.length === 0;

      const scan = await tx.scanHistory.create({
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
        await tx.user.update({
          where: { id: session.id },
          data: {
            creditPoints: {
              increment: product.creditPoints,
            },
          },
        });
      }
      
      return { scan, isFirstScan };
    });

    // Refresh the product to get the new scans list
    const updatedProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        scans: {
          orderBy: { scannedAt: 'asc' },
        },
      },
    });

    return NextResponse.json({ product: updatedProduct, scan: transactionResult.scan, isFirstScan: transactionResult.isFirstScan });
  } catch (error: any) {
    if (error.message === 'PRODUCT_NOT_FOUND') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
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

    const dbUser = await prisma.user.findUnique({ where: { id: session.id } });
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }
    if (dbUser.isBanned) {
      return NextResponse.json({ error: 'Your account has been banned. Please contact support.' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { id: productId } = resolvedParams;

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

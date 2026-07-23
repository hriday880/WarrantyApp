import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import QRCode from 'qrcode';
import { getSessionFromRequest } from '@/lib/auth';
import crypto from 'crypto';

function generateSerialNumber(prefix: string) {
  const randomChars = crypto.randomBytes(3).toString('hex').toUpperCase();
  return prefix ? `${prefix}-${randomChars}` : randomChars;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, serialPrefix, warrantyMonths, creditPoints, quantity, baseUrl } = await req.json();

    const count = parseInt(quantity, 10);

    if (!name || isNaN(count) || count < 1 || warrantyMonths == null || creditPoints == null) {
      return NextResponse.json({ error: 'Invalid input fields' }, { status: 400 });
    }

    // Limit max quantity to 500 per batch to prevent timeouts
    if (count > 500) {
      return NextResponse.json({ error: 'Maximum 500 QRs per batch' }, { status: 400 });
    }

    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
    let protocol = req.headers.get('x-forwarded-proto') || req.nextUrl.protocol.replace(':', '');
    if (!protocol) protocol = 'http';
    
    // Fallback for local testing when run in production mode but without a reverse proxy
    if (host.includes('localhost') || host.match(/^(192\.168|10\.|172\.1[6-9]|172\.2[0-9]|172\.3[0-1])/)) {
      protocol = 'http';
    }

    // We can't use createManyAndReturn with SQLite in Prisma, so we'll use a transaction
    // with multiple create statements to get the IDs back immediately.
    
    // Generate data for N products
    const operations = Array.from({ length: count }).map(() => {
      const sku = generateSerialNumber(serialPrefix || '');
      return prisma.product.create({
        data: {
          name,
          sku,
          warrantyMonths: Number(warrantyMonths),
          creditPoints: Number(creditPoints),
        }
      });
    });

    // Execute all creations in a transaction
    const createdProducts = await prisma.$transaction(operations);

    // Generate QRs
    const results = await Promise.all(
      createdProducts.map(async (product) => {
        const base = baseUrl || `${protocol}://${host}`;
        const scanUrl = `${base}/scan/${product.id}`;
        const qrCodeDataUrl = await QRCode.toDataURL(scanUrl);
        return {
          id: product.id,
          name: product.name,
          sku: product.sku,
          scanUrl,
          qrCodeDataUrl,
        };
      })
    );

    return NextResponse.json({ products: results });
  } catch (error: any) {
    console.error('Product creation error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Serial Number collision. Try again.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

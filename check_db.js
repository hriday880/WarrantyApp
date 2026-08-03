const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const scans = await prisma.scanHistory.findMany({
    take: 10,
    orderBy: { scannedAt: 'desc' }
  });
  console.log("Scans in DB:");
  console.log(scans);
  
  const products = await prisma.product.findMany({
    where: {
      id: { in: scans.map(s => s.productId) }
    }
  });
  console.log("Products for those scans:");
  console.log(products.map(p => p.id));
}

main().catch(console.error).finally(() => prisma.$disconnect());

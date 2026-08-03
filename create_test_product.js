const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.product.create({
    data: { name: 'Test Product Browser', sku: 'TEST-SKU-' + Date.now(), warrantyMonths: 12, creditPoints: 100 }
  });
  console.log("PRODUCT_ID=" + p.id);
}
main().catch(console.error).finally(() => prisma.$disconnect());

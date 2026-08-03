const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const products = await prisma.product.findMany({ include: { scans: true } });
  console.log("Products:", JSON.stringify(products, null, 2));
  const users = await prisma.user.findMany();
  console.log("Users:", JSON.stringify(users, null, 2));
}

run();

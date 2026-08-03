import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const products = await prisma.product.findMany()
  console.log("Products:", products.length)
  
  const users = await prisma.user.findMany()
  console.log("Users:", users.length)
}

main()

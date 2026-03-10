import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const databaseUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db';
const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  const [adminPasswordHash, staffPasswordHash] = await Promise.all([
    bcrypt.hash('admin123', 10),
    bcrypt.hash('staff123', 10),
  ]);

  await prisma.$transaction([
    prisma.orderStatusHistory.deleteMany(),
    prisma.orderItemAddon.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.comboItem.deleteMany(),
    prisma.combo.deleteMany(),
    prisma.menuItemAddon.deleteMany(),
    prisma.addon.deleteMany(),
    prisma.menuItem.deleteMany(),
    prisma.category.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const categories = await prisma.$transaction([
    prisma.category.create({ data: { name: 'Hamburgueres', displayOrder: 1 } }),
    prisma.category.create({ data: { name: 'Bebidas', displayOrder: 2 } }),
    prisma.category.create({ data: { name: 'Acompanhamentos', displayOrder: 3 } }),
  ]);

  const [hamburgueres, bebidas, acompanhamentos] = categories;

  await prisma.menuItem.createMany({
    data: [
      { name: 'Classic Burger', categoryId: hamburgueres.id, price: 18.9, displayOrder: 1 },
      { name: 'Cheese Burger', categoryId: hamburgueres.id, price: 21.9, displayOrder: 2 },
      { name: 'Bacon Burger', categoryId: hamburgueres.id, price: 24.9, displayOrder: 3 },
      { name: 'Double Burger', categoryId: hamburgueres.id, price: 27.9, displayOrder: 4 },
      { name: 'Veggie Burger', categoryId: hamburgueres.id, price: 22.9, displayOrder: 5 },

      { name: 'Refrigerante Lata', categoryId: bebidas.id, price: 6.5, displayOrder: 1 },
      { name: 'Suco Natural', categoryId: bebidas.id, price: 8.5, displayOrder: 2 },
      { name: 'Cha Gelado', categoryId: bebidas.id, price: 7.5, displayOrder: 3 },
      { name: 'Agua Mineral', categoryId: bebidas.id, price: 4.5, displayOrder: 4 },
      { name: 'Milkshake', categoryId: bebidas.id, price: 14.9, displayOrder: 5 },

      { name: 'Batata Frita P', categoryId: acompanhamentos.id, price: 9.9, displayOrder: 1 },
      { name: 'Batata Frita G', categoryId: acompanhamentos.id, price: 14.9, displayOrder: 2 },
      { name: 'Onion Rings', categoryId: acompanhamentos.id, price: 13.9, displayOrder: 3 },
      { name: 'Nuggets', categoryId: acompanhamentos.id, price: 15.9, displayOrder: 4 },
      { name: 'Salada da Casa', categoryId: acompanhamentos.id, price: 12.9, displayOrder: 5 },
    ],
  });

  const comboItems = await prisma.menuItem.findMany({
    where: {
      name: {
        in: [
          'Classic Burger',
          'Cheese Burger',
          'Bacon Burger',
          'Refrigerante Lata',
          'Suco Natural',
          'Batata Frita P',
          'Batata Frita G',
          'Onion Rings',
        ],
      },
    },
  });

  const itemByName = new Map(comboItems.map((item) => [item.name, item]));

  const [baconExtra, queijoExtra] = await prisma.$transaction([
    prisma.addon.create({
      data: {
        name: 'Bacon Extra',
        addonType: 'EXTRA',
        price: 3.5,
        description: 'Bacon crocante',
      },
    }),
    prisma.addon.create({
      data: {
        name: 'Queijo Extra',
        addonType: 'EXTRA',
        price: 2.5,
        description: 'Fatia adicional de queijo',
      },
    }),
  ]);

  await prisma.menuItemAddon.createMany({
    data: [
      {
        menuItemId: itemByName.get('Classic Burger')!.id,
        addonId: baconExtra.id,
      },
      {
        menuItemId: itemByName.get('Classic Burger')!.id,
        addonId: queijoExtra.id,
      },
      {
        menuItemId: itemByName.get('Cheese Burger')!.id,
        addonId: baconExtra.id,
      },
      {
        menuItemId: itemByName.get('Cheese Burger')!.id,
        addonId: queijoExtra.id,
      },
    ],
  });

  await prisma.combo.create({
    data: {
      name: 'Combo Classico',
      description: 'Classic Burger + Batata P + Refrigerante',
      price: 31.9,
      displayOrder: 1,
      comboItems: {
        create: [
          { menuItemId: itemByName.get('Classic Burger')!.id, quantity: 1 },
          { menuItemId: itemByName.get('Batata Frita P')!.id, quantity: 1 },
          { menuItemId: itemByName.get('Refrigerante Lata')!.id, quantity: 1 },
        ],
      },
    },
  });

  await prisma.combo.create({
    data: {
      name: 'Combo Cheese',
      description: 'Cheese Burger + Batata G + Suco Natural',
      price: 39.9,
      displayOrder: 2,
      comboItems: {
        create: [
          { menuItemId: itemByName.get('Cheese Burger')!.id, quantity: 1 },
          { menuItemId: itemByName.get('Batata Frita G')!.id, quantity: 1 },
          { menuItemId: itemByName.get('Suco Natural')!.id, quantity: 1 },
        ],
      },
    },
  });

  await prisma.combo.create({
    data: {
      name: 'Combo Bacon',
      description: 'Bacon Burger + Onion Rings + Refrigerante',
      price: 42.9,
      displayOrder: 3,
      comboItems: {
        create: [
          { menuItemId: itemByName.get('Bacon Burger')!.id, quantity: 1 },
          { menuItemId: itemByName.get('Onion Rings')!.id, quantity: 1 },
          { menuItemId: itemByName.get('Refrigerante Lata')!.id, quantity: 1 },
        ],
      },
    },
  });

  await prisma.user.createMany({
    data: [
      {
        email: 'admin@sistema.local',
        password: adminPasswordHash,
        role: 'ADMIN',
        name: 'Administrador',
        isActive: true,
      },
      {
        email: 'staff@sistema.local',
        password: staffPasswordHash,
        role: 'STAFF',
        name: 'Atendente',
        isActive: true,
      },
    ],
  });

  console.log('Categorias, itens, combos, addons e usuarios padrao criados.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('Seed executado com sucesso.');
  })
  .catch(async (error) => {
    console.error('Falha no seed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });

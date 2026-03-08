import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db';
const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.$transaction([
    prisma.comboItem.deleteMany(),
    prisma.combo.deleteMany(),
    prisma.menuItemAddon.deleteMany(),
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
        password: 'admin123',
        role: 'ADMIN',
        name: 'Administrador',
        isActive: true,
      },
      {
        email: 'staff@sistema.local',
        password: 'staff123',
        role: 'STAFF',
        name: 'Atendente',
        isActive: true,
      },
    ],
  });

  console.log('Categorias, itens, combos e usuarios padrao criados.');
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

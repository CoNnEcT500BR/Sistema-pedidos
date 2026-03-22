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
    prisma.auditLog.deleteMany(),
    prisma.deliveryStatusHistory.deleteMany(),
    prisma.delivery.deleteMany(),
    prisma.deliveryRoute.deleteMany(),
    prisma.deliveryCourier.deleteMany(),
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
    prisma.category.create({ data: { name: 'Hamburgueres', icon: '🍔', displayOrder: 1 } }),
    prisma.category.create({ data: { name: 'Bebidas', icon: '🥤', displayOrder: 2 } }),
    prisma.category.create({ data: { name: 'Acompanhamentos', icon: '🍟', displayOrder: 3 } }),
    prisma.category.create({ data: { name: 'Sobremesas', icon: '🍰', displayOrder: 4 } }),
    prisma.category.create({ data: { name: 'Combos', icon: '🎁', displayOrder: 5 } }),
    prisma.category.create({ data: { name: 'Kids', icon: '🧒', displayOrder: 6 } }),
    prisma.category.create({ data: { name: 'Molhos e Extras', icon: '🫙', displayOrder: 7 } }),
    prisma.category.create({ data: { name: 'Compartilhaveis', icon: '🍗', displayOrder: 8 } }),
  ]);

  const [
    hamburgueres,
    bebidas,
    acompanhamentos,
    sobremesas,
    _combos,
    kids,
    molhos,
    compartilhaveis,
  ] = categories;

  await prisma.menuItem.createMany({
    data: [
      {
        name: 'Classic Burger P',
        categoryId: hamburgueres.id,
        price: 16.9,
        displayOrder: 1,
        description: 'Pequeno: carne, queijo, ketchup e picles',
      },
      {
        name: 'Classic Burger M',
        categoryId: hamburgueres.id,
        price: 19.9,
        displayOrder: 2,
        description: 'Medio: carne, mostarda, ketchup, cebola e picles',
      },
      {
        name: 'Classic Burger G',
        categoryId: hamburgueres.id,
        price: 23.9,
        displayOrder: 3,
        description: 'Grande: 2 carnes, queijo, mostarda, ketchup, cebola e picles',
      },
      {
        name: 'Bacon Burger M',
        categoryId: hamburgueres.id,
        price: 23.9,
        displayOrder: 4,
        description: 'Medio: carne, bacon, queijo, cebola e maionese',
      },
      {
        name: 'Bacon Burger G',
        categoryId: hamburgueres.id,
        price: 28.9,
        displayOrder: 5,
        description: 'Grande: 2 carnes, bacon, 2 queijos, cebola e maionese',
      },
      {
        name: 'Chicken Burger M',
        categoryId: hamburgueres.id,
        price: 22.9,
        displayOrder: 6,
        description: 'Medio: frango grelhado, queijo, alface, tomate e maionese',
      },
      {
        name: 'Veggie Burger P',
        categoryId: hamburgueres.id,
        price: 18.9,
        displayOrder: 7,
        description: 'Pequeno: burger vegetal, alface, tomate e molho especial',
      },
      {
        name: 'Veggie Burger M',
        categoryId: hamburgueres.id,
        price: 21.9,
        displayOrder: 8,
        description: 'Medio: burger vegetal duplo, alface, tomate e molho especial',
      },
      {
        name: 'Monster Burger G',
        categoryId: hamburgueres.id,
        price: 34.9,
        displayOrder: 9,
        description: 'Exclusivo grande: 3 carnes, queijo, bacon, cebola e molho especial',
      },

      {
        name: 'Refrigerante P',
        categoryId: bebidas.id,
        price: 5.9,
        displayOrder: 1,
        description: '300ml. Escolha o sabor no modal.',
      },
      {
        name: 'Refrigerante M',
        categoryId: bebidas.id,
        price: 7.4,
        displayOrder: 2,
        description: '500ml. Escolha o sabor no modal.',
      },
      {
        name: 'Refrigerante G',
        categoryId: bebidas.id,
        price: 8.9,
        displayOrder: 3,
        description: '700ml. Escolha o sabor no modal.',
      },
      {
        name: 'Suco P',
        categoryId: bebidas.id,
        price: 6.9,
        displayOrder: 4,
        description: '300ml. Escolha o sabor no modal.',
      },
      {
        name: 'Suco M',
        categoryId: bebidas.id,
        price: 8.4,
        displayOrder: 5,
        description: '500ml. Escolha o sabor no modal.',
      },
      {
        name: 'Suco G',
        categoryId: bebidas.id,
        price: 9.9,
        displayOrder: 6,
        description: '700ml. Escolha o sabor no modal.',
      },
      {
        name: 'Cha Gelado P',
        categoryId: bebidas.id,
        price: 5.9,
        displayOrder: 7,
        description: '300ml. Escolha o sabor no modal.',
      },
      {
        name: 'Cha Gelado M',
        categoryId: bebidas.id,
        price: 7.4,
        displayOrder: 8,
        description: '500ml. Escolha o sabor no modal.',
      },
      {
        name: 'Cha Gelado G',
        categoryId: bebidas.id,
        price: 8.9,
        displayOrder: 9,
        description: '700ml. Escolha o sabor no modal.',
      },
      {
        name: 'Agua Mineral P',
        categoryId: bebidas.id,
        price: 3.9,
        displayOrder: 10,
        description: '300ml',
      },
      {
        name: 'Agua Mineral M',
        categoryId: bebidas.id,
        price: 5.2,
        displayOrder: 11,
        description: '500ml',
      },
      {
        name: 'Agua Mineral G',
        categoryId: bebidas.id,
        price: 6.5,
        displayOrder: 12,
        description: '700ml',
      },

      { name: 'Batata Frita P', categoryId: acompanhamentos.id, price: 9.9, displayOrder: 1 },
      { name: 'Batata Frita M', categoryId: acompanhamentos.id, price: 12.4, displayOrder: 2 },
      { name: 'Batata Frita G', categoryId: acompanhamentos.id, price: 14.9, displayOrder: 3 },
      { name: 'Onion Rings', categoryId: acompanhamentos.id, price: 13.9, displayOrder: 4 },
      { name: 'Nuggets (6 un.)', categoryId: acompanhamentos.id, price: 15.9, displayOrder: 5 },
      { name: 'Brinquedo Surpresa', categoryId: acompanhamentos.id, price: 7.9, displayOrder: 6 },

      {
        name: 'Milkshake P',
        categoryId: sobremesas.id,
        price: 12.9,
        displayOrder: 1,
        description: '300ml. Escolha o sabor no modal.',
      },
      {
        name: 'Milkshake M',
        categoryId: sobremesas.id,
        price: 14.4,
        displayOrder: 2,
        description: '500ml. Escolha o sabor no modal.',
      },
      {
        name: 'Milkshake G',
        categoryId: sobremesas.id,
        price: 15.9,
        displayOrder: 3,
        description: '700ml. Escolha o sabor no modal.',
      },
      { name: 'Sundae', categoryId: sobremesas.id, price: 9.9, displayOrder: 4 },
      { name: 'Brownie com Sorvete', categoryId: sobremesas.id, price: 13.9, displayOrder: 5 },
      { name: 'Torta de Maca', categoryId: sobremesas.id, price: 10.9, displayOrder: 6 },
      { name: 'Casquinha', categoryId: sobremesas.id, price: 6.9, displayOrder: 7 },

      {
        name: 'Lanche Kids P',
        categoryId: kids.id,
        price: 16.9,
        displayOrder: 1,
        description: 'Burger pequeno, ideal para criancas',
      },
      {
        name: 'Suco Kids P',
        categoryId: kids.id,
        price: 5.9,
        displayOrder: 2,
        description: 'Suco pequeno infantil',
      },
      {
        name: 'Mini Batata Kids',
        categoryId: kids.id,
        price: 7.9,
        displayOrder: 3,
        description: 'Batata porcao infantil',
      },

      { name: 'Molho BBQ', categoryId: molhos.id, price: 2.0, displayOrder: 1 },
      { name: 'Molho Ranch', categoryId: molhos.id, price: 2.0, displayOrder: 2 },
      { name: 'Molho Picante', categoryId: molhos.id, price: 2.0, displayOrder: 3 },
      { name: 'Cheddar Cremoso', categoryId: molhos.id, price: 3.5, displayOrder: 4 },

      { name: 'Balde de Batata M', categoryId: compartilhaveis.id, price: 24.9, displayOrder: 1 },
      { name: 'Balde de Batata G', categoryId: compartilhaveis.id, price: 34.9, displayOrder: 2 },
      { name: 'Nuggets (12 un.)', categoryId: compartilhaveis.id, price: 29.9, displayOrder: 3 },
      { name: 'Combo Molhos (4 un.)', categoryId: compartilhaveis.id, price: 7.5, displayOrder: 4 },
    ],
  });

  const allMenuItems = await prisma.menuItem.findMany();
  const itemByName = new Map(allMenuItems.map((item) => [item.name, item]));

  const addonsData = [
    { name: 'Mostarda', addonType: 'REMOVAL', price: 0, description: 'Mostarda do item' },
    { name: 'Ketchup', addonType: 'REMOVAL', price: 0, description: 'Ketchup do item' },
    { name: 'Cebola', addonType: 'REMOVAL', price: 0, description: 'Cebola do item' },
    { name: 'Picles', addonType: 'REMOVAL', price: 0, description: 'Picles do item' },
    { name: 'Alface', addonType: 'REMOVAL', price: 0, description: 'Alface do item' },
    { name: 'Tomate', addonType: 'REMOVAL', price: 0, description: 'Tomate do item' },
    { name: 'Maionese', addonType: 'REMOVAL', price: 0, description: 'Maionese do item' },
    { name: 'Bacon', addonType: 'REMOVAL', price: 0, description: 'Bacon do item' },
    { name: 'Queijo', addonType: 'REMOVAL', price: 0, description: 'Queijo do item' },
    {
      name: 'Molho Especial',
      addonType: 'REMOVAL',
      price: 0,
      description: 'Molho especial do item',
    },
    { name: 'Gelo', addonType: 'REMOVAL', price: 0, description: 'Gelo da bebida' },
    { name: 'Chantilly', addonType: 'REMOVAL', price: 0, description: 'Chantilly da sobremesa' },

    { name: 'Sabor Cola', addonType: 'EXTRA', price: 0, description: 'Troca sabor para cola' },
    {
      name: 'Sabor Guarana',
      addonType: 'EXTRA',
      price: 0,
      description: 'Troca sabor para guarana',
    },
    {
      name: 'Sabor Laranja',
      addonType: 'EXTRA',
      price: 0,
      description: 'Troca sabor para laranja',
    },
    { name: 'Sabor Uva', addonType: 'EXTRA', price: 0, description: 'Troca sabor para uva' },
    {
      name: 'Sabor Maracuja',
      addonType: 'EXTRA',
      price: 0,
      description: 'Troca sabor para maracuja',
    },
    { name: 'Sabor Limao', addonType: 'EXTRA', price: 0, description: 'Troca sabor para limao' },
    {
      name: 'Sabor Pessego',
      addonType: 'EXTRA',
      price: 0,
      description: 'Troca sabor para pessego',
    },
    {
      name: 'Sabor Chocolate',
      addonType: 'EXTRA',
      price: 0,
      description: 'Troca sabor para chocolate',
    },
    {
      name: 'Sabor Morango',
      addonType: 'EXTRA',
      price: 0,
      description: 'Troca sabor para morango',
    },
    {
      name: 'Sabor Baunilha',
      addonType: 'EXTRA',
      price: 0,
      description: 'Troca sabor para baunilha',
    },

    { name: 'Carne Extra', addonType: 'EXTRA', price: 5.0, description: 'Adicionar carne extra' },
    { name: 'Frango Extra', addonType: 'EXTRA', price: 4.5, description: 'Adicionar frango extra' },
    { name: 'Bacon Extra', addonType: 'EXTRA', price: 3.5, description: 'Adicionar bacon extra' },
    { name: 'Queijo Extra', addonType: 'EXTRA', price: 2.5, description: 'Adicionar queijo extra' },
    {
      name: 'Molho Especial Extra',
      addonType: 'EXTRA',
      price: 1.5,
      description: 'Adicionar molho especial extra',
    },
    {
      name: 'Brinquedo Surpresa Extra',
      addonType: 'EXTRA',
      price: 7.9,
      description: 'Adicionar brinquedo surpresa',
    },

    {
      name: 'Upgrade Batata para M',
      addonType: 'SIZE_CHANGE',
      price: 2.5,
      description: 'Troca batata para tamanho M [meta|station=SIDES|scope=SIDE|priority=CRITICAL]',
    },
    {
      name: 'Upgrade Batata para G',
      addonType: 'SIZE_CHANGE',
      price: 5.0,
      description: 'Troca batata para tamanho G [meta|station=SIDES|scope=SIDE|priority=CRITICAL]',
    },
    {
      name: 'Upgrade Bebida para M',
      addonType: 'SIZE_CHANGE',
      price: 1.5,
      description:
        'Troca bebida para tamanho M [meta|station=DRINKS|scope=DRINK|priority=CRITICAL]',
    },
    {
      name: 'Upgrade Bebida para G',
      addonType: 'SIZE_CHANGE',
      price: 3.0,
      description:
        'Troca bebida para tamanho G [meta|station=DRINKS|scope=DRINK|priority=CRITICAL]',
    },
  ] as const;

  await prisma.addon.createMany({ data: addonsData.map((addon) => ({ ...addon })) });

  const allAddons = await prisma.addon.findMany();
  const addonByName = new Map(allAddons.map((addon) => [addon.name, addon]));

  const menuItemAddonsConfig = [
    {
      item: 'Classic Burger P',
      removables: ['Queijo', 'Ketchup', 'Picles'],
      extras: ['Carne Extra', 'Queijo Extra', 'Brinquedo Surpresa Extra'],
    },
    {
      item: 'Classic Burger M',
      removables: ['Mostarda', 'Ketchup', 'Cebola', 'Picles'],
      extras: ['Carne Extra', 'Queijo Extra', 'Bacon Extra', 'Brinquedo Surpresa Extra'],
    },
    {
      item: 'Classic Burger G',
      removables: ['Queijo', 'Mostarda', 'Ketchup', 'Cebola', 'Picles'],
      extras: ['Carne Extra', 'Queijo Extra', 'Bacon Extra', 'Brinquedo Surpresa Extra'],
    },
    {
      item: 'Bacon Burger M',
      removables: ['Bacon', 'Queijo', 'Cebola', 'Maionese'],
      extras: ['Carne Extra', 'Bacon Extra', 'Queijo Extra', 'Brinquedo Surpresa Extra'],
    },
    {
      item: 'Bacon Burger G',
      removables: ['Bacon', 'Queijo', 'Cebola', 'Maionese'],
      extras: ['Carne Extra', 'Bacon Extra', 'Queijo Extra', 'Brinquedo Surpresa Extra'],
    },
    {
      item: 'Chicken Burger M',
      removables: ['Queijo', 'Alface', 'Tomate', 'Maionese'],
      extras: ['Frango Extra', 'Queijo Extra', 'Brinquedo Surpresa Extra'],
    },
    {
      item: 'Veggie Burger P',
      removables: ['Alface', 'Tomate', 'Molho Especial'],
      extras: ['Queijo Extra', 'Molho Especial Extra', 'Brinquedo Surpresa Extra'],
    },
    {
      item: 'Veggie Burger M',
      removables: ['Alface', 'Tomate', 'Molho Especial'],
      extras: ['Queijo Extra', 'Molho Especial Extra', 'Brinquedo Surpresa Extra'],
    },
    {
      item: 'Monster Burger G',
      removables: ['Queijo', 'Bacon', 'Cebola', 'Molho Especial'],
      extras: [
        'Carne Extra',
        'Bacon Extra',
        'Queijo Extra',
        'Molho Especial Extra',
        'Brinquedo Surpresa Extra',
      ],
    },

    {
      item: 'Refrigerante P',
      removables: ['Gelo'],
      extras: ['Sabor Cola', 'Sabor Guarana', 'Sabor Laranja', 'Sabor Uva'],
      sizeChanges: ['Upgrade Bebida para M', 'Upgrade Bebida para G'],
    },
    {
      item: 'Refrigerante M',
      removables: ['Gelo'],
      extras: ['Sabor Cola', 'Sabor Guarana', 'Sabor Laranja', 'Sabor Uva'],
      sizeChanges: ['Upgrade Bebida para M', 'Upgrade Bebida para G'],
    },
    {
      item: 'Refrigerante G',
      removables: ['Gelo'],
      extras: ['Sabor Cola', 'Sabor Guarana', 'Sabor Laranja', 'Sabor Uva'],
      sizeChanges: ['Upgrade Bebida para M', 'Upgrade Bebida para G'],
    },
    {
      item: 'Suco P',
      removables: ['Gelo'],
      extras: ['Sabor Laranja', 'Sabor Uva', 'Sabor Maracuja'],
      sizeChanges: ['Upgrade Bebida para M', 'Upgrade Bebida para G'],
    },
    {
      item: 'Suco M',
      removables: ['Gelo'],
      extras: ['Sabor Laranja', 'Sabor Uva', 'Sabor Maracuja'],
      sizeChanges: ['Upgrade Bebida para M', 'Upgrade Bebida para G'],
    },
    {
      item: 'Suco G',
      removables: ['Gelo'],
      extras: ['Sabor Laranja', 'Sabor Uva', 'Sabor Maracuja'],
      sizeChanges: ['Upgrade Bebida para M', 'Upgrade Bebida para G'],
    },
    {
      item: 'Cha Gelado P',
      removables: ['Gelo'],
      extras: ['Sabor Limao', 'Sabor Pessego'],
      sizeChanges: ['Upgrade Bebida para M', 'Upgrade Bebida para G'],
    },
    {
      item: 'Cha Gelado M',
      removables: ['Gelo'],
      extras: ['Sabor Limao', 'Sabor Pessego'],
      sizeChanges: ['Upgrade Bebida para M', 'Upgrade Bebida para G'],
    },
    {
      item: 'Cha Gelado G',
      removables: ['Gelo'],
      extras: ['Sabor Limao', 'Sabor Pessego'],
      sizeChanges: ['Upgrade Bebida para M', 'Upgrade Bebida para G'],
    },

    {
      item: 'Batata Frita P',
      removables: [],
      extras: [],
      sizeChanges: ['Upgrade Batata para M', 'Upgrade Batata para G'],
    },
    {
      item: 'Batata Frita M',
      removables: [],
      extras: [],
      sizeChanges: ['Upgrade Batata para M', 'Upgrade Batata para G'],
    },
    {
      item: 'Batata Frita G',
      removables: [],
      extras: [],
      sizeChanges: ['Upgrade Batata para M', 'Upgrade Batata para G'],
    },

    {
      item: 'Milkshake P',
      removables: ['Chantilly'],
      extras: ['Sabor Chocolate', 'Sabor Morango', 'Sabor Baunilha'],
    },
    {
      item: 'Milkshake M',
      removables: ['Chantilly'],
      extras: ['Sabor Chocolate', 'Sabor Morango', 'Sabor Baunilha'],
    },
    {
      item: 'Milkshake G',
      removables: ['Chantilly'],
      extras: ['Sabor Chocolate', 'Sabor Morango', 'Sabor Baunilha'],
    },
    {
      item: 'Sundae',
      removables: ['Chantilly'],
      extras: ['Sabor Chocolate', 'Sabor Morango', 'Sabor Baunilha'],
    },
  ] as const;

  // Atualizar removablesJson em cada item
  for (const config of menuItemAddonsConfig) {
    const menuItem = itemByName.get(config.item);
    if (!menuItem) continue;

    await prisma.menuItem.update({
      where: { id: menuItem.id },
      data: { removablesJson: JSON.stringify(config.removables) },
    });
  }

  for (const config of menuItemAddonsConfig) {
    const menuItem = itemByName.get(config.item);
    if (!menuItem) continue;

    const removables = config.removables
      .map((name, index) => {
        const addon = addonByName.get(name);
        if (!addon) return null;
        return {
          menuItemId: menuItem.id,
          addonId: addon.id,
          isRequired: true,
          displayOrder: index + 1,
        };
      })
      .filter(
        (
          row,
        ): row is {
          menuItemId: string;
          addonId: string;
          isRequired: boolean;
          displayOrder: number;
        } => row !== null,
      );

    const extras = config.extras
      .map((name, index) => {
        const addon = addonByName.get(name);
        if (!addon) return null;
        return {
          menuItemId: menuItem.id,
          addonId: addon.id,
          isRequired: false,
          displayOrder: index + 1,
        };
      })
      .filter(
        (
          row,
        ): row is {
          menuItemId: string;
          addonId: string;
          isRequired: boolean;
          displayOrder: number;
        } => row !== null,
      );

    const sizeChanges = (config.sizeChanges ?? [])
      .map((name, index) => {
        const addon = addonByName.get(name);
        if (!addon) return null;
        return {
          menuItemId: menuItem.id,
          addonId: addon.id,
          isRequired: false,
          displayOrder: index + extras.length + 1,
        };
      })
      .filter(
        (
          row,
        ): row is {
          menuItemId: string;
          addonId: string;
          isRequired: boolean;
          displayOrder: number;
        } => row !== null,
      );

    if (removables.length || extras.length || sizeChanges.length) {
      await prisma.menuItemAddon.createMany({ data: [...removables, ...extras, ...sizeChanges] });
    }
  }

  await prisma.combo.createMany({
    data: [
      {
        name: 'Combo Pequeno',
        description: 'Classic Burger P + Batata Frita P + Refrigerante P',
        price: 27.9,
        displayOrder: 1,
      },
      {
        name: 'Combo Medio',
        description: 'Classic Burger M + Batata Frita M + Refrigerante P',
        price: 33.9,
        displayOrder: 2,
      },
      {
        name: 'Combo Grande',
        description: 'Classic Burger G + Batata Frita G + Refrigerante M',
        price: 44.9,
        displayOrder: 3,
      },
      {
        name: 'Combo Monster',
        description: 'Monster Burger G + Onion Rings + Milkshake M',
        price: 52.9,
        displayOrder: 4,
      },
      {
        name: 'Combo Frango',
        description: 'Chicken Burger M + Batata Frita M + Suco M',
        price: 39.9,
        displayOrder: 5,
      },
      {
        name: 'Combo Kids Brinquedo',
        description: 'Lanche Kids P + Mini Batata Kids + Suco Kids P + Brinquedo Surpresa',
        price: 36.9,
        displayOrder: 6,
      },
      {
        name: 'Combo Compartilhar',
        description: 'Balde de Batata M + Nuggets (12 un.) + Refrigerante G',
        price: 54.9,
        displayOrder: 7,
      },
    ],
  });

  const combos = await prisma.combo.findMany();
  const comboByName = new Map(combos.map((combo) => [combo.name, combo]));

  const comboItemsConfig = [
    {
      combo: 'Combo Pequeno',
      items: ['Classic Burger P', 'Batata Frita P', 'Refrigerante P'],
    },
    { combo: 'Combo Medio', items: ['Classic Burger M', 'Batata Frita M', 'Refrigerante P'] },
    { combo: 'Combo Grande', items: ['Classic Burger G', 'Batata Frita G', 'Refrigerante M'] },
    { combo: 'Combo Monster', items: ['Monster Burger G', 'Onion Rings', 'Milkshake M'] },
    { combo: 'Combo Frango', items: ['Chicken Burger M', 'Batata Frita M', 'Suco M'] },
    {
      combo: 'Combo Kids Brinquedo',
      items: ['Lanche Kids P', 'Mini Batata Kids', 'Suco Kids P', 'Brinquedo Surpresa'],
    },
    {
      combo: 'Combo Compartilhar',
      items: ['Balde de Batata M', 'Nuggets (12 un.)', 'Refrigerante G'],
    },
  ] as const;

  for (const config of comboItemsConfig) {
    const combo = comboByName.get(config.combo);
    if (!combo) continue;

    const rows = config.items
      .map((itemName) => {
        const item = itemByName.get(itemName);
        if (!item) return null;
        return { comboId: combo.id, menuItemId: item.id, quantity: 1 };
      })
      .filter(
        (row): row is { comboId: string; menuItemId: string; quantity: number } => row !== null,
      );

    if (rows.length > 0) {
      await prisma.comboItem.createMany({ data: rows });
    }
  }

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

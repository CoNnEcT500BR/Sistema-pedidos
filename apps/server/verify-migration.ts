import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRaw`
    SELECT "assignmentType", "isRequired", COUNT(*) as count
    FROM "MenuItemAddon"
    GROUP BY "assignmentType", "isRequired"
    ORDER BY "assignmentType", "isRequired"
  `;

  console.log('\n=== MenuItemAddon Distribution ===\n');
  console.table(result);

  // Validar padrão correto
  const assembly = await prisma.menuItemAddon.count({
    where: { assignmentType: 'ASSEMBLY' },
  });
  const assemblyRequired = await prisma.menuItemAddon.count({
    where: { assignmentType: 'ASSEMBLY', isRequired: true },
  });
  const extra = await prisma.menuItemAddon.count({
    where: { assignmentType: 'EXTRA' },
  });
  const extraRequired = await prisma.menuItemAddon.count({
    where: { assignmentType: 'EXTRA', isRequired: true },
  });

  console.log('\n=== Validation Results ===\n');
  console.log(`ASSEMBLY total: ${assembly}`);
  console.log(`ASSEMBLY with isRequired=true: ${assemblyRequired}/${assembly} ✓`);
  console.log(`EXTRA total: ${extra}`);
  console.log(`EXTRA with isRequired=false: ${extra - extraRequired}/${extra} ✓`);

  if (assemblyRequired === assembly && extraRequired === 0) {
    console.log('\n✅ Migration successful! All data is correct.');
  } else {
    console.log('\n❌ Migration has issues!');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

const fs = require('node:fs/promises');
const path = require('node:path');

async function main() {
  const source = path.resolve(process.cwd(), 'apps/server/prisma/dev.db');
  const backupDir = path.resolve(process.cwd(), 'apps/server/prisma/backups');
  await fs.mkdir(backupDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const target = path.join(backupDir, `dev-backup-${stamp}.db`);

  await fs.copyFile(source, target);
  const stat = await fs.stat(target);

  console.log(JSON.stringify({ ok: true, backup: target, sizeBytes: stat.size }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, message: error.message }, null, 2));
  process.exit(1);
});

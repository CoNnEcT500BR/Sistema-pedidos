const fs = require('node:fs/promises');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function getLatestBackup(files) {
  const backups = files
    .filter((file) => file.startsWith('dev-backup-') && file.endsWith('.db'))
    .sort();

  return backups.length ? backups[backups.length - 1] : null;
}

async function main() {
  const prismaDir = path.resolve(process.cwd(), 'apps/server/prisma');
  const backupDir = path.join(prismaDir, 'backups');
  const restorePath = path.join(prismaDir, 'restore-check.db');

  const files = await fs.readdir(backupDir);
  const latest = getLatestBackup(files);
  if (!latest) {
    throw new Error('Nenhum backup encontrado em apps/server/prisma/backups');
  }

  const source = path.join(backupDir, latest);
  await fs.copyFile(source, restorePath);

  const serverCwd = path.resolve(process.cwd(), 'apps/server');
  const prismaCliPath = require.resolve('prisma/build/index.js', {
    paths: [serverCwd],
  });

  const check = spawnSync(
    process.execPath,
    [prismaCliPath, 'db', 'execute', '--file', './prisma/validate-restore.sql'],
    {
      cwd: serverCwd,
      env: {
        ...process.env,
        DATABASE_URL: 'file:./prisma/restore-check.db',
      },
      stdio: 'pipe',
      shell: false,
    },
  );

  if (check.status !== 0) {
    throw new Error(
      check.stderr?.toString() || check.stdout?.toString() || 'Falha ao validar restore',
    );
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        restoredFrom: source,
        validatedWith: 'prisma/validate-restore.sql',
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, message: error.message }, null, 2));
  process.exit(1);
});

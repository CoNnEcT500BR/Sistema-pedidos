import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export interface FeatureFlagRule {
  roles?: Array<'ADMIN' | 'STAFF' | 'PUBLIC'>;
  channels?: Array<'ADMIN' | 'STAFF' | 'KIOSK' | 'API'>;
  rolloutPercentage?: number;
}

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description?: string;
  rules?: FeatureFlagRule;
}

const configDir = path.resolve(process.cwd(), 'apps/server/config');
const configPath = path.join(configDir, 'feature-flags.json');

const defaultFlags: FeatureFlag[] = [
  {
    key: 'admin.delivery.v1',
    enabled: true,
    description: 'Fluxo de delivery no admin',
    rules: { roles: ['ADMIN', 'STAFF'], channels: ['ADMIN'], rolloutPercentage: 100 },
  },
  {
    key: 'admin.reports.csv_export',
    enabled: true,
    description: 'Exportacao CSV em relatorios admin',
    rules: { roles: ['ADMIN'], channels: ['ADMIN'], rolloutPercentage: 100 },
  },
  {
    key: 'kiosk.gradual_checkout_v2',
    enabled: false,
    description: 'Nova experiencia de checkout no kiosk',
    rules: { roles: ['PUBLIC'], channels: ['KIOSK'], rolloutPercentage: 0 },
  },
];

function normalizePercent(value: number | undefined): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 100;
  }

  return Math.max(0, Math.min(100, Math.floor(value)));
}

function hashToPercent(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash % 100;
}

async function ensureConfig(): Promise<void> {
  await mkdir(configDir, { recursive: true });

  try {
    await readFile(configPath, 'utf-8');
  } catch {
    await writeFile(configPath, JSON.stringify(defaultFlags, null, 2), 'utf-8');
  }
}

async function readFlags(): Promise<FeatureFlag[]> {
  await ensureConfig();
  const raw = await readFile(configPath, 'utf-8');
  const parsed = JSON.parse(raw) as FeatureFlag[];
  return Array.isArray(parsed) ? parsed : defaultFlags;
}

async function writeFlags(flags: FeatureFlag[]): Promise<void> {
  await ensureConfig();
  await writeFile(configPath, JSON.stringify(flags, null, 2), 'utf-8');
}

export const featureFlagsService = {
  async listFlags(): Promise<FeatureFlag[]> {
    return readFlags();
  },

  async upsertFlag(flag: FeatureFlag): Promise<FeatureFlag> {
    const flags = await readFlags();
    const index = flags.findIndex((entry) => entry.key === flag.key);

    const normalized: FeatureFlag = {
      ...flag,
      rules: {
        ...flag.rules,
        rolloutPercentage: normalizePercent(flag.rules?.rolloutPercentage),
      },
    };

    if (index >= 0) {
      flags[index] = normalized;
    } else {
      flags.push(normalized);
    }

    await writeFlags(flags);
    return normalized;
  },

  async evaluate(input: {
    key?: string;
    role: 'ADMIN' | 'STAFF' | 'PUBLIC';
    channel: 'ADMIN' | 'STAFF' | 'KIOSK' | 'API';
    userKey: string;
  }): Promise<Record<string, boolean>> {
    const flags = await readFlags();

    const result: Record<string, boolean> = {};
    for (const flag of flags) {
      if (input.key && flag.key !== input.key) {
        continue;
      }

      let enabled = flag.enabled;
      const rule = flag.rules;
      if (enabled && rule?.roles && !rule.roles.includes(input.role)) {
        enabled = false;
      }
      if (enabled && rule?.channels && !rule.channels.includes(input.channel)) {
        enabled = false;
      }
      if (enabled) {
        const percent = normalizePercent(rule?.rolloutPercentage);
        const bucket = hashToPercent(`${flag.key}:${input.userKey}`);
        enabled = bucket < percent;
      }

      result[flag.key] = enabled;
    }

    return result;
  },
};

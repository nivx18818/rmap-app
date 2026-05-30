/**
 * seed-skills.ts
 *
 * Seeds the `skills` and `resources` tables from roadmap.sh content files.
 *
 * Flow:
 *   1. Parse all roadmaps that have a migration-mapping.json / mapping.json.
 *   2. Deduplicate skills by name (same skill can appear in multiple roadmaps).
 *      - When a skill appears in multiple roadmaps, the first occurrence wins for
 *        roleCategory / description, but resources from ALL occurrences are merged.
 *   3. Upsert each skill by name (unique constraint).
 *   4. For each skill, insert its resources (idempotent: skip existing URLs).
 *
 * Run:
 *   pnpm --filter @repo/database tsx prisma/seed-skills.ts
 */

import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

import { PrismaClient } from '../../generated/prisma/client';

import { parseAllRoadmapsSkills, type ParsedSkillSeed } from './parser';

const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const log = (msg: string) => process.stdout.write(`${msg}\n`);
const warn = (msg: string) => process.stderr.write(`[WARN] ${msg}\n`);

// ---------------------------------------------------------------------------
// Deduplication
// ---------------------------------------------------------------------------

interface MergedSkill extends ParsedSkillSeed {
  resourceUrls: Set<string>; // for dedupe across roadmaps
}

function deduplicateSkills(batches: ReturnType<typeof parseAllRoadmapsSkills>): MergedSkill[] {
  const map = new Map<string, MergedSkill>();

  for (const { skills } of batches) {
    for (const skill of skills) {
      const key = skill.name.trim().toLowerCase();
      const existing = map.get(key);

      if (!existing) {
        map.set(key, {
          ...skill,
          resourceUrls: new Set(skill.resources.map((r) => r.url)),
        });
      } else {
        // Merge resources from later occurrences, deduplicating by URL
        for (const resource of skill.resources) {
          if (!existing.resourceUrls.has(resource.url)) {
            existing.resourceUrls.add(resource.url);
            existing.resources.push(resource);
          }
        }
      }
    }
  }

  return Array.from(map.values());
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function seedSkills(skills: MergedSkill[]) {
  let upserted = 0;
  let skipped = 0;
  let totalResources = 0;

  for (const skill of skills) {
    if (!skill.name || skill.name === 'Unknown') {
      warn(`Skipping skill with no name (id: ${skill.id})`);
      skipped += 1;
      continue;
    }

    // Upsert by name (unique constraint). We deliberately do NOT pass the
    // roadmap.sh node ID as primary key — DB generates its own UUID.
    const upsertedSkill = await prisma.skill.upsert({
      where: { name: skill.name },
      update: {
        // Update description and category only if the existing row has none
        description: skill.description || undefined,
        roleCategory: skill.role_category || undefined,
      },
      create: {
        name: skill.name,
        description: skill.description || null,
        roleCategory: skill.role_category || null,
        defaultEstimatedHours: null, // not available from markdown content
      },
      select: { id: true, name: true },
    });

    upserted += 1;

    if (upserted % 100 === 0 || upserted === skills.length) {
      log(`  Progress: ${upserted}/${skills.length} skills processed...`);
    }

    // Insert resources — skip already-existing URLs for this skill
    const existingUrls = await prisma.resource.findMany({
      where: { skillId: upsertedSkill.id },
      select: { url: true },
    });
    const existingUrlSet = new Set(existingUrls.map((r) => r.url));

    for (const res of skill.resources) {
      if (existingUrlSet.has(res.url)) continue;

      await prisma.resource.create({
        data: {
          skillId: upsertedSkill.id,
          title: res.title,
          url: res.url,
          resourceType: res.resource_type,
          isFree: true,
          isPrimary: false,
        },
      });

      existingUrlSet.add(res.url);
      totalResources += 1;
    }
  }

  return { upserted, skipped, totalResources };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export async function seedSkillsMain() {
  log('=== Seed Skills ===');
  log('Clearing existing skills and resources...');
  await prisma.resource.deleteMany({});
  await prisma.skill.deleteMany({});

  log('Parsing roadmaps...');

  const batches = parseAllRoadmapsSkills();
  log(`Found ${batches.length} roadmaps with mapping files.`);

  const totalRaw = batches.reduce((s, b) => s + b.skills.length, 0);
  log(`Total raw skill entries (before dedup): ${totalRaw}`);

  const skills = deduplicateSkills(batches);
  log(`Unique skills after deduplication: ${skills.length}`);

  log('Upserting skills and resources into DB...');
  const { upserted, skipped, totalResources } = await seedSkills(skills);

  log('');
  log(`Skills seeding done!`);
  log(`  Skills upserted : ${upserted}`);
  log(`  Skills skipped  : ${skipped}`);
  log(`  Resources created: ${totalResources}`);
}

const isMain =
  typeof process !== 'undefined' &&
  process.argv[1] != null &&
  new URL(import.meta.url).pathname.endsWith(process.argv[1].replace(/\\/g, '/'));

if (isMain) {
  seedSkillsMain()
    .catch((err) => {
      process.stderr.write(`[ERROR] ${String(err)}\n`);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
      await pool.end();
    });
}

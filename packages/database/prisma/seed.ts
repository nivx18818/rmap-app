/**
 * seed.ts
 *
 * Master seed script that coordinates the seeding of:
 *   1. Skills & Resources (from content files)
 *   2. Roadmaps (Templates)
 *   3. Roadmap Nodes (Hierarchy & Skill associations)
 */

import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

import { PrismaClient } from '../generated/prisma/client';
import { seedSkillsMain } from './seed/skills';
import { seedRoadmapsMain } from './seed/roadmaps';
import { seedNodesMain } from './seed/nodes';

const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const log = (msg: string) => process.stdout.write(`${msg}\n`);

async function main() {
  log('Starting master seed process...');
  const startTime = Date.now();

  // 1. Seed Skills and Resources first (RoadmapNodes depend on Skills)
  await seedSkillsMain();

  // 2. Seed Roadmap Templates (RoadmapNodes depend on Roadmaps)
  await seedRoadmapsMain();

  // 3. Seed Roadmap Nodes (Hierarchy)
  await seedNodesMain();

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  log(`\n=========================================`);
  log(`MASTER SEED COMPLETED IN ${duration}s`);
  log(`=========================================\n`);
}

main()
  .catch((err) => {
    process.stderr.write(`\n[MASTER SEED ERROR] ${String(err)}\n`);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

/**
 * seed-roadmaps.ts
 *
 * Seeds the `roadmaps` table from roadmap.sh content directories.
 * It extracts titles and descriptions from the frontmatter of {roadmap-name}.md files.
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

import { PrismaClient } from '../../generated/prisma/client';

import { getRoleCategoryForSlug, slugToTitle } from './utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const log = (msg: string) => process.stdout.write(`${msg}\n`);

// Path to roadmap data
const ROADMAPS_ROOT = path.resolve(
  __dirname,
  '../../../../docs/developer-roadmap/src/data/roadmaps',
);

interface RoadmapMetadata {
  title: string;
  description: string;
  roleCategory: any; // Using any here to avoid enum import issues in this simple script
}

function parseRoadmapMetadata(slug: string): RoadmapMetadata {
  const roadmapDir = path.join(ROADMAPS_ROOT, slug);
  const mdFile = path.join(roadmapDir, `${slug}.md`);

  let title = slugToTitle(slug);
  let description = `Step-by-step guide to becoming a ${title} in 2025.`;
  const roleCategory = getRoleCategoryForSlug(slug);

  if (fs.existsSync(mdFile)) {
    const content = fs.readFileSync(mdFile, 'utf-8');
    const lines = content.split('\n');

    let inSchema = false;
    let schemaHeadline: string | null = null;
    let schemaDescription: string | null = null;
    let topTitle: string | null = null;
    let topDescription: string | null = null;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed === 'schema:') {
        inSchema = true;
        continue;
      }

      if (inSchema && line.length > 0 && !line.startsWith(' ') && !line.startsWith('-')) {
        inSchema = false;
      }

      if (inSchema) {
        if (trimmed.startsWith('headline:')) {
          schemaHeadline = trimmed
            .replace('headline:', '')
            .trim()
            .replace(/^['"]|['"]$/g, '');
        } else if (trimmed.startsWith('description:')) {
          schemaDescription = trimmed
            .replace('description:', '')
            .trim()
            .replace(/^['"]|['"]$/g, '');
        }
      } else {
        if (trimmed.startsWith('title:') && !topTitle) {
          topTitle = trimmed
            .replace('title:', '')
            .trim()
            .replace(/^['"]|['"]$/g, '');
        } else if (trimmed.startsWith('description:') && !topDescription) {
          topDescription = trimmed
            .replace('description:', '')
            .trim()
            .replace(/^['"]|['"]$/g, '');
        }
      }
    }

    title = schemaHeadline || topTitle || title;
    description = schemaDescription || topDescription || description;
  }

  return { title, description, roleCategory };
}

export async function seedRoadmapsMain() {
  log('=== Seed Roadmaps ===');
  log('Clearing existing roadmaps...');
  await prisma.roadmap.deleteMany({});

  if (!fs.existsSync(ROADMAPS_ROOT)) {
    throw new Error(`Roadmaps directory not found at: ${ROADMAPS_ROOT}`);
  }

  const roadmapDirs = fs.readdirSync(ROADMAPS_ROOT).filter((dir) => {
    return fs.statSync(path.join(ROADMAPS_ROOT, dir)).isDirectory();
  });

  log(`Found ${roadmapDirs.length} potential roadmaps in docs.`);

  let created = 0;
  let updated = 0;

  for (const slug of roadmapDirs) {
    const metadata = parseRoadmapMetadata(slug);

    const existing = await prisma.roadmap.findFirst({
      where: {
        title: metadata.title,
        isTemplate: true,
        userId: null,
      },
    });

    if (existing) {
      await prisma.roadmap.update({
        where: { id: existing.id },
        data: {
          description: metadata.description,
          roleCategory: metadata.roleCategory,
          goalName: metadata.title,
        },
      });
      updated += 1;
    } else {
      await prisma.roadmap.create({
        data: {
          title: metadata.title,
          description: metadata.description,
          roleCategory: metadata.roleCategory,
          isTemplate: true,
          goalName: metadata.title,
          userId: null,
        },
      });
      created += 1;
    }

    if ((created + updated) % 10 === 0) {
      log(`  Progress: ${created + updated}/${roadmapDirs.length} processed...`);
    }
  }

  log('');
  log(`Roadmaps seeding done!`);
  log(`  Roadmaps created: ${created}`);
  log(`  Roadmaps updated: ${updated}`);
}

const isMain =
  typeof process !== 'undefined' &&
  process.argv[1] != null &&
  new URL(import.meta.url).pathname.endsWith(process.argv[1].replace(/\\/g, '/'));

if (isMain) {
  seedRoadmapsMain()
    .catch((err) => {
      process.stderr.write(`[ERROR] ${String(err)}\n`);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
      await pool.end();
    });
}

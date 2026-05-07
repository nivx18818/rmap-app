/**
 * seed-nodes.ts
 *
 * Seeds the `roadmap_nodes` table by parsing mapping files and roadmap JSONs.
 * Hierarchy is defined by mapping keys (e.g., "parent:child").
 * Automatically creates GROUP nodes for missing intermediate keys in the path.
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

import { PrismaClient } from '../../generated/prisma/client';
import { NodeType } from '../../generated/prisma/enums';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const log = (msg: string) => process.stdout.write(`${msg}\n`);
const warn = (msg: string) => process.stderr.write(`[WARN] ${msg}\n`);

const ROADMAPS_ROOT = path.resolve(
  __dirname,
  '../../../../docs/developer-roadmap/src/data/roadmaps',
);

function formatKeyName(key: string): string {
  return key
    .split(':')
    .pop()!
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getContentMetadata(
  roadmapDir: string,
  nodeId: string,
): { name: string; description: string } {
  const contentDir = path.join(roadmapDir, 'content');
  if (!fs.existsSync(contentDir)) return { name: '', description: '' };

  const files = fs.readdirSync(contentDir);
  const contentFile = files.find((f) => f.includes(`@${nodeId}.md`));

  if (!contentFile) return { name: '', description: '' };

  const content = fs.readFileSync(path.join(contentDir, contentFile), 'utf-8');
  const lines = content.split('\n');

  let name = '';
  let descLines: string[] = [];
  let inResourceSection = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) {
      name = trimmed.replace('# ', '').trim();
      continue;
    }
    if (trimmed === 'Visit the following resources to learn more:') {
      inResourceSection = true;
      continue;
    }
    if (!inResourceSection && !trimmed.startsWith('- ') && trimmed.length > 0) {
      descLines.push(trimmed);
    }
  }

  return { name, description: descLines.join('\n').trim() };
}

async function seedRoadmapNodes(roadmapId: string, slug: string): Promise<boolean> {
  const roadmapDir = path.join(ROADMAPS_ROOT, slug);
  const mappingFile = fs.existsSync(path.join(roadmapDir, 'migration-mapping.json'))
    ? path.join(roadmapDir, 'migration-mapping.json')
    : path.join(roadmapDir, 'mapping.json');

  const jsonStructureFile = path.join(roadmapDir, `${slug}.json`);

  if (!fs.existsSync(mappingFile)) return false;
  if (!fs.existsSync(jsonStructureFile)) return false;

  log(`Processing nodes for roadmap: ${slug}...`);
  const mapping: Record<string, string> = JSON.parse(fs.readFileSync(mappingFile, 'utf-8'));
  const jsonStructure = JSON.parse(fs.readFileSync(jsonStructureFile, 'utf-8'));
  const jsonNodes = jsonStructure.nodes || [];

  await prisma.roadmapNode.deleteMany({ where: { roadmapId } });

  const mappingKeys = Object.keys(mapping);
  const allHierarchyKeys = new Set<string>();

  // Collect all possible keys in the path (e.g. A:B:C -> A, A:B, A:B:C)
  mappingKeys.forEach((key) => {
    const parts = key.split(':');
    for (let i = 1; i <= parts.length; i++) {
      allHierarchyKeys.add(parts.slice(0, i).join(':'));
    }
  });

  const sortedKeys = Array.from(allHierarchyKeys).sort(
    (a, b) => a.split(':').length - b.split(':').length,
  );
  const keyToDbIdMap = new Map<string, string>();

  for (const key of sortedKeys) {
    const nodeId = mapping[key];
    const parts = key.split(':');
    const isLeafInMapping = mapping[key] && !mappingKeys.some((mk) => mk.startsWith(`${key}:`));

    let parentId: string | null = null;
    if (parts.length > 1) {
      const parentKey = parts.slice(0, -1).join(':');
      parentId = keyToDbIdMap.get(parentKey) || null;
    }

    const jsonNode = nodeId ? jsonNodes.find((n: any) => n.id === nodeId) : null;
    const content = nodeId ? getContentMetadata(roadmapDir, nodeId) : { name: '', description: '' };

    const displayName = content.name || jsonNode?.data?.label || formatKeyName(key);
    const posX = jsonNode?.position?.x || 0;
    const posY = jsonNode?.position?.y || 0;

    // RULE: Level 0 (no ":") is ALWAYS a GROUP.
    // Intermediate nodes (isLeafInMapping = false) are ALWAYS GROUPs.
    const isGroup = parts.length === 1 || !isLeafInMapping;

    if (isGroup) {
      // Create GROUP (explicit or implicit)
      const description = content.description || `Group container for ${displayName}`;
      const groupNode = await prisma.roadmapNode.create({
        data: {
          roadmapId,
          parentId,
          name: displayName,
          description,
          nodeType: NodeType.GROUP,
          posX,
          posY,
        },
      });
      keyToDbIdMap.set(key, groupNode.id);
    } else {
      // It's a Leaf Node (Level 1+)
      const skill = await prisma.skill.findFirst({
        where: { name: displayName },
        select: { id: true },
      });

      if (!skill) continue;

      let nodeType: NodeType = NodeType.REQUIRED;
      if (jsonNode?.data?.legend?.label?.toLowerCase().includes('option')) {
        nodeType = NodeType.OPTIONAL;
      }

      const leafNode = await prisma.roadmapNode.create({
        data: {
          roadmapId,
          parentId,
          skillId: skill.id,
          name: displayName,
          nodeType,
          posX,
          posY,
        },
      });
      keyToDbIdMap.set(key, leafNode.id);
    }
  }

  log(`  Done: ${keyToDbIdMap.size} nodes seeded.`);
  return true;
}

export async function seedNodesMain() {
  log('=== Seed Roadmap Nodes (Strict Hierarchy v4) ===');
  await prisma.roadmapNode.deleteMany({});

  const roadmaps = await prisma.roadmap.findMany({
    where: { isTemplate: true },
    select: { id: true, title: true },
  });

  const roadmapDirs = fs.readdirSync(ROADMAPS_ROOT).filter((dir) => {
    return fs.statSync(path.join(ROADMAPS_ROOT, dir)).isDirectory();
  });

  let roadmapsProcessed = 0;
  for (const slug of roadmapDirs) {
    const metadataFile = path.join(ROADMAPS_ROOT, slug, `${slug}.md`);
    let titleToMatch = slug;

    if (fs.existsSync(metadataFile)) {
      const content = fs.readFileSync(metadataFile, 'utf-8');
      const titleMatch = content.match(/^title:\s*['"]?(.+?)['"]?$/m);
      const headlineMatch = content.match(/^\s*headline:\s*['"]?(.+?)['"]?$/m);
      if (headlineMatch) titleToMatch = headlineMatch[1].trim();
      else if (titleMatch) titleToMatch = titleMatch[1].trim();
    }

    const dbRoadmap = roadmaps.find((r) => r.title === titleToMatch);
    if (dbRoadmap) {
      if (await seedRoadmapNodes(dbRoadmap.id, slug)) {
        roadmapsProcessed++;
      }
    }
  }

  log(`\nRoadmap Nodes seeding done! Successfully seeded ${roadmapsProcessed} roadmaps.`);
}

const isMain =
  typeof process !== 'undefined' &&
  process.argv[1] != null &&
  new URL(import.meta.url).pathname.endsWith(process.argv[1].replace(/\\/g, '/'));

if (isMain) {
  seedNodesMain()
    .catch((err) => {
      process.stderr.write(`[ERROR] ${String(err)}\n`);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
      await pool.end();
    });
}

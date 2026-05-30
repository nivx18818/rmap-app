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

import * as dagre from '@dagrejs/dagre';
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

interface LayoutNodeInput {
  tempId: string;
  tempParentId: string | null;
  nodeType: NodeType;
}

function computeDagreLayout(nodes: LayoutNodeInput[]): Map<string, { posX: number; posY: number }> {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'TB', ranksep: 100, nodesep: 60 });
  g.setDefaultEdgeLabel(() => ({}));

  for (const node of nodes) {
    const isLeaf = node.nodeType === NodeType.REQUIRED || node.nodeType === NodeType.OPTIONAL;
    g.setNode(node.tempId, {
      width: isLeaf ? 200 : 300,
      height: isLeaf ? 60 : 80,
    });

    if (node.tempParentId) {
      g.setEdge(node.tempParentId, node.tempId);
    }
  }

  dagre.layout(g);

  const result = new Map<string, { posX: number; posY: number }>();
  for (const node of nodes) {
    const { x, y } = g.node(node.tempId);
    result.set(node.tempId, { posX: x, posY: y });
  }

  return result;
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

  const skills = await prisma.skill.findMany({ select: { id: true, name: true } });
  const skillMap = new Map<string, string>();
  for (const s of skills) {
    skillMap.set(s.name, s.id);
  }

  interface ResolvedNode {
    key: string;
    parentKey: string | null;
    displayName: string;
    description: string | null;
    nodeType: NodeType;
    skillId: string | null;
  }

  const resolvedNodes = new Map<string, ResolvedNode>();

  for (const key of sortedKeys) {
    const nodeId = mapping[key];
    const parts = key.split(':');
    const isLeafInMapping = mapping[key] && !mappingKeys.some((mk) => mk.startsWith(`${key}:`));

    let parentKey: string | null = null;
    if (parts.length > 1) {
      parentKey = parts.slice(0, -1).join(':');
    }

    const jsonNode = nodeId ? jsonNodes.find((n: any) => n.id === nodeId) : null;
    const content = nodeId ? getContentMetadata(roadmapDir, nodeId) : { name: '', description: '' };

    const displayName = content.name || jsonNode?.data?.label || formatKeyName(key);

    // RULE: Level 0 (no ":") is ALWAYS a GROUP.
    // Intermediate nodes (isLeafInMapping = false) are ALWAYS GROUPs.
    const isGroup = parts.length === 1 || !isLeafInMapping;

    if (isGroup) {
      const description = content.description || `Group container for ${displayName}`;
      resolvedNodes.set(key, {
        key,
        parentKey,
        displayName,
        description,
        nodeType: NodeType.GROUP,
        skillId: null,
      });
    } else {
      // Leaf Node (Level 1+)
      const skillId = skillMap.get(displayName);
      if (!skillId) {
        continue;
      }

      let nodeType: NodeType = NodeType.REQUIRED;
      if (jsonNode?.data?.legend?.label?.toLowerCase().includes('option')) {
        nodeType = NodeType.OPTIONAL;
      }

      resolvedNodes.set(key, {
        key,
        parentKey,
        displayName,
        description: content.description || null,
        nodeType,
        skillId,
      });
    }
  }

  // Convert resolvedNodes to list of Dagre layout inputs
  const layoutNodes = Array.from(resolvedNodes.values()).map((node) => ({
    tempId: node.key,
    tempParentId: node.parentKey,
    nodeType: node.nodeType,
  }));

  // Compute layout
  const layoutPositions = computeDagreLayout(layoutNodes);

  const keyToDbIdMap = new Map<string, string>();

  for (const key of sortedKeys) {
    const node = resolvedNodes.get(key);
    if (!node) {
      continue;
    }

    let parentId: string | null = null;
    if (node.parentKey) {
      parentId = keyToDbIdMap.get(node.parentKey) || null;
    }

    const pos = layoutPositions.get(key) || { posX: 0, posY: 0 };

    const createdNode = await prisma.roadmapNode.create({
      data: {
        roadmapId,
        parentId,
        skillId: node.skillId,
        name: node.displayName,
        description: node.description,
        nodeType: node.nodeType,
        posX: pos.posX,
        posY: pos.posY,
      },
    });

    keyToDbIdMap.set(key, createdNode.id);
  }

  log(`  Done: ${keyToDbIdMap.size} nodes seeded.`);
  return true;
}

export async function seedNodesMain() {
  log('=== Seed Roadmap Nodes (Strict Hierarchy v4) ===');
  log('Clearing existing roadmap nodes and progress...');
  await prisma.userNodeProgress.deleteMany({});
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

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

function hasDeepChildren(key: string, allMappingKeys: string[]): boolean {
  const prefix = `${key}:`;
  const depth = key.split(':').length;
  return allMappingKeys.some((k) => k.startsWith(prefix) && k.split(':').length === depth + 1);
}

async function askGroupNameForSkill(
  skillNames: string,
  defaultName: string,
  roadmapSlug: string,
): Promise<string> {
  console.log(
    `[Agent Auto-Fill] Phân tích tên Group cho cụm skill "${skillNames}" thuộc roadmap "${roadmapSlug}"...`,
  );

  const rules = [
    { match: /Hypothesis Testing/i, name: 'Statistics' },
    { match: /SSR|Lifecycle/i, name: 'Angular Core' },
    { match: /Real Time|Polling/i, name: 'Realtime Comm' },
    { match: /ECR/i, name: 'Container Registry' },
    { match: /CI\/CD/i, name: 'CI/CD Pipelines' },
    { match: /NEO4J/i, name: 'Graph DB' },
    { match: /Databases/i, name: 'Databases' },
  ];

  for (const r of rules) {
    if (r.match.test(skillNames)) {
      console.log(`=> Auto-filled with: ${r.name}`);
      return r.name;
    }
  }

  const fallback = skillNames.includes(', ') ? 'Core Concepts' : defaultName;
  console.log(`=> Auto-filled with fallback: ${fallback}`);
  return fallback;
}

interface LayoutNodeInput {
  tempId: string;
  tempParentId: string | null;
  nodeType: NodeType;
}

/**
 * Mirrors DagreLayoutService.computeLayout() from apps/api:
 * - GROUP nodes form a vertical chain along the central axis (Dagre-computed Y).
 * - LEAF nodes are placed manually, alternating right/left of their GROUP parent,
 *   centered vertically around the parent's Y.
 * - ranksep is dynamic: max(150, ceil(maxLeafCount/2) * Y_SPACING + PADDING)
 *   so groups with many children never overlap their siblings.
 */
function computeDagreLayout(nodes: LayoutNodeInput[]) {
  const X_OFFSET = 340;
  const Y_SPACING = 50;
  const MIN_RANKSEP = 150;

  const axisNodes = nodes.filter((n) => n.tempParentId === null);
  const leafNodes = nodes.filter((n) => n.tempParentId !== null);

  const childrenMap = new Map<string, LayoutNodeInput[]>();
  for (const leaf of leafNodes) {
    if (leaf.tempParentId) {
      if (!childrenMap.has(leaf.tempParentId)) {
        childrenMap.set(leaf.tempParentId, []);
      }
      childrenMap.get(leaf.tempParentId)!.push(leaf);
    }
  }

  const result = new Map<string, { posX: number; posY: number }>();
  let currentY = 0;

  for (const node of axisNodes) {
    result.set(node.tempId, { posX: 0, posY: currentY });

    // ── Manual leaf placement (alternating right/left) ──────────────────
    const children = childrenMap.get(node.tempId) ?? [];
    const rightChildren = children.filter((_, idx) => idx % 2 === 0);
    const leftChildren = children.filter((_, idx) => idx % 2 !== 0);

    const placeChildren = (childArray: LayoutNodeInput[], isLeft: boolean) => {
      const k = childArray.length;
      if (k === 0) return;
      const startY = currentY - ((k - 1) * Y_SPACING) / 2;
      childArray.forEach((child, idx) => {
        const cx = isLeft ? -X_OFFSET : X_OFFSET;
        const cy = startY + idx * Y_SPACING;
        result.set(child.tempId, { posX: cx, posY: cy });
      });
    };

    placeChildren(rightChildren, false);
    placeChildren(leftChildren, true);

    // Calculate height consumed by children to push next axis node down dynamically
    const maxLeaves = children.length;
    const columnHeight = Math.ceil(maxLeaves / 2) * Y_SPACING;

    // Add dynamic spacing for the next node
    currentY += Math.max(MIN_RANKSEP, columnHeight + 50);
  }

  // ── Safety fallback for orphaned leaves ───────────────────────────────
  for (const leaf of leafNodes) {
    if (!result.has(leaf.tempId)) {
      result.set(leaf.tempId, { posX: 0, posY: 0 });
    }
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

  const allHierarchyKeysArray = Array.from(allHierarchyKeys);
  const prefixOrder = new Map<string, number>();
  mappingKeys.forEach((key) => {
    const prefix = key.split(':')[0];
    if (!prefixOrder.has(prefix)) {
      prefixOrder.set(prefix, prefixOrder.size);
    }
  });

  const getRank = (key: string): number => {
    const depth = key.split(':').length;
    if (depth === 2 && hasDeepChildren(key, allHierarchyKeysArray)) return 1; // Promoted groups
    if (depth === 1) return 2; // Base group
    if (depth === 2) return 3; // Non-promoted leaves of base group
    return depth + 2; // Depth 3 goes to 5, Depth 4 goes to 6, etc.
  };

  const sortedKeys = allHierarchyKeysArray.sort((a, b) => {
    const prefixA = a.split(':')[0];
    const prefixB = b.split(':')[0];

    // Maintain top-level prefix ordering first
    if (prefixA !== prefixB) {
      return (prefixOrder.get(prefixA) ?? 0) - (prefixOrder.get(prefixB) ?? 0);
    }

    // Within the same top-level prefix, sort by our custom rank
    const rankA = getRank(a);
    const rankB = getRank(b);

    if (rankA !== rankB) return rankA - rankB;

    // If same rank (e.g. two promoted groups), sort alphabetically to ensure determinism
    return a.localeCompare(b);
  });

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
    const depth = parts.length;

    const jsonNode = nodeId ? jsonNodes.find((n: any) => n.id === nodeId) : null;
    const content = nodeId ? getContentMetadata(roadmapDir, nodeId) : { name: '', description: '' };
    const displayName = content.name || jsonNode?.data?.label || formatKeyName(key);

    let isGroup = false;
    let parentKey: string | null = null;

    if (depth === 1) {
      isGroup = true;
      parentKey = null;
    } else if (depth === 2) {
      if (hasDeepChildren(key, allHierarchyKeysArray)) {
        isGroup = true;
        parentKey = null; // Promoted group
      } else {
        isGroup = false;
        parentKey = parts.slice(0, 1).join(':'); // Depth-1 parent
      }
    } else if (depth >= 3) {
      isGroup = false;
      parentKey = parts.slice(0, 2).join(':'); // Promoted depth-2 parent
    }

    if (isGroup) {
      let finalNodeType: NodeType = NodeType.GROUP;

      if (depth === 1) {
        const depth2Keys = allHierarchyKeysArray.filter(
          (k) => k.startsWith(`${key}:`) && k.split(':').length === 2,
        );
        // If there are no unpromoted depth-2 leaves, this base group becomes a MILESTONE
        const hasUnpromotedLeaves = depth2Keys.some(
          (k) => !hasDeepChildren(k, allHierarchyKeysArray),
        );
        if (!hasUnpromotedLeaves) {
          finalNodeType = NodeType.MILESTONE;
        }
      }

      const description = content.description || `Group container for ${displayName}`;
      resolvedNodes.set(key, {
        key,
        parentKey,
        displayName,
        description,
        nodeType: finalNodeType,
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

  // Q3: Detect leaf-less groups and cluster adjacent ones
  const depth1Keys = sortedKeys.filter((k) => k.split(':').length === 1);
  let currentCluster: { key: string; node: ResolvedNode; skillId: string }[] = [];

  const processCluster = async (cluster: typeof currentCluster) => {
    if (cluster.length === 0) return;

    const skillNames = cluster.map((c) => c.node.displayName).join(', ');
    const defaultName =
      cluster.length === 1 ? `${cluster[0].node.displayName} Concepts` : 'Misc Concepts';

    const groupName = await askGroupNameForSkill(skillNames, defaultName, slug);
    const wrapperKey = `cluster_wrapper_${cluster[0].key}`;

    resolvedNodes.set(wrapperKey, {
      key: wrapperKey,
      parentKey: null,
      displayName: groupName,
      description: `Wrapper for ${skillNames}`,
      nodeType: NodeType.GROUP,
      skillId: null,
    });

    for (const item of cluster) {
      item.node.nodeType = NodeType.REQUIRED;
      item.node.skillId = item.skillId;
      item.node.parentKey = wrapperKey;
    }
  };

  for (const key of depth1Keys) {
    const node = resolvedNodes.get(key);
    if (!node) continue;

    const hasChildren = Array.from(resolvedNodes.values()).some((n) => n.parentKey === key);

    if (!hasChildren) {
      const skillId = skillMap.get(node.displayName);
      if (skillId) {
        currentCluster.push({ key, node, skillId });
      }
    } else {
      if (currentCluster.length > 0) {
        await processCluster(currentCluster);
        currentCluster = [];
      }
    }
  }

  if (currentCluster.length > 0) {
    await processCluster(currentCluster);
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

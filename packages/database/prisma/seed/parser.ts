import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { RoleCategory } from '../../generated/prisma/enums';

import {
  getRoleCategoryForSlug,
  mapResourceType,
  type ParsedSkill,
  type ParsedResource,
} from './utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseMarkdownContent(
  filePath: string,
  roleCategory: RoleCategory,
  nodeId: string,
): ParsedSkill {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  let name = 'Unknown';
  let descLines: string[] = [];
  const resources: ParsedResource[] = [];
  let inResourceSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('# ')) {
      name = line.replace('# ', '').trim();
      continue;
    }

    if (line === 'Visit the following resources to learn more:') {
      inResourceSection = true;
      continue;
    }

    const resourceMatch = line.match(/^-\s+\[@(.*?)@(.*?)\]\((.*?)\)$/);
    if (resourceMatch) {
      const mapped = mapResourceType(resourceMatch[1]);
      if (mapped) {
        resources.push({
          resource_type: mapped,
          title: resourceMatch[2].trim(),
          url: resourceMatch[3].trim(),
        });
      }
      continue;
    }

    if (!inResourceSection && !line.startsWith('- ') && line.length > 0) {
      descLines.push(line);
    }
  }

  return {
    id: nodeId,
    name,
    description: descLines.join('\n').trim(),
    role_category: roleCategory,
    resources,
  };
}

export type ParsedSkillSeed = ParsedSkill;

export function parseSkillsFromRoadmap(roadmapSlug: string): ParsedSkillSeed[] {
  const baseDir = path.resolve(
    __dirname,
    `../../../../docs/developer-roadmap/src/data/roadmaps/${roadmapSlug}`,
  );

  const mapFile = fs.existsSync(path.join(baseDir, 'migration-mapping.json'))
    ? 'migration-mapping.json'
    : 'mapping.json';

  if (!fs.existsSync(path.join(baseDir, mapFile))) {
    return [];
  }

  const mapping: Record<string, string> = JSON.parse(
    fs.readFileSync(path.join(baseDir, mapFile), 'utf-8'),
  );

  const contentDir = path.join(baseDir, 'content');
  if (!fs.existsSync(contentDir)) {
    return [];
  }

  const roleCategory = getRoleCategoryForSlug(roadmapSlug);
  const contentById = new Map<string, string>();
  const files = fs.readdirSync(contentDir).filter((f) => f.endsWith('.md'));
  files.forEach((file) => {
    const match = file.match(/@([^@\.]+)\.md$/);
    if (match && match[1]) {
      contentById.set(match[1], path.join(contentDir, file));
    }
  });

  const skills: ParsedSkillSeed[] = [];

  const mappingKeys = Object.keys(mapping);

  for (const [key, nodeId] of Object.entries(mapping)) {
    if (!key.includes(':')) {
      const hasChildren = mappingKeys.some((k) => k.startsWith(`${key}:`));
      if (hasChildren) {
        continue;
      }
    }

    const contentPath = contentById.get(nodeId);
    if (!contentPath) {
      continue;
    }

    skills.push(parseMarkdownContent(contentPath, roleCategory, nodeId));
  }

  return skills;
}

export type RoadmapSkillBatch = {
  roadmapSlug: string;
  skills: ParsedSkillSeed[];
};

export function parseAllRoadmapsSkills(): RoadmapSkillBatch[] {
  const baseRoadmapsDir = path.resolve(
    __dirname,
    '../../../../docs/developer-roadmap/src/data/roadmaps',
  );

  const roadmapDirs = fs
    .readdirSync(baseRoadmapsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  const results: RoadmapSkillBatch[] = [];

  for (const roadmapSlug of roadmapDirs) {
    const roadmapDir = path.join(baseRoadmapsDir, roadmapSlug);
    const hasMapping =
      fs.existsSync(path.join(roadmapDir, 'migration-mapping.json')) ||
      fs.existsSync(path.join(roadmapDir, 'mapping.json'));

    if (!hasMapping) {
      continue;
    }

    const skills = parseSkillsFromRoadmap(roadmapSlug);
    if (skills.length === 0) {
      continue;
    }

    results.push({ roadmapSlug, skills });
  }

  return results;
}

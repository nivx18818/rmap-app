import { RoadmapGenerationUnavailableException } from '@/common/exceptions/app.exceptions';

import type { AiNode, AiRoadmapOutput, FlatNode } from '../types/ai-roadmap.types';

import { stripMarkdownFences } from './markdown';

type GenerationLogger = {
  error(message: string, error?: unknown): void;
  warn(message: string, context?: unknown): void;
};

export const flattenTree = (
  nodes: AiNode[],
  parentTempId: string | null,
  counter: { n: number },
): FlatNode[] => {
  const result: FlatNode[] = [];

  for (const node of nodes) {
    const tempId = `t${counter.n++}`;
    const flat: FlatNode = {
      tempId,
      tempParentId: parentTempId,
      realId: crypto.randomUUID(),
      realParentId: null,
      name: node.name,
      nodeType: node.nodeType.toUpperCase() as FlatNode['nodeType'],
      description: node.nodeType === 'milestone' ? (node.description ?? null) : null,
      estimatedHours:
        node.nodeType === 'required' || node.nodeType === 'optional'
          ? (node.estimatedHours ?? null)
          : null,
      skillId:
        node.nodeType === 'required' || node.nodeType === 'optional'
          ? (node.skillId ?? null)
          : null,
    };

    result.push(flat);

    if (node.children?.length) {
      result.push(...flattenTree(node.children, tempId, counter));
    }
  }

  return result;
};

export const parseRoadmapResponse = (
  text: string,
  skillMap: Array<{ id: string; name: string }>,
  logger: GenerationLogger,
): AiRoadmapOutput => {
  const cleaned = stripMarkdownFences(text);
  let parsed: unknown;

  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    logger.error('Failed to parse Gemini JSON response', { raw: text, err });
    throw new RoadmapGenerationUnavailableException();
  }

  if (!isValidAiRoadmapOutput(parsed, logger)) {
    throw new RoadmapGenerationUnavailableException();
  }

  const normalized = normalizeRoadmapOutput(parsed, skillMap, logger);
  if (normalized.nodes.length === 0) {
    logger.error('All nodes were filtered out during normalization');
    throw new RoadmapGenerationUnavailableException();
  }

  return normalized;
};

export const normalizeRoadmapOutput = (
  output: AiRoadmapOutput,
  skillMap: Array<{ id: string; name: string }>,
  logger: GenerationLogger,
): AiRoadmapOutput => {
  const validSkillIds = new Set(skillMap.map((skill) => skill.id));

  const cleanNodes = (nodes: AiNode[]): AiNode[] => {
    return nodes
      .map((node) => {
        if (node.nodeType === 'group' || node.nodeType === 'milestone') {
          const { skillId: _skillId, ...rest } = node;
          return {
            ...rest,
            children: node.children ? cleanNodes(node.children) : [],
          };
        }

        if ((node.nodeType === 'required' || node.nodeType === 'optional') && node.skillId) {
          if (!validSkillIds.has(node.skillId)) {
            logger.warn(
              `LLM hallucinated skillId: ${node.skillId}. Matching by name: ${node.name}`,
            );
            const matched = skillMap.find(
              (skill) => skill.name.toLowerCase() === node.name.toLowerCase(),
            );
            if (matched) {
              node.skillId = matched.id;
            } else {
              logger.error(`Could not recover hallucinated skill: ${node.name}`);
            }
          }
        }

        return {
          ...node,
          children: node.children ? cleanNodes(node.children) : [],
        };
      })
      .filter((node) => {
        if (node.nodeType === 'required' || node.nodeType === 'optional') {
          return !!node.skillId;
        }
        if (node.nodeType === 'group') {
          return !!node.children && node.children.length > 0;
        }
        return true;
      });
  };

  return {
    title: output.title,
    description: output.description,
    nodes: cleanNodes(output.nodes),
  };
};

export const isValidAiRoadmapOutput = (
  payload: unknown,
  logger: GenerationLogger,
): payload is AiRoadmapOutput => {
  if (!payload || typeof payload !== 'object') return false;

  const candidate = payload as AiRoadmapOutput;
  if (typeof candidate.title !== 'string') return false;
  if (typeof candidate.description !== 'string') return false;
  if (!Array.isArray(candidate.nodes) || candidate.nodes.length === 0) return false;

  return candidate.nodes.every((node) => isValidAiNode(node, logger));
};

export const isValidAiNode = (
  node: unknown,
  logger: GenerationLogger,
  depth = 0,
): node is AiNode => {
  if (!node || typeof node !== 'object') {
    logger.warn(`Validation failed: node is not an object at depth ${depth}`);
    return false;
  }
  const candidate = node as AiNode;

  if (typeof candidate.name !== 'string') {
    logger.warn(`Validation failed: node name is not a string at depth ${depth}`, { node });
    return false;
  }
  if (!['group', 'milestone', 'required', 'optional'].includes(candidate.nodeType)) {
    logger.warn(`Validation failed: invalid nodeType "${candidate.nodeType}" at depth ${depth}`, {
      node,
    });
    return false;
  }

  if (candidate.nodeType === 'required' || candidate.nodeType === 'optional') {
    if (
      candidate.skillId !== undefined &&
      candidate.skillId !== null &&
      typeof candidate.skillId !== 'string'
    ) {
      logger.warn(`Validation failed: leaf node skillId must be string or null`, { node });
      return false;
    }
    if (
      candidate.estimatedHours !== undefined &&
      candidate.estimatedHours !== null &&
      typeof candidate.estimatedHours !== 'number'
    ) {
      logger.warn(`Validation failed: leaf node estimatedHours must be number or null`, {
        node,
      });
      return false;
    }
    if (candidate.children && Array.isArray(candidate.children) && candidate.children.length > 0) {
      logger.warn(`Validation failed: leaf nodes cannot have children`, { node });
      return false;
    }
    return true;
  }

  if (candidate.nodeType === 'milestone') {
    if (candidate.children && Array.isArray(candidate.children) && candidate.children.length > 0) {
      logger.warn(`Validation failed: milestone nodes cannot have children`, { node });
      return false;
    }
    return true;
  }

  if (candidate.nodeType === 'group') {
    if (candidate.skillId !== undefined && candidate.skillId !== null) {
      logger.warn(`Validation failed: group nodes should not have skillId`, { node });
      return false;
    }
    if (!Array.isArray(candidate.children) || candidate.children.length === 0) {
      logger.warn(`Validation failed: group nodes must have children`, { node });
      return false;
    }

    const allChildrenAreLeaves = candidate.children.every((child) => {
      const childNode = child;
      return childNode && (childNode.nodeType === 'required' || childNode.nodeType === 'optional');
    });
    if (!allChildrenAreLeaves) {
      logger.warn(
        `Validation failed: group nodes must only contain leaf nodes (no nested groups allowed)`,
        { node },
      );
      return false;
    }

    return candidate.children.every((child) => isValidAiNode(child, logger, depth + 1));
  }

  return false;
};

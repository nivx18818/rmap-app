export type RoadmapMarkdownInlineNode =
  | { text: string; type: 'text' }
  | { children: RoadmapMarkdownInlineNode[]; type: 'bold' }
  | { children: RoadmapMarkdownInlineNode[]; type: 'italic' }
  | { text: string; type: 'code' }
  | { children: RoadmapMarkdownInlineNode[]; href: string; type: 'link' };

export type RoadmapMarkdownBlock =
  | { children: RoadmapMarkdownInlineNode[]; type: 'paragraph' }
  | { children: RoadmapMarkdownInlineNode[]; level: 1 | 2 | 3 | 4 | 5 | 6; type: 'heading' }
  | { items: RoadmapMarkdownInlineNode[][]; type: 'ordered-list' | 'unordered-list' };

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

const HEADING_PATTERN = /^(#{1,6})\s+(.+)$/;
const ORDERED_LIST_PATTERN = /^\d+[.)]\s+(.+)$/;
const UNORDERED_LIST_PATTERN = /^[-*]\s+(.+)$/;
const INLINE_HEADING_PATTERN = /([^\n])\s+(#{1,6})\s+/g;
const INLINE_LIST_PATTERN = /([^\n])\s+([-*]|\d+[.)])\s+/g;
const LIKELY_PARAGRAPH_STARTERS = new Set([
  'a',
  'after',
  'aim',
  'an',
  'before',
  'build',
  'building',
  'conduct',
  'create',
  'designing',
  'developing',
  'ensure',
  'if',
  'in',
  'learn',
  'make',
  'one',
  'once',
  'the',
  'these',
  'this',
  "today's",
  'to',
  'use',
  'when',
  'while',
]);

function compactWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeRoadmapMarkdown(value: string): string {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(INLINE_HEADING_PATTERN, '$1\n\n$2 ')
    .replace(INLINE_LIST_PATTERN, '$1\n$2 ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function countWords(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function toHeadingLevel(level: number): HeadingLevel {
  return Math.min(Math.max(level, 1), 6) as HeadingLevel;
}

function splitHeadingBody(content: string): { body?: string; title: string } {
  const words = content.trim().split(/\s+/);

  for (let index = 2; index <= Math.min(words.length - 6, 8); index += 1) {
    const starter = words[index]?.toLowerCase().replace(/[^\w']/g, '');

    if (!starter || !LIKELY_PARAGRAPH_STARTERS.has(starter)) continue;

    const title = words.slice(0, index).join(' ');
    const body = words.slice(index).join(' ');

    if (countWords(body) >= 6) {
      return { body: compactWhitespace(body), title: compactWhitespace(title) };
    }
  }

  return { title: compactWhitespace(content) };
}

function parseInlineMarkdown(value: string): RoadmapMarkdownInlineNode[] {
  const nodes: RoadmapMarkdownInlineNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;

  for (const match of value.matchAll(pattern)) {
    const token = match[0];
    const index = match.index ?? 0;

    if (index > lastIndex) {
      nodes.push({ text: value.slice(lastIndex, index), type: 'text' });
    }

    if (token.startsWith('**') && token.endsWith('**')) {
      nodes.push({ children: parseInlineMarkdown(token.slice(2, -2)), type: 'bold' });
    } else if (token.startsWith('*') && token.endsWith('*')) {
      nodes.push({ children: parseInlineMarkdown(token.slice(1, -1)), type: 'italic' });
    } else if (token.startsWith('`') && token.endsWith('`')) {
      nodes.push({ text: token.slice(1, -1), type: 'code' });
    } else {
      const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);

      if (linkMatch) {
        nodes.push({
          children: parseInlineMarkdown(linkMatch[1] ?? ''),
          href: linkMatch[2] ?? '#',
          type: 'link',
        });
      }
    }

    lastIndex = index + token.length;
  }

  if (lastIndex < value.length) {
    nodes.push({ text: value.slice(lastIndex), type: 'text' });
  }

  return nodes;
}

function flushParagraph(paragraphLines: string[], blocks: RoadmapMarkdownBlock[]) {
  if (paragraphLines.length === 0) return;

  const paragraph = compactWhitespace(paragraphLines.join(' '));

  if (paragraph) {
    blocks.push({ children: parseInlineMarkdown(paragraph), type: 'paragraph' });
  }

  paragraphLines.length = 0;
}

export function parseRoadmapMarkdown(value: string): RoadmapMarkdownBlock[] {
  const normalizedMarkdown = normalizeRoadmapMarkdown(value);
  const blocks: RoadmapMarkdownBlock[] = [];
  const paragraphLines: string[] = [];
  const lines = normalizedMarkdown.split('\n');

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph(paragraphLines, blocks);
      continue;
    }

    const headingMatch = HEADING_PATTERN.exec(line);

    if (headingMatch) {
      flushParagraph(paragraphLines, blocks);

      const level = headingMatch[1]?.length ?? 2;
      const { body, title } = splitHeadingBody(headingMatch[2] ?? '');

      blocks.push({
        children: parseInlineMarkdown(title),
        level: toHeadingLevel(level),
        type: 'heading',
      });

      if (body) {
        blocks.push({ children: parseInlineMarkdown(body), type: 'paragraph' });
      }

      continue;
    }

    const unorderedListMatch = UNORDERED_LIST_PATTERN.exec(line);
    const orderedListMatch = ORDERED_LIST_PATTERN.exec(line);

    if (unorderedListMatch || orderedListMatch) {
      const listType = unorderedListMatch ? 'unordered-list' : 'ordered-list';
      const item = unorderedListMatch?.[1] ?? orderedListMatch?.[1] ?? '';
      const previousBlock = blocks.at(-1);

      flushParagraph(paragraphLines, blocks);

      if (previousBlock?.type === listType) {
        previousBlock.items.push(parseInlineMarkdown(compactWhitespace(item)));
      } else {
        blocks.push({
          items: [parseInlineMarkdown(compactWhitespace(item))],
          type: listType,
        });
      }

      continue;
    }

    paragraphLines.push(line);
  }

  flushParagraph(paragraphLines, blocks);

  return blocks;
}

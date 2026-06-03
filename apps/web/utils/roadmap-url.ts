const BASE64URL_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const ENCODED_UUID_LENGTH = 22;
const UUID_HEX_REGEX = /^[0-9a-f]{32}$/i;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ReadableRoadmapUrlParts {
  id: string;
  title?: null | string;
}

interface ReadableNodeUrlParts {
  id: string;
  name?: null | string;
}

interface RoadmapNodeHrefParts {
  node: ReadableNodeUrlParts;
  roadmap: ReadableRoadmapUrlParts;
}

function encodeBytesToBase64Url(bytes: number[]): string {
  let encoded = '';

  for (let index = 0; index < bytes.length; index += 3) {
    const firstByte = bytes[index] ?? 0;
    const secondByte = bytes[index + 1] ?? 0;
    const thirdByte = bytes[index + 2] ?? 0;

    encoded += BASE64URL_ALPHABET.charAt(firstByte >> 2);
    encoded += BASE64URL_ALPHABET.charAt(((firstByte & 3) << 4) | (secondByte >> 4));

    if (index + 1 < bytes.length) {
      encoded += BASE64URL_ALPHABET.charAt(((secondByte & 15) << 2) | (thirdByte >> 6));
    }

    if (index + 2 < bytes.length) {
      encoded += BASE64URL_ALPHABET.charAt(thirdByte & 63);
    }
  }

  return encoded;
}

function getBase64UrlValue(character: string): number {
  const value = BASE64URL_ALPHABET.indexOf(character);

  if (value === -1) {
    throw new Error('Readable URL ID contains invalid characters.');
  }

  return value;
}

function decodeBase64UrlToBytes(value: string): number[] {
  const bytes: number[] = [];

  for (let index = 0; index < value.length; index += 4) {
    const chunk = value.slice(index, index + 4);

    if (chunk.length === 1) {
      throw new Error('Readable URL ID has invalid base64url length.');
    }

    const firstValue = getBase64UrlValue(chunk.charAt(0));
    const secondValue = getBase64UrlValue(chunk.charAt(1));
    const thirdValue = chunk.length > 2 ? getBase64UrlValue(chunk.charAt(2)) : 0;
    const fourthValue = chunk.length > 3 ? getBase64UrlValue(chunk.charAt(3)) : 0;
    const combinedValue =
      (firstValue << 18) | (secondValue << 12) | (thirdValue << 6) | fourthValue;

    bytes.push((combinedValue >> 16) & 255);

    if (chunk.length > 2) {
      bytes.push((combinedValue >> 8) & 255);
    }

    if (chunk.length > 3) {
      bytes.push(combinedValue & 255);
    }
  }

  return bytes;
}

function formatUuidFromBytes(bytes: number[]): string {
  const hex = bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('');

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

function extractEncodedUuidSuffix(value: string): string {
  const trimmedValue = value.trim();

  if (UUID_REGEX.test(trimmedValue)) {
    throw new Error('Readable URL ID must include a slug and encoded ID suffix.');
  }

  const separatorIndex = trimmedValue.length - ENCODED_UUID_LENGTH - 1;

  if (separatorIndex < 1 || trimmedValue.charAt(separatorIndex) !== '-') {
    throw new Error('Readable URL ID must include a slug and encoded ID suffix.');
  }

  return trimmedValue.slice(-ENCODED_UUID_LENGTH);
}

export function slugifyReadableUrlPart(value: null | string | undefined, fallback: string) {
  const slug = (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || fallback;
}

export function encodeUuidForReadableUrl(uuid: string): string {
  const hex = uuid.replace(/-/g, '').toLowerCase();

  if (!UUID_HEX_REGEX.test(hex)) {
    throw new Error('Readable URL IDs can only be built from UUIDs.');
  }

  const bytes = hex.match(/.{2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? [];

  return encodeBytesToBase64Url(bytes);
}

export function decodeReadableUrlId(value: string): string {
  const encodedId = extractEncodedUuidSuffix(value);
  const bytes = decodeBase64UrlToBytes(encodedId);

  if (bytes.length !== 16) {
    throw new Error('Readable URL ID does not decode to a UUID.');
  }

  return formatUuidFromBytes(bytes);
}

export function tryDecodeReadableUrlId(value: null | string): null | string {
  if (!value) return null;

  try {
    return decodeReadableUrlId(value);
  } catch {
    return null;
  }
}

export function buildRoadmapSlug(roadmap: ReadableRoadmapUrlParts): string {
  return `${slugifyReadableUrlPart(roadmap.title, 'roadmap')}-${encodeUuidForReadableUrl(
    roadmap.id,
  )}`;
}

export function buildNodeSlug(node: ReadableNodeUrlParts): string {
  return `${slugifyReadableUrlPart(node.name, 'node')}-${encodeUuidForReadableUrl(node.id)}`;
}

export function buildRoadmapHref(roadmap: ReadableRoadmapUrlParts): string {
  return `/roadmaps/${buildRoadmapSlug(roadmap)}`;
}

export function buildRoadmapNodeHref({ node, roadmap }: RoadmapNodeHrefParts): string {
  return `${buildRoadmapHref(roadmap)}?node=${buildNodeSlug(node)}`;
}

export function buildRoadmapNodeQuizHref({ node, roadmap }: RoadmapNodeHrefParts): string {
  return `${buildRoadmapHref(roadmap)}/nodes/${buildNodeSlug(node)}/quiz`;
}

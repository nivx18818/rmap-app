import type { Prisma } from '@repo/db/prisma/client';

import type { DecimalLike } from './roadmap-records';

export const toNumberOrNull = (value: Prisma.Decimal | number | null): number | null =>
  value === null ? null : Number(value);

export const formatDecimal = (value: DecimalLike | null): null | number => {
  if (!value) {
    return null;
  }

  return typeof value.toNumber === 'function' ? value.toNumber() : Number(value.toString());
};

export const roundToOne = (value: number): number => Math.round(value * 10) / 10;

export const roundToTwo = (value: number): number => Math.round(value * 100) / 100;

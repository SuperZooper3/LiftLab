import type { RandomSource } from './types.js';

export class SeededRandom implements RandomSource {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
    if (this.state === 0) {
      this.state = 0x6d2b79f5;
    }
  }

  next(): number {
    this.state += 0x6d2b79f5;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  integer(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new Error('Cannot pick from an empty array.');
    }
    return items[this.integer(0, items.length - 1)];
  }

  weightedIndex(weights: readonly number[]): number {
    const total = weights.reduce((sum, weight) => sum + Math.max(0, weight), 0);
    if (total <= 0) {
      return this.integer(0, weights.length - 1);
    }

    let cursor = this.next() * total;
    for (let index = 0; index < weights.length; index += 1) {
      cursor -= Math.max(0, weights[index]);
      if (cursor <= 0) {
        return index;
      }
    }

    return weights.length - 1;
  }
}

export function createSeededRandom(seed: number): SeededRandom {
  return new SeededRandom(seed);
}

export function poisson(lambda: number, rng: RandomSource): number {
  if (lambda <= 0) {
    return 0;
  }

  if (lambda > 30) {
    const normalApproximation = lambda + Math.sqrt(lambda) * boxMuller(rng);
    return Math.max(0, Math.round(normalApproximation));
  }

  const threshold = Math.exp(-lambda);
  let product = 1;
  let count = 0;

  do {
    count += 1;
    product *= rng.next();
  } while (product > threshold);

  return count - 1;
}

function boxMuller(rng: RandomSource): number {
  const u = Math.max(Number.EPSILON, rng.next());
  const v = Math.max(Number.EPSILON, rng.next());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

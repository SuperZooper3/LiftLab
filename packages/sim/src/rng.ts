/**
 * Deterministic Random Number Generator
 * Uses a Linear Congruential Generator (LCG) for reproducible randomness
 */

/**
 * Seeded Random Number Generator interface
 */
export interface SeededRNG {
  /** Generate next random float between 0 and 1 (exclusive of 1) */
  nextFloat(): number;
  
  /** Generate random integer between min (inclusive) and max (exclusive) */
  nextInt(min: number, max: number): number;
  
  /** Generate random integer between 0 (inclusive) and max (exclusive) */
  nextIntMax(max: number): number;
  
  /** Generate random boolean with given probability (default 0.5) */
  nextBoolean(probability?: number): boolean;
  
  /** Pick random element from array */
  choice<T>(array: T[]): T;
  
  /** Shuffle array in place using Fisher-Yates algorithm */
  shuffle<T>(array: T[]): T[];
  
  /** Generate random float between min and max */
  nextFloatRange(min: number, max: number): number;
  
  /** Get current seed state (for debugging/serialization) */
  getSeed(): number;
}

/**
 * Linear Congruential Generator implementation
 * Uses same constants as Numerical Recipes: a=1664525, c=1013904223, m=2^32
 */
class LCGRandom implements SeededRNG {
  private seed: number;
  private readonly a = 1664525;
  private readonly c = 1013904223;
  private readonly m = Math.pow(2, 32);

  constructor(seed: number) {
    // Ensure seed is a positive integer
    this.seed = Math.abs(Math.floor(seed)) || 1;
  }

  nextFloat(): number {
    this.seed = (this.a * this.seed + this.c) % this.m;
    return this.seed / this.m;
  }

  nextInt(min: number, max: number): number {
    if (min >= max) {
      throw new Error(`Invalid range: min (${min}) must be less than max (${max})`);
    }
    return Math.floor(this.nextFloat() * (max - min)) + min;
  }

  nextIntMax(max: number): number {
    return this.nextInt(0, max);
  }

  nextBoolean(probability: number = 0.5): boolean {
    if (probability < 0 || probability > 1) {
      throw new Error(`Probability must be between 0 and 1, got ${probability}`);
    }
    return this.nextFloat() < probability;
  }

  choice<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot choose from empty array');
    }
    const index = this.nextIntMax(array.length);
    return array[index];
  }

  shuffle<T>(array: T[]): T[] {
    // Fisher-Yates shuffle
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.nextIntMax(i + 1);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  nextFloatRange(min: number, max: number): number {
    if (min >= max) {
      throw new Error(`Invalid range: min (${min}) must be less than max (${max})`);
    }
    return this.nextFloat() * (max - min) + min;
  }

  getSeed(): number {
    return this.seed;
  }
}

/**
 * Create a new seeded random number generator
 * @param seed Initial seed value (will be made positive integer)
 * @returns SeededRNG instance
 */
export function createSeededRNG(seed: number): SeededRNG {
  return new LCGRandom(seed);
}

/**
 * Utility functions for common random operations
 */
export class RandomUtils {
  /**
   * Generate random passenger spawn times using Poisson distribution approximation
   * @param rng Random number generator
   * @param rate Average rate (passengers per minute)
   * @param deltaTime Time interval in minutes
   * @returns Number of passengers to spawn this interval
   */
  static poissonSpawn(rng: SeededRNG, rate: number, deltaTime: number): number {
    // Simple approximation: use normal distribution for high rates
    // For low rates, use exponential intervals
    const lambda = rate * deltaTime;
    
    if (lambda < 10) {
      // Use Knuth's algorithm for small lambda
      let l = Math.exp(-lambda);
      let k = 0;
      let p = 1;
      
      do {
        k++;
        p *= rng.nextFloat();
      } while (p > l);
      
      return k - 1;
    } else {
      // Normal approximation for large lambda
      const normal = this.normalRandom(rng, lambda, Math.sqrt(lambda));
      return Math.max(0, Math.round(normal));
    }
  }

  /**
   * Generate normally distributed random number using Box-Muller transform
   * @param rng Random number generator
   * @param mean Mean of distribution
   * @param stdDev Standard deviation
   * @returns Normally distributed random number
   */
  static normalRandom(rng: SeededRNG, mean: number = 0, stdDev: number = 1): number {
    // Box-Muller transform
    const u1 = rng.nextFloat();
    const u2 = rng.nextFloat();
    
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * stdDev + mean;
  }

  /**
   * Generate random floor selection with weighted probabilities
   * Ground floor and top floor might be more popular
   * @param rng Random number generator
   * @param floorCount Total number of floors
   * @param groundFloorWeight Weight for ground floor (default 2.0)
   * @param topFloorWeight Weight for top floor (default 1.5)
   * @returns Random floor (0-based)
   */
  static weightedFloorSelection(
    rng: SeededRNG, 
    floorCount: number,
    groundFloorWeight: number = 2.0,
    topFloorWeight: number = 1.5
  ): number {
    // Create weights array
    const weights = new Array(floorCount).fill(1.0);
    weights[0] = groundFloorWeight; // Ground floor
    weights[floorCount - 1] = topFloorWeight; // Top floor
    
    // Calculate total weight
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    
    // Generate random value
    let random = rng.nextFloat() * totalWeight;
    
    // Find selected floor
    for (let i = 0; i < floorCount; i++) {
      random -= weights[i];
      if (random <= 0) {
        return i;
      }
    }
    
    // Fallback (shouldn't happen)
    return floorCount - 1;
  }

  /**
   * Generate unique ID string using timestamp and random component
   * @param rng Random number generator
   * @param prefix Optional prefix for the ID
   * @returns Unique ID string
   */
  static generateId(rng: SeededRNG, prefix: string = ''): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.floor(rng.nextFloat() * 1000000).toString(36);
    return prefix ? `${prefix}_${timestamp}_${randomPart}` : `${timestamp}_${randomPart}`;
  }
}

/**
 * Pre-configured RNG instances for common use cases
 */
export class RNGPresets {
  /**
   * Create RNG with current timestamp as seed (for truly random behavior)
   */
  static createTimestamped(): SeededRNG {
    return createSeededRNG(Date.now());
  }

  /**
   * Create RNG with a well-known seed for testing
   */
  static createTestRNG(): SeededRNG {
    return createSeededRNG(12345);
  }

  /**
   * Create RNG from string hash (useful for configuration-based seeds)
   */
  static createFromString(str: string): SeededRNG {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return createSeededRNG(Math.abs(hash) || 1);
  }
}

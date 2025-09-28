/**
 * PassengerSpawner
 * Generates passengers with configurable spawn patterns and distributions
 */

import { Passenger } from './models.js';
import { SeededRNG, RandomUtils } from './rng.js';

/**
 * Configuration for passenger spawning behavior
 */
export interface SpawnerConfig {
  /** Total number of floors in the building */
  floorCount: number;
  
  /** Base spawn rate (passengers per minute) */
  spawnRate: number;
  
  /** Random number generator for deterministic behavior */
  rng: SeededRNG;
  
  /** Minimum time between spawns (seconds) to prevent clustering */
  minSpawnInterval?: number;
  
  /** Maximum passengers that can be waiting at any floor */
  maxWaitingPerFloor?: number;
  
  /** Weight for ground floor popularity (default: 2.0) */
  groundFloorWeight?: number;
  
  /** Weight for top floor popularity (default: 1.5) */
  topFloorWeight?: number;
  
  /** Probability that a passenger starting on ground floor goes up (default: 0.8) */
  groundFloorUpProbability?: number;
  
  /** Probability that a passenger starting on top floor goes down (default: 0.9) */
  topFloorDownProbability?: number;
}

/**
 * Passenger spawn pattern types
 */
export enum SpawnPattern {
  /** Uniform distribution across all floors */
  UNIFORM = 'uniform',
  
  /** Morning rush - mostly ground floor going up */
  MORNING_RUSH = 'morning_rush',
  
  /** Evening rush - mostly upper floors going down */
  EVENING_RUSH = 'evening_rush',
  
  /** Lunch time - mixed traffic between middle floors */
  LUNCH_TIME = 'lunch_time',
  
  /** Random bursts of activity */
  RANDOM_BURSTS = 'random_bursts',
  
  /** Custom weighted distribution */
  CUSTOM = 'custom',
}

/**
 * Statistics about spawned passengers
 */
export interface SpawnerStats {
  /** Total passengers spawned */
  totalSpawned: number;
  
  /** Passengers spawned per floor */
  spawnedPerFloor: number[];
  
  /** Average spawn rate (passengers per minute) */
  averageSpawnRate: number;
  
  /** Time since last spawn */
  timeSinceLastSpawn: number;
  
  /** Current active spawn pattern */
  currentPattern: SpawnPattern;
}

/**
 * PassengerSpawner class
 */
export class PassengerSpawner {
  private config: SpawnerConfig;
  private stats: SpawnerStats;
  private lastSpawnTime = 0;
  private totalRunTime = 0;
  private currentPattern: SpawnPattern = SpawnPattern.UNIFORM;
  private customWeights: number[] = [];

  constructor(config: SpawnerConfig) {
    this.config = {
      minSpawnInterval: 0.5, // 0.5 seconds
      maxWaitingPerFloor: 10,
      groundFloorWeight: 2.0,
      topFloorWeight: 1.5,
      groundFloorUpProbability: 0.8,
      topFloorDownProbability: 0.9,
      ...config,
    };

    this.stats = {
      totalSpawned: 0,
      spawnedPerFloor: new Array(config.floorCount).fill(0),
      averageSpawnRate: 0,
      timeSinceLastSpawn: 0,
      currentPattern: this.currentPattern,
    };
  }

  /**
   * Generate passengers for the current tick
   * @param deltaTime Time elapsed since last tick (seconds)
   * @param currentTime Current simulation time (seconds)
   * @param existingWaitingCounts Number of passengers waiting at each floor
   * @returns Array of newly spawned passengers
   */
  nextTick(
    deltaTime: number, 
    currentTime: number,
    existingWaitingCounts: number[] = []
  ): Passenger[] {
    this.totalRunTime += deltaTime;
    this.stats.timeSinceLastSpawn += deltaTime;

    // Check minimum spawn interval
    if (this.stats.timeSinceLastSpawn < this.config.minSpawnInterval!) {
      return [];
    }

    // Calculate spawn probability for this tick
    const spawnProbability = this.calculateSpawnProbability(deltaTime);
    const passengers: Passenger[] = [];

    // Determine number of passengers to spawn using Poisson distribution
    const deltaTimeMinutes = deltaTime / 60; // Convert to minutes
    const spawnCount = RandomUtils.poissonSpawn(
      this.config.rng,
      this.config.spawnRate,
      deltaTimeMinutes
    );
    
    // Debug spawning calculation
    if (spawnCount > 0 || Math.random() < 0.01) { // Log occasionally even when no spawn
      console.log(`🎲 Spawn calc: rate=${this.config.spawnRate}/min, deltaTime=${deltaTime.toFixed(3)}s (${deltaTimeMinutes.toFixed(4)}min), spawnCount=${spawnCount}`);
    }

    for (let i = 0; i < spawnCount; i++) {
      const passenger = this.spawnSinglePassenger(currentTime, existingWaitingCounts);
      if (passenger) {
        passengers.push(passenger);
        this.updateStats(passenger);
      }
    }

    if (passengers.length > 0) {
      this.lastSpawnTime = currentTime;
      this.stats.timeSinceLastSpawn = 0;
    }

    return passengers;
  }

  /**
   * Set spawn pattern
   */
  setSpawnPattern(pattern: SpawnPattern, customWeights?: number[]): void {
    this.currentPattern = pattern;
    this.stats.currentPattern = pattern;
    
    if (pattern === SpawnPattern.CUSTOM && customWeights) {
      if (customWeights.length !== this.config.floorCount) {
        throw new Error('Custom weights must match floor count');
      }
      this.customWeights = [...customWeights];
    }
  }

  /**
   * Get current spawner statistics
   */
  getStats(): SpawnerStats {
    const avgRate = this.totalRunTime > 0 
      ? (this.stats.totalSpawned / this.totalRunTime) * 60 
      : 0;
    
    return {
      ...this.stats,
      averageSpawnRate: avgRate,
    };
  }

  /**
   * Reset spawner statistics
   */
  resetStats(): void {
    this.stats = {
      totalSpawned: 0,
      spawnedPerFloor: new Array(this.config.floorCount).fill(0),
      averageSpawnRate: 0,
      timeSinceLastSpawn: 0,
      currentPattern: this.currentPattern,
    };
    this.totalRunTime = 0;
    this.lastSpawnTime = 0;
  }

  /**
   * Update spawn rate dynamically
   */
  setSpawnRate(newRate: number): void {
    if (newRate < 0) {
      throw new Error('Spawn rate must be non-negative');
    }
    this.config.spawnRate = newRate;
  }

  // ===== PRIVATE METHODS =====

  private calculateSpawnProbability(deltaTime: number): number {
    // Base probability based on spawn rate
    const baseRate = this.config.spawnRate / 60; // Convert to per-second
    return Math.min(1.0, baseRate * deltaTime);
  }

  private spawnSinglePassenger(
    currentTime: number,
    existingWaitingCounts: number[]
  ): Passenger | null {
    // Select start floor based on current pattern
    const startFloor = this.selectStartFloor();
    
    // Check if floor is already at capacity
    if (existingWaitingCounts[startFloor] >= this.config.maxWaitingPerFloor!) {
      return null; // Skip spawning if floor is too crowded
    }

    // Select destination floor
    const destinationFloor = this.selectDestinationFloor(startFloor);
    
    if (destinationFloor === startFloor) {
      return null; // Invalid destination, skip
    }

    // Create passenger
    const passenger: Passenger = {
      id: RandomUtils.generateId(this.config.rng, 'passenger'),
      startFloor,
      destinationFloor,
      requestTime: currentTime,
    };

    return passenger;
  }

  private selectStartFloor(): number {
    switch (this.currentPattern) {
      case SpawnPattern.UNIFORM:
        return this.config.rng.nextIntMax(this.config.floorCount);
      
      case SpawnPattern.MORNING_RUSH:
        // 70% ground floor, 30% other floors
        if (this.config.rng.nextBoolean(0.7)) {
          return 0; // Ground floor
        } else {
          return this.config.rng.nextInt(1, this.config.floorCount);
        }
      
      case SpawnPattern.EVENING_RUSH:
        // 20% ground floor, 80% upper floors
        if (this.config.rng.nextBoolean(0.2)) {
          return 0; // Ground floor
        } else {
          return this.config.rng.nextInt(1, this.config.floorCount);
        }
      
      case SpawnPattern.LUNCH_TIME:
        // Favor middle floors
        const middleStart = Math.floor(this.config.floorCount * 0.3);
        const middleEnd = Math.floor(this.config.floorCount * 0.7);
        return this.config.rng.nextInt(middleStart, middleEnd + 1);
      
      case SpawnPattern.RANDOM_BURSTS:
        // Use weighted selection with some randomness
        return RandomUtils.weightedFloorSelection(
          this.config.rng,
          this.config.floorCount,
          this.config.groundFloorWeight!,
          this.config.topFloorWeight!
        );
      
      case SpawnPattern.CUSTOM:
        return this.selectFromCustomWeights();
      
      default:
        return this.config.rng.nextIntMax(this.config.floorCount);
    }
  }

  private selectDestinationFloor(startFloor: number): number {
    const groundFloor = 0;
    const topFloor = this.config.floorCount - 1;

    // Special logic for ground and top floors
    if (startFloor === groundFloor) {
      if (this.config.floorCount === 1) return startFloor; // Edge case
      
      if (this.config.rng.nextBoolean(this.config.groundFloorUpProbability!)) {
        // Go up
        return this.config.rng.nextInt(1, this.config.floorCount);
      } else {
        // Stay on ground floor (shouldn't happen in practice)
        return this.config.rng.nextInt(1, this.config.floorCount);
      }
    }

    if (startFloor === topFloor) {
      if (this.config.rng.nextBoolean(this.config.topFloorDownProbability!)) {
        // Go down
        return this.config.rng.nextIntMax(topFloor);
      } else {
        // Go to any other floor
        return this.config.rng.nextIntMax(topFloor);
      }
    }

    // For middle floors, select any other floor
    const availableFloors = [];
    for (let i = 0; i < this.config.floorCount; i++) {
      if (i !== startFloor) {
        availableFloors.push(i);
      }
    }

    return this.config.rng.choice(availableFloors);
  }

  private selectFromCustomWeights(): number {
    if (this.customWeights.length === 0) {
      return this.config.rng.nextIntMax(this.config.floorCount);
    }

    const totalWeight = this.customWeights.reduce((sum, weight) => sum + weight, 0);
    let random = this.config.rng.nextFloat() * totalWeight;

    for (let i = 0; i < this.customWeights.length; i++) {
      random -= this.customWeights[i];
      if (random <= 0) {
        return i;
      }
    }

    return this.customWeights.length - 1; // Fallback
  }

  private updateStats(passenger: Passenger): void {
    this.stats.totalSpawned++;
    this.stats.spawnedPerFloor[passenger.startFloor]++;
  }
}

/**
 * Utility functions for common spawner operations
 */
export class SpawnerUtils {
  /**
   * Create a spawner with morning rush pattern
   */
  static createMorningRushSpawner(
    floorCount: number,
    spawnRate: number,
    rng: SeededRNG
  ): PassengerSpawner {
    const spawner = new PassengerSpawner({
      floorCount,
      spawnRate,
      rng,
      groundFloorUpProbability: 0.9,
    });
    
    spawner.setSpawnPattern(SpawnPattern.MORNING_RUSH);
    return spawner;
  }

  /**
   * Create a spawner with evening rush pattern
   */
  static createEveningRushSpawner(
    floorCount: number,
    spawnRate: number,
    rng: SeededRNG
  ): PassengerSpawner {
    const spawner = new PassengerSpawner({
      floorCount,
      spawnRate,
      rng,
      topFloorDownProbability: 0.95,
    });
    
    spawner.setSpawnPattern(SpawnPattern.EVENING_RUSH);
    return spawner;
  }

  /**
   * Create a spawner with uniform distribution
   */
  static createUniformSpawner(
    floorCount: number,
    spawnRate: number,
    rng: SeededRNG
  ): PassengerSpawner {
    const spawner = new PassengerSpawner({
      floorCount,
      spawnRate,
      rng,
    });
    
    spawner.setSpawnPattern(SpawnPattern.UNIFORM);
    return spawner;
  }

  /**
   * Analyze passenger flow patterns from spawn data
   */
  static analyzeSpawnPattern(passengers: Passenger[]): {
    upTraffic: number;
    downTraffic: number;
    internalTraffic: number;
    groundFloorOrigins: number;
    topFloorDestinations: number;
  } {
    let upTraffic = 0;
    let downTraffic = 0;
    let internalTraffic = 0;
    let groundFloorOrigins = 0;
    let topFloorDestinations = 0;

    for (const passenger of passengers) {
      if (passenger.startFloor === 0) {
        groundFloorOrigins++;
      }

      if (passenger.destinationFloor > passenger.startFloor) {
        upTraffic++;
      } else if (passenger.destinationFloor < passenger.startFloor) {
        downTraffic++;
      } else {
        internalTraffic++; // Same floor (shouldn't happen normally)
      }
    }

    return {
      upTraffic,
      downTraffic,
      internalTraffic,
      groundFloorOrigins,
      topFloorDestinations,
    };
  }
}

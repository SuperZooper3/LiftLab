/**
 * SimulationEngine - Centralized elevator simulation management
 * 
 * This class serves as the main orchestrator for the elevator simulation,
 * managing elevators, passengers, algorithms, and timing. It provides a
 * clean interface for React integration while maintaining deterministic
 * simulation behavior.
 * 
 * @example
 * ```typescript
 * const engine = new SimulationEngine({
 *   floors: 10,
 *   elevators: 3,
 *   spawnRate: 5.0,
 *   seed: 12345
 * });
 * 
 * engine.onStateChange = () => updateUI(engine.getState());
 * engine.start();
 * ```
 */

import { 
  ElevatorCar, 
  ElevatorConfig, 
  PassengerSpawner,
  createSeededRNG,
  createTicker,
  GreedyAlgorithm,
  Elevator,
  Passenger,
  SimulationStatus
} from '@lift-lab/sim';

/**
 * Configuration parameters for the simulation
 */
export interface SimulationConfig {
  /** Number of floors in the building (3-60) */
  floors: number;
  /** Number of elevators (1-8) */
  elevators: number;
  /** Passenger spawn rate (passengers per minute) */
  spawnRate: number;
  /** Random seed for deterministic behavior */
  seed?: number;
}

/**
 * Complete simulation state snapshot
 */
export interface SimulationState {
  /** Current simulation status */
  status: SimulationStatus;
  /** Current state of all elevators */
  elevators: Elevator[];
  /** Passengers currently waiting for pickup */
  waitingPassengers: Passenger[];
  /** Performance metrics */
  metrics: {
    avgWaitTime: number;
    avgTravelTime: number;
    passengersServed: number;
    totalPassengers: number;
  };
}

/**
 * Main simulation engine class
 * 
 * Manages the complete elevator simulation lifecycle including:
 * - Elevator state machines
 * - Passenger spawning and management
 * - Algorithm execution
 * - Performance metrics calculation
 * - Real-time state updates
 */
export class SimulationEngine {
  private config: SimulationConfig;
  private elevators: ElevatorCar[] = [];
  private waitingPassengers: Passenger[] = [];
  private completedPassengers: Passenger[] = [];
  private spawner: PassengerSpawner | null = null;
  private algorithm = new GreedyAlgorithm();
  private ticker: ReturnType<typeof createTicker> | null = null;
  private status: SimulationStatus = SimulationStatus.IDLE;
  
  /** Callback invoked when simulation state changes */
  public onStateChange: (() => void) | null = null;

  /**
   * Create a new simulation engine
   * @param config - Simulation configuration parameters
   */
  constructor(config: SimulationConfig) {
    this.config = {
      ...config,
      seed: config.seed ?? Date.now() // Default to current time if no seed provided
    };
  }

  /**
   * Start the simulation from idle state or resume from paused state
   * Initializes all components if starting fresh
   */
  start(): void {
    if (this.status === SimulationStatus.IDLE) {
      this.initialize();
    }
    
    this.status = SimulationStatus.RUNNING;
    this.ticker?.start();
    this.notifyStateChange();
  }

  /**
   * Pause the simulation while preserving current state
   * Can be resumed later with start() or resume()
   */
  pause(): void {
    this.status = SimulationStatus.PAUSED;
    this.ticker?.pause();
    this.notifyStateChange();
  }

  /**
   * Resume a paused simulation
   * Equivalent to calling start() when paused
   */
  resume(): void {
    this.status = SimulationStatus.RUNNING;
    this.ticker?.resume();
    this.notifyStateChange();
  }

  /**
   * Reset the simulation to initial state
   * Clears all passengers, resets elevators, and stops the ticker
   */
  reset(): void {
    this.status = SimulationStatus.IDLE;
    this.ticker?.stop();
    this.ticker = null;
    this.elevators = [];
    this.waitingPassengers = [];
    this.completedPassengers = [];
    this.spawner = null;
    this.notifyStateChange();
  }

  /**
   * Update simulation configuration
   * Some changes (floors, elevators) require reset, others can be applied live
   * @param newConfig - Partial configuration to merge with current config
   */
  updateConfig(newConfig: Partial<SimulationConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };
    
    // If spawn rate changed and we have a spawner, update it directly
    if (newConfig.spawnRate !== undefined && this.spawner) {
      this.spawner.setSpawnRate(this.config.spawnRate);
    }
    
    // If floors or elevators changed, need to reset
    if (newConfig.floors !== undefined || newConfig.elevators !== undefined) {
      if (this.status !== SimulationStatus.IDLE) {
        console.log('🔄 Resetting simulation due to floors/elevators change');
        this.reset(); // Reset if simulation is running
      }
    }
    
    // Don't call notifyStateChange here - it should be handled by the simulation loop
    // or specific methods that change state
  }

  /**
   * Adjust simulation speed multiplier
   * @param multiplier - Speed multiplier (0.25x to 4x)
   */
  setSpeed(multiplier: number): void {
    const baseTickRate = 10;
    const adjustedTickRate = baseTickRate * multiplier;
    console.log('⚡ Setting speed:', { 
      multiplier, 
      baseTickRate, 
      adjustedTickRate, 
      hasTicker: !!this.ticker,
      isRunning: this.ticker?.isRunning(),
      currentRate: this.ticker?.getTickRate()
    });
    this.ticker?.setTickRate(adjustedTickRate);
    console.log('✅ Speed updated, new rate:', this.ticker?.getTickRate());
  }

  /**
   * Get complete current simulation state
   * @returns Immutable snapshot of current simulation state
   */
  getState(): SimulationState {
    return {
      status: this.status,
      elevators: this.elevators.map(e => e.getState()),
      waitingPassengers: [...this.waitingPassengers],
      metrics: this.calculateMetrics()
    };
  }

  /**
   * Initialize the simulation components
   */
  private initialize(): void {

    // Create elevators
    this.elevators = [];
    for (let i = 0; i < this.config.elevators; i++) {
      const elevatorConfig: ElevatorConfig = {
        id: `elevator_${i}`,
        capacity: 8,
        floorTravelTime: 1.5, // Clean timing
        doorOperationTime: 1.5, // Door operation time  
        doorHoldTime: 2.0, // Door hold time
        floorCount: this.config.floors,
      };
      const elevator = new ElevatorCar(elevatorConfig, 0);
      this.elevators.push(elevator);
    }

    // Create passenger spawner
    const rng = createSeededRNG(this.config.seed ?? Date.now());
    this.spawner = new PassengerSpawner({
      floorCount: this.config.floors,
      spawnRate: this.config.spawnRate,
      rng,
      minSpawnInterval: 0.05, // Faster minimum interval for more responsive spawning
      maxWaitingPerFloor: 15,
    });

    // Create ticker with default speed - use IntervalTicker for better speed control
    const baseTickRate = 10;
    this.ticker = createTicker(baseTickRate, false); // Use IntervalTicker instead of PrecisionTicker
    this.ticker.onTick((deltaTime: number, totalTime: number) => {
      this.step(deltaTime, totalTime);
    });
    
    // Don't add test passengers - let the spawner handle all passenger generation
  }


  /**
   * Single simulation step
   */
  private step(deltaTime: number, totalTime: number): void {
    if (!this.spawner) return;

    // Spawn new passengers
    const waitingCounts = new Array(this.config.floors).fill(0);
    this.waitingPassengers.forEach(p => waitingCounts[p.startFloor]++);
    
    const newPassengers = this.spawner.nextTick(deltaTime, totalTime, waitingCounts);
    if (newPassengers.length > 0) {
      console.log(`👥 Spawned ${newPassengers.length} passengers at rate ${this.config.spawnRate}/min (deltaTime: ${deltaTime.toFixed(3)}s)`);
    }
    this.waitingPassengers.push(...newPassengers);
    
    // Debug spawn rate every few seconds
    if (Math.floor(totalTime) % 5 === 0 && Math.floor(totalTime) !== Math.floor(totalTime - deltaTime)) {
      console.log(`📊 Spawn rate check: ${this.config.spawnRate}/min, waiting: ${this.waitingPassengers.length}, spawner stats:`, this.spawner.getStats());
    }

    // Get elevator states
    const elevatorStates = this.elevators.map(e => e.getState());

    // Run algorithm
    const commands = this.algorithm.onTick(elevatorStates, this.waitingPassengers, totalTime);

    // Execute commands and handle passenger flow
    for (let i = 0; i < this.elevators.length; i++) {
      const elevator = this.elevators[i];
      
      // Step the elevator
      elevator.step(deltaTime, totalTime);
      
      // Execute commands for this elevator
      const elevatorCommands = commands.filter((c: any) => c.elevatorId === elevator.getState().id);
      for (const command of elevatorCommands) {
        elevator.executeCommand(command, totalTime);
      }
      
      // Handle passenger boarding
      const boarded = elevator.boardPassengers(this.waitingPassengers, totalTime);
      
      // Remove boarded passengers from waiting list
      if (boarded.length > 0) {
        const boardedIds = new Set(boarded.map((p: Passenger) => p.id));
        this.waitingPassengers = this.waitingPassengers.filter(p => !boardedIds.has(p.id));
      }
      
      // Handle passenger disembarking
      const disembarked = elevator.disembarkPassengers(totalTime);
      this.completedPassengers.push(...disembarked);
    }

    // Notify React of state changes
    this.notifyStateChange();
  }

  /**
   * Calculate performance metrics
   */
  private calculateMetrics() {
    const completed = this.completedPassengers;
    const totalPassengers = completed.length + this.waitingPassengers.length + 
      this.elevators.reduce((sum, e) => sum + e.getState().passengers.length, 0);
    
    if (completed.length === 0) {
      return {
        avgWaitTime: 0,
        avgTravelTime: 0,
        passengersServed: 0,
        totalPassengers,
      };
    }

    let totalWaitTime = 0;
    let totalTravelTime = 0;
    let waitCount = 0;
    let travelCount = 0;

    for (const passenger of completed) {
      if (passenger.pickupTime !== undefined) {
        totalWaitTime += passenger.pickupTime - passenger.requestTime;
        waitCount++;
      }
      if (passenger.dropoffTime !== undefined && passenger.pickupTime !== undefined) {
        totalTravelTime += passenger.dropoffTime - passenger.pickupTime;
        travelCount++;
      }
    }
    
    return {
      avgWaitTime: waitCount > 0 ? totalWaitTime / waitCount : 0,
      avgTravelTime: travelCount > 0 ? totalTravelTime / travelCount : 0,
      passengersServed: completed.length,
      totalPassengers,
    };
  }

  /**
   * Notify React of state changes
   */
  private notifyStateChange(): void {
    this.onStateChange?.();
  }
}

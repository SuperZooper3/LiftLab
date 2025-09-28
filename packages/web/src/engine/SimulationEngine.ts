/**
 * SimulationEngine - Clean, centralized simulation management
 * Single source of truth for all simulation state and logic
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

export interface SimulationConfig {
  floors: number;
  elevators: number;
  spawnRate: number;
  seed: number;
}

export interface SimulationState {
  status: SimulationStatus;
  elevators: Elevator[];
  waitingPassengers: Passenger[];
  metrics: {
    avgWaitTime: number;
    avgTravelTime: number;
    passengersServed: number;
    totalPassengers: number;
  };
}

export class SimulationEngine {
  private config: SimulationConfig;
  private elevators: ElevatorCar[] = [];
  private waitingPassengers: Passenger[] = [];
  private completedPassengers: Passenger[] = [];
  private spawner: PassengerSpawner | null = null;
  private algorithm = new GreedyAlgorithm();
  private ticker: ReturnType<typeof createTicker> | null = null;
  private status: SimulationStatus = SimulationStatus.IDLE;
  
  // Callback for state changes
  public onStateChange: (() => void) | null = null;

  constructor(config: SimulationConfig) {
    this.config = config;
  }

  /**
   * Start or resume the simulation
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
   * Pause the simulation
   */
  pause(): void {
    this.status = SimulationStatus.PAUSED;
    this.ticker?.pause();
    this.notifyStateChange();
  }

  /**
   * Resume the simulation
   */
  resume(): void {
    this.status = SimulationStatus.RUNNING;
    this.ticker?.resume();
    this.notifyStateChange();
  }

  /**
   * Reset the simulation
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
   * Update configuration
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
   * Set simulation speed
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
   * Get current simulation state
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
    const rng = createSeededRNG(this.config.seed);
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
    this.ticker.onTick((deltaTime, totalTime) => {
      this.step(deltaTime, totalTime);
    });
    
    // Don't add test passengers - let the spawner handle all passenger generation
  }

  /**
   * Add test passengers for debugging
   */
  private addTestPassengers(): void {
    const testPassengers = [
      {
        id: 'test-1',
        startFloor: 0,
        destinationFloor: 5,
        requestTime: 0,
      },
      {
        id: 'test-2',
        startFloor: 2,
        destinationFloor: 8,
        requestTime: 0,
      },
      {
        id: 'test-3',
        startFloor: 1,
        destinationFloor: 3,
        requestTime: 0,
      }
    ];
    
    this.waitingPassengers = [...testPassengers];
    console.log('🧪 Added test passengers:', testPassengers.length);
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
      const elevatorCommands = commands.filter(c => c.elevatorId === elevator.getState().id);
      for (const command of elevatorCommands) {
        elevator.executeCommand(command, totalTime);
      }
      
      // Handle passenger boarding
      const boarded = elevator.boardPassengers(this.waitingPassengers, totalTime);
      
      // Remove boarded passengers from waiting list
      if (boarded.length > 0) {
        const boardedIds = new Set(boarded.map(p => p.id));
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
   * Calculate current metrics
   */
  private calculateMetrics() {
    const completed = this.completedPassengers;
    const total = completed.length + this.waitingPassengers.length;
    
    if (completed.length === 0) {
      return {
        avgWaitTime: 0,
        avgTravelTime: 0,
        passengersServed: 0,
        totalPassengers: total,
      };
    }

    const waitTimes = completed
      .filter(p => p.pickupTime !== undefined)
      .map(p => p.pickupTime! - p.requestTime);
    
    const travelTimes = completed
      .filter(p => p.dropoffTime !== undefined && p.pickupTime !== undefined)
      .map(p => p.dropoffTime! - p.pickupTime!);
    
    const avgWait = waitTimes.length > 0 
      ? waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length 
      : 0;
    
    const avgTravel = travelTimes.length > 0
      ? travelTimes.reduce((a, b) => a + b, 0) / travelTimes.length
      : 0;
    
    return {
      avgWaitTime: avgWait,
      avgTravelTime: avgTravel,
      passengersServed: completed.length,
      totalPassengers: total,
    };
  }

  /**
   * Notify React of state changes
   */
  private notifyStateChange(): void {
    this.onStateChange?.();
  }
}

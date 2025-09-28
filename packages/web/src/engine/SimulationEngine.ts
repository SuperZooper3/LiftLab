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
    this.config = { ...this.config, ...newConfig };
    if (this.status !== SimulationStatus.IDLE) {
      this.reset(); // Reset if simulation is running
    }
  }

  /**
   * Set simulation speed
   */
  setSpeed(multiplier: number): void {
    const baseTickRate = 10;
    const adjustedTickRate = baseTickRate * multiplier;
    this.ticker?.setTickRate(adjustedTickRate);
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
    console.log('🎢 Initializing simulation...', this.config);

    // Create elevators
    this.elevators = [];
    for (let i = 0; i < this.config.elevators; i++) {
      const elevatorConfig: ElevatorConfig = {
        id: `elevator_${i}`,
        capacity: 8,
        floorTravelTime: 2.0,
        doorOperationTime: 1.0,
        doorHoldTime: 3.0,
        floorCount: this.config.floors,
      };
      const elevator = new ElevatorCar(elevatorConfig, 0);
      this.elevators.push(elevator);
    }

    // Create passenger spawner
    const rng = createSeededRNG(Date.now());
    this.spawner = new PassengerSpawner({
      floorCount: this.config.floors,
      spawnRate: this.config.spawnRate,
      rng,
      minSpawnInterval: 0.1,
      maxWaitingPerFloor: 15,
    });

    // Create ticker
    const baseTickRate = 10;
    this.ticker = createTicker(baseTickRate);
    this.ticker.onTick((deltaTime, totalTime) => {
      this.step(deltaTime, totalTime);
    });

    // Add some test passengers for immediate testing
    this.addTestPassengers();

    console.log('✅ Simulation initialized');
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
    this.waitingPassengers.push(...newPassengers);

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

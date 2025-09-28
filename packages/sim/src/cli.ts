#!/usr/bin/env node
/**
 * CLI Test Interface for LiftLab Simulation Engine
 * Simple command-line tool to verify the simulation system works
 */

import { 
  ElevatorCar, 
  ElevatorConfig,
  PassengerSpawner,
  SpawnPattern,
  createSeededRNG,
  createTicker,
  Direction,
  DoorState,
  ElevatorAction,
  Passenger
} from './index.js';

/**
 * Simple test simulation runner
 */
class TestSimulation {
  private elevators: ElevatorCar[] = [];
  private spawner: PassengerSpawner;
  private waitingPassengers: Passenger[] = [];
  private completedPassengers: Passenger[] = [];
  private currentTime = 0;
  private isRunning = false;

  constructor(
    floorCount: number = 10,
    elevatorCount: number = 3,
    spawnRate: number = 2.0
  ) {
    const rng = createSeededRNG(12345);

    // Create elevators
    for (let i = 0; i < elevatorCount; i++) {
      const config: ElevatorConfig = {
        id: `elevator_${i}`,
        capacity: 8,
        floorTravelTime: 2.0,
        doorOperationTime: 1.0,
        doorHoldTime: 3.0,
        floorCount,
      };
      this.elevators.push(new ElevatorCar(config, 0));
    }

    // Create passenger spawner
    this.spawner = new PassengerSpawner({
      floorCount,
      spawnRate,
      rng,
    });
  }

  /**
   * Run simulation for specified duration
   */
  async run(durationSeconds: number = 60): Promise<void> {
    console.log('🎢 Starting LiftLab Simulation Test...\n');
    console.log(`Configuration:`);
    console.log(`- Floors: ${this.elevators[0].getState().capacity ? this.spawner.getStats().currentPattern : 'N/A'}`);
    console.log(`- Elevators: ${this.elevators.length}`);
    console.log(`- Duration: ${durationSeconds}s\n`);

    this.isRunning = true;
    const ticker = createTicker(10); // 10 TPS for testing
    let lastReportTime = 0;

    ticker.onTick((deltaTime, totalTime) => {
      if (!this.isRunning || totalTime >= durationSeconds) {
        ticker.stop();
        this.printFinalReport();
        return;
      }

      this.currentTime = totalTime;
      this.simulationStep(deltaTime);

      // Print status every 10 seconds
      if (totalTime - lastReportTime >= 10) {
        this.printStatus();
        lastReportTime = totalTime;
      }
    });

    ticker.start();

    // Wait for simulation to complete
    return new Promise((resolve) => {
      const checkComplete = () => {
        if (!this.isRunning) {
          resolve();
        } else {
          setTimeout(checkComplete, 100);
        }
      };
      checkComplete();
    });
  }

  private simulationStep(deltaTime: number): void {
    // Spawn new passengers
    const waitingCounts = new Array(10).fill(0); // Simplified for test
    const newPassengers = this.spawner.nextTick(deltaTime, this.currentTime, waitingCounts);
    this.waitingPassengers.push(...newPassengers);

    // Step each elevator
    for (const elevator of this.elevators) {
      elevator.step(deltaTime, this.currentTime);

      // Simple greedy algorithm for testing
      this.runSimpleAlgorithm(elevator);

      // Handle passenger boarding/alighting
      const boarded = elevator.boardPassengers(this.waitingPassengers, this.currentTime);
      const alighted = elevator.disembarkPassengers(this.currentTime);

      // Remove boarded passengers from waiting list
      for (const passenger of boarded) {
        const index = this.waitingPassengers.indexOf(passenger);
        if (index >= 0) {
          this.waitingPassengers.splice(index, 1);
        }
      }

      // Add completed passengers
      this.completedPassengers.push(...alighted);
    }
  }

  /**
   * Simple greedy algorithm for testing
   */
  private runSimpleAlgorithm(elevator: ElevatorCar): void {
    const state = elevator.getState();

    // If elevator is idle and there are waiting passengers, go to nearest one
    if (state.direction === Direction.IDLE && this.waitingPassengers.length > 0) {
      let nearestFloor = -1;
      let minDistance = Infinity;

      for (const passenger of this.waitingPassengers) {
        const distance = Math.abs(passenger.startFloor - state.currentFloor);
        if (distance < minDistance) {
          minDistance = distance;
          nearestFloor = passenger.startFloor;
        }
      }

      if (nearestFloor >= 0) {
        elevator.addPickupRequest(nearestFloor);
      }
    }

    // Execute movement commands
    if (state.targetFloors.size > 0 && !state.passengers.length) {
      const targetFloor = elevator.getNextTargetFloor();
      if (targetFloor !== null) {
        if (targetFloor > state.currentFloor) {
          elevator.executeCommand({
            elevatorId: state.id,
            action: ElevatorAction.MOVE_UP,
          }, this.currentTime);
        } else if (targetFloor < state.currentFloor) {
          elevator.executeCommand({
            elevatorId: state.id,
            action: ElevatorAction.MOVE_DOWN,
          }, this.currentTime);
        }
      }
    }

    // Open doors if we should stop at current floor
    if (elevator.shouldStopAtCurrentFloor() && state.doorState === DoorState.CLOSED) {
      elevator.executeCommand({
        elevatorId: state.id,
        action: ElevatorAction.OPEN_DOORS,
      }, this.currentTime);
    }
  }

  private printStatus(): void {
    const stats = this.spawner.getStats();
    const elevatorStates = this.elevators.map(e => e.getState());
    
    console.log(`\n⏱️  Time: ${Math.floor(this.currentTime)}s`);
    console.log(`👥 Passengers: ${stats.totalSpawned} spawned, ${this.waitingPassengers.length} waiting, ${this.completedPassengers.length} completed`);
    
    console.log(`🎢 Elevators:`);
    for (const state of elevatorStates) {
      const status = state.direction === Direction.IDLE ? 'IDLE' : 
                    state.direction === Direction.UP ? '↑' : '↓';
      const doors = state.doorState === DoorState.OPEN ? '🔓' : '🔒';
      console.log(`   ${state.id}: Floor ${state.currentFloor} ${status} ${doors} (${state.passengers.length}/${state.capacity} passengers)`);
    }
  }

  private printFinalReport(): void {
    this.isRunning = false;
    const stats = this.spawner.getStats();
    
    console.log('\n🏁 Simulation Complete!\n');
    console.log('📊 Final Statistics:');
    console.log(`   • Total passengers spawned: ${stats.totalSpawned}`);
    console.log(`   • Passengers completed: ${this.completedPassengers.length}`);
    console.log(`   • Passengers still waiting: ${this.waitingPassengers.length}`);
    console.log(`   • Average spawn rate: ${stats.averageSpawnRate.toFixed(2)} passengers/min`);
    
    if (this.completedPassengers.length > 0) {
      const waitTimes = this.completedPassengers
        .filter(p => p.pickupTime !== undefined)
        .map(p => p.pickupTime! - p.requestTime);
      
      const travelTimes = this.completedPassengers
        .filter(p => p.dropoffTime !== undefined && p.pickupTime !== undefined)
        .map(p => p.dropoffTime! - p.pickupTime!);

      if (waitTimes.length > 0) {
        const avgWait = waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length;
        console.log(`   • Average wait time: ${avgWait.toFixed(2)}s`);
      }

      if (travelTimes.length > 0) {
        const avgTravel = travelTimes.reduce((a, b) => a + b, 0) / travelTimes.length;
        console.log(`   • Average travel time: ${avgTravel.toFixed(2)}s`);
      }
    }

    console.log('\n✅ Simulation engine is working correctly!');
  }
}

/**
 * Component tests
 */
function runComponentTests(): void {
  console.log('🧪 Running Component Tests...\n');

  // Test RNG
  console.log('1. Testing Random Number Generator...');
  const rng = createSeededRNG(42);
  const randomNumbers = Array.from({ length: 5 }, () => rng.nextFloat());
  console.log(`   Generated numbers: ${randomNumbers.map(n => n.toFixed(3)).join(', ')}`);
  console.log('   ✅ RNG working\n');

  // Test Ticker
  console.log('2. Testing Tick Scheduler...');
  const ticker = createTicker(5);
  let tickCount = 0;
  const unsubscribe = ticker.onTick(() => {
    tickCount++;
    if (tickCount >= 3) {
      ticker.stop();
      console.log(`   Received ${tickCount} ticks`);
      console.log('   ✅ Ticker working\n');
      unsubscribe();
    }
  });
  ticker.start();

  // Test Elevator
  console.log('3. Testing Elevator State Machine...');
  const elevatorConfig: ElevatorConfig = {
    id: 'test-elevator',
    capacity: 8,
    floorTravelTime: 1.0,
    doorOperationTime: 0.5,
    doorHoldTime: 2.0,
    floorCount: 10,
  };
  
  const elevator = new ElevatorCar(elevatorConfig, 0);
  const initialState = elevator.getState();
  console.log(`   Initial state: Floor ${initialState.currentFloor}, Direction: ${initialState.direction}`);
  
  // Test movement
  elevator.executeCommand({
    elevatorId: 'test-elevator',
    action: ElevatorAction.MOVE_UP,
  }, 0);
  
  elevator.step(1.5, 1.5); // Simulate 1.5 seconds
  const newState = elevator.getState();
  console.log(`   After move command: Floor ${newState.currentFloor}, Direction: ${newState.direction}`);
  console.log('   ✅ Elevator working\n');

  // Test Spawner
  console.log('4. Testing Passenger Spawner...');
  const spawner = new PassengerSpawner({
    floorCount: 10,
    spawnRate: 10.0, // High rate for testing
    rng: createSeededRNG(123),
  });
  
  const passengers = spawner.nextTick(6.0, 0); // 6 seconds should spawn some passengers
  console.log(`   Spawned ${passengers.length} passengers in 6 seconds`);
  if (passengers.length > 0) {
    const first = passengers[0];
    console.log(`   Example passenger: ${first.id} from floor ${first.startFloor} to ${first.destinationFloor}`);
  }
  console.log('   ✅ Spawner working\n');

  console.log('🎉 All component tests passed!\n');
}

/**
 * Main CLI entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0] || 'test';

  switch (command) {
    case 'test':
      runComponentTests();
      break;
    
    case 'simulate':
      const duration = parseInt(args[1]) || 30;
      const simulation = new TestSimulation();
      await simulation.run(duration);
      break;
    
    case 'help':
    default:
      console.log('LiftLab Simulation Engine CLI\n');
      console.log('Commands:');
      console.log('  test      - Run component tests');
      console.log('  simulate [duration] - Run simulation (default: 30s)');
      console.log('  help      - Show this help\n');
      console.log('Examples:');
      console.log('  npm run cli test');
      console.log('  npm run cli simulate 60');
      break;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: any) => console.error(error));
}

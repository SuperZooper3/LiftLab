/**
 * Elevator Algorithm Implementations
 * Various strategies for controlling elevator behavior
 */

import { 
  ElevatorAlgorithm, 
  ElevatorCommand, 
  Elevator, 
  Passenger,
  ElevatorAction,
  Direction 
} from './models.js';

/**
 * Greedy Algorithm - Always serves the nearest call first
 * Improved version that properly manages elevator states and door operations
 */
export class GreedyAlgorithm implements ElevatorAlgorithm {
  name = 'Greedy';
  description = 'Always serves the nearest call first';

  onTick(
    elevators: Elevator[],
    waitingPassengers: Passenger[],
    currentTime: number
  ): ElevatorCommand[] {
    console.log('🔧 GreedyAlgorithm.onTick called:', {
      elevatorCount: elevators.length,
      waitingPassengerCount: waitingPassengers.length,
      elevatorStates: elevators.map(e => `${e.id}@floor${e.currentFloor}(${e.direction},${e.doorState})`)
    });

    const commands: ElevatorCommand[] = [];

    for (const elevator of elevators) {
      const command = this.getElevatorCommand(elevator, waitingPassengers);
      if (command) {
        console.log(`📋 Command for ${elevator.id}:`, command.action);
        commands.push(command);
      } else {
        console.log(`❌ No command for ${elevator.id}`);
      }
    }

    console.log('🎯 Total commands generated:', commands.length);
    return commands;
  }

  /**
   * Get the next command for a specific elevator
   */
  private getElevatorCommand(elevator: Elevator, waitingPassengers: Passenger[]): ElevatorCommand | null {
    console.log(`🔍 Analyzing ${elevator.id}:`, {
      floor: elevator.currentFloor,
      direction: elevator.direction,
      doors: elevator.doorState,
      passengers: elevator.passengers.length,
      waitingNearby: waitingPassengers.filter(p => p.startFloor === elevator.currentFloor).length
    });

    // Priority 1: If doors are open, close them after a moment
    if (elevator.doorState === 'open') {
      console.log(`🚪 ${elevator.id}: Doors open, closing them`);
      return {
        elevatorId: elevator.id,
        action: ElevatorAction.CLOSE_DOORS,
      };
    }

    // Priority 2: If we have passengers, serve their destinations first
    if (elevator.passengers.length > 0) {
      const nearestDestination = this.findNearestDestination(elevator);
      if (nearestDestination !== null) {
        console.log(`🎯 ${elevator.id}: Has ${elevator.passengers.length} passengers, going to floor ${nearestDestination}`);
        return this.createMoveCommand(elevator, nearestDestination);
      }
    }

    // Priority 3: If idle, find nearest waiting passenger
    if (elevator.direction === Direction.IDLE) {
      const nearestCall = this.findNearestCall(elevator, waitingPassengers);
      if (nearestCall !== null) {
        console.log(`📞 ${elevator.id}: Idle, responding to call on floor ${nearestCall}`);
        return this.createMoveCommand(elevator, nearestCall);
      } else {
        console.log(`💤 ${elevator.id}: Idle but no calls to answer`);
      }
    } else {
      console.log(`🚶‍♂️ ${elevator.id}: Moving (${elevator.direction}), not giving new commands`);
    }

    return null;
  }

  /**
   * Find the nearest destination for passengers already in the elevator
   */
  private findNearestDestination(elevator: Elevator): number | null {
    if (elevator.passengers.length === 0) {
      return null;
    }

    let nearestFloor: number | null = null;
    let minDistance = Infinity;

    for (const passenger of elevator.passengers) {
      const distance = Math.abs(passenger.destinationFloor - elevator.currentFloor);
      if (distance < minDistance) {
        minDistance = distance;
        nearestFloor = passenger.destinationFloor;
      }
    }

    return nearestFloor;
  }

  /**
   * Find the nearest call (waiting passenger) to the elevator
   */
  private findNearestCall(elevator: Elevator, waitingPassengers: Passenger[]): number | null {
    if (waitingPassengers.length === 0) {
      return null;
    }

    let nearestFloor: number | null = null;
    let minDistance = Infinity;

    // Check all waiting passengers
    for (const passenger of waitingPassengers) {
      const distance = Math.abs(passenger.startFloor - elevator.currentFloor);
      if (distance < minDistance) {
        minDistance = distance;
        nearestFloor = passenger.startFloor;
      }
    }

    return nearestFloor;
  }

  /**
   * Create movement command to reach target floor
   */
  private createMoveCommand(elevator: Elevator, targetFloor: number): ElevatorCommand | null {
    if (targetFloor === elevator.currentFloor) {
      // Already at target floor, open doors
      return {
        elevatorId: elevator.id,
        action: ElevatorAction.OPEN_DOORS,
      };
    } else if (targetFloor > elevator.currentFloor) {
      // Move up
      return {
        elevatorId: elevator.id,
        action: ElevatorAction.MOVE_UP,
      };
    } else {
      // Move down
      return {
        elevatorId: elevator.id,
        action: ElevatorAction.MOVE_DOWN,
      };
    }
  }
}

/**
 * Export the default algorithm
 */
export const defaultAlgorithm = new GreedyAlgorithm();

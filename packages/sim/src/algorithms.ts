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
 * Selects the closest waiting passenger or destination floor for each elevator
 */
export class GreedyAlgorithm implements ElevatorAlgorithm {
  name = 'Greedy';
  description = 'Always serves the nearest call first';

  onTick(
    elevators: Elevator[],
    waitingPassengers: Passenger[],
    currentTime: number
  ): ElevatorCommand[] {
    const commands: ElevatorCommand[] = [];

    for (const elevator of elevators) {
      // Skip if elevator is moving or doors are operating
      if (elevator.direction !== Direction.IDLE) {
        continue;
      }

      // Find nearest call to service
      const nearestCall = this.findNearestCall(elevator, waitingPassengers);
      
      if (nearestCall !== null) {
        const command = this.createMoveCommand(elevator, nearestCall);
        if (command) {
          commands.push(command);
        }
      }
    }

    return commands;
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

    // Also check if elevator has passengers with destinations
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

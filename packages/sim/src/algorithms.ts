/**
 * Elevator Algorithm Implementations
 * 
 * This module contains various elevator control strategies that implement
 * the ElevatorAlgorithm interface. Each algorithm represents a different
 * approach to managing elevator movement and passenger service.
 * 
 * Available algorithms:
 * - GreedyAlgorithm: Serves nearest requests first (baseline implementation)
 * 
 * @example
 * ```typescript
 * import { GreedyAlgorithm } from '@lift-lab/sim';
 * 
 * const algorithm = new GreedyAlgorithm();
 * const commands = algorithm.onTick(elevators, passengers, currentTime);
 * ```
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
 * Greedy Algorithm - Nearest-First Strategy
 * 
 * A simple but effective algorithm that always serves the nearest call first.
 * This implementation includes proper door management and state handling.
 * 
 * Strategy:
 * 1. Close doors if they're open (after brief hold time)
 * 2. Serve existing passengers' destinations first
 * 3. Pick up nearest waiting passengers when idle
 * 
 * Performance: Good for low-traffic scenarios, may cause starvation in high traffic
 */
export class GreedyAlgorithm implements ElevatorAlgorithm {
  name = 'Greedy';
  description = 'Always serves the nearest call first';

  /**
   * Generate elevator commands for the current simulation tick
   * @param elevators - Current state of all elevators
   * @param waitingPassengers - Passengers waiting for pickup
   * @param currentTime - Current simulation time (unused in this implementation)
   * @returns Array of commands to execute
   */
  onTick(
    elevators: Elevator[],
    waitingPassengers: Passenger[],
    currentTime: number
  ): ElevatorCommand[] {
    const commands: ElevatorCommand[] = [];

    for (const elevator of elevators) {
      const command = this.getElevatorCommand(elevator, waitingPassengers);
      if (command) {
        commands.push(command);
      }
    }

    return commands;
  }

  /**
   * Get the next command for a specific elevator
   */
  /**
   * Determine the next command for a specific elevator
   * @param elevator - The elevator to command
   * @param waitingPassengers - All passengers waiting for pickup
   * @returns Command to execute, or null if no action needed
   */
  private getElevatorCommand(elevator: Elevator, waitingPassengers: Passenger[]): ElevatorCommand | null {
    // Priority 1: If doors are open, close them after a moment
    if (elevator.doorState === 'open') {
      return {
        elevatorId: elevator.id,
        action: ElevatorAction.CLOSE_DOORS,
      };
    }

    // Priority 2: If we have passengers, serve their destinations first
    if (elevator.passengers.length > 0) {
      const nearestDestination = this.findNearestDestination(elevator);
      if (nearestDestination !== null) {
        return this.createMoveCommand(elevator, nearestDestination);
      }
    }

    // Priority 3: If idle, find nearest waiting passenger
    if (elevator.direction === Direction.IDLE) {
      const nearestCall = this.findNearestCall(elevator, waitingPassengers);
      if (nearestCall !== null) {
        return this.createMoveCommand(elevator, nearestCall);
      }
    }

    return null;
  }

  /**
   * Find the nearest destination for passengers already in the elevator
   */
  /**
   * Find the nearest destination floor for passengers in the elevator
   * @param elevator - The elevator containing passengers
   * @returns Nearest destination floor, or null if no passengers
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
  /**
   * Find the nearest floor with waiting passengers
   * @param elevator - The elevator to find calls for
   * @param waitingPassengers - All passengers waiting for pickup
   * @returns Nearest call floor, or null if no waiting passengers
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
  /**
   * Create appropriate movement command to reach target floor
   * @param elevator - The elevator to command
   * @param targetFloor - The floor to reach
   * @returns Movement command (up/down/open doors)
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

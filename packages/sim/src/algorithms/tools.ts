import type { Direction, ElevatorSnapshot, Passenger } from '../types.js';

export function uniqueFloors(floors: readonly number[]): number[] {
  const seen = new Set<number>();
  const result: number[] = [];

  for (const floor of floors) {
    if (!seen.has(floor)) {
      seen.add(floor);
      result.push(floor);
    }
  }

  return result;
}

export function byDistanceFrom(floor: number): (a: number, b: number) => number {
  return (a, b) => Math.abs(a - floor) - Math.abs(b - floor);
}

export function passengerDestinations(elevator: ElevatorSnapshot): number[] {
  return uniqueFloors(elevator.passengers.map((passenger) => passenger.destination));
}

export function nearestWaitingPassenger(
  elevator: ElevatorSnapshot,
  waitingPassengers: readonly Passenger[],
  claimedPassengerIds: Set<string>,
): Passenger | undefined {
  let winner: Passenger | undefined;
  let winnerScore = Number.POSITIVE_INFINITY;

  for (const passenger of waitingPassengers) {
    if (claimedPassengerIds.has(passenger.id)) {
      continue;
    }
    if (
      passenger.assignedElevatorId !== undefined &&
      passenger.assignedElevatorId !== elevator.id
    ) {
      continue;
    }

    const score = Math.abs(passenger.origin - elevator.position);

    if (score < winnerScore) {
      winner = passenger;
      winnerScore = score;
    }
  }

  return winner;
}

export function directionFromFloor(from: number, to: number): Direction {
  if (to > from) {
    return 'up';
  }
  if (to < from) {
    return 'down';
  }
  return 'idle';
}

export function floorsInDirection(
  currentFloor: number,
  floors: readonly number[],
  direction: Direction,
): number[] {
  const unique = uniqueFloors(floors);
  if (direction === 'up') {
    return unique.filter((floor) => floor >= currentFloor).sort((a, b) => a - b);
  }
  if (direction === 'down') {
    return unique.filter((floor) => floor <= currentFloor).sort((a, b) => b - a);
  }
  return unique.sort(byDistanceFrom(currentFloor));
}

export function zoneForElevator(index: number, elevatorCount: number, floorCount: number): number {
  if (elevatorCount <= 1) {
    return 0;
  }
  return Math.round((index / (elevatorCount - 1)) * (floorCount - 1));
}

export function bandForFloor(floor: number, floorCount: number): 'low' | 'mid' | 'high' {
  const ratio = floor / Math.max(1, floorCount - 1);
  if (ratio < 0.34) {
    return 'low';
  }
  if (ratio < 0.67) {
    return 'mid';
  }
  return 'high';
}

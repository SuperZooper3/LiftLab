import type { Direction, ElevatorAlgorithm, ElevatorPlan, Passenger } from '../types.js';
import { directionFromFloor, floorsInDirection, passengerDestinations, uniqueFloors } from './tools.js';

export const scanAlgorithm: ElevatorAlgorithm = {
  id: 'scan',
  name: 'SCAN Sweep',
  category: 'Classical',
  summary: 'Cars keep sweeping in one direction, collecting compatible calls before reversing.',
  decide: ({ elevators, waitingPassengers, config }) => {
    const plans: ElevatorPlan[] = [];

    for (const elevator of elevators) {
      const currentFloor = Math.round(elevator.position);
      const direction = chooseDirection(elevator.direction, currentFloor, elevator.targetQueue);
      const onboard = passengerDestinations(elevator);
      const hasPickupCapacity = elevator.passengers.length < elevator.capacity;
      const compatibleOrigins = hasPickupCapacity
        ? waitingPassengers
            .filter((passenger) => isCompatible(passenger, currentFloor, direction))
            .map((passenger) => passenger.origin)
        : [];
      const sameDirectionStops = floorsInDirection(currentFloor, [...onboard, ...compatibleOrigins], direction);

      if (sameDirectionStops.length > 0) {
        plans.push({
          elevatorId: elevator.id,
          targetFloors: sameDirectionStops,
          mode: 'replace',
        });
        continue;
      }

      const reverseDirection: Direction = direction === 'up' ? 'down' : 'up';
      const reverseStops = floorsInDirection(
        currentFloor,
        [
          ...onboard,
          ...(hasPickupCapacity
            ? waitingPassengers
                .filter((passenger) => isCompatible(passenger, currentFloor, reverseDirection))
                .map((passenger) => passenger.origin)
            : []),
        ],
        reverseDirection,
      );

      if (reverseStops.length > 0) {
        plans.push({
          elevatorId: elevator.id,
          targetFloors: reverseStops,
          mode: 'replace',
        });
        continue;
      }

      if (waitingPassengers.length > 0) {
        const nearest = [...waitingPassengers].sort(
          (a, b) => Math.abs(a.origin - currentFloor) - Math.abs(b.origin - currentFloor),
        )[0];
        plans.push({
          elevatorId: elevator.id,
          targetFloors: uniqueFloors([nearest.origin, nearest.destination]),
          mode: 'replace',
        });
      } else if (elevator.passengers.length === 0) {
        const lobbyOrTop = elevator.index % 2 === 0 ? 0 : config.building.floorCount - 1;
        plans.push({ elevatorId: elevator.id, parkFloor: lobbyOrTop, mode: 'replace' });
      }
    }

    return { plans };
  },
};

function chooseDirection(direction: Direction, currentFloor: number, queue: readonly number[]): Direction {
  if (direction !== 'idle') {
    return direction;
  }
  if (queue[0] !== undefined) {
    return directionFromFloor(currentFloor, queue[0]);
  }
  return 'up';
}

function isCompatible(passenger: Passenger, currentFloor: number, direction: Direction): boolean {
  if (direction === 'up') {
    return passenger.origin >= currentFloor && passenger.direction === 'up';
  }
  if (direction === 'down') {
    return passenger.origin <= currentFloor && passenger.direction === 'down';
  }
  return true;
}

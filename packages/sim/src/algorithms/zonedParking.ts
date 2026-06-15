import type { ElevatorAlgorithm, ElevatorPlan, Passenger } from '../types.js';
import { passengerDestinations, uniqueFloors, zoneForElevator } from './tools.js';

export const zonedParkingAlgorithm: ElevatorAlgorithm = {
  id: 'zoned-parking',
  name: 'Zoned Parking',
  category: 'Positioning',
  summary: 'Partitions the building into zones and parks idle cars near their home floors.',
  decide: ({ elevators, waitingPassengers, config }) => {
    const plans: ElevatorPlan[] = [];
    const claimed = new Set<string>();

    for (const elevator of elevators) {
      const destinations = passengerDestinations(elevator);
      if (destinations.length > 0) {
        plans.push({
          elevatorId: elevator.id,
          targetFloors: destinations.sort((a, b) => Math.abs(a - elevator.position) - Math.abs(b - elevator.position)),
          mode: 'replace',
        });
        continue;
      }

      const homeFloor = zoneForElevator(
        elevator.index,
        config.building.elevatorCount,
        config.building.floorCount,
      );
      const passenger = chooseZonePassenger(
        elevator.index,
        config.building.elevatorCount,
        config.building.floorCount,
        waitingPassengers,
        claimed,
        elevator.id,
      );

      if (passenger) {
        claimed.add(passenger.id);
        plans.push({
          elevatorId: elevator.id,
          targetFloors: uniqueFloors([passenger.origin, passenger.destination]),
          assignPassengerIds: [passenger.id],
          mode: 'replace',
        });
        continue;
      }

      plans.push({
        elevatorId: elevator.id,
        parkFloor: homeFloor,
        mode: 'replace',
      });
    }

    return { plans };
  },
};

function chooseZonePassenger(
  elevatorIndex: number,
  elevatorCount: number,
  floorCount: number,
  waitingPassengers: readonly Passenger[],
  claimed: Set<string>,
  elevatorId: string,
): Passenger | undefined {
  const zoneStart = Math.floor((elevatorIndex / elevatorCount) * floorCount);
  const zoneEnd = Math.ceil(((elevatorIndex + 1) / elevatorCount) * floorCount) - 1;
  const zonePassengers = waitingPassengers.filter(
    (passenger) =>
      !claimed.has(passenger.id) && passenger.origin >= zoneStart && passenger.origin <= zoneEnd,
  ).filter(
    (passenger) =>
      passenger.assignedElevatorId === undefined || passenger.assignedElevatorId === elevatorId,
  );

  if (zonePassengers.length > 0) {
    return [...zonePassengers].sort((a, b) => a.requestTime - b.requestTime)[0];
  }

  return [...waitingPassengers]
    .filter((passenger) => !claimed.has(passenger.id))
    .filter(
      (passenger) =>
        passenger.assignedElevatorId === undefined || passenger.assignedElevatorId === elevatorId,
    )
    .sort((a, b) => a.requestTime - b.requestTime)[0];
}

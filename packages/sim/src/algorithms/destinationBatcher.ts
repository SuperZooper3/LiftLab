import type { ElevatorAlgorithm, ElevatorPlan, Passenger } from '../types.js';
import { bandForFloor, passengerDestinations, uniqueFloors } from './tools.js';

export const destinationBatcherAlgorithm: ElevatorAlgorithm = {
  id: 'destination-batcher',
  name: 'Destination Batcher',
  category: 'Batching',
  summary: 'Groups waiting passengers by direction and destination band before dispatching cars.',
  decide: ({ elevators, waitingPassengers, config }) => {
    const plans: ElevatorPlan[] = [];
    const claimed = new Set<string>();

    for (const elevator of elevators) {
      const eligibleWaitingPassengers = waitingPassengers.filter(
        (passenger) =>
          passenger.assignedElevatorId === undefined || passenger.assignedElevatorId === elevator.id,
      );
      const batches = createBatches(eligibleWaitingPassengers, config.building.floorCount);
      const onboard = passengerDestinations(elevator);
      if (onboard.length > 0) {
        plans.push({
          elevatorId: elevator.id,
          targetFloors: onboard.sort((a, b) => Math.abs(a - elevator.position) - Math.abs(b - elevator.position)),
          mode: 'replace',
        });
        continue;
      }

      const batch = batches.find((candidate) =>
        candidate.passengers.some((passenger) => !claimed.has(passenger.id)),
      );

      if (batch) {
        const passengers = batch.passengers
          .filter((passenger) => !claimed.has(passenger.id))
          .slice(0, config.building.capacity);
        passengers.forEach((passenger) => claimed.add(passenger.id));
        const origins = uniqueFloors(passengers.map((passenger) => passenger.origin)).sort(
          (a, b) => Math.abs(a - elevator.position) - Math.abs(b - elevator.position),
        );
        const destinations = uniqueFloors(passengers.map((passenger) => passenger.destination)).sort(
          batch.direction === 'up' ? (a, b) => a - b : (a, b) => b - a,
        );

        plans.push({
          elevatorId: elevator.id,
          targetFloors: uniqueFloors([...origins, ...destinations]),
          assignPassengerIds: passengers.map((passenger) => passenger.id),
          mode: 'replace',
        });
        continue;
      }

      const fallback = [...eligibleWaitingPassengers]
        .filter((passenger) => !claimed.has(passenger.id))
        .sort((a, b) => a.requestTime - b.requestTime)[0];

      if (fallback) {
        claimed.add(fallback.id);
        plans.push({
          elevatorId: elevator.id,
          targetFloors: uniqueFloors([fallback.origin, fallback.destination]),
          assignPassengerIds: [fallback.id],
          mode: 'replace',
        });
      }
    }

    return { plans };
  },
};

interface Batch {
  key: string;
  direction: Passenger['direction'];
  passengers: Passenger[];
}

function createBatches(waitingPassengers: readonly Passenger[], floorCount: number): Batch[] {
  const batchMap = new Map<string, Batch>();

  for (const passenger of waitingPassengers) {
    const key = `${passenger.direction}-${bandForFloor(passenger.destination, floorCount)}`;
    const batch = batchMap.get(key) ?? {
      key,
      direction: passenger.direction,
      passengers: [],
    };
    batch.passengers.push(passenger);
    batchMap.set(key, batch);
  }

  return [...batchMap.values()].sort((a, b) => {
    const sizeDifference = b.passengers.length - a.passengers.length;
    if (sizeDifference !== 0) {
      return sizeDifference;
    }
    return a.passengers[0].requestTime - b.passengers[0].requestTime;
  });
}

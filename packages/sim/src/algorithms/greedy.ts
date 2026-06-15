import type { ElevatorAlgorithm, ElevatorPlan } from '../types.js';
import { nearestWaitingPassenger, passengerDestinations, uniqueFloors } from './tools.js';

export const greedyAlgorithm: ElevatorAlgorithm = {
  id: 'greedy',
  name: 'Greedy Nearest Car',
  category: 'Baseline',
  summary: 'Each car serves onboard riders first, then the nearest unclaimed waiting passenger.',
  decide: ({ elevators, waitingPassengers }) => {
    const claimedPassengerIds = new Set<string>();
    const plans: ElevatorPlan[] = [];

    for (const elevator of elevators) {
      const destinations = passengerDestinations(elevator).sort(
        (a, b) => Math.abs(a - elevator.position) - Math.abs(b - elevator.position),
      );

      if (destinations.length > 0) {
        plans.push({
          elevatorId: elevator.id,
          targetFloors: destinations,
          mode: 'replace',
        });
        continue;
      }

      const passenger = nearestWaitingPassenger(elevator, waitingPassengers, claimedPassengerIds);
      if (!passenger) {
        continue;
      }

      claimedPassengerIds.add(passenger.id);
      plans.push({
        elevatorId: elevator.id,
        targetFloors: uniqueFloors([passenger.origin, passenger.destination]),
        assignPassengerIds: [passenger.id],
        mode: 'replace',
      });
    }

    return { plans };
  },
};

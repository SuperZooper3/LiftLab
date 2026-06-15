import type { ElevatorAlgorithm, ElevatorPlan } from '../types.js';
import { passengerDestinations, uniqueFloors } from './tools.js';

export const lobbyExpressAlgorithm: ElevatorAlgorithm = {
  id: 'lobby-express',
  name: 'Lobby Express',
  category: 'Batching',
  summary: 'Keeps empty cars available for lobby surges and batches high-floor riders together.',
  decide: ({ elevators, waitingPassengers, config }) => {
    const plans: ElevatorPlan[] = [];
    const highFloorCutoff = Math.max(1, Math.floor(config.building.floorCount * 0.55));
    const claimedLobby = new Set<string>();

    for (const elevator of elevators) {
      const eligibleWaitingPassengers = waitingPassengers.filter(
        (passenger) =>
          passenger.assignedElevatorId === undefined || passenger.assignedElevatorId === elevator.id,
      );
      const lobbyHighRiders = eligibleWaitingPassengers.filter(
        (passenger) => passenger.origin === 0 && passenger.destination >= highFloorCutoff,
      );
      const onboardDestinations = passengerDestinations(elevator);
      if (onboardDestinations.length > 0) {
        const sortedDestinations = onboardDestinations.sort((a, b) =>
          elevator.direction === 'down' ? b - a : a - b,
        );
        plans.push({
          elevatorId: elevator.id,
          targetFloors: sortedDestinations,
          mode: 'replace',
        });
        continue;
      }

      const unclaimedLobbyRiders = lobbyHighRiders.filter((passenger) => !claimedLobby.has(passenger.id));
      if (unclaimedLobbyRiders.length > 0 && elevator.loadFactor === 0) {
        const groupedPassengers = unclaimedLobbyRiders
          .sort((a, b) => b.destination - a.destination)
          .slice(0, Math.max(2, config.building.capacity));
        const groupedDestinations = uniqueFloors(
          groupedPassengers.map((passenger) => {
            claimedLobby.add(passenger.id);
            return passenger.destination;
          }),
        ).sort((a, b) => a - b);

        plans.push({
          elevatorId: elevator.id,
          targetFloors: uniqueFloors([0, ...groupedDestinations]),
          assignPassengerIds: groupedPassengers.map((passenger) => passenger.id),
          mode: 'replace',
        });
        continue;
      }

      const nextPassenger = [...eligibleWaitingPassengers]
        .filter((passenger) => !claimedLobby.has(passenger.id))
        .sort((a, b) => {
          const aLobbyBoost = a.origin === 0 ? -2 : 0;
          const bLobbyBoost = b.origin === 0 ? -2 : 0;
          return (
            Math.abs(a.origin - elevator.position) +
            aLobbyBoost -
            (Math.abs(b.origin - elevator.position) + bLobbyBoost)
          );
        })[0];

      if (nextPassenger) {
        claimedLobby.add(nextPassenger.id);
        plans.push({
          elevatorId: elevator.id,
          targetFloors: uniqueFloors([nextPassenger.origin, nextPassenger.destination]),
          assignPassengerIds: [nextPassenger.id],
          mode: 'replace',
        });
      } else {
        plans.push({ elevatorId: elevator.id, parkFloor: 0, mode: 'replace' });
      }
    }

    return { plans };
  },
};

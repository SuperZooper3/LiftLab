# Algorithm API

Algorithms are plain TypeScript objects. They do not open doors or move cars directly. They decide
which floors each elevator should target, and the simulation engine handles the mechanics.

```ts
import type { ElevatorAlgorithm } from '@lift-lab/sim';

export const myAlgorithm: ElevatorAlgorithm = {
  id: 'my-algorithm',
  name: 'My Algorithm',
  category: 'Experimental',
  summary: 'Short human-readable description.',
  decide: ({ elevators, waitingPassengers }) => {
    return {
      plans: elevators.map((elevator) => {
        const passenger = waitingPassengers[0];
        return {
          elevatorId: elevator.id,
          targetFloors: passenger ? [passenger.origin, passenger.destination] : [],
          mode: 'replace',
        };
      }),
    };
  },
};
```

Register it in `packages/sim/src/algorithms/index.ts`:

```ts
import { myAlgorithm } from './myAlgorithm.js';

export const algorithms = [
  myAlgorithm,
  // existing algorithms...
];
```

## Input Highlights

- `now` and `tick`: deterministic simulation time.
- `config`: normalized run config.
- `elevators`: immutable snapshots with position, door state, passengers, capacity, and queue.
- `waitingPassengers`: immutable passenger snapshots.
- `floorSummaries`: per-floor waiting counts and oldest wait.
- `metrics`: current live metrics.

Floor indexes in the API are zero-based. The UI displays those same floors as 1 through N.
Timing config includes `floorHeightMeters`, `floorTravelSeconds`, `doorOpenSeconds`,
`doorCloseSeconds`, and `doorHoldSeconds`.

## Decision Shape

```ts
{
  plans: [
    {
      elevatorId: 'E1',
      targetFloors: [0, 12, 14],
      assignPassengerIds: ['P42', 'P43'],
      mode: 'replace'
    }
  ]
}
```

Use `mode: 'append'` to keep the current queue and add stops. Use `parkFloor` for idle positioning.
The engine automatically keeps onboard passenger destinations in the queue, so an algorithm cannot
strand riders by forgetting their destination.

Passengers board in FIFO order for their origin floor and compatible travel direction.

`assignPassengerIds` supports destination-dispatch strategies. A waiting passenger assigned to `E2`
will only board `E2`, which lets algorithms model lobby terminals that tell people which elevator
to stand near before the car arrives. You can also return top-level `assignments`:

```ts
{
  plans: [],
  assignments: [{ passengerId: 'P42', elevatorId: 'E2' }]
}
```

## Profiles

Demand profiles live in `packages/sim/src/profiles.ts`. A profile provides:

- `intensityAt(ctx)`: rate multiplier at a simulation time.
- `sampleTrip(ctx)`: deterministic origin/destination sampling with the seeded RNG.

The UI exposes all registered profiles automatically.

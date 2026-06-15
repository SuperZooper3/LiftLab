# Architecture

LiftLab has two layers.

## `@lift-lab/sim`

The sim package is the source of truth. It has no DOM dependency and can run thousands of simulation
steps without rendering.

- `SimulationEngine` owns time, passenger generation, elevator physics, doors, boarding, unloading,
  metrics, and history sampling.
- `DemandProfile` objects describe traffic patterns and sample origin/destination pairs.
- `ElevatorAlgorithm` objects receive snapshots and return target floor plans.
- `runBenchmark` runs the same config across algorithms and seeds.

The engine uses fixed simulation steps and continuous elevator positions. UI speed changes only how
much simulated time is advanced per animation frame; the engine itself is not tied to frame rate.
The default physical timing assumes 5m floors, about 1.6 m/s car speed, 2.6 seconds to open doors,
3.2 seconds to close doors, and 4 seconds of door hold time for loading.

## `@lift-lab/web`

The web package is a thin React client around the sim package.

- Live playback uses `requestAnimationFrame`, but only renders snapshots after headless advancement.
- The building view is DOM/CSS based and auto-fits the configured floor/elevator count.
- Charts consume sampled run history rather than asking the engine for per-frame DOM updates.
- Benchmarks run the same headless engine as the live simulator.

## Run Lifecycle

1. Normalize a `RunConfig`.
2. Create elevators at the lobby and seed the deterministic RNG.
3. At each step, generate passengers from the active profile.
4. On the decision interval, call the selected algorithm with immutable snapshots.
5. Apply passenger-to-elevator assignments and elevator target plans.
6. Move cars, operate doors, board and unload passengers.
7. Sample metrics into history.
8. For finite runs, stop after the traffic window has ended and all active passengers are served, or
   after a generous runaway guard is reached.

Continuous runs skip the finite completion condition and keep generating demand until the caller
pauses or resets.

The UI displays floors as 1 through N. The engine and algorithm API use zero-based floor indexes to
keep array lookups and state snapshots simple.

The web app can save compact run summaries to local storage and export the full current run snapshot
as JSON.

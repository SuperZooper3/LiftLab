# Algorithms

LiftLab includes five algorithms.

## Greedy Nearest Car

Baseline strategy. Cars serve onboard destinations first, then claim the nearest waiting passenger.
It is simple and deterministic, but it can over-concentrate cars in busy areas.

## SCAN Sweep

Classical elevator sweep. Cars keep moving in a direction, collecting compatible calls, then reverse.
This is predictable, but can perform poorly against strong one-sided lobby surges.

## Zoned Parking

Partitions the building by elevator index and parks idle cars near their home floors. This improves
coverage during mixed traffic and gives the system a stable idle posture.

## Lobby Express

Specializes for morning-style lobby surges. Empty cars favor lobby pickups and batch high-floor
riders before running upward.

Morning rush is intentionally pure lobby-up traffic. End-of-day is intentionally pure upper-floor
down traffic, so early algorithm work can focus on clear dispatch behavior before mixed resilience
cases are introduced.

## Destination Batcher

Groups waiting passengers by direction and destination band. This can reduce stop churn by sending
cars to coherent batches rather than isolated nearest calls.

## Benchmark Metrics

Benchmarks compare:

- average wait
- P95 wait
- average journey time
- served passengers
- throughput per minute
- energy estimate from travel distance and door cycles
- timed-out runs

Timed-out runs sort below completed runs so low wait averages from partially served traffic do not
look better than completed service.

The default web run is intentionally moderate so the visualization can be watched without immediately
flooding the lobby queue. Increase `Rate / min` when you want stress-test behavior.

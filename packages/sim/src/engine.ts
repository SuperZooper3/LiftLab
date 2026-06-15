import { normalizeConfig } from './config.js';
import { getDemandProfile } from './profiles.js';
import { createSeededRandom, poisson } from './rng.js';
import type {
  Direction,
  DoorState,
  ElevatorAlgorithm,
  ElevatorSnapshot,
  FloorSnapshot,
  HistoryPoint,
  LiveMetrics,
  NormalizedRunConfig,
  Passenger,
  RunConfig,
  RunResult,
  RunSnapshot,
} from './types.js';

interface ElevatorInternal {
  id: string;
  index: number;
  position: number;
  direction: Direction;
  doorState: DoorState;
  doorTimer: number;
  holdTimer: number;
  passengers: Passenger[];
  capacity: number;
  targetQueue: number[];
  distanceTraveled: number;
  doorCycles: number;
  idleSeconds: number;
}

const EPSILON = 0.0001;

export class SimulationEngine<TState = unknown> {
  private config: NormalizedRunConfig;
  private readonly algorithm: ElevatorAlgorithm<TState>;
  private readonly algorithmState: TState;
  private rng: ReturnType<typeof createSeededRandom>;
  private readonly elevators: ElevatorInternal[];
  private readonly runId: string;

  private waitingPassengers: Passenger[] = [];
  private completedPassengers: Passenger[] = [];
  private history: HistoryPoint[] = [];
  private now = 0;
  private tick = 0;
  private passengerSequence = 0;
  private nextDecisionAt = 0;
  private nextHistoryAt = 0;
  private status: RunSnapshot['status'] = 'idle';
  private didNotifyAlgorithmEnd = false;

  constructor(config: RunConfig, algorithm: ElevatorAlgorithm<TState>) {
    this.config = normalizeConfig(config);
    this.algorithm = algorithm;
    this.algorithmState = algorithm.createRunState
      ? algorithm.createRunState(this.config)
      : (undefined as TState);
    this.rng = createSeededRandom(this.config.traffic.seed);
    this.runId = this.config.id ?? `run-${this.config.traffic.seed}`;
    this.elevators = Array.from({ length: this.config.building.elevatorCount }, (_, index) => ({
      id: `E${index + 1}`,
      index,
      position: 0,
      direction: 'idle',
      doorState: 'closed',
      doorTimer: 0,
      holdTimer: 0,
      passengers: [],
      capacity: this.config.building.capacity,
      targetQueue: [],
      distanceTraveled: 0,
      doorCycles: 0,
      idleSeconds: 0,
    }));

    this.recordHistory();
  }

  getConfig(): NormalizedRunConfig {
    return this.config;
  }

  updateConfig(config: RunConfig): RunSnapshot {
    const previousSeed = this.config.traffic.seed;
    this.config = normalizeConfig({
      ...config,
      id: this.runId,
      building: this.config.building,
    });

    if (this.config.traffic.seed !== previousSeed) {
      this.rng = createSeededRandom(this.config.traffic.seed);
    }

    this.nextDecisionAt = Math.min(
      this.nextDecisionAt,
      this.now + this.config.timing.decisionIntervalSeconds,
    );
    this.nextHistoryAt = Math.min(
      this.nextHistoryAt,
      this.now + this.config.timing.historyIntervalSeconds,
    );

    return this.getSnapshot();
  }

  getSnapshot(): RunSnapshot {
    const elevators = this.elevators.map((elevator) => this.toElevatorSnapshot(elevator));
    const floorSummaries = createFloorSummaries(
      this.config.building.floorCount,
      this.waitingPassengers,
      this.now,
    );

    return {
      id: this.runId,
      status: this.status,
      config: this.config,
      algorithmId: this.algorithm.id,
      algorithmName: this.algorithm.name,
      now: this.now,
      tick: this.tick,
      elevators,
      waitingPassengers: clonePassengers(this.waitingPassengers),
      completedPassengers: clonePassengers(this.completedPassengers),
      floorSummaries,
      metrics: this.calculateMetrics(),
      history: [...this.history],
    };
  }

  step(seconds = this.config.timing.stepSeconds): RunSnapshot {
    this.stepInternal(seconds);
    return this.getSnapshot();
  }

  advance(seconds: number, maxSteps = 100_000): RunSnapshot {
    const targetTime = this.now + Math.max(0, seconds);
    let steps = 0;

    while (this.now + EPSILON < targetTime && this.status !== 'complete' && steps < maxSteps) {
      const remaining = targetTime - this.now;
      this.stepInternal(Math.min(remaining, this.config.timing.stepSeconds));
      steps += 1;
    }

    return this.getSnapshot();
  }

  runUntilComplete(maxSteps = 2_000_000): RunResult {
    let steps = 0;

    while (this.status !== 'complete' && steps < maxSteps) {
      this.stepInternal();
      steps += 1;
      if (this.config.mode === 'continuous' && this.now >= this.config.durationSeconds) {
        break;
      }
    }

    if (steps >= maxSteps) {
      this.status = 'complete';
      this.notifyAlgorithmEnd();
    }

    const snapshot = this.getSnapshot();
    return {
      config: this.config,
      algorithmId: this.algorithm.id,
      algorithmName: this.algorithm.name,
      metrics: snapshot.metrics,
      history: snapshot.history,
      completedPassengers: snapshot.completedPassengers,
      timedOut: this.didTimeOut(),
    };
  }

  private stepInternal(seconds = this.config.timing.stepSeconds): void {
    if (this.status === 'complete') {
      return;
    }

    this.status = 'running';
    const dt = Math.max(0, Math.min(seconds, this.config.timing.stepSeconds * 4));

    this.spawnPassengers(dt);

    if (this.now + EPSILON >= this.nextDecisionAt) {
      this.applyAlgorithmDecision();
      this.nextDecisionAt = this.now + this.config.timing.decisionIntervalSeconds;
    }

    for (const elevator of this.elevators) {
      this.updateElevator(elevator, dt);
      this.ensurePassengerDestinations(elevator);
    }

    this.now += dt;
    this.tick += 1;

    if (this.now + EPSILON >= this.nextHistoryAt) {
      this.recordHistory();
      this.nextHistoryAt = this.now + this.config.timing.historyIntervalSeconds;
    }

    if (this.isComplete()) {
      this.status = 'complete';
      this.notifyAlgorithmEnd();
    }
  }

  private spawnPassengers(dt: number): void {
    if (this.config.mode === 'finite' && this.now >= this.config.durationSeconds) {
      return;
    }

    const profile = getDemandProfile(this.config.traffic.profileId);
    const intensity = Math.max(0, profile.intensityAt({ now: this.now, config: this.config }));
    const lambda = (this.config.traffic.baseRatePerMinute * intensity * dt) / 60;
    const count = poisson(lambda, this.rng);

    for (let index = 0; index < count; index += 1) {
      const trip = profile.sampleTrip({ now: this.now, config: this.config, rng: this.rng });
      const origin = clampFloor(trip.origin, this.config.building.floorCount);
      const destination = clampFloor(trip.destination, this.config.building.floorCount);

      if (origin === destination) {
        continue;
      }

      this.passengerSequence += 1;
      this.waitingPassengers.push({
        id: `P${this.passengerSequence}`,
        origin,
        destination,
        direction: destination > origin ? 'up' : 'down',
        requestTime: this.now,
        status: 'waiting',
      });
    }
  }

  private applyAlgorithmDecision(): void {
    const decision = this.algorithm.decide(
      {
        now: this.now,
        tick: this.tick,
        config: this.config,
        elevators: this.elevators.map((elevator) => this.toElevatorSnapshot(elevator)),
        waitingPassengers: clonePassengers(this.waitingPassengers),
        floorSummaries: createFloorSummaries(
          this.config.building.floorCount,
          this.waitingPassengers,
          this.now,
        ),
        metrics: this.calculateMetrics(),
      },
      this.algorithmState,
    );

    for (const assignment of decision.assignments ?? []) {
      if (!this.elevators.some((elevator) => elevator.id === assignment.elevatorId)) {
        continue;
      }
      const passenger = this.waitingPassengers.find((candidate) => candidate.id === assignment.passengerId);
      if (passenger) {
        passenger.assignedElevatorId = assignment.elevatorId;
      }
    }

    for (const plan of decision.plans) {
      const elevator = this.elevators.find((candidate) => candidate.id === plan.elevatorId);
      if (!elevator) {
        continue;
      }

      for (const passengerId of plan.assignPassengerIds ?? []) {
        const passenger = this.waitingPassengers.find((candidate) => candidate.id === passengerId);
        if (passenger) {
          passenger.assignedElevatorId = elevator.id;
        }
      }

      const targetFloors =
        plan.targetFloors !== undefined
          ? sanitizeTargets(plan.targetFloors, this.config.building.floorCount)
          : plan.parkFloor !== undefined
            ? [clampFloor(plan.parkFloor, this.config.building.floorCount)]
            : undefined;

      if (targetFloors === undefined) {
        continue;
      }

      if (plan.mode === 'append') {
        elevator.targetQueue = appendTargets(elevator.targetQueue, targetFloors);
      } else {
        elevator.targetQueue = targetFloors;
      }

      this.ensurePassengerDestinations(elevator);
    }
  }

  private updateElevator(elevator: ElevatorInternal, dt: number): void {
    if (elevator.doorState !== 'closed') {
      this.updateDoor(elevator, dt);
      return;
    }

    const floor = exactFloor(elevator.position);
    if (floor !== undefined && this.shouldOpenAtFloor(elevator, floor)) {
      this.beginOpening(elevator);
      return;
    }

    if (floor !== undefined && elevator.targetQueue[0] === floor) {
      this.clearTargetAtFloor(elevator, floor);
    }

    const target = elevator.targetQueue[0];
    if (target === undefined) {
      elevator.direction = 'idle';
      elevator.idleSeconds += dt;
      return;
    }

    this.moveElevatorToward(elevator, target, dt);
  }

  private updateDoor(elevator: ElevatorInternal, dt: number): void {
    if (elevator.doorState === 'opening') {
      elevator.doorTimer += dt;
      if (elevator.doorTimer + EPSILON >= this.config.timing.doorOpenSeconds) {
        elevator.doorState = 'open';
        elevator.doorTimer = 0;
        this.serviceCurrentFloor(elevator);
      }
      return;
    }

    if (elevator.doorState === 'open') {
      this.serviceCurrentFloor(elevator);
      elevator.holdTimer += dt;
      if (elevator.holdTimer + EPSILON >= this.config.timing.doorHoldSeconds) {
        elevator.doorState = 'closing';
        elevator.doorTimer = 0;
      }
      return;
    }

    if (elevator.doorState === 'closing') {
      elevator.doorTimer += dt;
      if (elevator.doorTimer + EPSILON >= this.config.timing.doorCloseSeconds) {
        elevator.doorState = 'closed';
        elevator.doorTimer = 0;
        elevator.holdTimer = 0;
      }
    }
  }

  private beginOpening(elevator: ElevatorInternal): void {
    elevator.direction = 'idle';
    elevator.doorState = 'opening';
    elevator.doorTimer = 0;
    elevator.holdTimer = 0;
    elevator.doorCycles += 1;
  }

  private shouldOpenAtFloor(elevator: ElevatorInternal, floor: number): boolean {
    if (elevator.passengers.some((passenger) => passenger.destination === floor)) {
      return true;
    }

    return elevator.targetQueue[0] === floor && this.hasBoardablePassenger(elevator, floor);
  }

  private finishArrivalAtFloor(elevator: ElevatorInternal, floor: number): void {
    if (this.shouldOpenAtFloor(elevator, floor)) {
      this.beginOpening(elevator);
      return;
    }

    this.clearTargetAtFloor(elevator, floor);
    elevator.direction = 'idle';
  }

  private clearTargetAtFloor(elevator: ElevatorInternal, floor: number): void {
    elevator.targetQueue = elevator.targetQueue.filter((target) => target !== floor);
  }

  private hasBoardablePassenger(elevator: ElevatorInternal, floor: number): boolean {
    if (elevator.passengers.length >= elevator.capacity) {
      return false;
    }

    return this.waitingPassengers.some(
      (passenger) =>
        passenger.origin === floor &&
        (passenger.assignedElevatorId === undefined || passenger.assignedElevatorId === elevator.id),
    );
  }

  private moveElevatorToward(elevator: ElevatorInternal, target: number, dt: number): void {
    const direction = directionBetween(elevator.position, target);
    if (direction === 'idle') {
      this.finishArrivalAtFloor(elevator, target);
      return;
    }

    const speed = 1 / this.config.timing.floorTravelSeconds;
    const previousPosition = elevator.position;
    const delta = speed * dt * (direction === 'up' ? 1 : -1);
    const nextPosition = elevator.position + delta;
    const crossedTarget =
      direction === 'up' ? nextPosition + EPSILON >= target : nextPosition - EPSILON <= target;

    elevator.direction = direction;

    if (crossedTarget) {
      elevator.position = target;
      elevator.distanceTraveled += Math.abs(target - previousPosition);
      this.finishArrivalAtFloor(elevator, target);
      return;
    }

    elevator.position = nextPosition;
    elevator.distanceTraveled += Math.abs(nextPosition - previousPosition);
  }

  private serviceCurrentFloor(elevator: ElevatorInternal): void {
    const floor = exactFloor(elevator.position);
    if (floor === undefined) {
      return;
    }

    elevator.targetQueue = elevator.targetQueue.filter((target) => target !== floor);

    const remainingPassengers: Passenger[] = [];
    for (const passenger of elevator.passengers) {
      if (passenger.destination === floor) {
        passenger.arrivalTime = this.now;
        passenger.status = 'served';
        this.completedPassengers.push(passenger);
      } else {
        remainingPassengers.push(passenger);
      }
    }
    elevator.passengers = remainingPassengers;

    const floorPassengers = this.waitingPassengers
      .filter(
        (passenger) =>
          passenger.origin === floor &&
          (passenger.assignedElevatorId === undefined || passenger.assignedElevatorId === elevator.id),
      )
      .sort((a, b) => a.requestTime - b.requestTime);

    if (floorPassengers.length === 0 || elevator.passengers.length >= elevator.capacity) {
      this.ensurePassengerDestinations(elevator);
      return;
    }

    let boardingDirection = this.getBoardingDirection(elevator, floor, floorPassengers);
    if (boardingDirection === 'idle') {
      boardingDirection = floorPassengers[0]?.direction ?? 'idle';
    }

    const boardedIds = new Set<string>();
    for (const passenger of floorPassengers) {
      if (passenger.direction !== boardingDirection) {
        continue;
      }

      if (elevator.passengers.length >= elevator.capacity) {
        break;
      }

      passenger.boardTime = this.now;
      passenger.status = 'riding';
      passenger.assignedElevatorId = elevator.id;
      elevator.passengers.push(passenger);
      boardedIds.add(passenger.id);
      elevator.targetQueue = appendTargets(elevator.targetQueue, [passenger.destination]);
    }

    if (boardedIds.size > 0) {
      this.waitingPassengers = this.waitingPassengers.filter(
        (passenger) => !boardedIds.has(passenger.id),
      );
    }

    this.ensurePassengerDestinations(elevator);
  }

  private getBoardingDirection(
    elevator: ElevatorInternal,
    floor: number,
    floorPassengers: Passenger[],
  ): Direction {
    const nextTarget = elevator.targetQueue.find((target) => target !== floor);
    if (nextTarget !== undefined) {
      return directionBetween(floor, nextTarget);
    }

    const onboardDestination = elevator.passengers.find((passenger) => passenger.destination !== floor)
      ?.destination;
    if (onboardDestination !== undefined) {
      return directionBetween(floor, onboardDestination);
    }

    const upCount = floorPassengers.filter((passenger) => passenger.direction === 'up').length;
    const downCount = floorPassengers.length - upCount;
    if (upCount === 0 && downCount === 0) {
      return 'idle';
    }

    return upCount >= downCount ? 'up' : 'down';
  }

  private ensurePassengerDestinations(elevator: ElevatorInternal): void {
    if (elevator.passengers.length === 0) {
      return;
    }

    elevator.targetQueue = appendTargets(
      elevator.targetQueue,
      elevator.passengers.map((passenger) => passenger.destination),
    );
  }

  private calculateMetrics(): LiveMetrics {
    const served = this.completedPassengers.length;
    const waiting = this.waitingPassengers.length;
    const riding = this.elevators.reduce((total, elevator) => total + elevator.passengers.length, 0);
    const generated = served + waiting + riding;
    const waits = this.completedPassengers
      .map((passenger) => (passenger.boardTime ?? passenger.requestTime) - passenger.requestTime)
      .filter((value) => Number.isFinite(value));
    const travels = this.completedPassengers
      .map((passenger) => (passenger.arrivalTime ?? this.now) - (passenger.boardTime ?? this.now))
      .filter((value) => Number.isFinite(value));
    const journeys = this.completedPassengers
      .map((passenger) => (passenger.arrivalTime ?? this.now) - passenger.requestTime)
      .filter((value) => Number.isFinite(value));
    const currentWaits = this.waitingPassengers.map((passenger) => this.now - passenger.requestTime);
    const distanceFloors = this.elevators.reduce(
      (total, elevator) => total + elevator.distanceTraveled,
      0,
    );
    const doorCycles = this.elevators.reduce((total, elevator) => total + elevator.doorCycles, 0);

    return {
      elapsedSeconds: this.now,
      generated,
      served,
      waiting,
      riding,
      averageWaitSeconds: average(waits),
      averageTravelSeconds: average(travels),
      averageJourneySeconds: average(journeys),
      p90WaitSeconds: percentile(waits, 0.9),
      p95WaitSeconds: percentile(waits, 0.95),
      maxWaitSeconds: waits.length > 0 ? Math.max(...waits) : 0,
      currentMaxWaitSeconds: currentWaits.length > 0 ? Math.max(...currentWaits) : 0,
      throughputPerMinute: this.now > 0 ? served / (this.now / 60) : 0,
      distanceFloors,
      doorCycles,
      energyEstimate: distanceFloors + doorCycles * 0.35,
    };
  }

  private toElevatorSnapshot(elevator: ElevatorInternal): ElevatorSnapshot {
    return {
      id: elevator.id,
      index: elevator.index,
      position: elevator.position,
      currentFloor: clampFloor(Math.round(elevator.position), this.config.building.floorCount),
      direction: elevator.direction,
      doorState: elevator.doorState,
      passengers: clonePassengers(elevator.passengers),
      capacity: elevator.capacity,
      targetQueue: [...elevator.targetQueue],
      loadFactor: elevator.passengers.length / elevator.capacity,
      distanceTraveled: elevator.distanceTraveled,
      doorCycles: elevator.doorCycles,
      idleSeconds: elevator.idleSeconds,
    };
  }

  private recordHistory(): void {
    this.history.push({
      time: this.now,
      ...this.calculateMetrics(),
    });
  }

  private isComplete(): boolean {
    if (this.config.mode === 'continuous') {
      return false;
    }

    const generationDone = this.now >= this.config.durationSeconds;
    const noActivePassengers =
      this.waitingPassengers.length === 0 &&
      this.elevators.every((elevator) => elevator.passengers.length === 0);

    return (generationDone && noActivePassengers) || this.now >= this.config.maxRunSeconds;
  }

  private didTimeOut(): boolean {
    return (
      this.config.mode === 'finite' &&
      this.now >= this.config.maxRunSeconds &&
      (this.waitingPassengers.length > 0 ||
        this.elevators.some((elevator) => elevator.passengers.length > 0))
    );
  }

  private notifyAlgorithmEnd(): void {
    if (this.didNotifyAlgorithmEnd) {
      return;
    }

    this.didNotifyAlgorithmEnd = true;
    this.algorithm.onRunEnd?.(this.getSnapshot(), this.algorithmState);
  }
}

export function directionBetween(from: number, to: number): Direction {
  if (Math.abs(from - to) < EPSILON) {
    return 'idle';
  }
  return to > from ? 'up' : 'down';
}

export function createFloorSummaries(
  floorCount: number,
  waitingPassengers: readonly Passenger[],
  now: number,
): FloorSnapshot[] {
  return Array.from({ length: floorCount }, (_, floor) => {
    const passengers = waitingPassengers.filter((passenger) => passenger.origin === floor);
    const oldest = passengers.reduce(
      (max, passenger) => Math.max(max, now - passenger.requestTime),
      0,
    );

    return {
      floor,
      waitingCount: passengers.length,
      upCount: passengers.filter((passenger) => passenger.direction === 'up').length,
      downCount: passengers.filter((passenger) => passenger.direction === 'down').length,
      oldestWaitSeconds: oldest,
    };
  });
}

function exactFloor(position: number): number | undefined {
  const floor = Math.round(position);
  return Math.abs(position - floor) < EPSILON ? floor : undefined;
}

function clampFloor(floor: number, floorCount: number): number {
  return Math.max(0, Math.min(floorCount - 1, Math.round(floor)));
}

function sanitizeTargets(targets: readonly number[], floorCount: number): number[] {
  const seen = new Set<number>();
  const sanitized: number[] = [];

  for (const target of targets) {
    const floor = clampFloor(target, floorCount);
    if (!seen.has(floor)) {
      seen.add(floor);
      sanitized.push(floor);
    }
  }

  return sanitized;
}

function appendTargets(existing: readonly number[], targets: readonly number[]): number[] {
  const queue = [...existing];

  for (const target of targets) {
    if (!queue.includes(target)) {
      queue.push(target);
    }
  }

  return queue;
}

function clonePassengers(passengers: readonly Passenger[]): Passenger[] {
  return passengers.map((passenger) => ({ ...passenger }));
}

function average(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * p) - 1);
  return sorted[index];
}

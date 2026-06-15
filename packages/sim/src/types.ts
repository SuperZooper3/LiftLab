export type Direction = 'up' | 'down' | 'idle';
export type DoorState = 'closed' | 'opening' | 'open' | 'closing';
export type PassengerStatus = 'waiting' | 'riding' | 'served';
export type RunMode = 'finite' | 'continuous';
export type ElevatorPlanMode = 'replace' | 'append';

export interface BuildingConfig {
  floorCount: number;
  elevatorCount: number;
  capacity: number;
}

export interface TimingConfig {
  stepSeconds: number;
  floorHeightMeters: number;
  floorTravelSeconds: number;
  doorOpenSeconds: number;
  doorCloseSeconds: number;
  doorHoldSeconds: number;
  decisionIntervalSeconds: number;
  historyIntervalSeconds: number;
}

export interface TrafficConfig {
  profileId: string;
  baseRatePerMinute: number;
  seed: number;
  lunchFloor?: number;
  eventFloor?: number;
}

export interface RunConfig {
  id?: string;
  label?: string;
  mode: RunMode;
  durationSeconds: number;
  building: BuildingConfig;
  timing: TimingConfig;
  traffic: TrafficConfig;
}

export interface NormalizedRunConfig extends RunConfig {
  maxRunSeconds: number;
}

export interface Passenger {
  id: string;
  origin: number;
  destination: number;
  direction: Exclude<Direction, 'idle'>;
  requestTime: number;
  boardTime?: number;
  arrivalTime?: number;
  assignedElevatorId?: string;
  status: PassengerStatus;
}

export interface PassengerAssignment {
  passengerId: string;
  elevatorId: string;
}

export interface PassengerIntent {
  origin: number;
  destination: number;
}

export interface ElevatorSnapshot {
  id: string;
  index: number;
  position: number;
  currentFloor: number;
  direction: Direction;
  doorState: DoorState;
  passengers: Passenger[];
  capacity: number;
  targetQueue: number[];
  loadFactor: number;
  distanceTraveled: number;
  doorCycles: number;
  idleSeconds: number;
}

export interface FloorSnapshot {
  floor: number;
  waitingCount: number;
  upCount: number;
  downCount: number;
  oldestWaitSeconds: number;
}

export interface LiveMetrics {
  elapsedSeconds: number;
  generated: number;
  served: number;
  waiting: number;
  riding: number;
  averageWaitSeconds: number;
  averageTravelSeconds: number;
  averageJourneySeconds: number;
  p90WaitSeconds: number;
  p95WaitSeconds: number;
  maxWaitSeconds: number;
  currentMaxWaitSeconds: number;
  throughputPerMinute: number;
  distanceFloors: number;
  doorCycles: number;
  energyEstimate: number;
}

export interface HistoryPoint extends LiveMetrics {
  time: number;
}

export interface RunSnapshot {
  id: string;
  status: 'idle' | 'running' | 'complete';
  config: NormalizedRunConfig;
  algorithmId: string;
  algorithmName: string;
  now: number;
  tick: number;
  elevators: ElevatorSnapshot[];
  waitingPassengers: Passenger[];
  completedPassengers: Passenger[];
  floorSummaries: FloorSnapshot[];
  metrics: LiveMetrics;
  history: HistoryPoint[];
}

export interface ElevatorPlan {
  elevatorId: string;
  targetFloors?: number[];
  assignPassengerIds?: string[];
  mode?: ElevatorPlanMode;
  parkFloor?: number;
  note?: string;
}

export interface AlgorithmInput {
  now: number;
  tick: number;
  config: NormalizedRunConfig;
  elevators: ElevatorSnapshot[];
  waitingPassengers: Passenger[];
  floorSummaries: FloorSnapshot[];
  metrics: LiveMetrics;
}

export interface AlgorithmDecision {
  plans: ElevatorPlan[];
  assignments?: PassengerAssignment[];
  notes?: string[];
  metadata?: Record<string, unknown>;
}

export interface ElevatorAlgorithm<TState = unknown> {
  id: string;
  name: string;
  summary: string;
  category: string;
  createRunState?: (config: NormalizedRunConfig) => TState;
  decide: (input: AlgorithmInput, state: TState) => AlgorithmDecision;
  onRunEnd?: (snapshot: RunSnapshot, state: TState) => void;
}

export interface DemandProfile {
  id: string;
  name: string;
  summary: string;
  recommendedDurationSeconds: number;
  sampleTrip: (ctx: ProfileSampleContext) => PassengerIntent;
  intensityAt: (ctx: ProfileIntensityContext) => number;
}

export interface ProfileIntensityContext {
  now: number;
  config: NormalizedRunConfig;
}

export interface ProfileSampleContext extends ProfileIntensityContext {
  rng: RandomSource;
}

export interface RandomSource {
  next: () => number;
  integer: (min: number, max: number) => number;
  pick: <T>(items: readonly T[]) => T;
  weightedIndex: (weights: readonly number[]) => number;
}

export interface RunResult {
  config: NormalizedRunConfig;
  algorithmId: string;
  algorithmName: string;
  metrics: LiveMetrics;
  history: HistoryPoint[];
  completedPassengers: Passenger[];
  timedOut: boolean;
}

export interface BenchmarkOptions {
  config: RunConfig;
  algorithms: ElevatorAlgorithm[];
  seeds: number[];
}

export interface BenchmarkRow {
  algorithmId: string;
  algorithmName: string;
  seed: number;
  served: number;
  averageWaitSeconds: number;
  p95WaitSeconds: number;
  averageJourneySeconds: number;
  throughputPerMinute: number;
  energyEstimate: number;
  timedOut: boolean;
}

export interface BenchmarkSummary {
  algorithmId: string;
  algorithmName: string;
  runs: number;
  served: number;
  averageWaitSeconds: number;
  p95WaitSeconds: number;
  averageJourneySeconds: number;
  throughputPerMinute: number;
  energyEstimate: number;
  timedOutRuns: number;
}

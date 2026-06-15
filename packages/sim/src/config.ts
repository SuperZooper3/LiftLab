import type { NormalizedRunConfig, RunConfig } from './types.js';

export const DEFAULT_TIMING = {
  stepSeconds: 0.5,
  floorHeightMeters: 5,
  floorTravelSeconds: 3.1,
  doorOpenSeconds: 2.6,
  doorCloseSeconds: 3.2,
  doorHoldSeconds: 4,
  decisionIntervalSeconds: 1,
  historyIntervalSeconds: 15,
} as const;

export const DEFAULT_RUN_CONFIG: RunConfig = {
  id: 'default-run',
  label: 'Default run',
  mode: 'finite',
  durationSeconds: 20 * 60,
  building: {
    floorCount: 18,
    elevatorCount: 4,
    capacity: 10,
  },
  timing: DEFAULT_TIMING,
  traffic: {
    profileId: 'morning-rush',
    baseRatePerMinute: 6,
    seed: 1948,
    eventFloor: 12,
  },
};

export function createDefaultRunConfig(overrides: Partial<RunConfig> = {}): RunConfig {
  return {
    ...DEFAULT_RUN_CONFIG,
    ...overrides,
    building: {
      ...DEFAULT_RUN_CONFIG.building,
      ...overrides.building,
    },
    timing: {
      ...DEFAULT_RUN_CONFIG.timing,
      ...overrides.timing,
    },
    traffic: {
      ...DEFAULT_RUN_CONFIG.traffic,
      ...overrides.traffic,
    },
  };
}

export function normalizeConfig(config: RunConfig): NormalizedRunConfig {
  const floorCount = clampInteger(config.building.floorCount, 2, 80);
  const elevatorCount = clampInteger(config.building.elevatorCount, 1, 16);
  const capacity = clampInteger(config.building.capacity, 2, 40);
  const durationSeconds = Math.max(60, finiteOr(config.durationSeconds, 45 * 60));
  const stepSeconds = clampNumber(config.timing.stepSeconds, 0.1, 5);

  return {
    id: config.id ?? `run-${config.traffic.seed}`,
    label: config.label,
    mode: config.mode,
    durationSeconds,
    maxRunSeconds: Math.max(durationSeconds + 4 * 60 * 60, durationSeconds * 8),
    building: {
      floorCount,
      elevatorCount,
      capacity,
    },
    timing: {
      stepSeconds,
      floorHeightMeters: clampNumber(config.timing.floorHeightMeters, 3, 7),
      floorTravelSeconds: clampNumber(config.timing.floorTravelSeconds, 0.5, 20),
      doorOpenSeconds: clampNumber(config.timing.doorOpenSeconds, 0.1, 20),
      doorCloseSeconds: clampNumber(config.timing.doorCloseSeconds, 0.1, 20),
      doorHoldSeconds: clampNumber(config.timing.doorHoldSeconds, 0, 60),
      decisionIntervalSeconds: clampNumber(config.timing.decisionIntervalSeconds, stepSeconds, 30),
      historyIntervalSeconds: clampNumber(config.timing.historyIntervalSeconds, stepSeconds, 300),
    },
    traffic: {
      profileId: config.traffic.profileId,
      baseRatePerMinute: clampNumber(config.traffic.baseRatePerMinute, 0, 300),
      seed: Math.trunc(finiteOr(config.traffic.seed, 1)),
      lunchFloor: clampOptionalFloor(config.traffic.lunchFloor, floorCount),
      eventFloor: clampOptionalFloor(config.traffic.eventFloor, floorCount),
    },
  };
}

function clampOptionalFloor(value: number | undefined, floorCount: number): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  return clampInteger(value, 0, floorCount - 1);
}

function clampInteger(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.trunc(finiteOr(value, min))));
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, finiteOr(value, min)));
}

function finiteOr(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

import type {
  DemandProfile,
  NormalizedRunConfig,
  PassengerIntent,
  ProfileSampleContext,
  RandomSource,
} from './types.js';

const STEADY_PROFILE: DemandProfile = {
  id: 'steady',
  name: 'Steady Mixed Traffic',
  summary: 'Balanced inter-floor demand with no dominant commute wave.',
  recommendedDurationSeconds: 20 * 60,
  intensityAt: ({ now, config }) => {
    const phase = (now / config.durationSeconds) * Math.PI * 2;
    return 0.75 + 0.25 * Math.sin(phase);
  },
  sampleTrip: ({ config, rng }) => sampleRandomTrip(config, rng),
};

const MORNING_RUSH_PROFILE: DemandProfile = {
  id: 'morning-rush',
  name: 'Morning Rush',
  summary: 'All passengers enter from floor 1 and travel upward.',
  recommendedDurationSeconds: 20 * 60,
  intensityAt: ({ now, config }) => bell(now / config.durationSeconds, 0.34, 0.22, 0.35, 1.55),
  sampleTrip: ({ config, rng }) => ({
    origin: 0,
    destination: sampleUpperFloor(config, rng),
  }),
};

const LUNCH_RUSH_PROFILE: DemandProfile = {
  id: 'lunch-rush',
  name: 'Lunch Rush',
  summary: 'Two pulses: office floors to a lunch floor, then back out again.',
  recommendedDurationSeconds: 30 * 60,
  intensityAt: ({ now, config }) => {
    const progress = now / config.durationSeconds;
    return (
      bell(progress, 0.32, 0.12, 0.15, 1.35) + bell(progress, 0.66, 0.14, 0.1, 1.15)
    );
  },
  sampleTrip: ({ now, config, rng }) => {
    const lunchFloor = lunchFloorForBuilding(config.building.floorCount);
    const outbound = now / config.durationSeconds < 0.5;

    if (outbound || rng.next() < 0.2) {
      return {
        origin: sampleNonSpecialFloor(config, rng, lunchFloor),
        destination: lunchFloor,
      };
    }

    return {
      origin: lunchFloor,
      destination: sampleNonSpecialFloor(config, rng, lunchFloor),
    };
  },
};

const END_OF_DAY_PROFILE: DemandProfile = {
  id: 'end-of-day',
  name: 'End Of Day',
  summary: 'All passengers start above floor 1 and travel down.',
  recommendedDurationSeconds: 20 * 60,
  intensityAt: ({ now, config }) => bell(now / config.durationSeconds, 0.28, 0.2, 0.2, 1.45),
  sampleTrip: ({ config, rng }) => ({
    origin: sampleUpperFloor(config, rng),
    destination: 0,
  }),
};

const ALL_HANDS_PROFILE: DemandProfile = {
  id: 'all-hands',
  name: 'All-Hands Event',
  summary: 'People converge on an event floor, then disperse back through the building.',
  recommendedDurationSeconds: 35 * 60,
  intensityAt: ({ now, config }) => {
    const progress = now / config.durationSeconds;
    return bell(progress, 0.22, 0.1, 0.05, 1.5) + bell(progress, 0.72, 0.12, 0.05, 1.25);
  },
  sampleTrip: ({ now, config, rng }) => {
    const eventFloor =
      config.traffic.eventFloor ?? Math.max(1, Math.floor(config.building.floorCount * 0.65));
    const arriving = now / config.durationSeconds < 0.5;

    if (arriving) {
      return {
        origin: sampleNonSpecialFloor(config, rng, eventFloor),
        destination: eventFloor,
      };
    }

    return {
      origin: eventFloor,
      destination: sampleNonSpecialFloor(config, rng, eventFloor),
    };
  },
};

const BURSTY_PROFILE: DemandProfile = {
  id: 'bursty',
  name: 'Bursty Mixed Demand',
  summary: 'Uneven arrivals that stress queue recovery and starvation behavior.',
  recommendedDurationSeconds: 25 * 60,
  intensityAt: ({ now, config }) => {
    const progress = now / config.durationSeconds;
    const wave = 0.7 + 0.35 * Math.sin(progress * Math.PI * 8);
    const pulse = progress > 0.45 && progress < 0.58 ? 1.15 : 0;
    return Math.max(0.1, wave + pulse);
  },
  sampleTrip: ({ config, rng }) => {
    if (rng.next() < 0.45) {
      return rng.next() < 0.5
        ? { origin: 0, destination: sampleUpperFloor(config, rng) }
        : { origin: sampleUpperFloor(config, rng), destination: 0 };
    }
    return sampleRandomTrip(config, rng);
  },
};

export const demandProfiles: DemandProfile[] = [
  MORNING_RUSH_PROFILE,
  LUNCH_RUSH_PROFILE,
  END_OF_DAY_PROFILE,
  ALL_HANDS_PROFILE,
  STEADY_PROFILE,
  BURSTY_PROFILE,
];

export function getDemandProfile(id: string): DemandProfile {
  return demandProfiles.find((profile) => profile.id === id) ?? STEADY_PROFILE;
}

export function lunchFloorForBuilding(floorCount: number): number {
  return Math.max(0, Math.min(floorCount - 1, Math.ceil(floorCount / 3) - 1));
}

function sampleRandomTrip(config: NormalizedRunConfig, rng: RandomSource): PassengerIntent {
  const origin = rng.integer(0, config.building.floorCount - 1);
  let destination = rng.integer(0, config.building.floorCount - 1);

  while (destination === origin) {
    destination = rng.integer(0, config.building.floorCount - 1);
  }

  return { origin, destination };
}

function sampleUpperFloor(config: NormalizedRunConfig, rng: RandomSource): number {
  const floors = Array.from({ length: config.building.floorCount - 1 }, (_, index) => index + 1);
  const weights = floors.map((floor) => 1 + floor / config.building.floorCount);
  return floors[rng.weightedIndex(weights)];
}

function sampleNonSpecialFloor(
  config: NormalizedRunConfig,
  rng: RandomSource,
  specialFloor: number,
): number {
  const floors = Array.from({ length: config.building.floorCount }, (_, floor) => floor).filter(
    (floor) => floor !== specialFloor,
  );

  if (floors.length === 0) {
    return specialFloor;
  }

  return rng.pick(floors);
}

function bell(
  progress: number,
  center: number,
  width: number,
  floor: number,
  amplitude: number,
): number {
  const exponent = -0.5 * Math.pow((progress - center) / width, 2);
  return floor + amplitude * Math.exp(exponent);
}

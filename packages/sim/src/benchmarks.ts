import { SimulationEngine } from './engine.js';
import type {
  BenchmarkOptions,
  BenchmarkRow,
  BenchmarkSummary,
  ElevatorAlgorithm,
  RunConfig,
  RunResult,
} from './types.js';

export function runSimulation(config: RunConfig, algorithm: ElevatorAlgorithm): RunResult {
  return new SimulationEngine(config, algorithm).runUntilComplete();
}

export function runBenchmark(options: BenchmarkOptions): {
  rows: BenchmarkRow[];
  summaries: BenchmarkSummary[];
} {
  const rows: BenchmarkRow[] = [];

  for (const algorithm of options.algorithms) {
    for (const seed of options.seeds) {
      const result = runSimulation(
        {
          ...options.config,
          id: `${algorithm.id}-${seed}`,
          traffic: {
            ...options.config.traffic,
            seed,
          },
        },
        algorithm,
      );

      rows.push({
        algorithmId: algorithm.id,
        algorithmName: algorithm.name,
        seed,
        served: result.metrics.served,
        averageWaitSeconds: result.metrics.averageWaitSeconds,
        p95WaitSeconds: result.metrics.p95WaitSeconds,
        averageJourneySeconds: result.metrics.averageJourneySeconds,
        throughputPerMinute: result.metrics.throughputPerMinute,
        energyEstimate: result.metrics.energyEstimate,
        timedOut: result.timedOut,
      });
    }
  }

  return {
    rows,
    summaries: summarizeBenchmarkRows(rows),
  };
}

export function summarizeBenchmarkRows(rows: readonly BenchmarkRow[]): BenchmarkSummary[] {
  const groups = new Map<string, BenchmarkRow[]>();

  for (const row of rows) {
    groups.set(row.algorithmId, [...(groups.get(row.algorithmId) ?? []), row]);
  }

  return [...groups.entries()]
    .map(([algorithmId, group]) => ({
      algorithmId,
      algorithmName: group[0].algorithmName,
      runs: group.length,
      served: average(group.map((row) => row.served)),
      averageWaitSeconds: average(group.map((row) => row.averageWaitSeconds)),
      p95WaitSeconds: average(group.map((row) => row.p95WaitSeconds)),
      averageJourneySeconds: average(group.map((row) => row.averageJourneySeconds)),
      throughputPerMinute: average(group.map((row) => row.throughputPerMinute)),
      energyEstimate: average(group.map((row) => row.energyEstimate)),
      timedOutRuns: group.filter((row) => row.timedOut).length,
    }))
    .sort((a, b) => {
      const timeoutPenalty = a.timedOutRuns - b.timedOutRuns;
      if (timeoutPenalty !== 0) {
        return timeoutPenalty;
      }
      return a.averageWaitSeconds - b.averageWaitSeconds;
    });
}

function average(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

import {
  algorithms,
  createDefaultRunConfig,
  demandProfiles,
  formatSeconds,
  runBenchmark,
} from './index.js';

const profileId = process.argv[2] ?? 'morning-rush';
const selectedProfile = demandProfiles.find((profile) => profile.id === profileId) ?? demandProfiles[0];
const config = createDefaultRunConfig({
  id: `cli-${selectedProfile.id}`,
  durationSeconds: Math.min(selectedProfile.recommendedDurationSeconds, 20 * 60),
  traffic: {
    profileId: selectedProfile.id,
    baseRatePerMinute: 12,
    seed: 2026,
  },
});
const { summaries } = runBenchmark({
  config,
  algorithms,
  seeds: [2026, 2027],
});

console.log(`LiftLab benchmark: ${selectedProfile.name}`);
console.log('Algorithm             Avg wait   P95 wait   Journey    Served/run   Energy   Timeouts');
console.log('------------------------------------------------------------------------------------');

for (const summary of summaries) {
  console.log(
    [
      summary.algorithmName.padEnd(21),
      formatSeconds(summary.averageWaitSeconds).padStart(8),
      formatSeconds(summary.p95WaitSeconds).padStart(9),
      formatSeconds(summary.averageJourneySeconds).padStart(8),
      summary.served.toFixed(0).padStart(10),
      summary.energyEstimate.toFixed(0).padStart(8),
      summary.timedOutRuns.toFixed(0).padStart(8),
    ].join('  '),
  );
}

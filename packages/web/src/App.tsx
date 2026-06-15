import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  algorithms,
  createDefaultRunConfig,
  demandProfiles,
  formatSeconds,
  runBenchmark,
  type BenchmarkSummary,
  type RunConfig,
  type RunSnapshot,
} from '@lift-lab/sim';
import { BuildingView } from './components/BuildingView.js';
import { BenchmarkChart, RunHistoryChart } from './components/Charts.js';
import { MetricsPanel } from './components/MetricsPanel.js';
import { RunClock } from './components/RunClock.js';
import { useLiveRun } from './lib/useLiveRun.js';

const MIN_PLAYBACK_SPEED = 0.25;
const MAX_PLAYBACK_SPEED = 1024;
const SPEED_DIAL_STEPS = 160;
const DEFAULT_PLAYBACK_SPEED = 1;
const RUN_LOG_KEY = 'liftlab.runLog.v1';
const SETTINGS_KEY = 'liftlab.settings.v1';

interface SavedRun {
  id: string;
  savedAt: string;
  profileName: string;
  algorithmId?: string;
  algorithmName: string;
  mode: string;
  elapsedSeconds: number;
  metrics: RunSnapshot['metrics'];
  config: RunSnapshot['config'];
  history: RunSnapshot['history'];
}

interface LocalSettings {
  config: RunConfig;
  algorithmId: string;
  speed: number;
}

export default function App() {
  const initialSettings = useMemo(() => loadInitialSettings(), []);
  const [config, setConfig] = useState<RunConfig>(() => initialSettings.config);
  const [algorithmId, setAlgorithmId] = useState(initialSettings.algorithmId);
  const [speed, setSpeed] = useState(initialSettings.speed);
  const [benchmarkSummaries, setBenchmarkSummaries] = useState<BenchmarkSummary[]>([]);
  const [runLog, setRunLog] = useState<SavedRun[]>(() => loadRunLog());
  const autoSavedRunIds = useRef(new Set<string>());
  const liveRun = useLiveRun(config, algorithmId, speed);
  const selectedProfile = useMemo(
    () => demandProfiles.find((profile) => profile.id === config.traffic.profileId) ?? demandProfiles[0],
    [config.traffic.profileId],
  );
  const selectedAlgorithm = algorithms.find((algorithm) => algorithm.id === algorithmId) ?? algorithms[0];
  const lockStructuralControls =
    liveRun.status === 'running' ||
    liveRun.status === 'paused' ||
    (liveRun.snapshot.now > 0 && liveRun.snapshot.status !== 'complete');

  const updateConfig = (recipe: (current: RunConfig) => RunConfig) => {
    setConfig((current) => createDefaultRunConfig(recipe(current)));
    setBenchmarkSummaries([]);
  };

  useEffect(() => {
    persistLocalSettings({ config, algorithmId, speed });
  }, [algorithmId, config, speed]);

  const setProfile = (profileId: string) => {
    const profile = demandProfiles.find((candidate) => candidate.id === profileId) ?? demandProfiles[0];
    updateConfig((current) => ({
      ...current,
      durationSeconds: profile.recommendedDurationSeconds,
      traffic: {
        ...current.traffic,
        profileId,
      },
    }));
  };

  const runComparison = () => {
    const seeds = [config.traffic.seed, config.traffic.seed + 101];
    const result = runBenchmark({
      config: createDefaultRunConfig({
        ...config,
        mode: 'finite',
        durationSeconds: Math.min(config.durationSeconds, 20 * 60),
        timing: {
          ...config.timing,
          stepSeconds: Math.max(1, config.timing.stepSeconds),
          historyIntervalSeconds: Math.max(30, config.timing.historyIntervalSeconds),
        },
      }),
      algorithms,
      seeds,
    });
    setBenchmarkSummaries(result.summaries);
  };

  const createSavedRun = useCallback((snapshot: RunSnapshot): SavedRun => {
    const entry: SavedRun = {
      id: snapshot.id,
      savedAt: new Date().toISOString(),
      profileName: profileNameForConfig(snapshot.config),
      algorithmId: snapshot.algorithmId,
      algorithmName: snapshot.algorithmName || selectedAlgorithm.name,
      mode: snapshot.config.mode,
      elapsedSeconds: snapshot.now,
      metrics: snapshot.metrics,
      config: snapshot.config,
      history: snapshot.history,
    };
    return entry;
  }, [selectedAlgorithm.name]);

  const upsertRunLog = useCallback((entry: SavedRun) => {
    setRunLog((current) => {
      const next = [entry, ...current.filter((run) => run.id !== entry.id)].slice(0, 20);
      persistRunLog(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (liveRun.status !== 'complete' || liveRun.snapshot.status !== 'complete') {
      return;
    }
    if (autoSavedRunIds.current.has(liveRun.snapshot.id)) {
      return;
    }
    autoSavedRunIds.current.add(liveRun.snapshot.id);
    upsertRunLog(createSavedRun(liveRun.snapshot));
  }, [createSavedRun, liveRun.snapshot, liveRun.status, upsertRunLog]);

  const clearRunLog = () => {
    setRunLog([]);
    persistRunLog([]);
  };

  const exportRunLog = () => {
    const exportedAt = new Date().toISOString();
    downloadJson(`liftlab-run-log-${filenameTimestamp(exportedAt)}.json`, {
      exportedAt,
      activeRun: liveRun.snapshot,
      savedRuns: runLog,
    });
  };

  const playbackLabel =
    liveRun.status === 'running'
      ? 'Pause'
      : liveRun.status === 'paused'
        ? 'Resume'
        : liveRun.status === 'complete'
          ? 'Run complete'
          : 'Start';

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div>
          <h1>LiftLab</h1>
          <p>{selectedProfile.name} / {selectedAlgorithm.name}</p>
        </div>
        <div className={`status-pill ${liveRun.status}`}>{liveRun.status}</div>
      </header>

      <main className="workspace">
        <aside className="control-rail" aria-label="Run controls">
          <section className="control-section">
            <div className="section-title">Run</div>
            <label>
              Profile
              <select value={config.traffic.profileId} onChange={(event) => setProfile(event.target.value)}>
                {demandProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                  </option>
                ))}
              </select>
            </label>
            <p className="muted">{selectedProfile.summary}</p>
            <label>
              Algorithm
              <select
                value={algorithmId}
                onChange={(event) => setAlgorithmId(event.target.value)}
                disabled={lockStructuralControls}
              >
                {algorithms.map((algorithm) => (
                  <option key={algorithm.id} value={algorithm.id}>
                    {algorithm.name}
                  </option>
                ))}
              </select>
            </label>
            <p className="muted">{selectedAlgorithm.summary}</p>
            <div className="segmented">
              <button
                className={config.mode === 'finite' ? 'active' : ''}
                onClick={() => updateConfig((current) => ({ ...current, mode: 'finite' }))}
              >
                Finite
              </button>
              <button
                className={config.mode === 'continuous' ? 'active' : ''}
                onClick={() => updateConfig((current) => ({ ...current, mode: 'continuous' }))}
              >
                Continuous
              </button>
            </div>
          </section>

          <section className="control-section">
            <div className="section-title">Playback</div>
            <div className="button-row">
              <button
                className="primary"
                disabled={liveRun.status === 'complete'}
                onClick={() => {
                  if (liveRun.status === 'running') {
                    liveRun.pause();
                  } else {
                    liveRun.start();
                  }
                }}
              >
                {playbackLabel}
              </button>
              <button onClick={liveRun.reset}>Reset</button>
            </div>
            <label>
              Speed {formatPlaybackSpeed(speed)}
              <input
                type="range"
                min={0}
                max={SPEED_DIAL_STEPS}
                step={1}
                value={dialFromPlaybackSpeed(speed)}
                onChange={(event) => setSpeed(playbackSpeedFromDial(Number(event.target.value)))}
              />
            </label>
            <div className="button-grid">
              <button onClick={() => liveRun.fastForward(5 * 60)}>+5 min</button>
              <button onClick={() => liveRun.fastForward(15 * 60)}>+15 min</button>
              <button onClick={liveRun.finishRun}>Quick Finish</button>
              <button onClick={runComparison}>Benchmark</button>
            </div>
          </section>

          <section className="control-section">
            <div className="section-title">Traffic</div>
            <StepperNumberField
              label="Rate / min"
              value={config.traffic.baseRatePerMinute}
              min={0}
              max={160}
              step={1}
              onChange={(value) =>
                updateConfig((current) => ({
                  ...current,
                  traffic: { ...current.traffic, baseRatePerMinute: value },
                }))
              }
            />
            <StepperNumberField
              label="Duration min"
              value={Math.round(config.durationSeconds / 60)}
              min={1}
              max={180}
              step={5}
              onChange={(value) =>
                updateConfig((current) => ({
                  ...current,
                  durationSeconds: value * 60,
                }))
              }
            />
            <NumberField
              label="Seed"
              value={config.traffic.seed}
              min={1}
              max={999999}
              onChange={(value) =>
                updateConfig((current) => ({
                  ...current,
                  traffic: { ...current.traffic, seed: value },
                }))
              }
            />
          </section>

          <section className="control-section">
            <div className="section-title">Building</div>
            <NumberField
              label="Floors"
              value={config.building.floorCount}
              min={2}
              max={80}
              disabled={lockStructuralControls}
              onChange={(value) =>
                updateConfig((current) => ({
                  ...current,
                  building: { ...current.building, floorCount: value },
                }))
              }
            />
            <NumberField
              label="Elevators"
              value={config.building.elevatorCount}
              min={1}
              max={16}
              disabled={lockStructuralControls}
              onChange={(value) =>
                updateConfig((current) => ({
                  ...current,
                  building: { ...current.building, elevatorCount: value },
                }))
              }
            />
            <NumberField
              label="Capacity"
              value={config.building.capacity}
              min={2}
              max={40}
              disabled={lockStructuralControls}
              onChange={(value) =>
                updateConfig((current) => ({
                  ...current,
                  building: { ...current.building, capacity: value },
                }))
              }
            />
          </section>

          <section className="control-section">
            <div className="section-title">Timing</div>
            <p className="muted">Assumes 5m floors. Door timings include mechanical motion only.</p>
            <NumberField
              label="Car speed m/s"
              value={Number((timingFloorHeight(config) / config.timing.floorTravelSeconds).toFixed(1))}
              min={0.5}
              max={5}
              step={0.1}
              onChange={(value) =>
                updateConfig((current) => ({
                  ...current,
                  timing: {
                    ...current.timing,
                    floorTravelSeconds: timingFloorHeight(current) / Math.max(0.5, value),
                  },
                }))
              }
            />
            <NumberField
              label="Door open sec"
              value={config.timing.doorOpenSeconds}
              min={0.2}
              max={10}
              step={0.1}
              onChange={(value) =>
                updateConfig((current) => ({
                  ...current,
                  timing: { ...current.timing, doorOpenSeconds: value },
                }))
              }
            />
            <NumberField
              label="Door close sec"
              value={config.timing.doorCloseSeconds}
              min={0.2}
              max={10}
              step={0.1}
              onChange={(value) =>
                updateConfig((current) => ({
                  ...current,
                  timing: { ...current.timing, doorCloseSeconds: value },
                }))
              }
            />
            <NumberField
              label="Door hold sec"
              value={config.timing.doorHoldSeconds}
              min={0}
              max={20}
              step={0.5}
              onChange={(value) =>
                updateConfig((current) => ({
                  ...current,
                  timing: { ...current.timing, doorHoldSeconds: value },
                }))
              }
            />
          </section>
        </aside>

        <div className="main-column">
          <BuildingView snapshot={liveRun.snapshot} />
        </div>

        <aside className="insight-rail" aria-label="Run insights">
          <RunClock snapshot={liveRun.snapshot} />
          <MetricsPanel snapshot={liveRun.snapshot} />
          <RunHistoryChart history={liveRun.snapshot.history} />
          <RunLogPanel runs={runLog} onClear={clearRunLog} onExport={exportRunLog} />
          <BenchmarkChart summaries={benchmarkSummaries} />
          <section className="panel algorithm-panel">
            <div className="panel-heading">
              <h2>Algorithms</h2>
              <span>{algorithms.length}</span>
            </div>
            <div className="algorithm-list">
              {algorithms.map((algorithm) => (
                <button
                  key={algorithm.id}
                  className={algorithm.id === algorithmId ? 'active' : ''}
                  onClick={() => setAlgorithmId(algorithm.id)}
                >
                  <strong>{algorithm.name}</strong>
                  <span>{algorithm.category}</span>
                </button>
              ))}
            </div>
          </section>
          <section className="panel queue-panel">
            <div className="panel-heading">
              <h2>Queue</h2>
              <span>{formatSeconds(liveRun.snapshot.metrics.currentMaxWaitSeconds)}</span>
            </div>
            <div className="queue-list">
              {liveRun.snapshot.floorSummaries
                .filter((floor) => floor.waitingCount > 0)
                .sort((a, b) => b.oldestWaitSeconds - a.oldestWaitSeconds)
                .slice(0, 8)
                .map((floor) => (
                  <div key={floor.floor}>
                    <span>Floor {floor.floor + 1}</span>
                    <strong>{floor.waitingCount}</strong>
                  </div>
                ))}
              {liveRun.snapshot.metrics.waiting === 0 && <div className="empty-state">No waiting calls.</div>}
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}

function RunLogPanel({
  runs,
  onClear,
  onExport,
}: {
  runs: SavedRun[];
  onClear: () => void;
  onExport: () => void;
}) {
  return (
    <section className="panel run-log-panel" aria-label="Saved run history">
      <div className="panel-heading">
        <h2>Run Log</h2>
        <div className="panel-actions">
          <button className="text-button" onClick={onExport}>
            Export JSON
          </button>
          <button className="text-button" onClick={onClear} disabled={runs.length === 0}>
            Clear
          </button>
        </div>
      </div>
      {runs.length === 0 ? (
        <div className="empty-state">Completed runs save here automatically.</div>
      ) : (
        <div className="run-log-list">
          {runs.map((run) => (
            <div className="run-log-item" key={run.id}>
              <div>
                <strong>{run.algorithmName}</strong>
                <span>{run.profileName} / {new Date(run.savedAt).toLocaleTimeString()}</span>
              </div>
              <dl>
                <div>
                  <dt>Time</dt>
                  <dd>{formatSeconds(run.elapsedSeconds)}</dd>
                </div>
                <div>
                  <dt>Served</dt>
                  <dd>{run.metrics.served}</dd>
                </div>
                <div>
                  <dt>Avg wait</dt>
                  <dd>{formatSeconds(run.metrics.averageWaitSeconds)}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  disabled = false,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label>
      {label}
      <DraftNumberInput
        ariaLabel={label}
        disabled={disabled}
        max={max}
        min={min}
        onChange={onChange}
        step={step}
        value={value}
      />
    </label>
  );
}

function StepperNumberField({
  label,
  value,
  min,
  max,
  step = 1,
  disabled = false,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  const changeBy = (delta: number) => {
    onChange(roundForStep(clampNumber(value + delta, min, max), step));
  };

  return (
    <div className="stepper-field">
      <div className="stepper-label">{label}</div>
      <div className="stepper-control">
        <button
          aria-label={`Decrease ${label}`}
          disabled={disabled || value <= min}
          onClick={() => changeBy(-step)}
          type="button"
        >
          -
        </button>
        <DraftNumberInput
          ariaLabel={label}
          disabled={disabled}
          max={max}
          min={min}
          onChange={onChange}
          step={step}
          value={value}
        />
        <button
          aria-label={`Increase ${label}`}
          disabled={disabled || value >= max}
          onClick={() => changeBy(step)}
          type="button"
        >
          +
        </button>
      </div>
    </div>
  );
}

function DraftNumberInput({
  ariaLabel,
  value,
  min,
  max,
  step,
  disabled,
  onChange,
}: {
  ariaLabel: string;
  value: number;
  min: number;
  max: number;
  step: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState(() => formatNumberInput(value));

  useEffect(() => {
    setDraft(formatNumberInput(value));
  }, [value]);

  const restoreDraft = () => {
    setDraft(formatNumberInput(value));
  };

  const commitDraft = () => {
    const parsedValue = Number(draft);
    if (!Number.isFinite(parsedValue)) {
      restoreDraft();
      return;
    }

    const nextValue = roundForStep(clampNumber(parsedValue, min, max), step);
    setDraft(formatNumberInput(nextValue));
    if (nextValue !== value) {
      onChange(nextValue);
    }
  };

  return (
    <input
      aria-label={ariaLabel}
      disabled={disabled}
      max={max}
      min={min}
      onBlur={commitDraft}
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.currentTarget.blur();
        }
        if (event.key === 'Escape') {
          restoreDraft();
          event.currentTarget.blur();
        }
      }}
      step={step}
      type="number"
      value={draft}
    />
  );
}

function loadRunLog(): SavedRun[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(RUN_LOG_KEY);
    return raw ? (JSON.parse(raw) as SavedRun[]) : [];
  } catch {
    return [];
  }
}

function loadInitialSettings(): LocalSettings {
  const savedSettings = loadLocalSettings();
  if (savedSettings) {
    return savedSettings;
  }

  const latestRun = loadRunLog()[0];
  if (latestRun) {
    return {
      config: createDefaultRunConfig(latestRun.config),
      algorithmId: latestRun.algorithmId ?? 'greedy',
      speed: DEFAULT_PLAYBACK_SPEED,
    };
  }

  return {
    config: createDefaultRunConfig(),
    algorithmId: 'greedy',
    speed: DEFAULT_PLAYBACK_SPEED,
  };
}

function loadLocalSettings(): LocalSettings | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return undefined;
    }

    const parsed = JSON.parse(raw) as Partial<LocalSettings>;
    if (!parsed.config) {
      return undefined;
    }

    const savedAlgorithmId =
      parsed.algorithmId && algorithms.some((algorithm) => algorithm.id === parsed.algorithmId)
        ? parsed.algorithmId
        : 'greedy';

    return {
      config: createDefaultRunConfig(parsed.config),
      algorithmId: savedAlgorithmId,
      speed: clampPlaybackSpeed(parsed.speed ?? DEFAULT_PLAYBACK_SPEED),
    };
  } catch {
    return undefined;
  }
}

function playbackSpeedFromDial(value: number): number {
  const t = clampNumber(value, 0, SPEED_DIAL_STEPS) / SPEED_DIAL_STEPS;
  return MIN_PLAYBACK_SPEED * (MAX_PLAYBACK_SPEED / MIN_PLAYBACK_SPEED) ** t;
}

function dialFromPlaybackSpeed(speed: number): number {
  const clampedSpeed = clampPlaybackSpeed(speed);
  const ratio = Math.log(clampedSpeed / MIN_PLAYBACK_SPEED) / Math.log(MAX_PLAYBACK_SPEED / MIN_PLAYBACK_SPEED);
  return Math.round(clampNumber(ratio, 0, 1) * SPEED_DIAL_STEPS);
}

function clampPlaybackSpeed(speed: number): number {
  return Number.isFinite(speed)
    ? clampNumber(speed, MIN_PLAYBACK_SPEED, MAX_PLAYBACK_SPEED)
    : DEFAULT_PLAYBACK_SPEED;
}

function formatPlaybackSpeed(speed: number): string {
  const clampedSpeed = clampPlaybackSpeed(speed);
  if (clampedSpeed < 1) {
    return `${clampedSpeed.toFixed(2)}x`;
  }
  if (clampedSpeed < 10) {
    return `${clampedSpeed.toFixed(1).replace(/\.0$/, '')}x`;
  }
  if (clampedSpeed < 100) {
    return `${Math.round(clampedSpeed)}x`;
  }
  return `${Math.round(clampedSpeed)}x`;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function roundForStep(value: number, step: number): number {
  const decimals = Math.max(0, `${step}`.split('.')[1]?.length ?? 0);
  return Number(value.toFixed(Math.max(decimals, 4)));
}

function formatNumberInput(value: number): string {
  return Number.isFinite(value) ? `${value}` : '';
}

function persistLocalSettings(settings: LocalSettings): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function persistRunLog(runs: SavedRun[]): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(RUN_LOG_KEY, JSON.stringify(runs));
}

function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function filenameTimestamp(value: string): string {
  return value.replace(/[:.]/g, '-');
}

function timingFloorHeight(config: RunConfig): number {
  return config.timing.floorHeightMeters ?? 5;
}

function profileNameForConfig(config: RunConfig): string {
  return demandProfiles.find((profile) => profile.id === config.traffic.profileId)?.name ?? 'Custom profile';
}

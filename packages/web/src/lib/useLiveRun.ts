import { useCallback, useEffect, useRef, useState } from 'react';
import {
  SimulationEngine,
  createDefaultRunConfig,
  getAlgorithm,
  type RunConfig,
  type RunSnapshot,
} from '@lift-lab/sim';

export type PlaybackStatus = 'idle' | 'running' | 'paused' | 'complete';

export interface LiveRunControls {
  snapshot: RunSnapshot;
  status: PlaybackStatus;
  start: () => void;
  pause: () => void;
  reset: () => void;
  fastForward: (seconds: number) => void;
  finishRun: () => void;
}

export function useLiveRun(config: RunConfig, algorithmId: string, speed: number): LiveRunControls {
  const runSequenceRef = useRef(0);
  const engineRef = useRef(createEngine(config, algorithmId, runSequenceRef.current));
  const configRef = useRef(config);
  const algorithmIdRef = useRef(algorithmId);
  const speedRef = useRef(speed);
  const statusRef = useRef<PlaybackStatus>('idle');
  const [snapshot, setSnapshot] = useState<RunSnapshot>(() => engineRef.current.getSnapshot());
  const [status, setStatus] = useState<PlaybackStatus>('idle');

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const resetEngine = useCallback((nextConfig: RunConfig, nextAlgorithmId: string) => {
    runSequenceRef.current += 1;
    const engine = createEngine(nextConfig, nextAlgorithmId, runSequenceRef.current);
    engineRef.current = engine;
    configRef.current = nextConfig;
    algorithmIdRef.current = nextAlgorithmId;
    setSnapshot(engine.getSnapshot());
    setStatus('idle');
  }, []);

  useEffect(() => {
    const previousConfig = configRef.current;
    const algorithmChanged = algorithmIdRef.current !== algorithmId;
    const buildingChanged = !sameBuilding(previousConfig.building, config.building);
    const shouldReset = algorithmChanged || buildingChanged || statusRef.current === 'complete';

    if (shouldReset) {
      resetEngine(config, algorithmId);
      return;
    }

    configRef.current = config;
    const nextSnapshot = engineRef.current.updateConfig(createDefaultRunConfig(config));
    setSnapshot(nextSnapshot);
  }, [algorithmId, config, resetEngine]);

  useEffect(() => {
    if (status !== 'running') {
      return undefined;
    }

    let frameId = 0;
    let previousTime = performance.now();

    const frame = (time: number) => {
      const realSeconds = Math.min(0.25, (time - previousTime) / 1000);
      previousTime = time;
      const engine = engineRef.current;
      const nextSnapshot = engine.advance(realSeconds * speedRef.current, 20_000);
      setSnapshot(nextSnapshot);

      if (nextSnapshot.status === 'complete') {
        setStatus('complete');
        return;
      }

      frameId = requestAnimationFrame(frame);
    };

    frameId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(frameId);
  }, [status]);

  const start = useCallback(() => {
    setStatus('running');
  }, []);

  const pause = useCallback(() => {
    setStatus((current) => (current === 'running' ? 'paused' : current));
  }, []);

  const reset = useCallback(() => {
    resetEngine(configRef.current, algorithmIdRef.current);
  }, [resetEngine]);

  const fastForward = useCallback((seconds: number) => {
    const nextSnapshot = engineRef.current.advance(seconds);
    setSnapshot(nextSnapshot);
    if (nextSnapshot.status === 'complete') {
      setStatus('complete');
    }
  }, []);

  const finishRun = useCallback(() => {
    const result = engineRef.current.runUntilComplete();
    const nextSnapshot = engineRef.current.getSnapshot();
    setSnapshot({
      ...nextSnapshot,
      metrics: result.metrics,
      history: result.history,
    });
    setStatus('complete');
  }, []);

  return {
    snapshot,
    status,
    start,
    pause,
    reset,
    fastForward,
    finishRun,
  };
}

function createEngine(config: RunConfig, algorithmId: string, runSequence: number): SimulationEngine {
  const baseId = config.id ?? `run-${config.traffic.seed}`;
  return new SimulationEngine(
    createDefaultRunConfig({
      ...config,
      id: `${baseId}-${Date.now().toString(36)}-${runSequence}`,
    }),
    getAlgorithm(algorithmId),
  );
}

function sameBuilding(a: RunConfig['building'], b: RunConfig['building']): boolean {
  return (
    a.floorCount === b.floorCount &&
    a.elevatorCount === b.elevatorCount &&
    a.capacity === b.capacity
  );
}

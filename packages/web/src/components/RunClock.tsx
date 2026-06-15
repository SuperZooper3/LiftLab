import type { CSSProperties } from 'react';
import { formatSeconds, type RunSnapshot } from '@lift-lab/sim';

interface RunClockProps {
  snapshot: RunSnapshot;
}

export function RunClock({ snapshot }: RunClockProps) {
  const { config, metrics, now } = snapshot;
  const trafficProgress =
    config.mode === 'continuous' ? 0 : Math.min(1, now / Math.max(1, config.durationSeconds));
  const active = config.mode === 'continuous' || now < config.durationSeconds;
  const remainingTraffic = Math.max(0, config.durationSeconds - now);
  const phase = config.mode === 'continuous' ? 'Continuous demand' : active ? 'Rush active' : 'Draining queues';
  const servedRatio =
    metrics.generated === 0 ? 0 : Math.min(1, metrics.served / Math.max(1, metrics.generated));

  return (
    <section className="panel clock-panel" aria-label="Run clock">
      <div className="panel-heading">
        <h2>Clock</h2>
        <span>{phase}</span>
      </div>
      <div className="clock-body">
        <div
          className="run-dial"
          style={{ '--progress': `${trafficProgress * 360}deg` } as CSSProperties}
        >
          <div>
            <strong>{formatSeconds(now)}</strong>
            <span>elapsed</span>
          </div>
        </div>
        <div className="phase-readout">
          <div>
            <span>Total sim time</span>
            <strong>{formatSeconds(now)}</strong>
          </div>
          <div>
            <span>Arrivals left</span>
            <strong>
              {config.mode === 'continuous'
                ? 'continuous'
                : active
                  ? formatSeconds(remainingTraffic)
                  : '0s'}
            </strong>
          </div>
        </div>
      </div>
      <div className="phase-bars">
        <div>
          <span>Arrival period</span>
          <i><b style={{ width: `${config.mode === 'continuous' ? 100 : trafficProgress * 100}%` }} /></i>
        </div>
        <div>
          <span>Served</span>
          <i><b style={{ width: `${servedRatio * 100}%` }} /></i>
        </div>
      </div>
    </section>
  );
}

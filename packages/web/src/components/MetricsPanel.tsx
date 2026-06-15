import { formatNumber, formatSeconds, type RunSnapshot } from '@lift-lab/sim';

interface MetricsPanelProps {
  snapshot: RunSnapshot;
}

export function MetricsPanel({ snapshot }: MetricsPanelProps) {
  const { metrics } = snapshot;
  const activeLoad = snapshot.elevators.reduce(
    (total, elevator) => total + elevator.passengers.length,
    0,
  );

  return (
    <section className="panel metrics-panel" aria-label="Run metrics">
      <div className="panel-heading">
        <h2>Metrics</h2>
        <span>{formatSeconds(snapshot.now)}</span>
      </div>
      <div className="metric-grid">
        <Metric label="Avg wait" value={formatSeconds(metrics.averageWaitSeconds)} />
        <Metric label="P95 wait" value={formatSeconds(metrics.p95WaitSeconds)} />
        <Metric label="Oldest wait" value={formatSeconds(metrics.currentMaxWaitSeconds)} />
        <Metric label="Served" value={formatNumber(metrics.served, 0)} />
        <Metric label="Waiting" value={formatNumber(metrics.waiting, 0)} />
        <Metric label="Riding" value={formatNumber(activeLoad, 0)} />
        <Metric label="Throughput" value={`${metrics.throughputPerMinute.toFixed(1)}/m`} />
        <Metric label="Energy" value={formatNumber(metrics.energyEstimate, 0)} />
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

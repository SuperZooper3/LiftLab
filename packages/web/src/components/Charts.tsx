import type { BenchmarkSummary, HistoryPoint } from '@lift-lab/sim';

interface LineChartProps {
  history: HistoryPoint[];
}

interface BenchmarkChartProps {
  summaries: BenchmarkSummary[];
}

const CHART_WIDTH = 680;
const CHART_HEIGHT = 220;
const PADDING = 28;

export function RunHistoryChart({ history }: LineChartProps) {
  const data = history.length > 1 ? history : [];
  const maxTime = Math.max(1, ...data.map((point) => point.time));
  const maxValue = Math.max(
    10,
    ...data.flatMap((point) => [
      point.averageWaitSeconds,
      point.p95WaitSeconds,
      point.currentMaxWaitSeconds,
    ]),
  );

  return (
    <section className="panel chart-panel" aria-label="Run history">
      <div className="panel-heading">
        <h2>Run History</h2>
        <span>{data.length} samples</span>
      </div>
      <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} role="img" className="line-chart">
        <Grid maxValue={maxValue} />
        <Path
          points={data}
          maxTime={maxTime}
          maxValue={maxValue}
          getValue={(point) => point.averageWaitSeconds}
          color="#147d64"
        />
        <Path
          points={data}
          maxTime={maxTime}
          maxValue={maxValue}
          getValue={(point) => point.p95WaitSeconds}
          color="#b45309"
        />
        <Path
          points={data}
          maxTime={maxTime}
          maxValue={maxValue}
          getValue={(point) => point.currentMaxWaitSeconds}
          color="#b91c1c"
        />
      </svg>
      <div className="legend">
        <span><i style={{ background: '#147d64' }} />Avg wait</span>
        <span><i style={{ background: '#b45309' }} />P95 wait</span>
        <span><i style={{ background: '#b91c1c' }} />Oldest waiting</span>
      </div>
    </section>
  );
}

export function BenchmarkChart({ summaries }: BenchmarkChartProps) {
  const maxWait = Math.max(10, ...summaries.map((summary) => summary.averageWaitSeconds));

  return (
    <section className="panel benchmark-panel" aria-label="Benchmark comparison">
      <div className="panel-heading">
        <h2>Benchmark</h2>
        <span>{summaries.length > 0 ? `${summaries[0].runs} seeds` : 'not run'}</span>
      </div>
      {summaries.length === 0 ? (
        <div className="empty-state">Run a comparison to rank every algorithm on this profile.</div>
      ) : (
        <div className="bars">
          {summaries.map((summary) => (
            <div className="bar-row" key={summary.algorithmId}>
              <div className="bar-label">{summary.algorithmName}</div>
              <div className="bar-track">
                <span
                  className="bar-fill"
                  style={{ width: `${Math.max(4, (summary.averageWaitSeconds / maxWait) * 100)}%` }}
                />
              </div>
              <div className="bar-value">{summary.averageWaitSeconds.toFixed(1)}s</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Grid({ maxValue }: { maxValue: number }) {
  return (
    <>
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const y = PADDING + (1 - ratio) * (CHART_HEIGHT - PADDING * 2);
        return (
          <g key={ratio}>
            <line x1={PADDING} x2={CHART_WIDTH - PADDING} y1={y} y2={y} className="grid-line" />
            <text x={4} y={y + 4} className="axis-text">
              {(maxValue * ratio).toFixed(0)}
            </text>
          </g>
        );
      })}
    </>
  );
}

function Path({
  points,
  maxTime,
  maxValue,
  getValue,
  color,
}: {
  points: HistoryPoint[];
  maxTime: number;
  maxValue: number;
  getValue: (point: HistoryPoint) => number;
  color: string;
}) {
  if (points.length < 2) {
    return null;
  }

  const d = points
    .map((point, index) => {
      const x = PADDING + (point.time / maxTime) * (CHART_WIDTH - PADDING * 2);
      const y =
        CHART_HEIGHT -
        PADDING -
        (Math.max(0, getValue(point)) / maxValue) * (CHART_HEIGHT - PADDING * 2);
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');

  return <path d={d} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />;
}

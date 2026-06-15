import type { CSSProperties } from 'react';
import { formatSeconds, lunchFloorForBuilding, type Passenger, type RunSnapshot } from '@lift-lab/sim';

interface BuildingViewProps {
  snapshot: RunSnapshot;
}

export function BuildingView({ snapshot }: BuildingViewProps) {
  const { config, elevators, floorSummaries, waitingPassengers } = snapshot;
  const floors = Array.from({ length: config.building.floorCount }, (_, index) => index).reverse();
  const carHeight = Math.max(9.8, Math.min(15, 170 / config.building.floorCount));
  const personBubbleSize = config.building.floorCount > 30 ? 20 : config.building.floorCount > 22 ? 24 : 30;
  const riderBubbleSize = Math.max(22, personBubbleSize - 4);
  const personBubbleFont = config.building.floorCount > 30 ? '0.62rem' : config.building.floorCount > 22 ? '0.72rem' : '0.84rem';
  const riderBubbleFont = config.building.floorCount > 30 ? '0.58rem' : config.building.floorCount > 22 ? '0.68rem' : '0.76rem';
  const waitingLimit = config.building.floorCount > 32 ? 3 : config.building.floorCount > 22 ? 4 : 5;
  const riderLimit = config.building.capacity > 12 ? 7 : config.building.capacity > 8 ? 6 : 5;
  const waitingByFloor = groupWaitingPassengers(waitingPassengers);
  const lunchFloor = config.traffic.profileId === 'lunch-rush'
    ? lunchFloorForBuilding(config.building.floorCount)
    : undefined;

  return (
    <section className="panel building-panel" aria-label="Building visualization">
      <div className="panel-heading">
        <h2>Building</h2>
        <div className="building-heading-meta">
          <span>{config.building.floorCount} floors / {config.building.elevatorCount} elevators</span>
          <div className="bubble-legend" aria-label="Passenger color legend">
            <strong>Destination</strong>
            <span>low</span>
            <i className="destination-gradient" />
            <span>high</span>
          </div>
        </div>
      </div>
      <div
        className="building-grid"
        style={
          {
            '--floor-count': config.building.floorCount,
            '--elevator-count': config.building.elevatorCount,
            '--person-bubble-size': `${personBubbleSize}px`,
            '--rider-bubble-size': `${riderBubbleSize}px`,
            '--person-bubble-font': personBubbleFont,
            '--rider-bubble-font': riderBubbleFont,
          } as CSSProperties
        }
      >
        <div className="floor-axis">
          {floors.map((floor) => (
            <div className={`floor-label ${floor === lunchFloor ? 'lunch-floor' : ''}`} key={floor}>
              {shouldShowFloorLabel(floor, config.building.floorCount) || floor === lunchFloor
                ? floorLabel(floor)
                : ''}
              {floor === lunchFloor && <span>Lunch</span>}
            </div>
          ))}
        </div>
        <div className="shaft-field">
          {elevators.map((elevator) => {
            const bottom =
              config.building.floorCount <= 1
                ? 0
                : (elevator.position / (config.building.floorCount - 1)) * (100 - carHeight);
            return (
              <div className="shaft" key={elevator.id}>
                <div className="shaft-floor-lines" aria-hidden="true">
                  {floors.map((floor) => (
                    <span className={floor === lunchFloor ? 'lunch-floor-line' : ''} key={floor} />
                  ))}
                </div>
                <div
                  className={`elevator-car ${elevator.doorState} ${elevator.direction}`}
                  style={{ bottom: `${bottom}%`, height: `${carHeight}%` }}
                  title={elevatorStateTitle(elevator)}
                >
                  <div className="car-meta-row">
                    <strong>{elevator.id}</strong>
                    <span>{elevatorStateShortLabel(elevator)}</span>
                    <span>F{floorLabel(elevator.currentFloor)}</span>
                    <span>{elevator.passengers.length}</span>
                  </div>
                  <div className="rider-bubbles">
                    {elevator.passengers.slice(0, riderLimit).map((passenger) => (
                      <span
                        className="person-bubble rider"
                        key={passenger.id}
                        style={destinationStyle(passenger.destination, config.building.floorCount)}
                        title={`To floor ${floorLabel(passenger.destination)}`}
                      >
                        {floorLabel(passenger.destination)}
                      </span>
                    ))}
                    {elevator.passengers.length > riderLimit && (
                      <span className="person-bubble overflow">+{elevator.passengers.length - riderLimit}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="waiting-stack">
          {floors.map((floor) => {
            const summary = floorSummaries[floor];
            const passengers = waitingByFloor.get(floor) ?? [];
            const visiblePassengers = passengers.slice(0, waitingLimit);
            return (
              <div className={`waiting-floor ${floor === lunchFloor ? 'lunch-floor' : ''}`} key={floor}>
                {summary.waitingCount > 0 && (
                  <div className="waiting-cluster">
                    <div className="waiting-count">
                      <strong>{summary.waitingCount}</strong>
                      <span>{formatSeconds(summary.oldestWaitSeconds)}</span>
                    </div>
                    <div className="waiting-bubbles">
                      {visiblePassengers.map((passenger, index) => (
                        <span
                          className="person-bubble waiting"
                          key={passenger.id}
                          style={destinationStyle(passenger.destination, config.building.floorCount)}
                          title={`Queue ${index + 1}: floor ${floorLabel(floor)} to ${floorLabel(
                            passenger.destination,
                          )}`}
                        >
                          {floorLabel(passenger.destination)}
                        </span>
                      ))}
                      {passengers.length > waitingLimit && (
                        <span className="person-bubble overflow">+{passengers.length - waitingLimit}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function shouldShowFloorLabel(floor: number, floorCount: number): boolean {
  if (floor === 0 || floor === floorCount - 1) {
    return true;
  }
  if (floorCount <= 24) {
    return true;
  }
  return floor % 5 === 0;
}

function floorLabel(floor: number): string {
  return `${floor + 1}`;
}

function groupWaitingPassengers(passengers: readonly Passenger[]): Map<number, Passenger[]> {
  const grouped = new Map<number, Passenger[]>();

  for (const passenger of passengers) {
    const floorPassengers = grouped.get(passenger.origin) ?? [];
    floorPassengers.push(passenger);
    grouped.set(passenger.origin, floorPassengers);
  }

  for (const floorPassengers of grouped.values()) {
    floorPassengers.sort((a, b) => a.requestTime - b.requestTime);
  }

  return grouped;
}

function destinationStyle(floor: number, floorCount: number): CSSProperties {
  const ratio = floor / Math.max(1, floorCount - 1);
  const hue = 205 - ratio * 165;
  return {
    background: `hsl(${hue} 86% 78%)`,
    borderColor: `hsl(${hue} 78% 40%)`,
  };
}

function elevatorStateLabel(elevator: RunSnapshot['elevators'][number]): string {
  if (elevator.doorState === 'opening') {
    return 'Open';
  }
  if (elevator.doorState === 'open') {
    return elevator.passengers.length > 0 ? 'Board' : 'Load';
  }
  if (elevator.doorState === 'closing') {
    return 'Close';
  }
  if (elevator.direction === 'up') {
    return 'Up';
  }
  if (elevator.direction === 'down') {
    return 'Down';
  }
  return elevator.targetQueue.length > 0 ? 'Queue' : 'Wait';
}

function elevatorStateShortLabel(elevator: RunSnapshot['elevators'][number]): string {
  if (elevator.doorState === 'opening') {
    return 'Op';
  }
  if (elevator.doorState === 'open') {
    return elevator.passengers.length > 0 ? 'Ld' : 'Op';
  }
  if (elevator.doorState === 'closing') {
    return 'Cl';
  }
  if (elevator.direction === 'up') {
    return 'Up';
  }
  if (elevator.direction === 'down') {
    return 'Dn';
  }
  return elevator.targetQueue.length > 0 ? 'Q' : 'Wait';
}

function elevatorStateTitle(elevator: RunSnapshot['elevators'][number]): string {
  const nextTarget =
    elevator.targetQueue[0] === undefined ? 'no queued stop' : `next floor ${floorLabel(elevator.targetQueue[0])}`;
  return `${elevator.id}: ${elevatorStateLabel(elevator)}, ${elevator.passengers.length}/${elevator.capacity} riders, ${nextTarget}`;
}

/**
 * React Hook for Simulation Engine Integration
 * 
 * Provides a clean React interface to the SimulationEngine class with:
 * - Automatic state synchronization between engine and React
 * - Proper lifecycle management (initialization and cleanup)
 * - Live configuration updates
 * - Simple control interface for UI components
 * 
 * @example
 * ```tsx
 * function SimulationComponent() {
 *   const simulation = useSimulationEngine({
 *     floors: 10,
 *     elevators: 3,
 *     spawnRate: 5.0
 *   });
 * 
 *   return (
 *     <div>
 *       <button onClick={simulation.start}>Start</button>
 *       <div>Status: {simulation.status}</div>
 *     </div>
 *   );
 * }
 * ```
 */

import { useRef, useState, useEffect } from 'react';
import { SimulationEngine, SimulationConfig, SimulationState } from '../engine/SimulationEngine';
import { SimulationStatus } from '@lift-lab/sim';

/**
 * Hook for integrating SimulationEngine with React components
 * @param config - Simulation configuration parameters
 * @returns Simulation state and control interface
 */
export function useSimulationEngine(config: SimulationConfig) {
  const engineRef = useRef<SimulationEngine | null>(null);
  const [state, setState] = useState<SimulationState>({
    status: SimulationStatus.IDLE,
    elevators: [],
    waitingPassengers: [],
    metrics: {
      avgWaitTime: 0,
      avgTravelTime: 0,
      passengersServed: 0,
      totalPassengers: 0,
    }
  });

  // Initialize engine once
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new SimulationEngine(config);
      engineRef.current.onStateChange = () => {
        if (engineRef.current) {
          setState(engineRef.current.getState());
        }
      };
      setState(engineRef.current.getState());
    }
    return () => engineRef.current?.reset();
  }, []);

  // Update config when it changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateConfig(config);
    }
  }, [config]);

  // Return simple interface
  return {
    // State
    status: state.status,
    elevators: state.elevators,
    waitingPassengers: state.waitingPassengers,
    metrics: state.metrics,
    
    // Controls
    start: () => engineRef.current?.start(),
    pause: () => engineRef.current?.pause(),
    resume: () => engineRef.current?.resume(),
    reset: () => engineRef.current?.reset(),
    setSpeed: (multiplier: number) => engineRef.current?.setSpeed(multiplier),
  };
}

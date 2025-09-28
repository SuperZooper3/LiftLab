/**
 * useSimulationEngine - Clean React integration with SimulationEngine
 * Simple wrapper that provides React state updates when engine state changes
 */

import { useRef, useState, useEffect } from 'react';
import { SimulationEngine, SimulationConfig, SimulationState } from '../engine/SimulationEngine';
import { SimulationStatus } from '@lift-lab/sim';

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

  // Initialize engine
  useEffect(() => {
    engineRef.current = new SimulationEngine(config);
    
    // Set up state change callback
    engineRef.current.onStateChange = () => {
      if (engineRef.current) {
        setState(engineRef.current.getState());
      }
    };

    // Initial state
    setState(engineRef.current.getState());

    // Cleanup on unmount
    return () => {
      engineRef.current?.reset();
    };
  }, []); // Only run once on mount

  // Update config when it changes
  useEffect(() => {
    if (engineRef.current) {
      console.log('🔄 Config change detected in hook:', {
        floors: config.floors,
        elevators: config.elevators,
        spawnRate: config.spawnRate
      });
      engineRef.current.updateConfig(config);
      setState(engineRef.current.getState());
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

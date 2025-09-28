/**
 * useSimulationEngine - Clean React integration with SimulationEngine
 * Simple wrapper that provides React state updates when engine state changes
 */

import { useRef, useState, useEffect } from 'react';
import { SimulationEngine, SimulationConfig, SimulationState } from '../engine/SimulationEngine';
import { SimulationStatus } from '@lift-lab/sim';

export function useSimulationEngine(config: SimulationConfig) {
  console.log('🏗️ useSimulationEngine hook called with config:', config);
  const engineRef = useRef<SimulationEngine | null>(null);
  const isInitialized = useRef(false);
  const configRef = useRef<SimulationConfig>(config);
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

  // Initialize engine only once
  useEffect(() => {
    if (!engineRef.current) {
      console.log('🚀 Initializing new SimulationEngine with initial config:', configRef.current);
      engineRef.current = new SimulationEngine(configRef.current);
      
      // Set up state change callback
      engineRef.current.onStateChange = () => {
        if (engineRef.current) {
          setState(engineRef.current.getState());
        }
      };

      // Initial state
      setState(engineRef.current.getState());
      
      // Mark as initialized
      isInitialized.current = true;
    }

    // Cleanup on unmount
    return () => {
      engineRef.current?.reset();
    };
  }, []); // Only run once on mount

  // Update config when it changes (but not during initial setup)
  useEffect(() => {
    // Always update the config ref
    configRef.current = config;
    
    if (engineRef.current && isInitialized.current) {
      console.log('🔄 Config change detected in hook (post-initialization):', {
        floors: config.floors,
        elevators: config.elevators,
        spawnRate: config.spawnRate,
        engineStatus: engineRef.current.getState().status
      });
      
      engineRef.current.updateConfig(config);
      // Let the onStateChange callback handle state updates
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

/**
 * Global Application State Management
 * 
 * Manages UI state and configuration using Zustand for:
 * - Simulation configuration (floors, elevators, spawn rate)
 * - UI controls (speed, algorithm selection)
 * - Live metrics display
 * - Simulation status tracking
 */

import { create } from 'zustand';

/**
 * Configuration parameters for the simulation
 */
export interface SimulationConfig {
  /** Number of floors in the building (3-60) */
  floors: number;
  /** Number of elevators (1-8) */
  elevators: number;
  /** Passenger spawn rate in passengers per minute */
  spawnRate: number;
  /** Random seed for deterministic behavior */
  seed: number;
}


/**
 * Global application state interface
 */
export interface AppState {
  // Configuration
  config: SimulationConfig;
  setConfig: (config: Partial<SimulationConfig>) => void;
  resetConfig: () => void;

  speed: number; // multiplier: 0.25x to 4x
  setSpeed: (speed: number) => void;

  // Selected algorithm
  selectedAlgorithm: string;
  setSelectedAlgorithm: (algorithm: string) => void;
}

// Default configuration
const DEFAULT_CONFIG: SimulationConfig = {
  floors: 10,
  elevators: 3,
  spawnRate: 5.0, // 5 passengers per minute (middle of new range)
  seed: Date.now(),
};


// Create the store
export const useAppStore = create<AppState>((set, get) => ({
  // Configuration
  config: DEFAULT_CONFIG,
  setConfig: (newConfig) =>
    set((state) => ({
      config: { ...state.config, ...newConfig },
    })),
  resetConfig: () => set({ config: DEFAULT_CONFIG }),

  speed: 1.0,
  setSpeed: (speed) => set({ speed: Math.max(0.25, Math.min(4.0, speed)) }),

  // Algorithm selection
  selectedAlgorithm: 'greedy',
  setSelectedAlgorithm: (algorithm) => set({ selectedAlgorithm: algorithm }),
}));

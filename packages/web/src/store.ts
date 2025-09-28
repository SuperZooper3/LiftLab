import { create } from 'zustand';

// Simulation configuration
export interface SimulationConfig {
  floors: number;
  elevators: number;
  spawnRate: number; // passengers per minute
  seed: number;
}

// Simulation status
export type SimulationStatus = 'idle' | 'running' | 'paused' | 'completed';

// Global app state
export interface AppState {
  // Configuration
  config: SimulationConfig;
  setConfig: (config: Partial<SimulationConfig>) => void;
  resetConfig: () => void;

  // Simulation control
  status: SimulationStatus;
  setStatus: (status: SimulationStatus) => void;
  speed: number; // multiplier: 0.25x to 4x
  setSpeed: (speed: number) => void;

  // Selected algorithm
  selectedAlgorithm: string;
  setSelectedAlgorithm: (algorithm: string) => void;

  // Metrics (live during simulation)
  metrics: {
    avgWaitTime: number;
    avgTravelTime: number;
    totalPassengers: number;
    passengersServed: number;
  };
  updateMetrics: (metrics: Partial<AppState['metrics']>) => void;
  resetMetrics: () => void;
}

// Default configuration
const DEFAULT_CONFIG: SimulationConfig = {
  floors: 10,
  elevators: 3,
  spawnRate: 2.0, // 2 passengers per minute
  seed: Date.now(),
};

// Default metrics
const DEFAULT_METRICS = {
  avgWaitTime: 0,
  avgTravelTime: 0,
  totalPassengers: 0,
  passengersServed: 0,
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

  // Simulation control
  status: 'idle',
  setStatus: (status) => set({ status }),
  speed: 1.0,
  setSpeed: (speed) => set({ speed: Math.max(0.25, Math.min(4.0, speed)) }),

  // Algorithm selection
  selectedAlgorithm: 'greedy',
  setSelectedAlgorithm: (algorithm) => set({ selectedAlgorithm: algorithm }),

  // Metrics
  metrics: DEFAULT_METRICS,
  updateMetrics: (newMetrics) =>
    set((state) => ({
      metrics: { ...state.metrics, ...newMetrics },
    })),
  resetMetrics: () => set({ metrics: DEFAULT_METRICS }),
}));

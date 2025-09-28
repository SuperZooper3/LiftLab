import { useAppStore } from './store';
import { BuildingCanvas } from './components/BuildingCanvas';
import { useSimulationEngine } from './hooks/useSimulationEngine';
import { SimulationStatus } from '@lift-lab/sim';
import { useMemo } from 'react';

function App() {
  const { 
    config, 
    selectedAlgorithm, 
    speed,
    setConfig, 
    setSpeed
  } = useAppStore();
  
  // Use the clean simulation engine
  const simulation = useSimulationEngine(config);

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <header className="bg-cream-100/80 backdrop-blur-sm shadow-sm border-b border-cream-200">
        <div className="max-w-full mx-auto px-6">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-sage-800">LiftLab</h1>
              <span className="text-2xl">🎢</span>
            </div>
                    <div className="text-sm text-sage-600">
                      Status: <span className="font-medium capitalize text-sage-700">{simulation.status}</span>
                    </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex h-[calc(100vh-80px)]">
        {/* Left Sidebar - Controls & Metrics */}
        <aside className="w-80 bg-cream-100/60 border-r border-cream-200 p-6 overflow-y-auto">
          {/* Configuration Panel */}
          <div className="control-panel mb-6">
            <h2 className="text-lg font-semibold mb-4 text-sage-800">Configuration</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-sage-700 mb-2">
                  Floors (3-60)
                </label>
                <input
                  type="number"
                  min="3"
                  max="60"
                  value={config.floors}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (value >= 3 && value <= 60) {
                      setConfig({ floors: value });
                    }
                  }}
                  disabled={simulation.status === SimulationStatus.RUNNING}
                  className="w-full px-3 py-2 border border-cream-300 rounded-md text-sage-800 bg-white focus:outline-none focus:ring-2 focus:ring-sage-400 disabled:bg-cream-100 disabled:opacity-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-sage-700 mb-2">
                  Elevators (1-8)
                </label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={config.elevators}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (value >= 1 && value <= 8) {
                      setConfig({ elevators: value });
                    }
                  }}
                  disabled={simulation.status === SimulationStatus.RUNNING}
                  className="w-full px-3 py-2 border border-cream-300 rounded-md text-sage-800 bg-white focus:outline-none focus:ring-2 focus:ring-sage-400 disabled:bg-cream-100 disabled:opacity-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-sage-700 mb-2">
                  Algorithm
                </label>
                <select
                  value={selectedAlgorithm}
                  disabled={simulation.status === SimulationStatus.RUNNING}
                  className="w-full px-3 py-2 border border-cream-300 rounded-md text-sage-800 bg-white focus:outline-none focus:ring-2 focus:ring-sage-400 disabled:bg-cream-100 disabled:opacity-50"
                >
                  <option value="greedy">Greedy</option>
                </select>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-cream-300">
              <h3 className="text-sm font-medium text-sage-700 mb-3">Playback Controls</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => {
                    if (simulation.status === SimulationStatus.IDLE) {
                      simulation.start();
                    } else if (simulation.status === SimulationStatus.RUNNING) {
                      simulation.pause();
                    } else if (simulation.status === SimulationStatus.PAUSED) {
                      simulation.resume();
                    }
                  }}
                  className="w-full px-4 py-2 bg-sage-500 text-white rounded-md hover:bg-sage-600 disabled:opacity-50 transition-colors"
                >
                  {simulation.status === SimulationStatus.IDLE ? 'Start Simulation' : 
                   simulation.status === SimulationStatus.RUNNING ? 'Pause' : 'Resume'}
                </button>
                <button 
                  onClick={() => simulation.reset()}
                  className="w-full px-4 py-2 bg-lavender-500 text-white rounded-md hover:bg-lavender-600 transition-colors"
                >
                  Reset
                </button>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-sage-700 mb-2">
                  Speed: {speed}×
                </label>
                <input
                  type="range"
                  min="0.25"
                  max="4"
                  step="0.25"
                  value={speed}
                  onChange={(e) => {
                    const newSpeed = parseFloat(e.target.value);
                    setSpeed(newSpeed);
                    simulation.setSpeed(newSpeed);
                  }}
                  className="w-full h-2 bg-cream-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-sage-500 mt-1">
                  <span>0.25×</span>
                  <span>1×</span>
                  <span>4×</span>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-sage-700 mb-2">
                  Spawn Rate: {config.spawnRate.toFixed(1)}/min
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="50"
                  step="0.5"
                  value={config.spawnRate}
                  onChange={(e) => {
                    const newRate = parseFloat(e.target.value);
                    setConfig({ spawnRate: newRate });
                  }}
                  disabled={false}
                  className="w-full h-2 bg-cream-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-sage-500 mt-1">
                  <span>0.5/min</span>
                  <span>25/min</span>
                  <span>50/min</span>
                </div>
              </div>
            </div>
          </div>

          {/* Metrics Panel */}
          <div className="metrics-overlay">
            <h2 className="text-lg font-semibold mb-4 text-sage-800">Metrics</h2>
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-sage-600">Avg Wait Time</div>
                        <div className="text-xl font-semibold text-sage-800">
                          {simulation.metrics.avgWaitTime > 0 ? `${simulation.metrics.avgWaitTime.toFixed(1)}s` : '--'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-sage-600">Avg Travel Time</div>
                        <div className="text-xl font-semibold text-sage-800">
                          {simulation.metrics.avgTravelTime > 0 ? `${simulation.metrics.avgTravelTime.toFixed(1)}s` : '--'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-sage-600">Passengers Served</div>
                        <div className="text-xl font-semibold text-sage-800">{simulation.metrics.passengersServed}</div>
                      </div>
                      <div>
                        <div className="text-sm text-sage-600">Total Passengers</div>
                        <div className="text-xl font-semibold text-sage-800">{simulation.metrics.totalPassengers}</div>
                      </div>
                      <div>
                        <div className="text-sm text-sage-600">Waiting Now</div>
                        <div className="text-xl font-semibold text-sage-800">{simulation.waitingPassengers.length}</div>
                      </div>
                      <div>
                        <div className="text-sm text-sage-600">In Elevators</div>
                        <div className="text-xl font-semibold text-sage-800">
                          {simulation.elevators.reduce((total, elevator) => total + elevator.passengers.length, 0)}
                        </div>
                      </div>
                    </div>
          </div>
        </aside>

        {/* Main Visualization Area */}
        <div className="flex-1 p-6">
          <div className="bg-cream-100/40 backdrop-blur-sm rounded-lg shadow-lg border border-cream-200 h-full">
            <div className="p-6 h-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-sage-800">Building Visualization</h2>
                <span className="text-sm text-sage-600 font-medium">
                  {config.floors} Floors • {config.elevators} Elevators
                </span>
              </div>
                      <div className="h-[calc(100%-3rem)] relative">
                        <BuildingCanvas 
                          floors={config.floors} 
                          elevators={config.elevators}
                          elevatorStates={simulation.elevators}
                          waitingPassengers={simulation.waitingPassengers}
                        />
                <div className="absolute bottom-2 right-2 text-xs text-sage-500 bg-cream-100/80 px-2 py-1 rounded">
                  Scroll to zoom • Drag to pan
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

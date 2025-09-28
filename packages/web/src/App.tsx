import { useAppStore } from './store';
import { BuildingCanvas } from './components/BuildingCanvas';

function App() {
  const { config, status, selectedAlgorithm } = useAppStore();

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
              Status: <span className="font-medium capitalize text-sage-700">{status}</span>
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
                <label className="block text-sm font-medium text-sage-700 mb-1">
                  Floors
                </label>
                <div className="text-sm text-sage-600">{config.floors}</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-sage-700 mb-1">
                  Elevators
                </label>
                <div className="text-sm text-sage-600">{config.elevators}</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-sage-700 mb-1">
                  Algorithm
                </label>
                <div className="text-sm text-sage-600 capitalize">{selectedAlgorithm}</div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-cream-300">
              <h3 className="text-sm font-medium text-sage-700 mb-2">Controls</h3>
              <div className="space-y-2">
                <button 
                  className="w-full px-4 py-2 bg-sage-500 text-white rounded-md hover:bg-sage-600 disabled:opacity-50 transition-colors"
                  disabled={status === 'running'}
                >
                  Start Simulation
                </button>
                <button 
                  className="w-full px-4 py-2 bg-lavender-500 text-white rounded-md hover:bg-lavender-600 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Metrics Panel */}
          <div className="metrics-overlay">
            <h2 className="text-lg font-semibold mb-4 text-sage-800">Metrics</h2>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-sage-600">Avg Wait Time</div>
                <div className="text-xl font-semibold text-sage-800">--</div>
              </div>
              <div>
                <div className="text-sm text-sage-600">Avg Travel Time</div>
                <div className="text-xl font-semibold text-sage-800">--</div>
              </div>
              <div>
                <div className="text-sm text-sage-600">Passengers Served</div>
                <div className="text-xl font-semibold text-sage-800">0</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Visualization Area */}
        <div className="flex-1 p-6">
          <div className="bg-cream-100/40 backdrop-blur-sm rounded-lg shadow-lg border border-cream-200 h-full">
            <div className="p-6 h-full">
              <h2 className="text-lg font-semibold mb-4 text-sage-800">Building Visualization</h2>
              <div className="h-[calc(100%-3rem)]">
                <BuildingCanvas 
                  floors={config.floors} 
                  elevators={config.elevators}
                  width={800}
                  height={500}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

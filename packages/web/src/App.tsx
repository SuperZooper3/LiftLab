import { useAppStore } from './store';

function App() {
  const { config, status, selectedAlgorithm } = useAppStore();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">LiftLab</h1>
              <span className="text-2xl">🎢</span>
            </div>
            <div className="text-sm text-gray-500">
              Status: <span className="font-medium capitalize">{status}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Control Panel */}
          <div className="lg:col-span-1">
            <div className="control-panel">
              <h2 className="text-lg font-semibold mb-4">Configuration</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Floors
                  </label>
                  <div className="text-sm text-gray-600">{config.floors}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Elevators
                  </label>
                  <div className="text-sm text-gray-600">{config.elevators}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Algorithm
                  </label>
                  <div className="text-sm text-gray-600 capitalize">{selectedAlgorithm}</div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Controls</h3>
                <div className="space-y-2">
                  <button 
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    disabled={status === 'running'}
                  >
                    Start Simulation
                  </button>
                  <button 
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Visualization Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Building Visualization</h2>
              <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-2">🏢</div>
                  <div>Canvas renderer will be implemented here</div>
                  <div className="text-sm mt-2">
                    {config.floors} floors • {config.elevators} elevators
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Metrics Panel */}
          <div className="lg:col-span-1">
            <div className="metrics-overlay">
              <h2 className="text-lg font-semibold mb-4">Metrics</h2>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">Avg Wait Time</div>
                  <div className="text-xl font-semibold">--</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Avg Travel Time</div>
                  <div className="text-xl font-semibold">--</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Passengers Served</div>
                  <div className="text-xl font-semibold">0</div>
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

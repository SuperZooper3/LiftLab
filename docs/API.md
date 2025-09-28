# LiftLab API Reference 📚

> **Complete API documentation for LiftLab simulation engine and components**

## 🎯 **Overview**

LiftLab provides multiple APIs for different use cases:
- **Algorithm Development API** - For implementing elevator control strategies
- **Simulation Engine API** - For programmatic simulation control
- **React Integration API** - For building custom UIs
- **CLI API** - For automated testing and scripting

---

## 🧠 **Algorithm Development API**

### **Core Interface**

#### `ElevatorAlgorithm`
The main interface that all elevator algorithms must implement.

```typescript
interface ElevatorAlgorithm {
  /** Human-readable algorithm name */
  name: string;
  
  /** Brief description of the algorithm strategy */
  description: string;
  
  /** 
   * Called every simulation tick to generate elevator commands
   * @param elevators - Current state of all elevators
   * @param waitingPassengers - Passengers waiting for pickup
   * @param currentTime - Current simulation time in seconds
   * @returns Array of commands to execute
   */
  onTick(
    elevators: Elevator[],
    waitingPassengers: Passenger[],
    currentTime: number
  ): ElevatorCommand[];
}
```

### **Data Structures**

#### `Elevator`
Complete state information for a single elevator.

```typescript
interface Elevator {
  /** Unique identifier (e.g., "elevator_0") */
  id: string;
  
  /** Current floor number (0-based, 0 = ground floor) */
  currentFloor: number;
  
  /** Current movement direction */
  direction: Direction;
  
  /** Current door state */
  doorState: DoorState;
  
  /** Passengers currently inside the elevator */
  passengers: Passenger[];
  
  /** Maximum passenger capacity */
  capacity: number;
  
  /** Set of floors this elevator needs to visit */
  targetFloors: Set<number>;
}
```

#### `Passenger`
Information about a passenger in the system.

```typescript
interface Passenger {
  /** Unique identifier */
  id: string;
  
  /** Floor where passenger is waiting/started */
  startFloor: number;
  
  /** Floor where passenger wants to go */
  destinationFloor: number;
  
  /** Simulation time when passenger made request */
  requestTime: number;
  
  /** Time when passenger was picked up (if applicable) */
  pickupTime?: number;
  
  /** Time when passenger was dropped off (if applicable) */
  dropoffTime?: number;
}
```

#### `ElevatorCommand`
Command to control an elevator's behavior.

```typescript
interface ElevatorCommand {
  /** ID of elevator to command */
  elevatorId: string;
  
  /** Action for elevator to perform */
  action: ElevatorAction;
}
```

### **Enums**

#### `Direction`
```typescript
enum Direction {
  UP = 'up',
  DOWN = 'down',
  IDLE = 'idle'
}
```

#### `DoorState`
```typescript
enum DoorState {
  OPEN = 'open',
  CLOSED = 'closed',
  OPENING = 'opening',
  CLOSING = 'closing'
}
```

#### `ElevatorAction`
```typescript
enum ElevatorAction {
  MOVE_UP = 'moveUp',
  MOVE_DOWN = 'moveDown',
  OPEN_DOORS = 'openDoors',
  CLOSE_DOORS = 'closeDoors',
  WAIT = 'wait'
}
```

### **Utility Functions**

#### `isElevatorFull(elevator: Elevator): boolean`
Check if elevator is at capacity.

#### `getDistance(floor1: number, floor2: number): number`
Calculate distance between floors.

#### `findNearestFloor(currentFloor: number, targetFloors: number[]): number | null`
Find closest floor from a list of targets.

---

## 🎮 **Simulation Engine API**

### **SimulationEngine Class**

#### Constructor
```typescript
constructor(config: SimulationConfig)
```

#### Configuration
```typescript
interface SimulationConfig {
  /** Number of floors in building (3-60) */
  floors: number;
  
  /** Number of elevators (1-8) */
  elevators: number;
  
  /** Passenger spawn rate (passengers per minute) */
  spawnRate: number;
}
```

#### Methods

##### `start(): void`
Start or resume the simulation.

##### `pause(): void`
Pause the simulation while preserving state.

##### `resume(): void`
Resume a paused simulation.

##### `reset(): void`
Stop simulation and reset to initial state.

##### `setSpeed(multiplier: number): void`
Adjust simulation speed (0.25x to 4x).

##### `updateConfig(config: Partial<SimulationConfig>): void`
Update configuration during simulation.

##### `getState(): SimulationState`
Get current complete simulation state.

#### State Structure
```typescript
interface SimulationState {
  /** Current simulation status */
  status: SimulationStatus;
  
  /** Current state of all elevators */
  elevators: Elevator[];
  
  /** Passengers currently waiting */
  waitingPassengers: Passenger[];
  
  /** Performance metrics */
  metrics: SimulationMetrics;
}
```

#### Metrics
```typescript
interface SimulationMetrics {
  /** Average time passengers wait for pickup */
  avgWaitTime: number;
  
  /** Average time from pickup to destination */
  avgTravelTime: number;
  
  /** Total passengers who completed their journey */
  passengersServed: number;
  
  /** Total passengers in system (waiting + traveling) */
  totalPassengers: number;
}
```

---

## ⚛️ **React Integration API**

### **useSimulationEngine Hook**

#### Usage
```typescript
import { useSimulationEngine } from '@lift-lab/web';

function MyComponent() {
  const simulation = useSimulationEngine({
    floors: 10,
    elevators: 3,
    spawnRate: 5.0
  });
  
  return (
    <div>
      <button onClick={simulation.start}>Start</button>
      <div>Status: {simulation.status}</div>
      <div>Passengers: {simulation.waitingPassengers.length}</div>
    </div>
  );
}
```

#### Return Value
```typescript
interface SimulationHookResult {
  // State
  status: SimulationStatus;
  elevators: Elevator[];
  waitingPassengers: Passenger[];
  metrics: SimulationMetrics;
  
  // Controls
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  setSpeed: (multiplier: number) => void;
}
```

### **BuildingCanvas Component**

#### Props
```typescript
interface BuildingCanvasProps {
  /** Number of floors */
  floors: number;
  
  /** Number of elevators */
  elevators: number;
  
  /** Current elevator states for animation */
  elevatorStates?: Elevator[];
  
  /** Waiting passengers to display */
  waitingPassengers?: Passenger[];
}
```

#### Usage
```typescript
<BuildingCanvas
  floors={config.floors}
  elevators={config.elevators}
  elevatorStates={simulation.elevators}
  waitingPassengers={simulation.waitingPassengers}
/>
```

---

## 🖥️ **CLI API**

### **Commands**

#### Test Command
```bash
npm run cli test [options]
```

**Options:**
- `--algorithm <name>` - Algorithm to test (default: greedy)
- `--floors <number>` - Number of floors (default: 10)
- `--elevators <number>` - Number of elevators (default: 3)
- `--duration <seconds>` - Test duration (default: 60)

#### Simulate Command
```bash
npm run cli simulate [options]
```

**Options:**
- `--config <file>` - Configuration file path
- `--output <file>` - Results output file
- `--verbose` - Detailed logging

#### Benchmark Command
```bash
npm run cli benchmark [options]
```

**Options:**
- `--algorithms <list>` - Comma-separated algorithm names
- `--scenarios <file>` - Test scenarios configuration
- `--iterations <number>` - Number of test runs per scenario

### **Configuration Files**

#### Simulation Config
```json
{
  "building": {
    "floors": 20,
    "elevators": 4
  },
  "simulation": {
    "duration": 300,
    "spawnRate": 8.0,
    "seed": 12345
  },
  "algorithm": {
    "name": "greedy",
    "parameters": {}
  }
}
```

#### Benchmark Scenarios
```json
{
  "scenarios": [
    {
      "name": "Rush Hour",
      "floors": 30,
      "elevators": 6,
      "spawnRate": 20.0,
      "duration": 600
    },
    {
      "name": "Low Traffic",
      "floors": 15,
      "elevators": 2,
      "spawnRate": 2.0,
      "duration": 300
    }
  ]
}
```

---

## 🔧 **Advanced APIs**

### **Custom Passenger Spawning**

#### PassengerSpawner Configuration
```typescript
interface SpawnerConfig {
  floorCount: number;
  spawnRate: number;
  rng: SeededRNG;
  
  // Optional advanced settings
  minSpawnInterval?: number;
  maxWaitingPerFloor?: number;
  groundFloorWeight?: number;
  topFloorWeight?: number;
}
```

#### Spawn Patterns
```typescript
enum SpawnPattern {
  UNIFORM = 'uniform',
  MORNING_RUSH = 'morning_rush',
  EVENING_RUSH = 'evening_rush',
  LUNCH_RUSH = 'lunch_rush',
  CUSTOM = 'custom'
}
```

### **Deterministic Random Number Generation**

#### SeededRNG Interface
```typescript
interface SeededRNG {
  /** Generate random float between 0 and 1 */
  nextFloat(): number;
  
  /** Generate random integer between min and max (inclusive) */
  nextInt(min: number, max: number): number;
  
  /** Get current seed value */
  getSeed(): number;
}
```

#### Creating RNG
```typescript
import { createSeededRNG } from '@lift-lab/sim';

const rng = createSeededRNG(12345);
const randomValue = rng.nextFloat();
```

### **Performance Monitoring**

#### Metrics Collection
```typescript
interface PerformanceMetrics {
  // Timing
  simulationFPS: number;
  renderFPS: number;
  
  // Memory
  memoryUsage: number;
  objectCount: number;
  
  // Simulation
  tickDuration: number;
  algorithmDuration: number;
}
```

---

## 🚨 **Error Handling**

### **Common Errors**

#### `InvalidConfigurationError`
Thrown when simulation configuration is invalid.

```typescript
try {
  const engine = new SimulationEngine({
    floors: 0, // Invalid!
    elevators: 3,
    spawnRate: 5.0
  });
} catch (error) {
  if (error instanceof InvalidConfigurationError) {
    console.error('Configuration error:', error.message);
  }
}
```

#### `AlgorithmError`
Thrown when algorithm returns invalid commands.

#### `SimulationError`
General simulation runtime errors.

### **Error Recovery**

#### Graceful Degradation
- Invalid commands are ignored with warnings
- Simulation continues with fallback behavior
- UI remains responsive during errors

#### Debug Mode
```typescript
const engine = new SimulationEngine(config, { debug: true });
// Enables detailed error logging and validation
```

---

## 📊 **Performance Guidelines**

### **Algorithm Performance**
- **Execution Time**: Keep `onTick` under 1ms for smooth simulation
- **Memory Usage**: Avoid creating large objects in hot paths
- **Complexity**: O(n) or O(n log n) algorithms work best

### **React Performance**
- **State Updates**: Minimize unnecessary re-renders
- **Canvas Rendering**: Use React.memo for expensive components
- **Event Handlers**: Use useCallback for stable references

### **Simulation Performance**
- **Tick Rate**: 10 TPS provides good balance of accuracy and performance
- **Passenger Count**: System handles 100+ passengers efficiently
- **Building Size**: Tested up to 60 floors, 8 elevators

---

## 🔗 **Integration Examples**

### **Custom Algorithm Integration**
```typescript
// 1. Implement algorithm
class MyAlgorithm implements ElevatorAlgorithm {
  name = 'My Algorithm';
  description = 'Custom strategy';
  
  onTick(elevators, passengers) {
    // Algorithm logic
    return commands;
  }
}

// 2. Register in application
const algorithms = {
  'my-algorithm': new MyAlgorithm()
};

// 3. Use in simulation
const engine = new SimulationEngine(config);
engine.setAlgorithm(algorithms['my-algorithm']);
```

### **Custom UI Integration**
```typescript
function CustomDashboard() {
  const simulation = useSimulationEngine(config);
  
  return (
    <div>
      <MetricsDisplay metrics={simulation.metrics} />
      <ElevatorList elevators={simulation.elevators} />
      <PassengerQueue passengers={simulation.waitingPassengers} />
    </div>
  );
}
```

---

**This API reference provides complete documentation for all LiftLab interfaces and integration points.** 📚✨

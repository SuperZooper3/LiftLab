# LiftLab System Redesign 🏗️

## Current Problems 🚨

### **State Management Chaos:**
- React state + refs + simulation state = timing issues
- Passengers getting lost between state layers
- Complex synchronization between UI and simulation
- Multiple sources of truth

### **Overly Complex Flow:**
- useEffect chains with setTimeout hacks
- Algorithm logging scattered everywhere
- Unclear ownership of passenger data
- Too many abstraction layers

### **Poor Separation of Concerns:**
- UI logic mixed with simulation logic
- React hooks doing too much
- Algorithm tightly coupled to React state
- No clear data flow

## Simplified Architecture 🎯

### **Single Source of Truth: SimulationEngine Class**
```typescript
class SimulationEngine {
  private elevators: ElevatorCar[] = [];
  private waitingPassengers: Passenger[] = [];
  private spawner: PassengerSpawner;
  private algorithm: ElevatorAlgorithm;
  private ticker: Ticker;
  
  // Simple, clear methods
  start(): void
  pause(): void  
  reset(): void
  step(): void // Single simulation step
  
  // State access
  getState(): SimulationState
}
```

### **Clean React Integration:**
```typescript
// Simple hook - just wraps the engine
function useSimulation() {
  const engine = useRef(new SimulationEngine());
  const [state, setState] = useState(engine.current.getState());
  
  // Engine updates trigger React re-renders
  useEffect(() => {
    engine.current.onStateChange = () => {
      setState(engine.current.getState());
    };
  }, []);
  
  return {
    state,
    start: () => engine.current.start(),
    pause: () => engine.current.pause(), 
    reset: () => engine.current.reset()
  };
}
```

### **Clear Data Flow:**
1. **User clicks start** → Engine.start()
2. **Engine creates elevators/passengers** → Internal state
3. **Engine ticks** → Algorithm runs → Commands execute
4. **State changes** → React re-renders → Canvas updates

## Benefits ✅

### **Simplicity:**
- One class owns all simulation state
- No refs, no timing hacks, no useEffect chains
- Clear method calls instead of state management

### **Reliability:**
- No lost passengers between state layers
- No synchronization issues
- Predictable data flow

### **Testability:**
- Engine can be tested independently
- No React dependencies in core logic
- Easy to unit test algorithms

### **Maintainability:**
- Single place to look for simulation logic
- Clear interfaces between components
- Easy to add features

## Implementation Plan 🚀

1. **Create SimulationEngine class** - encapsulate all logic
2. **Simplify useSimulation hook** - just wrap the engine  
3. **Clean up algorithm** - remove debug logging
4. **Update components** - use engine state directly
5. **Test and verify** - much simpler flow

This will eliminate 90% of the complexity while making the system more robust!

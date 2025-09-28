# LiftLab Architecture 🏗️

> **System design and technical architecture overview**

## 🎯 **Overview**

LiftLab follows a **modular, layered architecture** with clear separation between simulation logic, algorithm implementations, and user interface. The system is designed for extensibility, performance, and maintainability.

## 📐 **High-Level Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                    Web Application Layer                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │  React UI       │  │  State Mgmt     │  │  Canvas     │ │
│  │  Components     │  │  (Zustand)      │  │  (Konva)    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Simulation Engine Layer                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │  Engine Core    │  │  React Hook     │  │  CLI Tool   │ │
│  │  (TypeScript)   │  │  Integration    │  │  Interface  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Core Simulation Layer                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────┐ │
│  │  Elevator   │ │  Passenger  │ │  Algorithm  │ │  RNG   │ │
│  │  State      │ │  Spawner    │ │  Interface  │ │ System │ │
│  │  Machine    │ │             │ │             │ │        │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Foundation Layer                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │  Type System    │  │  Timing System  │  │  Models &   │ │
│  │  (TypeScript)   │  │  (Tick Engine)  │  │  Interfaces │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏢 **Core Components**

### **1. Simulation Engine (`@lift-lab/sim`)**

The heart of LiftLab - a deterministic simulation engine written in pure TypeScript.

#### **Key Classes:**

**`SimulationEngine`**
- **Purpose**: Central orchestrator managing entire simulation lifecycle
- **Responsibilities**: Configuration, state management, algorithm coordination
- **Interface**: Start/stop/pause controls, real-time state access

**`ElevatorCar`**
- **Purpose**: Individual elevator state machine
- **Responsibilities**: Movement, door operations, passenger management
- **State**: Floor position, direction, door status, passenger list

**`PassengerSpawner`**
- **Purpose**: Realistic passenger generation system
- **Responsibilities**: Configurable spawn patterns, traffic modeling
- **Features**: Deterministic randomization, rush hour patterns

**`TickScheduler`**
- **Purpose**: High-precision timing system
- **Responsibilities**: Consistent simulation stepping, speed control
- **Implementations**: Browser (requestAnimationFrame) and Node.js (setTimeout)

#### **Algorithm System:**
```typescript
interface ElevatorAlgorithm {
  name: string;
  description: string;
  onTick(elevators: Elevator[], passengers: Passenger[]): ElevatorCommand[];
}
```

### **2. Web Application (`@lift-lab/web`)**

React-based frontend providing interactive visualization and controls.

#### **Key Components:**

**`SimulationEngine` (React Integration)**
- **Purpose**: Bridge between React and simulation engine
- **Pattern**: Custom hook (`useSimulationEngine`)
- **Features**: Real-time state synchronization, lifecycle management

**`BuildingCanvas`**
- **Purpose**: Real-time visualization using Konva/Canvas
- **Features**: Smooth animations, pan/zoom, responsive design
- **Performance**: Hardware-accelerated rendering, 60fps target

**`App` (Main Component)**
- **Purpose**: Application shell and layout
- **Features**: Control panels, metrics dashboard, configuration

**State Management (Zustand)**
- **Purpose**: Global application state
- **Scope**: UI preferences, simulation configuration
- **Pattern**: Reactive store with TypeScript integration

---

## 🔄 **Data Flow**

### **Simulation Loop**
```
1. User Input → Configuration Change
2. Configuration → Engine Update
3. Engine → Algorithm Execution
4. Algorithm → Elevator Commands
5. Commands → State Updates
6. State → React Re-render
7. React → Canvas Animation
```

### **Real-time Updates**
```typescript
// Engine notifies React of state changes
engine.onStateChange = () => {
  setState(engine.getState());
};

// React updates visualization
useEffect(() => {
  updateCanvas(simulationState);
}, [simulationState]);
```

---

## 🎨 **Design Patterns**

### **1. Strategy Pattern (Algorithms)**
```typescript
class SimulationEngine {
  private algorithm: ElevatorAlgorithm;
  
  setAlgorithm(algorithm: ElevatorAlgorithm) {
    this.algorithm = algorithm;
  }
}
```

### **2. State Machine (Elevators)**
```typescript
class ElevatorCar {
  private state: ElevatorState;
  
  step(deltaTime: number) {
    this.updateMovement(deltaTime);
    this.updateDoors(deltaTime);
    this.processPassengers();
  }
}
```

### **3. Observer Pattern (State Updates)**
```typescript
class SimulationEngine {
  onStateChange: (() => void) | null = null;
  
  private notifyStateChange() {
    this.onStateChange?.();
  }
}
```

### **4. Command Pattern (Elevator Control)**
```typescript
interface ElevatorCommand {
  elevatorId: string;
  action: ElevatorAction;
}

// Commands are queued and executed by the engine
```

---

## ⚡ **Performance Architecture**

### **Simulation Performance**
- **Deterministic Execution**: Fixed time steps for consistent behavior
- **Efficient State Updates**: Minimal object creation, reuse where possible
- **Batch Processing**: Group operations to reduce overhead

### **Rendering Performance**
- **Canvas Optimization**: Hardware-accelerated Konva rendering
- **Animation Batching**: Group visual updates to prevent layout thrashing
- **Selective Re-rendering**: Only update changed elements

### **Memory Management**
- **Object Pooling**: Reuse passenger and command objects
- **Cleanup Lifecycle**: Proper disposal of resources on reset
- **Weak References**: Prevent memory leaks in event handlers

---

## 🔧 **Configuration System**

### **Hierarchical Configuration**
```typescript
interface SimulationConfig {
  floors: number;           // Building parameters
  elevators: number;
  spawnRate: number;        // Passenger generation
}

interface ElevatorConfig {
  capacity: number;         // Per-elevator settings
  floorTravelTime: number;
  doorOperationTime: number;
}
```

### **Runtime Updates**
- **Hot Configuration**: Change spawn rate during simulation
- **Validation**: Type-safe configuration with runtime checks
- **Persistence**: Save/load configuration presets

---

## 🧪 **Testing Architecture**

### **Unit Testing**
- **Pure Functions**: Algorithm logic, utility functions
- **State Machines**: Elevator behavior, passenger spawning
- **Deterministic**: Seeded randomization for reproducible tests

### **Integration Testing**
- **End-to-End Flows**: Complete simulation cycles
- **Algorithm Validation**: Performance benchmarking
- **UI Testing**: React component behavior

### **Manual Testing**
- **Scenario Testing**: Predefined test cases
- **Performance Testing**: Stress testing with high loads
- **Cross-browser**: Compatibility validation

---

## 🚀 **Deployment Architecture**

### **Development**
```bash
npm run dev    # Vite dev server with HMR
npm run build  # Production build
```

### **Production Considerations**
- **Static Hosting**: Can be deployed to any static host
- **CDN Optimization**: Asset optimization and caching
- **Progressive Loading**: Code splitting for faster initial load

### **Monitoring**
- **Performance Metrics**: Frame rate, simulation speed
- **Error Tracking**: Runtime error collection
- **Usage Analytics**: Algorithm popularity, configuration patterns

---

## 🔮 **Extensibility Points**

### **Algorithm Development**
- **Plugin Architecture**: Drop-in algorithm implementations
- **Parameter Tuning**: Runtime algorithm configuration
- **Performance Profiling**: Built-in benchmarking tools

### **Visualization Extensions**
- **Custom Renderers**: Alternative visualization approaches
- **Theme System**: Customizable visual styling
- **Export Capabilities**: Save simulation recordings

### **Data Integration**
- **Real Building Data**: Import actual elevator logs
- **External APIs**: Connect to building management systems
- **Machine Learning**: Algorithm training data export

---

## 📊 **Scalability Considerations**

### **Simulation Scale**
- **Building Size**: Tested up to 60 floors, 8 elevators
- **Passenger Load**: Handles 100+ concurrent passengers
- **Algorithm Complexity**: Supports sophisticated decision trees

### **Performance Targets**
- **Simulation Speed**: 10+ TPS on modern hardware
- **Visualization**: 60fps with smooth animations
- **Memory Usage**: <100MB for typical scenarios
- **Startup Time**: <2 seconds cold start

---

## 🛡️ **Quality Assurance**

### **Code Quality**
- **TypeScript**: Strict type checking throughout
- **ESLint**: Comprehensive linting rules
- **Prettier**: Consistent code formatting
- **Documentation**: Comprehensive inline documentation

### **Architecture Principles**
- **SOLID Principles**: Single responsibility, open/closed, etc.
- **DRY**: Don't repeat yourself
- **KISS**: Keep it simple, stupid
- **YAGNI**: You aren't gonna need it

---

**This architecture provides a solid foundation for elevator simulation while remaining flexible for future enhancements and algorithm development.** 🏗️✨

# LiftLab 🎢

> **An advanced elevator simulation engine and algorithm testing platform**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2+-61DAFB.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-4.4+-646CFF.svg)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

LiftLab is a sophisticated elevator simulation platform designed for algorithm development, performance analysis, and educational purposes. It provides a realistic simulation environment where you can implement, test, and benchmark custom elevator control algorithms.

## 🎯 **Features**

### **Core Simulation Engine**
- **Deterministic simulation** with configurable parameters
- **Realistic elevator physics** (travel time, door operations, capacity limits)
- **Passenger behavior modeling** with configurable spawn patterns
- **High-precision timing** with adjustable simulation speed
- **Comprehensive metrics** tracking (wait times, travel times, throughput)

### **Algorithm Development**
- **Pluggable algorithm system** for easy experimentation
- **Rich API** providing elevator states and passenger data
- **Real-time command execution** with immediate feedback
- **Performance benchmarking** against baseline algorithms
- **CLI testing tools** for algorithm validation

### **Interactive Visualization**
- **Real-time building visualization** with smooth animations
- **Passenger tracking** with destination indicators
- **Elevator state display** (loading, traveling, idle)
- **Live metrics dashboard** with performance indicators
- **Responsive design** with pan/zoom controls

### **Developer Experience**
- **TypeScript throughout** for type safety and IDE support
- **Modular architecture** with clear separation of concerns
- **Comprehensive documentation** and examples
- **Hot reload development** with Vite
- **Enterprise-grade code quality** with linting and formatting

---

## 🚀 **Quick Start**

### **Prerequisites**
- **Node.js** 18+ and **npm** 8+
- Modern web browser with ES2022 support

### **Installation**
```bash
# Clone the repository
git clone https://github.com/your-org/liftlab.git
cd liftlab

# Install dependencies
npm install

# Build the simulation engine
npm run build

# Start the development server
npm run dev
```

### **First Run**
1. Open http://localhost:5173 in your browser
2. Configure building parameters (floors: 3-60, elevators: 1-8)
3. Adjust spawn rate and simulation speed
4. Click "Start Simulation" to begin
5. Watch elevators intelligently serve passengers!

---

## 📁 **Project Structure**

```
liftlab/
├── packages/
│   ├── sim/                    # Core simulation engine
│   │   ├── src/
│   │   │   ├── models.ts       # Type definitions and interfaces
│   │   │   ├── elevator.ts     # Elevator state machine
│   │   │   ├── spawner.ts      # Passenger generation system
│   │   │   ├── algorithms.ts   # Algorithm implementations
│   │   │   ├── rng.ts          # Deterministic random number generation
│   │   │   ├── tick.ts         # High-precision timing system
│   │   │   ├── cli.ts          # Command-line interface
│   │   │   └── index.ts        # Public API exports
│   │   └── package.json
│   └── web/                    # React frontend application
│       ├── src/
│       │   ├── components/     # React components
│       │   ├── engine/         # Simulation engine integration
│       │   ├── hooks/          # Custom React hooks
│       │   ├── store.ts        # Global state management
│       │   └── App.tsx         # Main application component
│       └── package.json
├── docs/
│   ├── ALGORITHMS.md           # Algorithm development guide
│   ├── ARCHITECTURE.md         # System architecture overview
│   └── API.md                  # API reference documentation
├── README.md                   # This file
├── package.json                # Workspace configuration
└── tsconfig.json              # TypeScript configuration
```

---

## 🧠 **Algorithm Development**

LiftLab's core strength is its pluggable algorithm system. You can implement custom elevator control strategies and immediately see their performance.

### **Quick Example**
```typescript
import { ElevatorAlgorithm, ElevatorCommand, Elevator, Passenger } from '@lift-lab/sim';

export class MyAlgorithm implements ElevatorAlgorithm {
  name = 'My Smart Algorithm';
  description = 'A custom elevator control strategy';

  onTick(elevators: Elevator[], waitingPassengers: Passenger[]): ElevatorCommand[] {
    // Your algorithm logic here
    return this.generateCommands(elevators, waitingPassengers);
  }
}
```

### **Available Algorithms**
- **Greedy Algorithm** (default) - Always serves nearest request
- **SCAN Algorithm** - Sweeps up/down serving all requests
- **Custom Algorithms** - Implement your own strategies

📖 **See [ALGORITHMS.md](./ALGORITHMS.md) for comprehensive development guide**

---

## 🎮 **Usage**

### **Web Interface**
The primary interface is a React-based web application providing:

- **Configuration Panel**: Set building parameters and algorithm selection
- **Simulation Controls**: Start/pause/reset with speed adjustment
- **Live Visualization**: Real-time building view with passenger tracking
- **Metrics Dashboard**: Performance indicators and statistics
- **Spawn Rate Control**: Adjust passenger generation rate

### **Command Line Interface**
For algorithm testing and automation:

```bash
# Run component tests
npm run test-sim

# Run full simulation
npm run simulate

# Test specific algorithm
npm run cli -- test --algorithm=greedy

# Run performance benchmark
npm run cli -- benchmark --floors=20 --elevators=4
```

### **Programmatic API**
```typescript
import { SimulationEngine } from '@lift-lab/sim';

const engine = new SimulationEngine({
  floors: 10,
  elevators: 3,
  spawnRate: 5.0
});

engine.start();
// Access real-time state
const state = engine.getState();
```

---

## ⚙️ **Configuration**

### **Building Parameters**
- **Floors**: 3-60 floors (configurable range)
- **Elevators**: 1-8 elevators per building
- **Capacity**: 8 passengers per elevator (standard)

### **Simulation Parameters**
- **Spawn Rate**: 0.5-50 passengers per minute
- **Speed Multiplier**: 0.25x to 4x simulation speed
- **Travel Time**: 1.5 seconds per floor
- **Door Operations**: 1.5 seconds open/close, 2 seconds hold

### **Algorithm Parameters**
Each algorithm can define custom parameters for fine-tuning behavior.

---

## 📊 **Performance Metrics**

LiftLab tracks comprehensive performance indicators:

### **Primary Metrics**
- **Average Wait Time**: Time from request to pickup
- **Average Travel Time**: Time from pickup to destination
- **Passengers Served**: Total completed journeys
- **Throughput**: Passengers per minute

### **Secondary Metrics**
- **Elevator Utilization**: Percentage of time elevators are active
- **Energy Efficiency**: Total distance traveled per passenger
- **Fairness Index**: Distribution of wait times across passengers
- **Peak Performance**: Metrics during high-traffic periods

---

## 🏗️ **Architecture**

### **Core Principles**
- **Separation of Concerns**: Clear boundaries between simulation, algorithms, and UI
- **Type Safety**: Full TypeScript coverage with strict type checking
- **Deterministic Simulation**: Reproducible results with seeded randomization
- **Real-time Performance**: Optimized for smooth 60fps visualization
- **Extensibility**: Plugin architecture for algorithms and visualizations

### **Key Components**

#### **Simulation Engine** (`@lift-lab/sim`)
- **ElevatorCar**: State machine managing individual elevator behavior
- **PassengerSpawner**: Configurable passenger generation with realistic patterns
- **TickScheduler**: High-precision timing with browser/Node.js compatibility
- **Algorithm Interface**: Standardized API for elevator control strategies

#### **Web Application** (`@lift-lab/web`)
- **SimulationEngine**: React integration layer
- **BuildingCanvas**: Konva-based real-time visualization
- **Control Panel**: Configuration and simulation controls
- **Metrics Dashboard**: Live performance indicators

📖 **See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for detailed system design**

---

## 🛠️ **Development**

### **Available Scripts**
```bash
# Development
npm run dev              # Start development server
npm run build           # Build all packages
npm run type-check      # TypeScript compilation check

# Testing
npm run test-sim        # Run simulation engine tests
npm run simulate        # Run CLI simulation

# Code Quality
npm run lint            # ESLint code analysis
npm run format          # Prettier code formatting
```

### **Development Workflow**
1. **Make changes** to simulation engine or web app
2. **Build packages** with `npm run build`
3. **Test changes** with `npm run dev`
4. **Validate types** with `npm run type-check`
5. **Format code** with `npm run format`

### **Adding New Algorithms**
1. Create algorithm class implementing `ElevatorAlgorithm`
2. Export from `packages/sim/src/algorithms.ts`
3. Register in web app algorithm selector
4. Test with CLI and web interface

---

## 🧪 **Testing**

### **Manual Testing**
LiftLab includes comprehensive manual testing scenarios:

- **Basic Operations**: Elevator movement, passenger pickup/dropoff
- **Edge Cases**: Full elevators, rush hour scenarios, empty building
- **Algorithm Comparison**: Side-by-side performance analysis
- **Configuration Testing**: Various building sizes and parameters

### **Automated Testing**
- **Unit Tests**: Core simulation components
- **Integration Tests**: Algorithm behavior validation
- **Performance Tests**: Metrics accuracy and timing
- **CLI Tests**: Command-line interface functionality

---

## 📈 **Performance**

### **Optimization Features**
- **Efficient State Management**: Minimal React re-renders
- **Canvas Optimization**: Hardware-accelerated graphics with Konva
- **Memory Management**: Proper cleanup and garbage collection
- **Deterministic Performance**: Consistent timing across devices

### **Benchmarks**
- **Simulation Speed**: 10+ TPS on modern hardware
- **Visualization**: Smooth 60fps with 100+ passengers
- **Memory Usage**: <100MB for typical scenarios
- **Startup Time**: <2 seconds cold start

---

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### **Development Setup**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### **Code Standards**
- **TypeScript**: Strict type checking enabled
- **ESLint**: Airbnb configuration with custom rules
- **Prettier**: Consistent code formatting
- **Conventional Commits**: Standardized commit messages

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 **Acknowledgments**

- **Elevator Algorithm Research**: Based on classical scheduling algorithms
- **React Ecosystem**: Built with modern React patterns and best practices
- **TypeScript Community**: Leveraging advanced type system features
- **Open Source Libraries**: Konva, Zustand, Vite, and many others

---

## 📞 **Support**

- **Documentation**: [ALGORITHMS.md](./ALGORITHMS.md) | [ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- **Issues**: [GitHub Issues](https://github.com/your-org/liftlab/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/liftlab/discussions)

---

**Built with ❤️ for elevator algorithm enthusiasts and simulation lovers!** 🎢✨
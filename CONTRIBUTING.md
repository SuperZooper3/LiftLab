# Contributing to LiftLab 🤝

> **Welcome! We're excited to have you contribute to LiftLab.**

Thank you for your interest in contributing to LiftLab! This guide will help you get started with contributing to our elevator simulation platform.

## 🎯 **Ways to Contribute**

### **Algorithm Development** 🧠
- Implement new elevator control algorithms
- Optimize existing algorithms for better performance
- Add algorithm configuration parameters
- Create algorithm comparison studies

### **Core Engine** ⚙️
- Improve simulation accuracy and performance
- Add new passenger behavior patterns
- Enhance elevator physics modeling
- Optimize memory usage and speed

### **User Interface** 🎨
- Improve visualization and animations
- Add new control panels and metrics
- Enhance accessibility and usability
- Create new themes and styling options

### **Documentation** 📚
- Improve API documentation
- Add tutorials and examples
- Create algorithm development guides
- Write performance optimization tips

### **Testing & Quality** 🧪
- Add unit tests for core components
- Create integration test scenarios
- Improve error handling and validation
- Add performance benchmarks

---

## 🚀 **Getting Started**

### **Prerequisites**
- **Node.js** 18+ and **npm** 8+
- **Git** for version control
- **TypeScript** knowledge (preferred)
- **React** experience (for UI contributions)

### **Development Setup**
```bash
# 1. Fork the repository on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/liftlab.git
cd liftlab

# 3. Install dependencies
npm install

# 4. Build the simulation engine
npm run build

# 5. Start development server
npm run dev

# 6. Run tests
npm run test-sim
```

### **Project Structure**
```
liftlab/
├── packages/
│   ├── sim/           # Core simulation engine
│   └── web/           # React web application
├── docs/              # Documentation
├── README.md          # Project overview
└── CONTRIBUTING.md    # This file
```

---

## 🔄 **Development Workflow**

### **1. Choose an Issue**
- Browse [open issues](https://github.com/your-org/liftlab/issues)
- Look for `good first issue` or `help wanted` labels
- Comment on the issue to claim it
- Ask questions if anything is unclear

### **2. Create a Branch**
```bash
# Create feature branch from main
git checkout main
git pull origin main
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

### **3. Make Changes**
- Follow our [coding standards](#coding-standards)
- Write tests for new functionality
- Update documentation as needed
- Test your changes thoroughly

### **4. Commit Changes**
```bash
# Stage your changes
git add .

# Commit with descriptive message
git commit -m "feat: add SCAN elevator algorithm

- Implement SCAN algorithm with up/down sweeps
- Add configuration parameters for optimization
- Include performance benchmarks
- Update algorithm selector in UI"
```

### **5. Submit Pull Request**
```bash
# Push to your fork
git push origin feature/your-feature-name

# Create pull request on GitHub
# Fill out the PR template completely
# Link to related issues
```

---

## 📝 **Coding Standards**

### **TypeScript Guidelines**
```typescript
// ✅ Good: Explicit types and clear naming
interface ElevatorConfig {
  readonly id: string;
  readonly capacity: number;
  readonly floorTravelTime: number;
}

class ElevatorCar {
  private readonly config: ElevatorConfig;
  private state: ElevatorState;
  
  constructor(config: ElevatorConfig, initialFloor: number) {
    this.config = config;
    this.state = this.createInitialState(initialFloor);
  }
  
  public getState(): Elevator {
    return {
      id: this.config.id,
      currentFloor: this.state.currentFloor,
      // ... other properties
    };
  }
}

// ❌ Avoid: Any types and unclear naming
class Thing {
  private stuff: any;
  
  doSomething(x: any): any {
    return this.stuff.process(x);
  }
}
```

### **Code Style**
- **Indentation**: 2 spaces (no tabs)
- **Quotes**: Single quotes for strings
- **Semicolons**: Always use semicolons
- **Naming**: camelCase for variables/functions, PascalCase for classes
- **Comments**: JSDoc for public APIs, inline for complex logic

### **File Organization**
```typescript
// File header with description
/**
 * ElevatorCar - Individual elevator state machine
 * Manages movement, doors, and passenger operations
 */

// Imports (external first, then internal)
import { Konva } from 'konva';
import { ElevatorConfig, Passenger } from './models.js';

// Types and interfaces
interface ElevatorState {
  // ...
}

// Constants
const DEFAULT_CAPACITY = 8;
const DOOR_OPERATION_TIME = 1.5;

// Main class implementation
export class ElevatorCar {
  // ...
}
```

---

## 🧠 **Algorithm Development**

### **Algorithm Template**
```typescript
import { 
  ElevatorAlgorithm, 
  ElevatorCommand, 
  Elevator, 
  Passenger,
  ElevatorAction 
} from '../models.js';

/**
 * YourAlgorithm - Brief description of strategy
 * 
 * Detailed explanation of how the algorithm works,
 * its strengths, weaknesses, and use cases.
 */
export class YourAlgorithm implements ElevatorAlgorithm {
  readonly name = 'Your Algorithm';
  readonly description = 'Brief description for UI';
  
  onTick(
    elevators: Elevator[],
    waitingPassengers: Passenger[],
    currentTime: number
  ): ElevatorCommand[] {
    const commands: ElevatorCommand[] = [];
    
    for (const elevator of elevators) {
      const command = this.decideAction(elevator, waitingPassengers);
      if (command) {
        commands.push(command);
      }
    }
    
    return commands;
  }
  
  private decideAction(
    elevator: Elevator,
    waitingPassengers: Passenger[]
  ): ElevatorCommand | null {
    // Your algorithm logic here
    return null;
  }
}
```

### **Algorithm Guidelines**
- **Performance**: Keep `onTick` execution under 1ms
- **Determinism**: Same inputs should produce same outputs
- **Documentation**: Explain your strategy clearly
- **Testing**: Include test scenarios and benchmarks

### **Adding Your Algorithm**
1. Create file in `packages/sim/src/algorithms/`
2. Export from `packages/sim/src/algorithms.ts`
3. Add to UI selector in `packages/web/src/App.tsx`
4. Add tests and documentation

---

## 🎨 **UI Development**

### **React Guidelines**
```typescript
// ✅ Good: Functional components with hooks
interface MetricsDisplayProps {
  metrics: SimulationMetrics;
  className?: string;
}

export function MetricsDisplay({ metrics, className }: MetricsDisplayProps) {
  const formattedWaitTime = useMemo(
    () => metrics.avgWaitTime.toFixed(1),
    [metrics.avgWaitTime]
  );
  
  return (
    <div className={`metrics-display ${className || ''}`}>
      <div className="metric">
        <span className="label">Avg Wait Time</span>
        <span className="value">{formattedWaitTime}s</span>
      </div>
    </div>
  );
}

// ❌ Avoid: Class components and inline styles
class BadComponent extends React.Component {
  render() {
    return (
      <div style={{ color: 'red', fontSize: '14px' }}>
        {/* Inline styles and class components */}
      </div>
    );
  }
}
```

### **Styling Guidelines**
- **Tailwind CSS**: Use utility classes for styling
- **Custom CSS**: Only for complex animations or unique styles
- **Responsive**: Design for mobile and desktop
- **Accessibility**: Include ARIA labels and keyboard navigation

---

## 🧪 **Testing**

### **Unit Tests**
```typescript
import { ElevatorCar } from '../elevator.js';
import { createMockConfig } from './test-utils.js';

describe('ElevatorCar', () => {
  let elevator: ElevatorCar;
  
  beforeEach(() => {
    const config = createMockConfig();
    elevator = new ElevatorCar(config, 0);
  });
  
  it('should start at ground floor', () => {
    const state = elevator.getState();
    expect(state.currentFloor).toBe(0);
    expect(state.direction).toBe('idle');
  });
  
  it('should move up when commanded', () => {
    elevator.executeCommand({
      elevatorId: elevator.getState().id,
      action: ElevatorAction.MOVE_UP
    }, 0);
    
    elevator.step(2.0, 2.0); // 2 seconds
    
    const state = elevator.getState();
    expect(state.currentFloor).toBe(1);
  });
});
```

### **Integration Tests**
```typescript
describe('Algorithm Integration', () => {
  it('should serve all passengers efficiently', async () => {
    const engine = new SimulationEngine({
      floors: 10,
      elevators: 2,
      spawnRate: 5.0
    });
    
    engine.setAlgorithm(new YourAlgorithm());
    engine.start();
    
    // Run simulation for 60 seconds
    await runSimulation(engine, 60);
    
    const metrics = engine.getState().metrics;
    expect(metrics.avgWaitTime).toBeLessThan(30); // 30 seconds max
    expect(metrics.passengersServed).toBeGreaterThan(0);
  });
});
```

---

## 📋 **Pull Request Guidelines**

### **PR Template**
```markdown
## Description
Brief description of changes and motivation.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Performance impact assessed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new linter warnings
```

### **Review Process**
1. **Automated Checks**: CI runs tests and linting
2. **Code Review**: Maintainers review code quality and design
3. **Testing**: Manual testing of new features
4. **Documentation**: Ensure docs are updated
5. **Merge**: Approved PRs are merged to main

---

## 🏷️ **Issue Guidelines**

### **Bug Reports**
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. macOS, Windows, Linux]
- Browser: [e.g. Chrome, Firefox, Safari]
- Version: [e.g. 1.0.0]
```

### **Feature Requests**
```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Other solutions you've considered.

**Additional context**
Any other context about the feature request.
```

---

## 🎯 **Good First Issues**

Looking for a place to start? Try these beginner-friendly tasks:

### **Algorithm Development**
- Implement First-Come-First-Served algorithm
- Add algorithm parameter configuration
- Create algorithm performance comparison tool

### **UI Improvements**
- Add keyboard shortcuts for controls
- Improve mobile responsiveness
- Add dark mode theme

### **Documentation**
- Add more algorithm examples
- Improve API documentation
- Create video tutorials

### **Testing**
- Add unit tests for utility functions
- Create more integration test scenarios
- Add performance benchmarks

---

## 🏆 **Recognition**

### **Contributors**
All contributors are recognized in:
- GitHub contributors list
- Project README
- Release notes for significant contributions

### **Maintainers**
Active contributors may be invited to become maintainers with:
- Commit access to the repository
- Ability to review and merge PRs
- Input on project direction and roadmap

---

## 📞 **Getting Help**

### **Questions?**
- **GitHub Discussions**: For general questions and ideas
- **GitHub Issues**: For bug reports and feature requests
- **Code Review**: Ask questions in PR comments

### **Resources**
- **Documentation**: [README.md](./README.md), [ALGORITHMS.md](./ALGORITHMS.md)
- **Examples**: Check existing algorithms and components
- **Community**: Join discussions and help others

---

## 📄 **License**

By contributing to LiftLab, you agree that your contributions will be licensed under the same [MIT License](./LICENSE) that covers the project.

---

**Thank you for contributing to LiftLab! Together we're building the best elevator simulation platform.** 🎢✨

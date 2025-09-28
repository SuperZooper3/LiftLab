# LiftLab Algorithm Development Guide 🧠

## Overview

LiftLab uses a **pluggable algorithm system** that allows you to implement custom elevator control strategies. Your algorithm receives real-time information about elevators and waiting passengers, then decides what each elevator should do next.

## 🎯 **How It Works**

### **The Algorithm Interface**
Every algorithm must implement the `ElevatorAlgorithm` interface:

```typescript
interface ElevatorAlgorithm {
  name: string;
  description: string;
  
  onTick(
    elevators: Elevator[],
    waitingPassengers: Passenger[],
    currentTime: number
  ): ElevatorCommand[];
}
```

### **The Game Loop**
1. **Every simulation tick** (~10 times per second), your algorithm is called
2. **You receive** current state of all elevators and waiting passengers
3. **You return** an array of commands telling elevators what to do
4. **The simulation** executes your commands and updates the world

---

## 📊 **Data Structures**

### **Elevator State**
```typescript
interface Elevator {
  id: string;                    // "elevator_0", "elevator_1", etc.
  currentFloor: number;          // 0 = ground floor, 9 = 10th floor
  direction: Direction;          // 'up' | 'down' | 'idle'
  doorState: DoorState;          // 'open' | 'closed' | 'opening' | 'closing'
  passengers: Passenger[];       // People currently inside
  capacity: number;              // Max passengers (usually 8)
  targetFloors: Set<number>;     // Floors this elevator needs to visit
}
```

### **Passenger Data**
```typescript
interface Passenger {
  id: string;                    // Unique identifier
  startFloor: number;            // Where they're waiting
  destinationFloor: number;      // Where they want to go
  requestTime: number;           // When they pressed the button
  pickupTime?: number;           // When they got on (if picked up)
  dropoffTime?: number;          // When they got off (if completed)
}
```

### **Commands You Can Issue**
```typescript
interface ElevatorCommand {
  elevatorId: string;            // Which elevator to command
  action: ElevatorAction;        // What to do
}

enum ElevatorAction {
  MOVE_UP = 'moveUp',
  MOVE_DOWN = 'moveDown', 
  OPEN_DOORS = 'openDoors',
  CLOSE_DOORS = 'closeDoors',
  WAIT = 'wait'
}
```

---

## 🚀 **Creating Your First Algorithm**

### **1. Basic Template**
Create a new file in `packages/sim/src/algorithms/`:

```typescript
// packages/sim/src/algorithms/MyAlgorithm.ts
import { 
  ElevatorAlgorithm, 
  ElevatorCommand, 
  Elevator, 
  Passenger,
  ElevatorAction,
  Direction 
} from '../models.js';

export class MyAlgorithm implements ElevatorAlgorithm {
  name = 'My Algorithm';
  description = 'A custom elevator control strategy';

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
    // Your logic here!
    return null;
  }
}
```

### **2. Example: Simple Greedy Algorithm**
```typescript
private decideAction(
  elevator: Elevator, 
  waitingPassengers: Passenger[]
): ElevatorCommand | null {
  
  // Priority 1: Close doors if they're open
  if (elevator.doorState === 'open') {
    return {
      elevatorId: elevator.id,
      action: ElevatorAction.CLOSE_DOORS
    };
  }

  // Priority 2: Serve passengers already inside
  if (elevator.passengers.length > 0) {
    const nearestDestination = this.findNearestDestination(elevator);
    if (nearestDestination !== null) {
      return this.moveTowards(elevator, nearestDestination);
    }
  }

  // Priority 3: Pick up waiting passengers
  if (elevator.direction === Direction.IDLE) {
    const nearestCall = this.findNearestCall(elevator, waitingPassengers);
    if (nearestCall !== null) {
      return this.moveTowards(elevator, nearestCall);
    }
  }

  return null; // Do nothing
}

private moveTowards(elevator: Elevator, targetFloor: number): ElevatorCommand {
  if (targetFloor === elevator.currentFloor) {
    return {
      elevatorId: elevator.id,
      action: ElevatorAction.OPEN_DOORS
    };
  } else if (targetFloor > elevator.currentFloor) {
    return {
      elevatorId: elevator.id,
      action: ElevatorAction.MOVE_UP
    };
  } else {
    return {
      elevatorId: elevator.id,
      action: ElevatorAction.MOVE_DOWN
    };
  }
}
```

---

## 🧠 **Algorithm Strategies**

### **Greedy Approach** (Current Default)
- Always serve the **nearest request** first
- Simple but can be inefficient
- Good baseline for comparison

### **SCAN/Elevator Algorithm**
- Move in one direction, serving all requests
- Change direction only when no more requests in current direction
- More efficient for high traffic

### **LOOK Algorithm**
- Like SCAN but reverses direction at the last request
- Doesn't always go to building extremes
- Good balance of efficiency and response time

### **Shortest Seek Time First (SSTF)**
- Always serve the request requiring least travel time
- Can cause starvation of distant requests
- Good for minimizing average wait time

### **Priority-Based**
- Weight requests by wait time, VIP status, etc.
- Prevent starvation with aging
- More complex but can optimize for fairness

---

## 💡 **Advanced Techniques**

### **1. Predictive Algorithms**
```typescript
// Predict where passengers will want to go
private predictDestinations(passengers: Passenger[]): number[] {
  // Morning rush: mostly going up from ground floor
  // Evening rush: mostly going down to ground floor
  // Lunch time: mixed patterns
  return predictions;
}
```

### **2. Multi-Elevator Coordination**
```typescript
onTick(elevators: Elevator[], waitingPassengers: Passenger[], currentTime: number) {
  // Assign zones to elevators
  const zones = this.divideIntoZones(elevators.length);
  
  // Coordinate to avoid clustering
  return this.coordinatedCommands(elevators, zones, waitingPassengers);
}
```

### **3. Machine Learning Integration**
```typescript
// Track performance metrics
private updateLearning(metrics: {
  avgWaitTime: number;
  avgTravelTime: number;
  efficiency: number;
}) {
  // Adjust algorithm parameters based on performance
  this.parameters = this.optimizer.update(metrics);
}
```

### **4. Traffic Pattern Recognition**
```typescript
private analyzeTraffic(waitingPassengers: Passenger[], currentTime: number) {
  // Detect rush hours, lunch patterns, etc.
  // Adjust strategy accordingly
  
  if (this.isMorningRush(currentTime)) {
    return this.morningRushStrategy();
  } else if (this.isEveningRush(currentTime)) {
    return this.eveningRushStrategy();
  }
  
  return this.normalStrategy();
}
```

---

## 🔧 **Integration & Testing**

### **1. Add to Algorithms Index**
```typescript
// packages/sim/src/algorithms.ts
export { MyAlgorithm } from './algorithms/MyAlgorithm.js';
```

### **2. Register in Frontend**
```typescript
// packages/web/src/App.tsx
const algorithms = {
  'greedy': new GreedyAlgorithm(),
  'my-algorithm': new MyAlgorithm(),
  // Add your algorithm here
};
```

### **3. Add to Dropdown**
```tsx
<select value={selectedAlgorithm}>
  <option value="greedy">Greedy</option>
  <option value="my-algorithm">My Algorithm</option>
</select>
```

### **4. Test with CLI**
```bash
# Test your algorithm
npm run simulate
```

---

## 📈 **Performance Metrics**

Your algorithm will be judged on:

- **Average Wait Time**: How long passengers wait for pickup
- **Average Travel Time**: How long trips take once boarded  
- **Throughput**: Passengers served per minute
- **Efficiency**: Energy usage (distance traveled)
- **Fairness**: Distribution of wait times

### **Accessing Metrics**
```typescript
// Metrics are calculated automatically
// Available in the UI and via simulation results
interface SimulationMetrics {
  avgWaitTime: number;      // Lower is better
  avgTravelTime: number;    // Lower is better  
  passengersServed: number; // Higher is better
  totalPassengers: number;  // Context
}
```

---

## 🎮 **Testing Your Algorithm**

### **1. Start Simple**
- Begin with single elevator scenarios
- Test basic pickup/dropoff cycles
- Verify commands execute correctly

### **2. Add Complexity**
- Multiple elevators
- Higher passenger loads  
- Different building sizes

### **3. Edge Cases**
- Full elevators
- All passengers going to same floor
- Rush hour scenarios
- Empty building periods

### **4. Performance Tuning**
- Compare against baseline (Greedy)
- Test different building configurations
- Optimize for specific metrics

---

## 🚨 **Common Pitfalls**

### **1. Command Conflicts**
```typescript
// DON'T: Issue conflicting commands
commands.push({ elevatorId: 'elevator_0', action: ElevatorAction.MOVE_UP });
commands.push({ elevatorId: 'elevator_0', action: ElevatorAction.MOVE_DOWN });

// DO: One command per elevator per tick
const command = this.decideAction(elevator, waitingPassengers);
if (command) commands.push(command);
```

### **2. Ignoring Elevator State**
```typescript
// DON'T: Ignore current state
return { elevatorId: id, action: ElevatorAction.MOVE_UP };

// DO: Check state first
if (elevator.direction === Direction.IDLE) {
  return { elevatorId: id, action: ElevatorAction.MOVE_UP };
}
```

### **3. Forgetting Door Management**
```typescript
// DON'T: Forget to close doors
if (elevator.currentFloor === targetFloor) {
  return { elevatorId: id, action: ElevatorAction.OPEN_DOORS };
  // Doors will stay open forever!
}

// DO: Manage door lifecycle
if (elevator.doorState === 'open') {
  return { elevatorId: id, action: ElevatorAction.CLOSE_DOORS };
}
```

---

## 🏆 **Algorithm Challenges**

Try implementing these classic algorithms:

### **Beginner**
- ✅ **First Come, First Served**: Serve requests in order received
- ✅ **Nearest Car**: Send closest elevator to each request

### **Intermediate** 
- 🎯 **SCAN**: Sweep up and down serving all requests
- 🎯 **Destination Dispatch**: Group passengers by destination

### **Advanced**
- 🚀 **Genetic Algorithm**: Evolve optimal parameters
- 🚀 **Neural Network**: Learn from passenger patterns
- 🚀 **Multi-Objective**: Optimize multiple metrics simultaneously

---

## 📚 **Resources**

- **Real Elevator Algorithms**: Research papers on elevator control
- **Scheduling Theory**: CPU scheduling algorithms apply to elevators
- **Operations Research**: Optimization techniques for resource allocation
- **Game Theory**: Multi-agent coordination strategies

---

**Happy Algorithm Development!** 🎢🧠

Create the smartest elevator controller and watch your passengers zoom efficiently through the building! 🚀

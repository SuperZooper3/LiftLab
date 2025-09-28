/**
 * ElevatorCar State Machine
 * Handles elevator behavior, movement, and passenger management
 */

import { 
  Elevator, 
  Passenger, 
  Direction, 
  DoorState, 
  ElevatorAction,
  ElevatorCommand,
  isElevatorFull 
} from './models.js';

/**
 * Internal elevator state for state machine logic
 */
interface ElevatorInternalState {
  /** Current floor (0-based) */
  currentFloor: number;
  
  /** Target floor for current movement */
  targetFloor: number | null;
  
  /** Movement direction */
  direction: Direction;
  
  /** Door state */
  doorState: DoorState;
  
  /** Time remaining for current door operation (seconds) */
  doorTimer: number;
  
  /** Time remaining for floor movement (seconds) */
  moveTimer: number;
  
  /** Passengers currently in elevator */
  passengers: Passenger[];
  
  /** Floors that have been requested (pickup + dropoff) */
  requestedFloors: Set<number>;
  
  /** Floors where passengers want to get off */
  dropoffFloors: Set<number>;
  
  /** Floors where passengers are waiting to be picked up */
  pickupFloors: Set<number>;
  
  /** Whether elevator is currently moving between floors */
  isMoving: boolean;
  
  /** Time when current action started */
  actionStartTime: number;
}

/**
 * Configuration for elevator behavior
 */
export interface ElevatorConfig {
  /** Unique identifier */
  id: string;
  
  /** Maximum passenger capacity */
  capacity: number;
  
  /** Time to travel between adjacent floors (seconds) */
  floorTravelTime: number;
  
  /** Time to open/close doors (seconds) */
  doorOperationTime: number;
  
  /** Time doors stay open for passenger boarding (seconds) */
  doorHoldTime: number;
  
  /** Total number of floors in building */
  floorCount: number;
}

/**
 * ElevatorCar class implementing the state machine
 */
export class ElevatorCar {
  private config: ElevatorConfig;
  private state: ElevatorInternalState;
  
  constructor(config: ElevatorConfig, initialFloor: number = 0) {
    this.config = config;
    this.state = {
      currentFloor: Math.max(0, Math.min(initialFloor, config.floorCount - 1)),
      targetFloor: null,
      direction: Direction.IDLE,
      doorState: DoorState.CLOSED,
      doorTimer: 0,
      moveTimer: 0,
      passengers: [],
      requestedFloors: new Set(),
      dropoffFloors: new Set(),
      pickupFloors: new Set(),
      isMoving: false,
      actionStartTime: 0,
    };
  }

  /**
   * Get current elevator state snapshot
   */
  getState(): Elevator {
    return {
      id: this.config.id,
      currentFloor: this.state.currentFloor,
      direction: this.state.direction,
      doorState: this.state.doorState,
      passengers: [...this.state.passengers],
      capacity: this.config.capacity,
      targetFloors: new Set([
        ...this.state.dropoffFloors,
        ...this.state.pickupFloors
      ]),
    };
  }

  /**
   * Execute a command from the elevator algorithm
   */
  executeCommand(command: ElevatorCommand, currentTime: number): boolean {
    if (command.elevatorId !== this.config.id) {
      return false;
    }

    switch (command.action) {
      case ElevatorAction.MOVE_UP:
        return this.moveUp(currentTime);
      
      case ElevatorAction.MOVE_DOWN:
        return this.moveDown(currentTime);
      
      case ElevatorAction.OPEN_DOORS:
        return this.openDoors(currentTime);
      
      case ElevatorAction.CLOSE_DOORS:
        return this.closeDoors(currentTime);
      
      case ElevatorAction.WAIT:
        return true; // Always successful
      
      default:
        console.warn(`Unknown elevator action: ${command.action}`);
        return false;
    }
  }

  /**
   * Step the elevator state machine forward by deltaTime
   */
  step(deltaTime: number, currentTime: number): void {
    // Update timers
    if (this.state.doorTimer > 0) {
      this.state.doorTimer -= deltaTime;
    }
    
    if (this.state.moveTimer > 0) {
      this.state.moveTimer -= deltaTime;
    }

    // Handle door state transitions
    this.updateDoorState(currentTime);
    
    // Handle movement
    this.updateMovement(currentTime);
    
    // Update direction based on current goals
    this.updateDirection();
  }

  /**
   * Add pickup request for a floor
   */
  addPickupRequest(floor: number): void {
    if (floor >= 0 && floor < this.config.floorCount) {
      this.state.pickupFloors.add(floor);
      this.state.requestedFloors.add(floor);
    }
  }

  /**
   * Add dropoff request for a floor
   */
  addDropoffRequest(floor: number): void {
    if (floor >= 0 && floor < this.config.floorCount) {
      this.state.dropoffFloors.add(floor);
      this.state.requestedFloors.add(floor);
    }
  }

  /**
   * Board passengers onto the elevator
   */
  boardPassengers(passengers: Passenger[], currentTime: number): Passenger[] {
    const boarded: Passenger[] = [];
    
    // Only board if doors are open and we have capacity
    if (this.state.doorState !== DoorState.OPEN || isElevatorFull(this.getState())) {
      return boarded;
    }

    for (const passenger of passengers) {
      if (passenger.startFloor === this.state.currentFloor && 
          this.state.passengers.length < this.config.capacity) {
        
        // Update passenger pickup time
        passenger.pickupTime = currentTime;
        
        // Add passenger to elevator
        this.state.passengers.push(passenger);
        boarded.push(passenger);
        
        // Add their destination as a dropoff request
        this.addDropoffRequest(passenger.destinationFloor);
      }
    }

    // Remove pickup request for this floor if we picked up passengers
    if (boarded.length > 0) {
      this.state.pickupFloors.delete(this.state.currentFloor);
      if (!this.state.dropoffFloors.has(this.state.currentFloor)) {
        this.state.requestedFloors.delete(this.state.currentFloor);
      }
    }

    return boarded;
  }

  /**
   * Disembark passengers at current floor
   */
  disembarkPassengers(currentTime: number): Passenger[] {
    const disembarked: Passenger[] = [];
    
    // Only disembark if doors are open
    if (this.state.doorState !== DoorState.OPEN) {
      return disembarked;
    }

    // Find passengers who want to get off at this floor
    for (let i = this.state.passengers.length - 1; i >= 0; i--) {
      const passenger = this.state.passengers[i];
      
      if (passenger.destinationFloor === this.state.currentFloor) {
        // Update passenger dropoff time
        passenger.dropoffTime = currentTime;
        
        // Remove from elevator
        this.state.passengers.splice(i, 1);
        disembarked.push(passenger);
      }
    }

    // Remove dropoff request for this floor if we dropped off passengers
    if (disembarked.length > 0) {
      this.state.dropoffFloors.delete(this.state.currentFloor);
      if (!this.state.pickupFloors.has(this.state.currentFloor)) {
        this.state.requestedFloors.delete(this.state.currentFloor);
      }
    }

    return disembarked;
  }

  /**
   * Check if elevator should stop at current floor
   */
  shouldStopAtCurrentFloor(): boolean {
    return this.state.requestedFloors.has(this.state.currentFloor);
  }

  /**
   * Get next target floor based on current direction and requests
   */
  getNextTargetFloor(): number | null {
    const currentFloor = this.state.currentFloor;
    const requests = Array.from(this.state.requestedFloors).sort((a, b) => a - b);
    
    if (requests.length === 0) {
      return null;
    }

    switch (this.state.direction) {
      case Direction.UP:
        // Find next floor above current
        const upFloors = requests.filter(floor => floor > currentFloor);
        return upFloors.length > 0 ? upFloors[0] : null;
      
      case Direction.DOWN:
        // Find next floor below current
        const downFloors = requests.filter(floor => floor < currentFloor);
        return downFloors.length > 0 ? downFloors[downFloors.length - 1] : null;
      
      case Direction.IDLE:
        // Find closest floor
        let closest = requests[0];
        let minDistance = Math.abs(closest - currentFloor);
        
        for (const floor of requests) {
          const distance = Math.abs(floor - currentFloor);
          if (distance < minDistance) {
            closest = floor;
            minDistance = distance;
          }
        }
        
        return closest;
      
      default:
        return null;
    }
  }

  // ===== PRIVATE METHODS =====

  private moveUp(currentTime: number): boolean {
    if (this.state.isMoving || this.state.doorState !== DoorState.CLOSED) {
      return false;
    }
    
    if (this.state.currentFloor >= this.config.floorCount - 1) {
      return false; // Already at top floor
    }

    this.startMovement(this.state.currentFloor + 1, currentTime);
    return true;
  }

  private moveDown(currentTime: number): boolean {
    if (this.state.isMoving || this.state.doorState !== DoorState.CLOSED) {
      return false;
    }
    
    if (this.state.currentFloor <= 0) {
      return false; // Already at bottom floor
    }

    this.startMovement(this.state.currentFloor - 1, currentTime);
    return true;
  }

  private openDoors(currentTime: number): boolean {
    if (this.state.doorState === DoorState.OPEN || 
        this.state.doorState === DoorState.OPENING ||
        this.state.isMoving) {
      return false;
    }

    this.state.doorState = DoorState.OPENING;
    this.state.doorTimer = this.config.doorOperationTime;
    this.state.actionStartTime = currentTime;
    return true;
  }

  private closeDoors(currentTime: number): boolean {
    if (this.state.doorState === DoorState.CLOSED || 
        this.state.doorState === DoorState.CLOSING ||
        this.state.isMoving) {
      return false;
    }

    this.state.doorState = DoorState.CLOSING;
    this.state.doorTimer = this.config.doorOperationTime;
    this.state.actionStartTime = currentTime;
    return true;
  }

  private startMovement(targetFloor: number, currentTime: number): void {
    this.state.targetFloor = targetFloor;
    this.state.isMoving = true;
    this.state.moveTimer = this.config.floorTravelTime;
    this.state.actionStartTime = currentTime;
    
    // Set direction based on movement
    if (targetFloor > this.state.currentFloor) {
      this.state.direction = Direction.UP;
    } else if (targetFloor < this.state.currentFloor) {
      this.state.direction = Direction.DOWN;
    }
  }

  private updateDoorState(currentTime: number): void {
    if (this.state.doorTimer <= 0) {
      switch (this.state.doorState) {
        case DoorState.OPENING:
          this.state.doorState = DoorState.OPEN;
          // Start hold timer
          this.state.doorTimer = this.config.doorHoldTime;
          break;
        
        case DoorState.CLOSING:
          this.state.doorState = DoorState.CLOSED;
          break;
        
        case DoorState.OPEN:
          // Auto-close doors after hold time
          this.closeDoors(currentTime);
          break;
      }
    }
  }

  private updateMovement(currentTime: number): void {
    if (this.state.isMoving && this.state.moveTimer <= 0) {
      // Movement completed
      this.state.currentFloor = this.state.targetFloor!;
      this.state.targetFloor = null;
      this.state.isMoving = false;
      
      // Auto-open doors if we should stop at this floor
      if (this.shouldStopAtCurrentFloor()) {
        this.openDoors(currentTime);
      }
    }
  }

  private updateDirection(): void {
    if (this.state.isMoving) {
      return; // Don't change direction while moving
    }

    const requests = Array.from(this.state.requestedFloors);
    
    if (requests.length === 0) {
      this.state.direction = Direction.IDLE;
      return;
    }

    const currentFloor = this.state.currentFloor;
    const hasUpRequests = requests.some(floor => floor > currentFloor);
    const hasDownRequests = requests.some(floor => floor < currentFloor);

    // Continue in current direction if there are requests in that direction
    if (this.state.direction === Direction.UP && hasUpRequests) {
      return;
    }
    
    if (this.state.direction === Direction.DOWN && hasDownRequests) {
      return;
    }

    // Change direction or go idle
    if (hasUpRequests) {
      this.state.direction = Direction.UP;
    } else if (hasDownRequests) {
      this.state.direction = Direction.DOWN;
    } else {
      this.state.direction = Direction.IDLE;
    }
  }

  // ===== PUBLIC UTILITY METHODS =====

  /**
   * Check if elevator has any pending requests
   */
  hasRequests(): boolean {
    return this.state.requestedFloors.size > 0;
  }

  /**
   * Get current passenger count
   */
  getPassengerCount(): number {
    return this.state.passengers.length;
  }

  /**
   * Check if elevator is at capacity
   */
  isFull(): boolean {
    return this.state.passengers.length >= this.config.capacity;
  }

  /**
   * Check if elevator is idle (no movement, no requests)
   */
  isIdle(): boolean {
    return !this.state.isMoving && 
           this.state.requestedFloors.size === 0 && 
           this.state.direction === Direction.IDLE;
  }

  /**
   * Get distance to a specific floor
   */
  getDistanceToFloor(floor: number): number {
    return Math.abs(this.state.currentFloor - floor);
  }

  /**
   * Reset elevator to initial state
   */
  reset(initialFloor: number = 0): void {
    this.state = {
      currentFloor: Math.max(0, Math.min(initialFloor, this.config.floorCount - 1)),
      targetFloor: null,
      direction: Direction.IDLE,
      doorState: DoorState.CLOSED,
      doorTimer: 0,
      moveTimer: 0,
      passengers: [],
      requestedFloors: new Set(),
      dropoffFloors: new Set(),
      pickupFloors: new Set(),
      isMoving: false,
      actionStartTime: 0,
    };
  }
}

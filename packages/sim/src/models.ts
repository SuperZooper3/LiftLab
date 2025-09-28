/**
 * LiftLab Domain Models
 * Core types and interfaces for the elevator simulation engine
 */

// ===== ENUMS =====

/**
 * Direction of elevator movement
 */
export enum Direction {
  UP = 'up',
  DOWN = 'down',
  IDLE = 'idle',
}

/**
 * State of elevator doors
 */
export enum DoorState {
  OPEN = 'open',
  CLOSED = 'closed',
  OPENING = 'opening',
  CLOSING = 'closing',
}

/**
 * Elevator command actions
 */
export enum ElevatorAction {
  MOVE_UP = 'moveUp',
  MOVE_DOWN = 'moveDown',
  OPEN_DOORS = 'openDoors',
  CLOSE_DOORS = 'closeDoors',
  WAIT = 'wait',
}

/**
 * Simulation status
 */
export enum SimulationStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

// ===== CORE INTERFACES =====

/**
 * Passenger in the simulation
 * Represents a person requesting elevator service
 */
export interface Passenger {
  /** Unique identifier for the passenger */
  id: string;
  
  /** Floor where passenger starts (makes request) */
  startFloor: number;
  
  /** Floor where passenger wants to go */
  destinationFloor: number;
  
  /** Timestamp when passenger made the request (simulation time) */
  requestTime: number;
  
  /** Timestamp when passenger was picked up (optional) */
  pickupTime?: number;
  
  /** Timestamp when passenger was dropped off (optional) */
  dropoffTime?: number;
}

/**
 * Elevator state snapshot
 * Represents current state of an elevator
 */
export interface Elevator {
  /** Unique identifier for the elevator */
  id: string;
  
  /** Current floor position (0-based indexing) */
  currentFloor: number;
  
  /** Current movement direction */
  direction: Direction;
  
  /** Current door state */
  doorState: DoorState;
  
  /** Passengers currently in this elevator */
  passengers: Passenger[];
  
  /** Maximum capacity of passengers */
  capacity: number;
  
  /** Target floors to visit (internal queue) */
  targetFloors: Set<number>;
}

/**
 * Command to control an elevator
 */
export interface ElevatorCommand {
  /** ID of elevator to control */
  elevatorId: string;
  
  /** Action to perform */
  action: ElevatorAction;
  
  /** Optional target floor for move commands */
  targetFloor?: number;
}

/**
 * Building configuration
 */
export interface BuildingConfig {
  /** Total number of floors (1-based, so 10 floors = floors 1-10) */
  floorCount: number;
  
  /** Number of elevators in the building */
  elevatorCount: number;
  
  /** Floor height in pixels for visualization */
  floorHeight: number;
  
  /** Elevator capacity (max passengers) */
  elevatorCapacity: number;
}

/**
 * Simulation configuration
 */
export interface SimulationConfig {
  /** Building configuration */
  building: BuildingConfig;
  
  /** Passenger spawn rate (passengers per minute) */
  spawnRate: number;
  
  /** Random seed for deterministic simulation */
  seed: number;
  
  /** Simulation speed multiplier */
  speedMultiplier: number;
  
  /** Duration of simulation in minutes (0 = infinite) */
  duration: number;
}

/**
 * Simulation metrics
 */
export interface SimulationMetrics {
  /** Average time passengers wait for pickup (seconds) */
  averageWaitTime: number;
  
  /** Average time passengers spend traveling (seconds) */
  averageTravelTime: number;
  
  /** Total passengers that have made requests */
  totalPassengers: number;
  
  /** Total passengers that have been served (dropped off) */
  passengersServed: number;
  
  /** Maximum wait time recorded */
  maxWaitTime: number;
  
  /** Maximum travel time recorded */
  maxTravelTime: number;
  
  /** Current simulation time (seconds) */
  currentTime: number;
}

/**
 * Elevator algorithm interface
 * Implementations control elevator behavior
 */
export interface ElevatorAlgorithm {
  /** Algorithm name for display */
  name: string;
  
  /** Algorithm description */
  description: string;
  
  /**
   * Called every simulation tick to get elevator commands
   * @param elevators Current state of all elevators
   * @param waitingPassengers Passengers waiting for pickup
   * @param currentTime Current simulation time
   * @returns Commands to execute this tick
   */
  onTick(
    elevators: Elevator[],
    waitingPassengers: Passenger[],
    currentTime: number
  ): ElevatorCommand[];
  
  /**
   * Called when simulation starts (optional)
   * @param config Simulation configuration
   */
  onSimulationStart?(config: SimulationConfig): void;
  
  /**
   * Called when simulation ends (optional)
   * @param metrics Final simulation metrics
   */
  onSimulationEnd?(metrics: SimulationMetrics): void;
}

// ===== UTILITY TYPES =====

/**
 * Position in 2D space (for visualization)
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Elevator visual state for rendering
 */
export interface ElevatorVisualState extends Elevator {
  /** Visual position for smooth animations */
  visualPosition: Position;
  
  /** Whether elevator is currently moving */
  isMoving: boolean;
  
  /** Animation progress (0-1) for smooth movement */
  animationProgress: number;
}

/**
 * Passenger visual state for rendering
 */
export interface PassengerVisualState extends Passenger {
  /** Visual position */
  position: Position;
  
  /** Whether passenger is in an elevator */
  inElevator: boolean;
  
  /** ID of elevator passenger is in (if any) */
  elevatorId?: string;
}

/**
 * Complete simulation state snapshot
 */
export interface SimulationState {
  /** Current simulation status */
  status: SimulationStatus;
  
  /** Current simulation time (seconds) */
  currentTime: number;
  
  /** All elevators and their states */
  elevators: Elevator[];
  
  /** Passengers waiting for pickup */
  waitingPassengers: Passenger[];
  
  /** Passengers currently traveling */
  travelingPassengers: Passenger[];
  
  /** Passengers who have completed their journey */
  completedPassengers: Passenger[];
  
  /** Current metrics */
  metrics: SimulationMetrics;
  
  /** Configuration used for this simulation */
  config: SimulationConfig;
}

// ===== TYPE GUARDS =====

/**
 * Type guard to check if a passenger is waiting
 */
export function isWaitingPassenger(passenger: Passenger): boolean {
  return passenger.pickupTime === undefined;
}

/**
 * Type guard to check if a passenger is traveling
 */
export function isTravelingPassenger(passenger: Passenger): boolean {
  return passenger.pickupTime !== undefined && passenger.dropoffTime === undefined;
}

/**
 * Type guard to check if a passenger has completed their journey
 */
export function isCompletedPassenger(passenger: Passenger): boolean {
  return passenger.dropoffTime !== undefined;
}

/**
 * Check if elevator is at capacity
 */
export function isElevatorFull(elevator: Elevator): boolean {
  return elevator.passengers.length >= elevator.capacity;
}

/**
 * Check if elevator has no passengers
 */
export function isElevatorEmpty(elevator: Elevator): boolean {
  return elevator.passengers.length === 0;
}

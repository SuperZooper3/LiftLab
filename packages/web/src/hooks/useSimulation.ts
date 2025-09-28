/**
 * useSimulation Hook
 * Manages the connection between UI state and the actual simulation engine
 */

import { useEffect, useRef, useState } from 'react';
import { 
  ElevatorCar, 
  ElevatorConfig, 
  PassengerSpawner,
  createSeededRNG,
  createTicker,
  GreedyAlgorithm,
  Elevator,
  Passenger
} from '@lift-lab/sim';
import { useAppStore } from '../store';

export function useSimulation() {
  const { 
    config, 
    status, 
    speed, 
    setStatus, 
    updateMetrics,
    resetMetrics 
  } = useAppStore();
  
  // Simulation state
  const [elevatorStates, setElevatorStates] = useState<Elevator[]>([]);
  const [waitingPassengers, setWaitingPassengers] = useState<Passenger[]>([]);
  
  // Simulation objects
  const elevatorsRef = useRef<ElevatorCar[]>([]);
  const spawnerRef = useRef<PassengerSpawner | null>(null);
  const tickerRef = useRef<ReturnType<typeof createTicker> | null>(null);
  const algorithmRef = useRef(new GreedyAlgorithm());
  const completedPassengersRef = useRef<Passenger[]>([]);
  
  // Initialize simulation
  const initializeSimulation = () => {
    console.log('🎢 Initializing simulation...', { floors: config.floors, elevators: config.elevators });
    
    // Reset metrics
    resetMetrics();
    completedPassengersRef.current = [];
    
    // Create elevators
    elevatorsRef.current = [];
    for (let i = 0; i < config.elevators; i++) {
      const elevatorConfig: ElevatorConfig = {
        id: `elevator_${i}`,
        capacity: 8,
        floorTravelTime: 2.0,
        doorOperationTime: 1.0,
        doorHoldTime: 3.0,
        floorCount: config.floors,
      };
      const elevator = new ElevatorCar(elevatorConfig, 0);
      elevatorsRef.current.push(elevator);
    }
    
    // Create passenger spawner
    const rng = createSeededRNG(Date.now());
    spawnerRef.current = new PassengerSpawner({
      floorCount: config.floors,
      spawnRate: 30.0, // 30 passengers per minute (much higher for testing)
      rng,
      minSpawnInterval: 0.1, // Reduce minimum spawn interval to 0.1 seconds
      maxWaitingPerFloor: 15, // Allow more passengers per floor
    });
    
    console.log('👷 Spawner created:', {
      floorCount: config.floors,
      spawnRate: 30.0,
      minSpawnInterval: 0.1,
      maxWaitingPerFloor: 15
    });
    
    // Update initial elevator states
    updateElevatorStates();
    setWaitingPassengers([]);
    
    // Add some test passengers for debugging
    const testPassengers = [
      {
        id: 'test-1',
        startFloor: 0,
        destinationFloor: 5,
        requestTime: 0,
      },
      {
        id: 'test-2', 
        startFloor: 2,
        destinationFloor: 8,
        requestTime: 0,
      },
      {
        id: 'test-3',
        startFloor: 1,
        destinationFloor: 3,
        requestTime: 0,
      }
    ];
    
    console.log('🧪 Adding test passengers:', testPassengers);
    setWaitingPassengers(testPassengers);
    
    console.log('✅ Simulation initialized');
  };
  
  // Update elevator states for the canvas
  const updateElevatorStates = () => {
    const states = elevatorsRef.current.map(elevator => elevator.getState());
    setElevatorStates(states);
  };
  
  // Main simulation step
  const simulationStep = (deltaTime: number, totalTime: number) => {
    console.log('🔄 Simulation step:', { deltaTime, totalTime, elevatorCount: elevatorsRef.current.length });
    
    if (!spawnerRef.current || elevatorsRef.current.length === 0) {
      console.warn('⚠️ Missing spawner or elevators:', { 
        spawner: !!spawnerRef.current, 
        elevators: elevatorsRef.current.length 
      });
      return;
    }
    
    // Spawn new passengers
    const waitingCounts = new Array(config.floors).fill(0);
    waitingPassengers.forEach(p => waitingCounts[p.startFloor]++);
    
    const newPassengers = spawnerRef.current.nextTick(deltaTime, totalTime, waitingCounts);
    console.log('👥 Passenger spawning:', { 
      deltaTime,
      totalTime,
      newPassengers: newPassengers.length, 
      currentWaiting: waitingPassengers.length,
      waitingCounts,
      spawnRate: spawnerRef.current.config?.spawnRate
    });
    
    const allWaiting = [...waitingPassengers, ...newPassengers];
    
    if (newPassengers.length > 0) {
      console.log('🆕 New passengers:', newPassengers.map(p => `Floor ${p.startFloor} → ${p.destinationFloor}`));
    }
    
    // Step each elevator
    for (let i = 0; i < elevatorsRef.current.length; i++) {
      const elevator = elevatorsRef.current[i];
      const prevState = elevator.getState();
      
      elevator.step(deltaTime, totalTime);
      
      const currentState = elevator.getState();
      if (prevState.currentFloor !== currentState.currentFloor || 
          prevState.doorState !== currentState.doorState ||
          prevState.direction !== currentState.direction) {
        console.log(`🏢 Elevator ${i + 1}:`, {
          floor: `${prevState.currentFloor} → ${currentState.currentFloor}`,
          doors: `${prevState.doorState} → ${currentState.doorState}`,
          direction: `${prevState.direction} → ${currentState.direction}`,
          passengers: currentState.passengers.length
        });
      }
      
      // Run algorithm
      const elevatorStates = elevatorsRef.current.map(e => e.getState());
      const commands = algorithmRef.current.onTick(elevatorStates, allWaiting, totalTime);
      
      console.log(`🤖 Algorithm commands for E${i + 1}:`, commands.filter(c => c.elevatorId === elevator.getState().id));
      
      // Execute commands
      for (const command of commands) {
        if (command.elevatorId === elevator.getState().id) {
          const success = elevator.executeCommand(command, totalTime);
          console.log(`⚡ Command executed:`, { command: command.action, success });
        }
      }
      
      // Handle passenger boarding
      const boarded = elevator.boardPassengers(allWaiting, totalTime);
      
      // Handle passenger disembarking
      const disembarked = elevator.disembarkPassengers(totalTime);
      completedPassengersRef.current.push(...disembarked);
      
      // Remove boarded passengers from waiting list
      for (const passenger of boarded) {
        const index = allWaiting.indexOf(passenger);
        if (index >= 0) {
          allWaiting.splice(index, 1);
        }
      }
    }
    
    // Update state
    setWaitingPassengers(allWaiting);
    updateElevatorStates();
    
    // Update metrics
    updateMetricsData(totalTime);
  };
  
  // Calculate and update metrics
  const updateMetricsData = (currentTime: number) => {
    const completed = completedPassengersRef.current;
    const total = completed.length + waitingPassengers.length;
    
    if (completed.length > 0) {
      const waitTimes = completed
        .filter(p => p.pickupTime !== undefined)
        .map(p => p.pickupTime! - p.requestTime);
      
      const travelTimes = completed
        .filter(p => p.dropoffTime !== undefined && p.pickupTime !== undefined)
        .map(p => p.dropoffTime! - p.pickupTime!);
      
      const avgWait = waitTimes.length > 0 
        ? waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length 
        : 0;
      
      const avgTravel = travelTimes.length > 0
        ? travelTimes.reduce((a, b) => a + b, 0) / travelTimes.length
        : 0;
      
      updateMetrics({
        avgWaitTime: avgWait,
        avgTravelTime: avgTravel,
        totalPassengers: total,
        passengersServed: completed.length,
      });
    } else {
      updateMetrics({
        totalPassengers: total,
        passengersServed: 0,
      });
    }
  };
  
  // Start simulation
  const startSimulation = () => {
    console.log('▶️ Starting simulation...');
    
    if (!tickerRef.current) {
      const baseTickRate = 10; // 10 TPS base rate
      const adjustedTickRate = baseTickRate * speed;
      
      console.log('🎯 Creating ticker:', { baseTickRate, speed, adjustedTickRate });
      tickerRef.current = createTicker(adjustedTickRate);
      tickerRef.current.onTick(simulationStep);
    }
    
    console.log('🚀 Starting ticker...');
    tickerRef.current.start();
  };
  
  // Pause simulation
  const pauseSimulation = () => {
    console.log('⏸️ Pausing simulation...');
    tickerRef.current?.pause();
  };
  
  // Resume simulation
  const resumeSimulation = () => {
    console.log('▶️ Resuming simulation...');
    tickerRef.current?.resume();
  };
  
  // Stop and reset simulation
  const resetSimulation = () => {
    console.log('🔄 Resetting simulation...');
    
    tickerRef.current?.stop();
    tickerRef.current = null;
    
    // Clear all state
    elevatorsRef.current = [];
    spawnerRef.current = null;
    completedPassengersRef.current = [];
    setElevatorStates([]);
    setWaitingPassengers([]);
    resetMetrics();
  };
  
  // React to status changes
  useEffect(() => {
    switch (status) {
      case 'running':
        if (elevatorsRef.current.length === 0) {
          // First time starting - initialize
          initializeSimulation();
          startSimulation();
        } else {
          // Resuming
          resumeSimulation();
        }
        break;
        
      case 'paused':
        pauseSimulation();
        break;
        
      case 'idle':
        resetSimulation();
        break;
    }
  }, [status, config.floors, config.elevators]);
  
  // React to speed changes
  useEffect(() => {
    if (tickerRef.current && status === 'running') {
      const baseTickRate = 10;
      const adjustedTickRate = baseTickRate * speed;
      console.log('⚡ Updating tick rate:', { speed, adjustedTickRate });
      tickerRef.current.setTickRate(adjustedTickRate);
    }
  }, [speed, status]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      tickerRef.current?.stop();
    };
  }, []);
  
  return {
    elevatorStates,
    waitingPassengers,
    isRunning: status === 'running',
  };
}

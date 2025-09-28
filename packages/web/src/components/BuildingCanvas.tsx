/**
 * BuildingCanvas - Konva-based elevator visualization
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Rect, Text, Group } from 'react-konva';
import Konva from 'konva';
import { Elevator, Passenger } from '@lift-lab/sim';

interface BuildingCanvasProps {
  /** Number of floors in the building */
  floors: number;
  
  /** Number of elevators */
  elevators: number;
  
  /** Current elevator states (optional for animation) */
  elevatorStates?: Elevator[];
  
  /** Waiting passengers on each floor */
  waitingPassengers?: Passenger[];
}

const FLOOR_HEIGHT = 60; // Increased for better spacing
const SHAFT_WIDTH = 120; // Spacing between shafts
const ELEVATOR_WIDTH = 100; // Bigger elevator cars
const ELEVATOR_HEIGHT = 50; // Bigger elevator cars
const MARGIN = 40;
const FLOOR_LABEL_WIDTH = 80; // Space for floor labels on the left
const PASSENGER_AREA_WIDTH = 100; // Space to the right of shafts for passengers

// Pastel colors for elevators (cycles after 5)
const ELEVATOR_COLORS = [
  '#FFB3BA', // Light pink
  '#BAFFC9', // Light green  
  '#BAE1FF', // Light blue
  '#FFFFBA', // Light yellow
  '#FFDFBA', // Light peach
];

// Function to get elevator color
const getElevatorColor = (elevatorIndex: number): string => {
  return ELEVATOR_COLORS[elevatorIndex % ELEVATOR_COLORS.length];
};

export function BuildingCanvas({ 
  floors, 
  elevators, 
  elevatorStates,
  waitingPassengers = []
}: BuildingCanvasProps) {
  const elevatorRefs = useRef<(Konva.Group | null)[]>([]);
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Pan and zoom state
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  // Calculate dimensions (use full size, no auto-scaling)
  const buildingHeight = floors * FLOOR_HEIGHT;
  const buildingWidth = elevators * SHAFT_WIDTH;
  
  // Use full-size dimensions
  const scaledFloorHeight = FLOOR_HEIGHT;
  const scaledShaftWidth = SHAFT_WIDTH;
  const scaledElevatorWidth = ELEVATOR_WIDTH;
  const scaledElevatorHeight = ELEVATOR_HEIGHT;
  
  // Start building at margin offset, with space for floor labels
  const offsetX = MARGIN + FLOOR_LABEL_WIDTH;
  const offsetY = MARGIN;

  // Resize observer to track container dimensions
  const updateDimensions = useCallback(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      setDimensions({ width: clientWidth, height: clientHeight });
    }
  }, []);

  useEffect(() => {
    updateDimensions();
    
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [updateDimensions]);

  // Pan and zoom handlers
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    
    const stage = e.target.getStage();
    if (!stage) return;
    
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    
    // Zoom sensitivity
    const scaleBy = 1.1;
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    
    // Constrain zoom levels
    const clampedScale = Math.max(0.3, Math.min(3, newScale));
    
    setStageScale(clampedScale);
    
    // Calculate new position to zoom towards mouse
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    
    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };
    
    setStagePos(newPos);
  };
  
  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    setStagePos({
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  // No animations - instant positioning for clean timing

  return (
    <div 
      ref={containerRef}
      className="w-full h-full bg-gradient-to-b from-cream-50 to-cream-100 rounded-lg border border-cream-200 overflow-hidden"
    >
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        draggable
        onWheel={handleWheel}
        onDragEnd={handleDragEnd}
        ref={stageRef}
      >
        <Layer>
          {/* Render shared floor labels on the left */}
          {Array.from({ length: floors }).map((_, floorIndex) => {
            const floorNumber = floors - floorIndex - 1; // Top floor = highest number
            return (
              <Text
                key={`floor-label-${floorIndex}`}
                x={MARGIN}
                y={offsetY + floorIndex * scaledFloorHeight + scaledFloorHeight / 2 - 10}
                text={`Floor ${floorNumber}`}
                fontSize={16}
                fill="#804d25" // cream-900
                fontFamily="Arial, sans-serif"
                fontStyle="bold"
                align="left"
                width={FLOOR_LABEL_WIDTH - 10}
              />
            );
          })}

          {/* Render elevator shafts */}
          {Array.from({ length: elevators }).map((_, elevatorIndex) => {
            const shaftX = offsetX + elevatorIndex * scaledShaftWidth;
            
            return (
              <React.Fragment key={`shaft-${elevatorIndex}`}>
                {/* Shaft background */}
                <Rect
                  x={shaftX}
                  y={offsetY}
                  width={scaledShaftWidth}
                  height={buildingHeight}
                  fill="#f5dab0" // cream-300 from our palette
                  stroke="#efc485" // cream-400
                  strokeWidth={2}
                />
                
                {/* Floor lines */}
                {Array.from({ length: floors - 1 }).map((_, floorIndex) => (
                  <Rect
                    key={`floor-line-${elevatorIndex}-${floorIndex}`}
                    x={shaftX}
                    y={offsetY + (floorIndex + 1) * scaledFloorHeight}
                    width={scaledShaftWidth}
                    height={1}
                    fill="#d68d3e" // cream-600
                  />
                ))}
              </React.Fragment>
            );
          })}
          
                  {/* Render elevator cars */}
                  {Array.from({ length: elevators }).map((_, elevatorIndex) => {
                    const shaftX = offsetX + elevatorIndex * scaledShaftWidth;
                    
                    // Use elevator state if provided, otherwise default to floor 0
                    const elevatorState = elevatorStates?.[elevatorIndex];
                    const currentFloor = elevatorState?.currentFloor ?? 0;
                    const passengers = elevatorState?.passengers ?? [];
                    const isDoorsOpen = elevatorState?.doorState === 'open';
                    const direction = elevatorState?.direction ?? 'idle';
                    const elevatorColor = getElevatorColor(elevatorIndex);
                    
                    // Calculate Y position (floor 0 is at bottom) - instant positioning
                    const elevatorY = offsetY + (floors - currentFloor - 1) * scaledFloorHeight + 
                                     (scaledFloorHeight - scaledElevatorHeight) / 2;
                    
                    const elevatorX = shaftX + (scaledShaftWidth - scaledElevatorWidth) / 2;
                    
                    // Generate more detailed state text
                    let stateText = '';
                    if (isDoorsOpen) {
                      if (passengers.length > 0) {
                        stateText = 'Unloading';
                      } else {
                        stateText = 'Loading';
                      }
                    } else if (direction === 'up') {
                      stateText = 'Going Up';
                    } else if (direction === 'down') {
                      stateText = 'Going Down';
                    } else {
                      // Check if there are passengers waiting on this floor
                      const waitingOnFloor = waitingPassengers?.filter(p => p.startFloor === currentFloor).length || 0;
                      if (waitingOnFloor > 0 && passengers.length < 8) {
                        stateText = 'Opening...';
                      } else if (passengers.length > 0) {
                        stateText = 'Planning';
                      } else {
                        stateText = 'Idle';
                      }
                    }
                    
                    return (
                      <Group
                        key={`elevator-${elevatorIndex}`}
                        x={elevatorX}
                        y={elevatorY}
                        ref={(node) => {
                          elevatorRefs.current[elevatorIndex] = node;
                        }}
                      >
                        {/* Elevator car */}
                        <Rect
                          x={0}
                          y={0}
                          width={scaledElevatorWidth}
                          height={scaledElevatorHeight}
                          fill={elevatorColor}
                          stroke={isDoorsOpen ? "#7d9a7d" : "#666"} // Green border if doors open
                          strokeWidth={2}
                          cornerRadius={6}
                        />
                        
                        {/* Elevator ID */}
                        <Text
                          x={5}
                          y={5}
                          text={`E${elevatorIndex + 1}`}
                          fontSize={12}
                          fill="#333"
                          fontFamily="Arial, sans-serif"
                          fontStyle="bold"
                        />
                        
                        {/* State text */}
                        <Text
                          x={5}
                          y={scaledElevatorHeight - 15}
                          text={stateText}
                          fontSize={10}
                          fill="#333"
                          fontFamily="Arial, sans-serif"
                        />
                        
                        {/* Passengers inside elevator */}
                        {passengers.map((passenger, pIndex) => {
                          // Better positioning: 4 passengers per row, centered in elevator
                          const passengersPerRow = 4;
                          const passengerSize = 12;
                          const spacing = 16;
                          const row = Math.floor(pIndex / passengersPerRow);
                          const col = pIndex % passengersPerRow;
                          
                          // Center the passengers in the elevator
                          const startX = (scaledElevatorWidth - (passengersPerRow - 1) * spacing) / 2;
                          const startY = 20; // Start below the elevator ID
                          
                          const passengerX = startX + col * spacing;
                          const passengerY = startY + row * spacing;
                          
                          return (
                            <Group key={`elevator-passenger-${passenger.id}`} x={passengerX} y={passengerY}>
                              {/* Passenger circle */}
                              <Rect
                                x={-passengerSize/2}
                                y={-passengerSize/2}
                                width={passengerSize}
                                height={passengerSize}
                                fill="#5f7f5f" // Darker green for traveling passengers
                                cornerRadius={passengerSize/2}
                                stroke="#4a654a"
                                strokeWidth={1}
                              />
                              
                              {/* Destination number */}
                              <Text
                                x={-passengerSize/2}
                                y={-4}
                                text={passenger.destinationFloor.toString()}
                                fontSize={8}
                                fill="white"
                                fontFamily="Arial, sans-serif"
                                fontStyle="bold"
                                align="center"
                                width={passengerSize}
                              />
                            </Group>
                          );
                        })}
                      </Group>
                    );
                  })}
                  
                  {/* Render waiting passengers to the right of shafts */}
                  {waitingPassengers.map((passenger, index) => {
                    const floorIndex = floors - passenger.startFloor - 1; // Convert to visual index
                    const y = offsetY + floorIndex * scaledFloorHeight + scaledFloorHeight / 2; // Center of floor
                    
                    // Position passengers to the right of all shafts
                    const passengersOnFloor = waitingPassengers.filter(p => p.startFloor === passenger.startFloor);
                    const passengerIndex = passengersOnFloor.indexOf(passenger);
                    const spacing = 25; // Fixed spacing between passengers
                    const passengerAreaStart = offsetX + buildingWidth + 20; // Start after all shafts
                    const x = passengerAreaStart + (passengerIndex * spacing);
                    
                    return (
                      <Group key={`passenger-${passenger.id}`} x={x} y={y}>
                        {/* Passenger circle */}
                        <Rect
                          x={-10}
                          y={-10}
                          width={20}
                          height={20}
                          fill="#d68d3e" // Orange circle
                          cornerRadius={10} // Make it a circle
                          stroke="#b8722e" // Darker orange border
                          strokeWidth={1}
                        />
                        
                        {/* Destination number */}
                        <Text
                          x={-10}
                          y={-6}
                          text={passenger.destinationFloor.toString()}
                          fontSize={12}
                          fill="white"
                          fontFamily="Arial, sans-serif"
                          fontStyle="bold"
                          align="center"
                          width={20}
                        />
                      </Group>
                    );
                  })}
                  
                </Layer>
              </Stage>
    </div>
  );
}

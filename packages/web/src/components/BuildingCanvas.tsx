/**
 * BuildingCanvas - Konva-based elevator visualization
 */

import React, { useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Group } from 'react-konva';
import Konva from 'konva';
import { Elevator } from '@lift-lab/sim';

interface BuildingCanvasProps {
  /** Number of floors in the building */
  floors: number;
  
  /** Number of elevators */
  elevators: number;
  
  /** Current elevator states (optional for animation) */
  elevatorStates?: Elevator[];
  
  /** Canvas dimensions */
  width?: number;
  height?: number;
}

const FLOOR_HEIGHT = 50;
const SHAFT_WIDTH = 100;
const ELEVATOR_WIDTH = 85;
const ELEVATOR_HEIGHT = 40;
const MARGIN = 40;

export function BuildingCanvas({ 
  floors, 
  elevators, 
  elevatorStates,
  width = 800, 
  height = 600 
}: BuildingCanvasProps) {
  const elevatorRefs = useRef<(Konva.Group | null)[]>([]);
  const prevElevatorStates = useRef<Elevator[]>([]);
  // Calculate dimensions
  const buildingHeight = floors * FLOOR_HEIGHT;
  const buildingWidth = elevators * SHAFT_WIDTH;
  
  // Scale to fit canvas
  const scaleX = Math.min(1, (width - MARGIN * 2) / buildingWidth);
  const scaleY = Math.min(1, (height - MARGIN * 2) / buildingHeight);
  const scale = Math.min(scaleX, scaleY);
  
  const scaledFloorHeight = FLOOR_HEIGHT * scale;
  const scaledShaftWidth = SHAFT_WIDTH * scale;
  const scaledElevatorWidth = ELEVATOR_WIDTH * scale;
  const scaledElevatorHeight = ELEVATOR_HEIGHT * scale;
  
  // Center the building
  const offsetX = (width - buildingWidth * scale) / 2;
  const offsetY = (height - buildingHeight * scale) / 2;

  // Animation effect for elevator movement
  useEffect(() => {
    if (!elevatorStates) return;

    elevatorStates.forEach((currentState, index) => {
      const elevatorGroup = elevatorRefs.current[index];
      const prevState = prevElevatorStates.current[index];
      
      if (elevatorGroup && prevState && currentState.currentFloor !== prevState.currentFloor) {
        // Calculate new Y position
        const newY = offsetY + (floors - currentState.currentFloor - 1) * scaledFloorHeight + 
                     (scaledFloorHeight - scaledElevatorHeight) / 2;
        
        // Animate to new position
        const tween = new Konva.Tween({
          node: elevatorGroup,
          duration: 0.8, // 800ms animation
          y: newY,
          easing: Konva.Easings.EaseInOut,
        });
        
        tween.play();
      }
    });

    // Update previous states
    prevElevatorStates.current = elevatorStates ? [...elevatorStates] : [];
  }, [elevatorStates, floors, offsetY, scaledFloorHeight, scaledElevatorHeight]);

  return (
    <div className="w-full h-full bg-gradient-to-b from-cream-50 to-cream-100 rounded-lg border border-cream-200">
      <Stage width={width} height={height}>
        <Layer>
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
                  height={buildingHeight * scale}
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
                
                {/* Floor numbers */}
                {Array.from({ length: floors }).map((_, floorIndex) => {
                  const floorNumber = floors - floorIndex - 1; // Top floor = highest number
                  return (
                    <Text
                      key={`floor-label-${elevatorIndex}-${floorIndex}`}
                      x={shaftX + 5}
                      y={offsetY + floorIndex * scaledFloorHeight + scaledFloorHeight / 2 - 8}
                      text={floorNumber.toString()}
                      fontSize={12 * scale}
                      fill="#804d25" // cream-900
                      fontFamily="Arial"
                    />
                  );
                })}
              </React.Fragment>
            );
          })}
          
          {/* Render elevator cars */}
          {Array.from({ length: elevators }).map((_, elevatorIndex) => {
            const shaftX = offsetX + elevatorIndex * scaledShaftWidth;
            
            // Use elevator state if provided, otherwise default to floor 0
            const elevatorState = elevatorStates?.[elevatorIndex];
            const currentFloor = elevatorState?.currentFloor ?? 0;
            const passengerCount = elevatorState?.passengers?.length ?? 0;
            const isDoorsOpen = elevatorState?.doorState === 'open';
            
            // Calculate Y position (floor 0 is at bottom)
            const elevatorY = offsetY + (floors - currentFloor - 1) * scaledFloorHeight + 
                             (scaledFloorHeight - scaledElevatorHeight) / 2;
            
            const elevatorX = shaftX + (scaledShaftWidth - scaledElevatorWidth) / 2;
            
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
                  fill={isDoorsOpen ? "#7d9a7d" : "#a688bd"} // sage-400 if doors open, lavender-500 if closed
                  stroke="#8d6ba3" // lavender-600
                  strokeWidth={2}
                  cornerRadius={4}
                />
                
                {/* Elevator ID */}
                <Text
                  x={0}
                  y={scaledElevatorHeight / 2 - 8}
                  text={`E${elevatorIndex + 1}`}
                  fontSize={12 * scale}
                  fill="white"
                  fontFamily="Arial, sans-serif"
                  fontStyle="bold"
                  align="center"
                  width={scaledElevatorWidth}
                />
                
                {/* Passenger count */}
                <Text
                  x={0}
                  y={scaledElevatorHeight / 2 + 4}
                  text={`${passengerCount}/8`}
                  fontSize={10 * scale}
                  fill="white"
                  fontFamily="Arial, sans-serif"
                  align="center"
                  width={scaledElevatorWidth}
                />
              </Group>
            );
          })}
          
        </Layer>
      </Stage>
    </div>
  );
}

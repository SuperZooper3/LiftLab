/**
 * BuildingCanvas - Konva-based elevator visualization
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
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
}

const FLOOR_HEIGHT = 50;
const SHAFT_WIDTH = 120; // Increased spacing between shafts
const ELEVATOR_WIDTH = 85;
const ELEVATOR_HEIGHT = 40;
const MARGIN = 40;
const FLOOR_LABEL_WIDTH = 80; // Space for floor labels on the left

export function BuildingCanvas({ 
  floors, 
  elevators, 
  elevatorStates
}: BuildingCanvasProps) {
  const elevatorRefs = useRef<(Konva.Group | null)[]>([]);
  const prevElevatorStates = useRef<Elevator[]>([]);
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
                  fontSize={14}
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
                  fontSize={12}
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

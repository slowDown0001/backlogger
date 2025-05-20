"use client";

import { useState, useEffect } from "react";
import Tile from "./tile";
import { DragDropContext, DropResult } from "@adaptabletools/react-beautiful-dnd";
import { createClient } from "@/utils/supabase/client";

interface Task {
  id: string;
  tile_id: string;
  title: string;
  description?: string;
  position: number;
  is_completed: boolean;
  created_by: string;
}

interface TileWithTasks {
  id: string;
  title: string;
  tasks: Task[];
}

export interface DragDropWrapperProps {
  tilesWithTasks: TileWithTasks[];
  currentUserId: string;
}

export default function DragDropWrapper({ 
  tilesWithTasks: initialTilesWithTasks, 
  currentUserId 
}: DragDropWrapperProps) {
  const [tilesWithTasks, setTilesWithTasks] = useState<TileWithTasks[]>(initialTilesWithTasks);

  useEffect(() => {
    setTilesWithTasks(initialTilesWithTasks);
  }, [initialTilesWithTasks]);

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination } = result;
    
    // Early returns for invalid states
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // Save original state for potential revert
    const originalTiles = [...tilesWithTasks];

    try {
      // Optimistic update
      const newTilesWithTasks = [...tilesWithTasks];
      const sourceTileIndex = newTilesWithTasks.findIndex(tile => tile.id === source.droppableId);
      const destTileIndex = newTilesWithTasks.findIndex(tile => tile.id === destination.droppableId);

      if (sourceTileIndex === -1 || destTileIndex === -1) return;

      const sourceTasks = [...newTilesWithTasks[sourceTileIndex].tasks];
      const [movedTask] = sourceTasks.splice(source.index, 1);

      let destTasks: any[] = [];
      if (source.droppableId === destination.droppableId) {
        // Same tile reordering
        sourceTasks.splice(destination.index, 0, movedTask);
        newTilesWithTasks[sourceTileIndex] = {
          ...newTilesWithTasks[sourceTileIndex],
          tasks: sourceTasks,
        };
      } else {
        // Different tile movement
        destTasks = [...newTilesWithTasks[destTileIndex].tasks];
        destTasks.splice(destination.index, 0, { ...movedTask, tile_id: destination.droppableId });

        newTilesWithTasks[sourceTileIndex] = {
          ...newTilesWithTasks[sourceTileIndex],
          tasks: sourceTasks,
        };
        newTilesWithTasks[destTileIndex] = {
          ...newTilesWithTasks[destTileIndex],
          tasks: destTasks,
        };
      }

      setTilesWithTasks(newTilesWithTasks);

      // Server update using provided PostgreSQL functions
      const supabase = createClient();
      if (source.droppableId === destination.droppableId) {
        // Reordering within the same tile
        const taskIds = sourceTasks.map(t => t.id);
        const positions = sourceTasks.map((_, i) => i + 1);
        const { error } = await supabase.rpc('update_task_positions', {
          task_ids: taskIds,
          new_positions: positions
        });
        if (error) throw error;
      } else {
        // Moving between tiles
        const sourceTaskIds = sourceTasks.map(t => t.id);
        const sourcePositions = sourceTasks.map((_, i) => i + 1);
        const destTaskIds = destTasks.map(t => t.id);
        const destPositions = destTasks.map((_, i) => i + 1);

        await Promise.all([
          supabase.rpc('update_task_positions', {
            task_ids: sourceTaskIds,
            new_positions: sourcePositions
          }),
          supabase.rpc('update_task_positions_and_tile', {
            task_ids: destTaskIds,
            new_positions: destPositions,
            new_tile_id: destination.droppableId
          })
        ]);
      }
    } catch (error) {
      console.error("Update failed:", error);
      // Revert to original state on error
      setTilesWithTasks(originalTiles);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto">
        {tilesWithTasks.map(tile => (
          <Tile key={tile.id} {...tile} currentUserId={currentUserId} />
        ))}
      </div>
    </DragDropContext>
  );
}
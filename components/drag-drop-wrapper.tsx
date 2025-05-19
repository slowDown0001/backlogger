"use client";

import { useState } from "react";
import Tile from "./tile";
import { DragDropContext } from "@adaptabletools/react-beautiful-dnd";
import { createClient } from "@/utils/supabase/client";

interface DragDropWrapperProps {
  tilesWithTasks: { id: string; title: string; tasks: { id: string; tile_id: string; title: string; description?: string; position: number; is_completed: boolean; created_by: string }[] }[];
  currentUserId: string;
}

export default function DragDropWrapper({ tilesWithTasks: initialTilesWithTasks, currentUserId }: DragDropWrapperProps) {
  const [tilesWithTasks, setTilesWithTasks] = useState(initialTilesWithTasks);

  const handleDragEnd = async (result: any) => {
    const { source, destination } = result;

    // If no destination, return
    if (!destination) return;

    const supabase = createClient();

    // Copy the current state
    const newTilesWithTasks = [...tilesWithTasks];

    // Find source and destination tiles
    const sourceTileIndex = newTilesWithTasks.findIndex(tile => tile.id === source.droppableId);
    const destTileIndex = newTilesWithTasks.findIndex(tile => tile.id === destination.droppableId);

    if (sourceTileIndex === -1 || destTileIndex === -1) return;

    const sourceTasks = [...newTilesWithTasks[sourceTileIndex].tasks];
    const [movedTask] = sourceTasks.splice(source.index, 1);

    if (source.droppableId === destination.droppableId) {
      // Reordering within the same tile
      sourceTasks.splice(destination.index, 0, movedTask);
      newTilesWithTasks[sourceTileIndex] = {
        ...newTilesWithTasks[sourceTileIndex],
        tasks: sourceTasks,
      };

      // Update positions in the database
      const updatedTasks = sourceTasks.map((task, index) => ({
        ...task,
        position: index + 1,
      }));

      for (const task of updatedTasks) {
        await supabase
          .from("tasks")
          .update({ position: task.position })
          .eq("id", task.id);
      }

      setTilesWithTasks(newTilesWithTasks);
    } else {
      // Moving between tiles
      const destTasks = [...newTilesWithTasks[destTileIndex].tasks];
      destTasks.splice(destination.index, 0, movedTask);

      newTilesWithTasks[sourceTileIndex] = {
        ...newTilesWithTasks[sourceTileIndex],
        tasks: sourceTasks,
      };
      newTilesWithTasks[destTileIndex] = {
        ...newTilesWithTasks[destTileIndex],
        tasks: destTasks,
      };

      // Update positions and tile_id in the database
      const updatedSourceTasks = sourceTasks.map((task, index) => ({
        ...task,
        position: index + 1,
      }));
      const updatedDestTasks = destTasks.map((task, index) => ({
        ...task,
        position: index + 1,
      }));

      // Update source tile tasks
      for (const task of updatedSourceTasks) {
        await supabase
          .from("tasks")
          .update({ position: task.position })
          .eq("id", task.id);
      }

      // Update destination tile tasks (including the moved task's tile_id)
      for (const task of updatedDestTasks) {
        await supabase
          .from("tasks")
          .update({
            tile_id: newTilesWithTasks[destTileIndex].id,
            position: task.position,
          })
          .eq("id", task.id);
      }

      setTilesWithTasks(newTilesWithTasks);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto">
        {tilesWithTasks.map(tile => (
          <Tile
            key={tile.id}
            id={tile.id}
            title={tile.title}
            tasks={tile.tasks}
            currentUserId={currentUserId}
          />
        ))}
      </div>
    </DragDropContext>
  );
}
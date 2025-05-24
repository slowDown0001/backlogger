"use client";

import { useState, useEffect, useRef } from "react";
import Tile from "./tile";
import { DragDropContext } from "@/components/drag-drop";
import { createClient } from "@/utils/supabase/client";
import { DropResult } from "@adaptabletools/react-beautiful-dnd";

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
  position: number;
  tasks: Task[];
  color: string;
}

export interface DragDropWrapperProps {
  tilesWithTasks: TileWithTasks[];
  currentUserId: string;
  workspaceId: string; // Added for future-proofing
}

export default function DragDropWrapper({
  tilesWithTasks: initialTilesWithTasks,
  currentUserId,
  workspaceId,
}: DragDropWrapperProps) {
  const [tilesWithTasks, setTilesWithTasks] = useState<TileWithTasks[]>(initialTilesWithTasks);
  const [shouldCenter, setShouldCenter] = useState(true); // Track if tiles should be centered
  const containerRef = useRef<HTMLDivElement>(null); // Ref to the container div

  // 🔄 Refresh board data from Supabase
  const refreshData = async () => {
    const supabase = createClient();

    const { data: tiles, error: tilesError } = await supabase
      .from("tiles")
      .select("id, title, position, color")
      .eq("workspace_id", workspaceId)
      .order("position", { ascending: true });

    if (tilesError || !tiles) {
      console.error("Error fetching tiles:", tilesError?.message);
      return;
    }

    const tileIds = tiles.map((tile) => tile.id);

    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("id, tile_id, title, description, position, is_completed, created_by")
      .in("tile_id", tileIds)
      .order("position", { ascending: true });

    if (tasksError || !tasks) {
      console.error("Error fetching tasks:", tasksError?.message);
      return;
    }

    const updatedTilesWithTasks = tiles.map((tile) => ({
      ...tile,
      tasks: tasks.filter((task) => task.tile_id === tile.id),
    }));

    setTilesWithTasks(updatedTilesWithTasks);
  };

  const handleAddTile = async () => {
    const supabase = createClient();
    const maxPosition = tilesWithTasks.length > 0 ? Math.max(...tilesWithTasks.map((t) => t.position)) : 0;

    // 🚀 Create temporary tile
    const tempId = `temp-${Date.now()}`;
    const newTile: TileWithTasks = {
      id: tempId,
      title: "New Column",
      position: maxPosition + 1,
      tasks: [],
      color: 'default',
    };

    // ✅ Optimistically update board
    setTilesWithTasks((prev) => [...prev, newTile]);

    try {
      // 💾 Save to Supabase
      const { data, error } = await supabase
        .from("tiles")
        .insert({
          title: "New Column",
          position: maxPosition + 1,
          workspace_id: workspaceId,
        })
        .select()
        .single();

      if (error) {
        console.error("Supabase insert error:", error);
        throw error;
      }

      // ✅ Replace temp ID with real one
      setTilesWithTasks((prev) =>
        prev.map((tile) => (tile.id === tempId ? { ...data, tasks: [] } : tile))
      );
    } catch (error: any) {
      console.error("Error adding tile:", error.message || error);
      // 🛑 Revert optimistic change
      setTilesWithTasks((prev) => prev.filter((tile) => tile.id !== tempId));
    }
  };



    // Function to calculate total width and determine centering
  const updateCentering = () => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth;
    const tileWidth = 256; // w-64 = 256px
    const gap = 16; // gap-4 = 16px
    const totalTilesWidth =
      tilesWithTasks.length * tileWidth + (tilesWithTasks.length - 1) * gap;

    // Include the width of the "Add Tile" button (w-16 = 64px)
    const totalContentWidth = totalTilesWidth + 64;

    // If the content width is less than the container width, center the tiles
    setShouldCenter(totalContentWidth < containerWidth);

    // Reset scroll position to the left if centering
    if (totalContentWidth < containerWidth && containerRef.current) {
      containerRef.current.scrollLeft = 0;
    }
  };  

    // Update centering on mount, resize, and when tiles change
  useEffect(() => {
    updateCentering();
    window.addEventListener("resize", updateCentering);
    return () => window.removeEventListener("resize", updateCentering);
  }, [tilesWithTasks]);


  const handleDragEnd = async (result: DropResult) => {
    const { source, destination } = result;

    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) {
      return;
    }

    const originalTiles = [...tilesWithTasks];
    try {
      const newTilesWithTasks = [...tilesWithTasks];
      const sourceTileIndex = newTilesWithTasks.findIndex((tile) => tile.id === source.droppableId);
      const destTileIndex = newTilesWithTasks.findIndex((tile) => tile.id === destination.droppableId);

      if (sourceTileIndex === -1 || destTileIndex === -1) return;

      const sourceTasks = [...newTilesWithTasks[sourceTileIndex].tasks];
      const [movedTask] = sourceTasks.splice(source.index, 1);
      let destTasks: Task[] = [];

      if (source.droppableId === destination.droppableId) {
        sourceTasks.splice(destination.index, 0, movedTask);
        newTilesWithTasks[sourceTileIndex].tasks = sourceTasks;
      } else {
        destTasks = [...newTilesWithTasks[destTileIndex].tasks];
        destTasks.splice(destination.index, 0, { ...movedTask, tile_id: destination.droppableId });
        newTilesWithTasks[sourceTileIndex].tasks = sourceTasks;
        newTilesWithTasks[destTileIndex].tasks = destTasks;
      }

      setTilesWithTasks(newTilesWithTasks);

      const supabase = createClient();

      if (source.droppableId === destination.droppableId) {
        const taskIds = sourceTasks.map((t) => t.id);
        const positions = sourceTasks.map((_, i) => i + 1);
        const { error } = await supabase.rpc("update_task_positions", {
          task_ids: taskIds,
          new_positions: positions,
        });

        if (error) throw error;
      } else {
        const sourceTaskIds = sourceTasks.map((t) => t.id);
        const sourcePositions = sourceTasks.map((_, i) => i + 1);
        const destTaskIds = destTasks.map((t) => t.id);
        const destPositions = destTasks.map((_, i) => i + 1);

        await Promise.all([
          supabase.rpc("update_task_positions", {
            task_ids: sourceTaskIds,
            new_positions: sourcePositions,
          }),
          supabase.rpc("update_task_positions_and_tile", {
            task_ids: destTaskIds,
            new_positions: destPositions,
            new_tile_id: destination.droppableId,
          }),
        ]);
      }
    } catch (error) {
      console.error("Update failed:", error);
      setTilesWithTasks(originalTiles);
    }
  };

  // Updated onTasksUpdate to accept an optional updater
  const onTasksUpdate = (updater?: (prev: TileWithTasks[]) => TileWithTasks[]) => {
    if (updater) {
      setTilesWithTasks(updater);
    } else {
      refreshData();
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div
        ref={containerRef}
        className={`flex gap-4 w-screen px-2 overflow-x-auto ${
          shouldCenter ? "justify-center" : "justify-start"
        }`}
      >
        {tilesWithTasks.map((tile) => (
          <Tile
            key={tile.id}
            {...tile}
            currentUserId={currentUserId}
            onTasksUpdate={onTasksUpdate}
          />
        ))}
        <button
          onClick={handleAddTile}
          className="flex-shrink-0 w-16 h-16 bg-green-500 text-white rounded-lg flex items-center justify-center hover:bg-green-600"
          aria-label="Add new column"
        >
          +
        </button>
      </div>
    </DragDropContext>
  );
}
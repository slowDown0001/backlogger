"use client";

import { useState } from "react";
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
  tasks: Task[];
}

export interface DragDropWrapperProps {
  tilesWithTasks: TileWithTasks[];
  currentUserId: string;
}

export default function DragDropWrapper({
  tilesWithTasks: initialTilesWithTasks,
  currentUserId,
}: DragDropWrapperProps) {
  const [tilesWithTasks, setTilesWithTasks] = useState<TileWithTasks[]>(initialTilesWithTasks);

  // 🔄 Refresh board data from Supabase
  const refreshData = async () => {
    const supabase = createClient();

    const { data: tiles, error: tilesError } = await supabase
      .from("tiles")
      .select("id, title, position")
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
      <div className="flex gap-4 overflow-x-auto">
        {tilesWithTasks.map((tile) => (
          <Tile
            key={tile.id}
            {...tile}
            currentUserId={currentUserId}
            onTasksUpdate={onTasksUpdate}
          />
        ))}
      </div>
    </DragDropContext>
  );
}
// "use client";

// import { useState, useEffect } from "react";
// import Tile from "./tile";
// import { DragDropContext } from "@/components/drag-drop";
// import { createClient } from "@/utils/supabase/client";
// import { DropResult } from "@adaptabletools/react-beautiful-dnd";

// interface Task {
//   id: string;
//   tile_id: string;
//   title: string;
//   description?: string;
//   position: number;
//   is_completed: boolean;
//   created_by: string;
// }

// interface TileWithTasks {
//   id: string;
//   title: string;
//   tasks: Task[];
// }

// export interface DragDropWrapperProps {
//   tilesWithTasks: TileWithTasks[];
//   currentUserId: string;
// }

// export default function DragDropWrapper({ 
//   tilesWithTasks: initialTilesWithTasks, 
//   currentUserId 
// }: DragDropWrapperProps) {
//   const [tilesWithTasks, setTilesWithTasks] = useState<TileWithTasks[]>(initialTilesWithTasks);

//   // 🔄 Refresh board data from Supabase
//   const refreshData = async () => {
//     const supabase = createClient();

//     const { data: tiles, error: tilesError } = await supabase
//       .from("tiles")
//       .select("id, title, position")
//       .order("position", { ascending: true });

//     if (tilesError || !tiles) return;

//     const tileIds = tiles.map((tile) => tile.id);

//     const { data: tasks, error: tasksError } = await supabase
//       .from("tasks")
//       .select("id, tile_id, title, description, position, is_completed, created_by")
//       .in("tile_id", tileIds)
//       .order("position", { ascending: true });

//     if (tasksError || !tasks) return;

//     const updatedTilesWithTasks = tiles.map(tile => ({
//       ...tile,
//       tasks: tasks.filter(task => task.tile_id === tile.id),
//     }));

//     setTilesWithTasks(updatedTilesWithTasks);
//   };

//   // 🧠 Only define once
//   useEffect(() => {
//     setTilesWithTasks(initialTilesWithTasks);
//   }, [initialTilesWithTasks]);

//   const handleDragEnd = async (result: DropResult) => {
//     const { source, destination } = result;

//     if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) {
//       return;
//     }

//     const originalTiles = [...tilesWithTasks];
//     try {
//       const newTilesWithTasks = [...tilesWithTasks];
//       const sourceTileIndex = newTilesWithTasks.findIndex(tile => tile.id === source.droppableId);
//       const destTileIndex = newTilesWithTasks.findIndex(tile => tile.id === destination.droppableId);

//       if (sourceTileIndex === -1 || destTileIndex === -1) return;

//       const sourceTasks = [...newTilesWithTasks[sourceTileIndex].tasks];
//       const [movedTask] = sourceTasks.splice(source.index, 1);
//       let destTasks: Task[] = [];

//       if (source.droppableId === destination.droppableId) {
//         sourceTasks.splice(destination.index, 0, movedTask);
//         newTilesWithTasks[sourceTileIndex].tasks = sourceTasks;
//       } else {
//         destTasks = [...newTilesWithTasks[destTileIndex].tasks];
//         destTasks.splice(destination.index, 0, { ...movedTask, tile_id: destination.droppableId });
//         newTilesWithTasks[sourceTileIndex].tasks = sourceTasks;
//         newTilesWithTasks[destTileIndex].tasks = destTasks;
//       }

//       setTilesWithTasks(newTilesWithTasks);

//       const supabase = createClient();

//       if (source.droppableId === destination.droppableId) {
//         const taskIds = sourceTasks.map(t => t.id);
//         const positions = sourceTasks.map((_, i) => i + 1);
//         const { error } = await supabase.rpc("update_task_positions", {
//           task_ids: taskIds,
//           new_positions: positions,
//         });

//         if (error) throw error;
//       } else {
//         const sourceTaskIds = sourceTasks.map(t => t.id);
//         const sourcePositions = sourceTasks.map((_, i) => i + 1);
//         const destTaskIds = destTasks.map(t => t.id);
//         const destPositions = destTasks.map((_, i) => i + 1);

//         await Promise.all([
//           supabase.rpc("update_task_positions", {
//             task_ids: sourceTaskIds,
//             new_positions: sourcePositions,
//           }),
//           supabase.rpc("update_task_positions_and_tile", {
//             task_ids: destTaskIds,
//             new_positions: destPositions,
//             new_tile_id: destination.droppableId,
//           }),
//         ]);
//       }
//     } catch (error) {
//       console.error("Update failed:", error);
//       setTilesWithTasks(originalTiles);
//     }
//   };

//   return (
//     <DragDropContext onDragEnd={handleDragEnd}>
//       <div className="flex gap-4 overflow-x-auto">
//         {tilesWithTasks.map(tile => (
//           <Tile
//             key={tile.id}
//             {...tile}
//             currentUserId={currentUserId}
//             onTasksUpdate={refreshData} // ✅ Pass refresh callback down
//           />
//         ))}
//       </div>
//     </DragDropContext>
//   );
// }
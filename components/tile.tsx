"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Task from "./task";
import { Droppable } from "@/components/drag-drop";

interface Task {
  id: string;
  tile_id: string;
  title: string;
  description?: string;
  position: number;
  is_completed: boolean;
  created_by: string;
}

// interface TileWithTasks {
//   id: string;
//   title: string;
//   tasks: Task[];
// }

interface TileWithTasks {
  id: string;
  title: string;
  position: number; // Added
  tasks: Task[];
  color: string; // Add color field
}

interface TileProps {
  id: string;
  title: string;
  tasks: Task[];
  currentUserId: string;
  color: string; // Add color prop
  onTasksUpdate: (updater?: (prev: TileWithTasks[]) => TileWithTasks[]) => void;
}

export default function Tile({
  id,
  title: initialTitle,
  tasks,
  color, // Add this line
  currentUserId,
  onTasksUpdate,
}: TileProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(initialTitle);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddTask = async () => {
    const supabase = createClient();
    const maxPosition = tasks.length > 0 ? Math.max(...tasks.map((task) => task.position)) : 0;

    const tempId = `temp-${Date.now()}`;
    const newTask = {
      id: tempId,
      tile_id: id,
      title: "New Task",
      description: "",
      position: maxPosition + 1,
      is_completed: false,
      created_by: currentUserId,
    };

    // Optimistically update parent state
    onTasksUpdate((prev) =>
      prev.map((tile) =>
        tile.id === id ? { ...tile, tasks: [...tile.tasks, newTask] } : tile
      )
    );

    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          tile_id: id,
          title: "New Task",
          created_by: currentUserId,
          position: maxPosition + 1,
          is_completed: false,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Replace temp task with real task
      onTasksUpdate((prev) =>
        prev.map((tile) =>
          tile.id === id
            ? {
                ...tile,
                tasks: tile.tasks.map((task) =>
                  task.id === tempId ? { ...data, tile_id: id } : task
                ),
              }
            : tile
        )
      );
    } catch (error) {
      console.error("Error adding task:", error);
      onTasksUpdate(); // Refresh from server
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const supabase = createClient();

    // Optimistically remove task
    onTasksUpdate((prev) =>
      prev.map((tile) =>
        tile.id === id
          ? { ...tile, tasks: tile.tasks.filter((task) => task.id !== taskId) }
          : tile
      )
    );

    try {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting task:", error);
      onTasksUpdate(); // Refresh from server
    }
  };

  const handleEditTitle = async () => {
    if (!isEditingTitle) {
      setIsEditingTitle(true);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("tiles")
      .update({ title })
      .eq("id", id);

    if (error) {
      console.error("Error updating tile title:", error.message);
      setTitle(initialTitle); // Revert on error
    }

    setIsEditingTitle(false);
    setIsMenuOpen(false);
  };

  const handleRemoveTile = async () => {
    const supabase = createClient();
    const { error } = await supabase
      .from("tiles")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error removing tile:", error.message);
    } else {
      onTasksUpdate(); // Refresh parent
    }
  };

  const handleChangeColor = async (newColor: string) => {
    // Optimistically update the tile's color
    onTasksUpdate((prev) =>
      prev.map((tile) =>
        tile.id === id ? { ...tile, color: newColor } : tile
      )
    );

    // Update in Supabase
    const supabase = createClient();
    const { error } = await supabase
      .from("tiles")
      .update({ color: newColor })
      .eq("id", id);

    if (error) {
      console.error("Error updating tile color:", error.message);
      // Revert on error
      onTasksUpdate();
    }
  };

  return (
    <div className={`relative flex-shrink-0 w-64 rounded-lg p-4 ${color === 'yellow' ? 'bg-yellow-200 dark:bg-yellow-700' : color === 'green' ? 'bg-green-200 dark:bg-green-700' : color === 'red' ? 'bg-red-200 dark:bg-red-700' : 'bg-gray-100 dark:bg-gray-800'}`} style={{ minHeight: "600px", height: "auto" }}>
      <div className="flex justify-between items-center mb-4">
        {isEditingTitle ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleEditTitle}
            onKeyDown={(e) => e.key === "Enter" && handleEditTitle()}
            className="text-xl font-semibold w-full p-1 rounded border dark:bg-gray-700 dark:border-gray-600"
            autoFocus
          />
        ) : (
          <h2 className="text-xl font-semibold">{title}</h2>
        )}
        <div className="relative">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white-700 hover:text-gray-700 dark:hover:text-gray-300">
            ⋮
          </button>
          {isMenuOpen && (
            <div ref={menuRef} className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg z-10">
              <button
                onClick={() => {
                  setIsEditingTitle(true);
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                Edit Title
              </button>
              <button
                onClick={() => {
                  handleAddTask();
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                Add a Card
              </button>
              
              <button
                onClick={() => {
                  handleRemoveTile();
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                Remove Tile
              </button>
              <div className="flex w-full px-4 py-2 gap-2">
                <span
                  onClick={() => {
                    handleChangeColor('yellow');
                    setIsMenuOpen(false);
                  }}
                  className="w-6 h-6 rounded-full bg-yellow-200 dark:bg-yellow-500 cursor-pointer hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-500"
                  aria-label="Yellow"
                />
                <span
                  onClick={() => {
                    handleChangeColor('green');
                    setIsMenuOpen(false);
                  }}
                  className="w-6 h-6 rounded-full bg-green-200 dark:bg-green-500 cursor-pointer hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-500"
                  aria-label="Green"
                />
                <span
                  onClick={() => {
                    handleChangeColor('red');
                    setIsMenuOpen(false);
                  }}
                  className="w-6 h-6 rounded-full bg-red-200 dark:bg-red-500 cursor-pointer hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-500"
                  aria-label="Red"
                />
                <span
                  onClick={() => {
                    handleChangeColor('default');
                    setIsMenuOpen(false);
                  }}
                  className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 cursor-pointer hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-500"
                  aria-label="Default"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <Droppable droppableId={id}>
        {(provided) => (
          <div className="flex flex-col gap-2" ref={provided.innerRef} {...provided.droppableProps}>
            {tasks.length > 0 ? (
              tasks.map((task, index) => (
                <Task
                  key={task.id}
                  id={task.id}
                  title={task.title}
                  description={task.description}
                  isCompleted={task.is_completed}
                  createdBy={task.created_by}
                  currentUserId={currentUserId}
                  index={index}
                  onDelete={handleDeleteTask}
                />
              ))
            ) : (
              <p className="text-sm text-gray-500">No tasks yet.</p>
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      <button onClick={handleAddTask} className="mt-2 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">
        +
      </button>
    </div>
  );
}
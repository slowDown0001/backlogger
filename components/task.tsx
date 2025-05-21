"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import TaskModal from "./task-modal";
import { Draggable } from "@/components/drag-drop";

interface TaskProps {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  createdBy: string;
  currentUserId: string;
  index: number;
}

export default function Task({ id, title: initialTitle, description: initialDescription, isCompleted: initialIsCompleted, createdBy, currentUserId, index }: TaskProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskData, setTaskData] = useState({ title: initialTitle, description: initialDescription || "", isCompleted: initialIsCompleted });

  useEffect(() => {
    const fetchTask = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("tasks")
        .select("title, description, is_completed")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching task:", error.message);
      } else {
        setTaskData({
          title: data.title,
          description: data.description || "",
          isCompleted: data.is_completed,
        });
      }
    };

    if (isModalOpen) {
      fetchTask();
    }
  }, [id, isModalOpen]);

  const handleUpdate = (updatedTitle: string, updatedDescription: string) => {
    setTaskData(prev => ({
      ...prev,
      title: updatedTitle,
      description: updatedDescription,
    }));
  };

  return (
    <Draggable draggableId={id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <div
            className={`p-3 rounded-md ${
              taskData.isCompleted ? "bg-green-200 dark:bg-green-700" : "bg-white dark:bg-gray-700"
            } shadow-sm cursor-pointer`}
            onClick={() => setIsModalOpen(true)}
          >
            <p className="text-sm">{taskData.title}</p>
          </div>
          {isModalOpen && (
            <TaskModal
              id={id}
              title={taskData.title}
              description={taskData.description}
              isEditable={createdBy === currentUserId}
              onClose={() => setIsModalOpen(false)}
              onUpdate={handleUpdate}
            />
          )}
        </div>
      )}
    </Draggable>
  );
}
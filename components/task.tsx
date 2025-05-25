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
  onDelete?: (taskId: string) => Promise<void>;
}

export default function Task({
  id,
  title: initialTitle,
  description: initialDescription,
  isCompleted: initialIsCompleted,
  createdBy,
  currentUserId,
  index,
  onDelete,
}: TaskProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskData, setTaskData] = useState({
    title: initialTitle,
    description: initialDescription || "",
    isCompleted: initialIsCompleted,
  });
  const [isTempId, setIsTempId] = useState(id.startsWith("temp-")); // Track if ID is temporary

  // Monitor the id prop for changes to detect when the temporary ID is replaced
  useEffect(() => {
    setIsTempId(id.startsWith("temp-"));
  }, [id]);

  const handleUpdate = async (updatedTitle: string, updatedDescription: string, updatedIsCompleted: boolean) => {
    setTaskData((prev) => ({
      ...prev,
      title: updatedTitle,
      description: updatedDescription,
      isCompleted: updatedIsCompleted,
    }));

    // Update the task in Supabase
    const supabase = createClient();
    const { error } = await supabase
      .from("tasks")
      .update({
        title: updatedTitle,
        description: updatedDescription,
        is_completed: updatedIsCompleted,
      })
      .eq("id", id);

    if (error) {
      console.error("Error updating task:", error.message);
    }
  };

  return (
    <Draggable draggableId={id} index={index}>
      {(provided) => (
        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
          <div
            className={`p-3 rounded-md ${
              taskData.isCompleted ? "bg-green-200 dark:bg-green-700" : "bg-white dark:bg-gray-700"
            } shadow-sm cursor-pointer flex justify-between items-center`}
            onClick={() => setIsModalOpen(true)}
          >
            <p className={`text-sm ${taskData.isCompleted ? 'line-through' : ''}`}>{taskData.title}</p>
            {onDelete && createdBy === currentUserId && (
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent modal from opening
                  onDelete(id);
                }}
                className="text-black dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full w-6 h-6 flex items-center justify-center"
                aria-label="Delete task"
              >
                ✕
              </button>
            )}
          </div>
          {isModalOpen && (
            <>
              {isTempId ? (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex flex-col items-center">
                    <svg
                      className="animate-spin h-8 w-8 text-blue-500 mb-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <p className="text-gray-700 dark:text-gray-300">
                      Saving task to the database, please wait a moment...
                    </p>
                  </div>
                </div>
              ) : (
                <TaskModal
                  id={id}
                  title={taskData.title}
                  description={taskData.description}
                  isCompleted={taskData.isCompleted}
                  isEditable={createdBy === currentUserId}
                  onClose={() => setIsModalOpen(false)}
                  onUpdate={handleUpdate}
                />
              )}
            </>
          )}
        </div>
      )}
    </Draggable>
  );
}
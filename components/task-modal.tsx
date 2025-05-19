"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

interface TaskModalProps {
  id: string;
  title: string;
  description: string;
  isEditable: boolean;
  onClose: () => void;
  onUpdate: (title: string, description: string) => void;
}

export default function TaskModal({ id, title: initialTitle, description: initialDescription, isEditable, onClose, onUpdate }: TaskModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);

  // Fetch the latest task data when the modal opens
  useEffect(() => {
    const fetchTask = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("tasks")
        .select("title, description")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching task:", error.message);
      } else {
        setTitle(data.title);
        setDescription(data.description || "");
      }
    };

    fetchTask();
  }, [id]);

  const handleSave = async () => {
    if (!isEditable) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("tasks")
      .update({ title, description })
      .eq("id", id);

    if (error) {
      console.error("Error updating task:", error.message);
    } else {
      onUpdate(title, description); // Notify parent of the update
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
        <h2 className="text-xl font-semibold mb-4">Task Details</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={!isEditable}
            className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!isEditable}
            className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600"
            rows={4}
          />
        </div>
        <div className="flex justify-end gap-2">
          {isEditable ? (
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Save
            </button>
          ) : null}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
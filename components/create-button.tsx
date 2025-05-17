"use client";

export default function CreateButton() {
  return (
    <button
      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
      onClick={() => {
        alert("Create Workspace functionality coming soon!");
      }}
    >
      Create
    </button>
  );
}
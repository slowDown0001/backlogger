"use client";

import { ErrorBoundary } from "react-error-boundary";
import DragDropWrapper, {DragDropWrapperProps} from "@/components/drag-drop-wrapper";

function ErrorFallback({ error, resetErrorBoundary }: any) {
  const isHydrationError = error.message.includes('hydr');
  
  return (
    <div role="alert" className="p-4 bg-red-100 text-red-700 rounded">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
      {isHydrationError ? (
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-3 py-1 bg-blue-500 text-white rounded"
        >
          Refresh Page
        </button>
      ) : (
        <button 
          onClick={resetErrorBoundary} 
          className="mt-2 px-3 py-1 bg-red-500 text-white rounded"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function BoardWrapper({ tilesWithTasks, currentUserId }: DragDropWrapperProps) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <DragDropWrapper tilesWithTasks={tilesWithTasks} currentUserId={currentUserId} />
    </ErrorBoundary>
  );
}
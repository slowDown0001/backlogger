import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { FormMessage, Message } from "@/components/form-message";

export default async function ProtectedPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const supabase = await createClient();

  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirect("/sign-in");
  }

  // Check for a profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, last_workspace_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return redirect("/profile/setup");
  }

  // Fetch the workspace (use last_workspace_id or default)
  const workspaceId = profile.last_workspace_id || 'c2d3d999-441e-4afe-bb6c-e2d7a4e124ed';
  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id, name")
    .eq("id", workspaceId)
    .single();

  if (workspaceError || !workspace) {
    console.error("Error fetching workspace:", workspaceError?.message);
    return redirect("/sign-in");
  }

  // Fetch tiles for the workspace
  const { data: tiles, error: tilesError } = await supabase
    .from("tiles")
    .select("id, title, position")
    .eq("workspace_id", workspaceId)
    .order("position", { ascending: true });

  if (tilesError) {
    console.error("Error fetching tiles:", tilesError.message);
    return redirect("/sign-in");
  }

  // Fetch tasks for each tile
  const tileIds = tiles?.map(tile => tile.id) || [];
  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("id, tile_id, title, position, is_completed")
    .in("tile_id", tileIds)
    .order("position", { ascending: true });

  if (tasksError) {
    console.error("Error fetching tasks:", tasksError.message);
    return redirect("/sign-in");
  }

  // Group tasks by tile
  const tilesWithTasks = tiles?.map(tile => ({
    ...tile,
    tasks: tasks?.filter(task => task.tile_id === tile.id) || [],
  })) || [];

  const searchParamsData = await searchParams;
  let message: Message | undefined;

  if (searchParamsData.error) {
    message = { error: decodeURIComponent(searchParamsData.error as string) };
  } else if (searchParamsData.success) {
    message = { success: decodeURIComponent(searchParamsData.success as string) };
  } else if (searchParamsData.message) {
    message = { message: decodeURIComponent(searchParamsData.message as string) };
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-6 p-4">
      {message && <FormMessage message={message} />}
      <h1 className="text-3xl font-bold">{workspace.name}</h1>
      <div className="flex gap-4 overflow-x-auto">
        {tilesWithTasks.map(tile => (
          <div
            key={tile.id}
            className="flex-shrink-0 w-64 bg-gray-100 dark:bg-gray-800 rounded-lg p-4"
            style={{ minHeight: "600px", height: "auto" }}
          >
            <h2 className="text-xl font-semibold mb-4">{tile.title}</h2>
            <div className="flex flex-col gap-2">
              {tile.tasks.length > 0 ? (
                tile.tasks.map(task => (
                  <div
                    key={task.id}
                    className={`p-3 rounded-md ${
                      task.is_completed
                        ? "bg-green-200 dark:bg-green-700"
                        : "bg-white dark:bg-gray-700"
                    } shadow-sm`}
                  >
                    <p className="text-sm">{task.title}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No tasks yet.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
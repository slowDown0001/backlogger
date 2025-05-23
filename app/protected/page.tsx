import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { FormMessage, Message } from "@/components/form-message";
import { BoardWrapper } from "@/components/error-boundaries";

export default async function ProtectedPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
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
    .select("id, tile_id, title, description, position, is_completed, created_by")
    .in("tile_id", tileIds)
    .order("position", { ascending: true });

  if (tasksError) {
    console.error("Error fetching tasks:", tasksError.message);
    return redirect("/sign-in");
  }

  // Add this check
  if (!tasks) {
    return <div>Loading tasks...</div>;
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
    <div className="flex-1 w-screen flex flex-col gap-6">
      {message && <FormMessage message={message} />}
      <h1 className="text-3xl font-bold px-2 text-center">
        {workspace.name}
      </h1>
      
      <BoardWrapper
        tilesWithTasks={tilesWithTasks}
        currentUserId={user.id}
        workspaceId={workspaceId} // Add workspaceId prop
      />
    </div>
  );
}
import FetchDataSteps from "@/components/tutorial/fetch-data-steps";
import { createClient } from "@/utils/supabase/server";
import { InfoIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { FormMessage, Message } from "@/components/form-message";

export default async function ProtectedPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Check for a profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return redirect("/profile/setup");
  }

  // Fetch workspaces and create a default one if none exist
  let workspaces = null;
  const { data: wsData } = await supabase
    .from("workspaces")
    .select("id, name")
    .order("created_at", { ascending: true });
  workspaces = wsData;

  if (!workspaces || workspaces.length === 0) {
    const { error } = await supabase
      .from("workspaces")
      .insert({ name: "Workspace", created_by: user.id });

    if (error) {
      console.error("Error creating default workspace:", error.message);
      // Handle error gracefully, continue rendering the page
    } else {
      const { data: newWorkspaces } = await supabase
        .from("workspaces")
        .select("id, name")
        .order("created_at", { ascending: true });
      workspaces = newWorkspaces || [];
    }
  }

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
    <div className="flex-1 w-full flex flex-col gap-12">
      {message && <FormMessage message={message} />}
      <div className="w-full">
        <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
          <InfoIcon size="16" strokeWidth={2} />
          This is a protected page that you can only see as an authenticated user
        </div>
      </div>
      <div className="flex flex-col gap-2 items-start">
        <h2 className="font-bold text-2xl mb-4">Your user details</h2>
        <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>
      {/* <div>
        <h2 className="font-bold text-2xl mb-4">Next steps</h2>
        <FetchDataSteps />
      </div> */}
    </div>
  );
}
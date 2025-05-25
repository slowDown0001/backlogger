import { setupProfileAction } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage, Message } from "@/components/form-message";
import Link from "next/link";

export default async function ProfileSetup({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
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
    <div className="flex-1 flex items-center justify-center">
      <form className="flex flex-col gap-4 w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Set Up Your Profile</h1>
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            placeholder="Your full name"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="role">Role</Label>
          <Input
            id="role"
            name="role"
            placeholder="Your role (e.g., Designer, Developer)"
            required
          />
        </div>
        <SubmitButton formAction={setupProfileAction} pendingText="Saving...">
          Save Profile
        </SubmitButton>
        {message && <FormMessage message={message} />}
        <p className="text-sm mt-4">
          Already set up?{" "}
          <Link href="/sign-in" className="text-blue-500 underline">
            Go back to sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
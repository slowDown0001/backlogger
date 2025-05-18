// import { createClient } from "@/utils/supabase/server";
// import { NextResponse } from "next/server";

// export async function GET(request: Request) {
//   // The `/auth/callback` route is required for the server-side auth flow implemented
//   // by the SSR package. It exchanges an auth code for the user's session.
//   // https://supabase.com/docs/guides/auth/server-side/nextjs
//   const requestUrl = new URL(request.url);
//   const code = requestUrl.searchParams.get("code");
//   const origin = requestUrl.origin;
//   const redirectTo = requestUrl.searchParams.get("redirect_to")?.toString();

//   if (code) {
//     const supabase = await createClient();
//     await supabase.auth.exchangeCodeForSession(code);
//   }

//   if (redirectTo) {
//     return NextResponse.redirect(`${origin}${redirectTo}`);
//   }

//   // URL to redirect to after sign up process completes
//   return NextResponse.redirect(`${origin}/protected`);
// }
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// Helper function to construct redirect URL with encoded message
const createRedirectUrl = (
  origin: string,
  path: string,
  type: "error" | "success",
  message: string,
) => {
  return `${origin}${path}?${type}=${encodeURIComponent(message)}`;
};

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;
  const redirectTo = requestUrl.searchParams.get("redirect_to")?.toString();

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        createRedirectUrl(origin, "/sign-in", "error", "Authentication failed")
      );
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(
        createRedirectUrl(origin, "/sign-in", "error", "User not found")
      );
    }

    // Check for a profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.redirect(`${origin}/profile/setup`);
    }
  }

  if (redirectTo) {
    return NextResponse.redirect(`${origin}${redirectTo}`);
  }

  return NextResponse.redirect(`${origin}/protected`);
}
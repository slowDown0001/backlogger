import DeployButton from "@/components/deploy-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import ProfileButton from "@/components/profile-button";
import WorkspaceDropdown from "@/components/workspace-dropdown";
import CreateButton from "@/components/create-button";
import HeaderAuth from "@/components/header-auth";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import { signOutAction } from "@/app/actions";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Next.js and Supabase Starter Kit",
  description: "The fastest way to build apps with Next.js and Supabase",
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  let workspaces = null;
  let currentWorkspace = { id: "", name: "Workspace" };

  if (isLoggedIn) {
    // Fetch workspaces
    const { data: wsData } = await supabase
      .from("workspaces")
      .select("id, name")
      .order("created_at", { ascending: true });
    workspaces = wsData;

    currentWorkspace = workspaces && workspaces.length > 0 ? workspaces[0] : { id: "", name: "Workspace" };
  }

  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="min-h-screen flex flex-col items-center overflow-x-auto">
            <div className="flex-1 w-full flex flex-col gap-20 items-center border-2">
              <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16 mb-20">
                <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
                  <div className="flex gap-5 items-center font-semibold border-red-500">
                    <Link href={"/"}>Backloger app for Ёж ЕГЭ</Link>
                  </div>
                  {isLoggedIn ? (
                    <div className="flex items-center gap-4">
                      <ProfileButton userId={user?.id} email={user?.email} />
                      {/* <WorkspaceDropdown currentWorkspace={currentWorkspace} workspaces={workspaces || []} /> */}
                      <CreateButton />
                      <form action={signOutAction}>
                        <button type="submit" className="text-sm text-foreground underline">
                          Sign Out
                        </button>
                      </form>
                      {!hasEnvVars ? <EnvVarWarning /> : null}
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      {!hasEnvVars ? <EnvVarWarning /> : <HeaderAuth />}
                    </div>
                  )}
                </div>
              </nav>


              <div className="flex-1 w-full flex flex-col items-center justify-center">
                {children}
              </div>


              <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-8 border-2">
                <p>Powered by Ёж</p>
                <ThemeSwitcher />
              </footer>
            </div>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
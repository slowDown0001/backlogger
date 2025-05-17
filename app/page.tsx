// import { createClient } from "@/utils/supabase/server";
// import { redirect } from "next/navigation";

// export default async function Home() {
//   const supabase = await createClient();
//   const { data: { user } } = await supabase.auth.getUser();

//   // Redirect to /protected if logged in, /sign-in otherwise
//   if (user) {
//     redirect("/protected");
//   } else {
//     redirect("/sign-in");
//   }
// }

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    return redirect("/protected");
  }

  return (
    <div className="flex-1 flex items-center justify-center h-128 p-40">
      <h1 className="text-5xl font-bold text-sky-600 dark:text-lime-400 text-center">Welcome to Backloger app for Ёж ЕГЭ</h1>
    </div>
  );
}

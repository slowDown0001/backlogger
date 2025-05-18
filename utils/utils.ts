import { redirect } from "next/navigation";

/**
 * Redirects to a specified path with an encoded message as a query parameter.
 * @param {('error' | 'success')} type - The type of message, either 'error' or 'success'.
 * @param {string} path - The path to redirect to.
 * @param {string} message - The message to be encoded and added as a query parameter.
 * @returns {never} This function doesn't return as it triggers a redirect.
 */
export function encodedRedirect(
  type: "error" | "success",
  path: string,
  message: string,
) {
  return redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}




// This code does one simple thing:

// > It sends the user to a new page and includes a message in the URL like this:
// >
// > ```
// > /login?error=Invalid%20Password
// > ```

// Then, when the next page loads, that message can be read and shown to the user (like an error or success popup).

// ---

// ## 🔍 Step-by-step Explanation

// ### 1. What is `redirect`?

// ```js
// import { redirect } from "next/navigation";
// ```

// - This line gives us a tool called `redirect`.
// - When you call `redirect(...)`, your program stops and tells the browser:  
//   **"Go to this new URL instead."**

// Think of it like telling someone:  
// > "Don't keep reading this page — go here instead."

// ---

// ### 2. What is `encodedRedirect`?

// ```js
// export function encodedRedirect(type, path, message)
// ```

// - It’s just a helper function.
// - You give it:
//   - A **type** (`"error"` or `"success"`),
//   - A **path** (where to send the user),
//   - A **message** (what to say).
  
// Example:
// ```js
// encodedRedirect("error", "/login", "Wrong password")
// ```

// ---

// ### 3. How does it work?

// ```js
// return redirect(`${path}?${type}=${encodeURIComponent(message)}`);
// ```

// This builds a URL like:

// ```
// /login?error=Wrong%20password
// ```

// Let’s break that down:

// | Part | Meaning |
// |------|---------|
// | `/login` | The page we're sending the user to |
// | `?` | Starts the query string (adds extra info to the URL) |
// | `error=` | Says what kind of message it is |
// | `Wrong%20password` | The message, safely formatted for URLs |

// #### Why encode the message?

// Some characters like spaces or emojis can’t go directly into URLs.  
// `encodeURIComponent(...)` makes sure the message is safe by converting them into codes like `%20` for space.

// ---

// ### 4. Why do this at all?

// Let’s say someone tries to log in with the wrong password.  
// You want to:
// 1. Send them back to the login page,
// 2. And tell them what went wrong.

// So you redirect them to:

// ```
// /login?error=Wrong%20password
// ```

// Then on the login page, you can check the URL and show:

// > ❌ Wrong password

// ---

// ### ✅ Summary (for non-web devs)

// - This code redirects the user to a new page.
// - It attaches a message to the URL (like “wrong password”).
// - That message can be read later to show errors or success messages.
// - It’s a way to pass short notes between different parts of a website using URLs.

// ---

// Let me know if you'd like a real-life analogy or diagram!

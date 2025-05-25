# 📌 Kanban Board

A modern, interactive Kanban board built with **Next.js**, **TypeScript**, **React**, **Supabase**, and **Tailwind CSS**.

This application allows users to manage tasks and projects efficiently with:
- ✅ A clean interface
- ✅ Optimistic UI updates
- ✅ Real-time synchronization with a Supabase backend

---

## 🚀 Features

### 🔐 Supabase Authentication
- Secure user authentication using **Supabase Auth**
- Users must sign in to access the Kanban board
- Profile setup required on first login
  - Auto-redirection to `/profile/setup` if incomplete
- Supports workspace selection
  - Defaults to a predefined workspace ID if none set

---

### 📁 Workspaces
- Tasks and tiles are organized within **user-specific workspaces**
- Each workspace is fetched from Supabase and displayed with its name at the top of the board
- Supports multiple workspaces
  - Workspace switching via `last_workspace_id` stored in the user profile

---

### 🧱 Tiles (Columns)

Create, edit, and delete tiles to organize tasks into columns like "To Do", "In Progress", etc.

#### ✅ Core Features:
- **Optimistic UI updates** for adding, editing, and deleting tiles
  - Reverts gracefully on failure
- Tiles ordered by position
- Fetched dynamically from Supabase

#### 🎨 Color Customization:
- Users can set tile colors: Yellow, Green, Red, or Default
  - Done via a 3-dot menu (`⋮`)
- Colors reflected as background colors (e.g., `bg-yellow-200`, `dark:bg-yellow-600`)
- Color options shown as clickable circles in the modal for intuitive selection
- Color updates pushed to Supabase once selected

---

### 📝 Tasks (Cards)

Add, edit, delete, and drag tasks within and across tiles.

#### ✅ Task Features:
- Supports: title, description, completion status (`is_completed`), creator (`created_by`)
- Drag-and-Drop powered by `react-beautiful-dnd`
  - Tasks reordered within a tile or moved between tiles
  - Position changes saved to Supabase after move completes

#### 📲 Modals:
- Click a task to open a modal for viewing/editing details
- Editable only by the task creator (`created_by === currentUserId`)
- Completion status toggle (`is_completed`) updates:
  - Title gets strikethrough in UI
  - Background turns green (`bg-green-200 dark:bg-green-700`)
  - Status persisted in Supabase

#### 🧠 Optimistic Updates:
- Temporary IDs (`temp-${Date.now()}`) used during optimistic updates
- Replaced with real Supabase-generated IDs after successful insert/update
- Rollback if error occurs during Supabase sync

---

### 🎯 Optimistic UI

Provides an instant, responsive experience:
- Tile creation, deletion, and title edits
- Task creation, deletion, and drag-and-drop
- If Supabase returns an error → UI reverts to last known good state

Prevents full page reloads for smoother UX.

---

### 🌙 Dark Mode Support

Fully supports Tailwind’s dark mode:
- Tiles, modals, and menus use `dark:` modifiers
- Examples:  
  - `bg-gray-100 dark:bg-gray-800`
  - Softened color variants for dark themes (e.g., `dark:bg-yellow-600`)

---

### ❗ Error Handling

- Wrapped in `<ErrorBoundary>` for robust error fallback
- Shows friendly error messages with retry/refresh options
- Console logs Supabase errors for debugging
- Handles hydration mismatches safely

---

### 📱 Responsive Design

- Flexible layout using `flex` and `overflow-x-auto`
- Tiles scroll horizontally when screen width is limited
- Modals use fixed widths (`w-96`) for mobile compatibility
- Dynamic centering logic based on tile count and viewport size

---

### 🧩 TypeScript

- Fully typed interfaces for:
  - `Task`
  - `TileWithTasks`
  - Component props
- Type safety maintained throughout the app

---

### 💾 Supabase Integration

- Real-time data fetching and updates
- Tables involved:
  - `profiles`: User management (`id`, `last_workspace_id`)
  - `workspaces`: Workspace metadata (`id`, `name`)
  - `tiles`: Columns (`id`, `title`, `position`, `color`, `workspace_id`)
  - `tasks`: Task cards (`id`, `tile_id`, `title`, `description`, `position`, `is_completed`, `created_by`, `created_at`)
- Uses custom PostgreSQL functions:
  - `update_task_positions(task_ids uuid[], new_positions int[])`
  - `update_task_positions_and_tile(...)` for cross-column moves

---

## 🛠 Getting Started

### 📦 Prerequisites

- Node.js (v18+)
- Supabase project set up with these tables:
  - `profiles` – user info (`id`, `last_workspace_id`)
  - `workspaces` – workspace info (`id`, `name`)
  - `tiles` – column data (`id`, `title`, `position`, `color`, `workspace_id`)
  - `tasks` – task cards (`id`, `tile_id`, `title`, `description`, `position`, `is_completed`, `created_by`, `created_at`)
- Supabase credentials:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

### 📁 Installation

```bash
# Clone the repo
git clone <repository-url>
cd kanban-board

# Install dependencies
npm install

# Set up environment variables
echo "NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url" > .env.local
echo "NEXT_PUBLIC_SUPABase_ANON_KEY=<your-anon-key>" >> .env.local

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view it locally.

---

### 🧑‍💻 Usage

| Action | How To |
|--------|--------|
| Sign In | Navigate to `/sign-in` |
| Setup Profile | Redirected to `/profile/setup` if needed |
| View Board | Go to `/protected` route |
| Add Tile | Use “+” button
| Edit Tile | Open 3-dot menu → "Edit Title"
| Delete Tile | 3-dot menu → "Remove Tile"
| Add Task | Click “+” inside a tile or from tile menu
| Edit/Delete Task | Click task to open modal
| Drag Task | Use mouse or DnD interaction
| Toggle Dark Mode | Use system preferences or browser settings

---

### 🏗 Project Structure

```
components/
├── drag-drop-wrapper.tsx     # Manages global board state and drag-and-drop
├── tile.tsx                  # Renders individual tiles and manages color/title menu
├── task.tsx                  # Task component with drag support
├── task-modal.tsx            # Modal for editing task details
├── error-boundaries.tsx      # Wraps app in React error boundary
└── ...

pages/
└── protected/
    └── page.tsx              # Server-side rendering of workspace/tiles/tasks

utils/
└── supabase/
    ├── client.ts             # Supabase client for client components
    └── server.ts             # Supabase server components + auth handling
```

---

## 🧭 Future Improvements

| Feature | Description |
|--------|-------------|
| ✅ Task Color Customization | Already supported in DB — just needs UI implementation |
| 🔁 Real-Time Collaboration | Using Supabase Realtime/subscriptions |
| 📊 Task Filtering | Filter tasks by status, date, assignee |
| 🔄 Real-Time Sync | Update board state without refresh |
| 🖱️ Tile Reordering | Allow drag-and-drop reordering of columns |

---

## 🤝 Contributing

Contributions are welcome! Please:
- Open an issue for bugs or feature requests
- Submit pull requests for enhancements or fixes

---

## 📄 License

This project is licensed under the **MIT License**. Feel free to use and modify it as you see fit.
"use client";

import dynamic from "next/dynamic";

export const DragDropContext = dynamic(
  () => import("@adaptabletools/react-beautiful-dnd").then((mod) => mod.DragDropContext),
  { ssr: false }
);

export const Droppable = dynamic(
  () => import("@adaptabletools/react-beautiful-dnd").then((mod) => mod.Droppable),
  { ssr: false }
);

export const Draggable = dynamic(
  () => import("@adaptabletools/react-beautiful-dnd").then((mod) => mod.Draggable),
  { ssr: false }
);
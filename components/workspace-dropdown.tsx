"use client";

import { Menu, MenuButton, MenuItem, MenuItems, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import Link from "next/link";

export default function WorkspaceDropdown({ currentWorkspace, workspaces }: { currentWorkspace: { id: string; name: string }; workspaces: { id: string; name: string }[] }) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <MenuButton className="flex items-center gap-1 text-lg font-medium text-gray-800 hover:text-gray-600">
        {currentWorkspace.name}
        <ChevronDownIcon className="w-5 h-5" />
      </MenuButton>
      <MenuItems
        transition
        className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none transition duration-200 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
      >
        <div className="py-1">
          {workspaces.map((workspace) => (
            <MenuItem key={workspace.id}>
              {({ focus }) => (
                <Link
                  href={`/workspaces/${workspace.id}`}
                  className={`block px-4 py-2 text-sm text-gray-700 ${focus ? "bg-gray-100" : ""}`}
                >
                  {workspace.name}
                </Link>
              )}
            </MenuItem>
          ))}
        </div>
      </MenuItems>
    </Menu>
  );
}
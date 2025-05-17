"use client";

import Image from "next/image";

export default function ProfileButton({ profilePicture, email }: { profilePicture?: string; email?: string }) {
  return (
    <div className="relative w-10 h-10 rounded-full overflow-hidden">
      {profilePicture ? (
        <Image
          src={profilePicture}
          alt="Profile Picture"
          fill
          className="object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gray-300 flex items-center justify-center text-white">
          {email?.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}
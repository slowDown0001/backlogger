"use client";

// Utility function to generate a consistent random color based on userId
const getRandomColor = (userId: string | undefined): string => {
  if (!userId) return "hsl(0, 70%, 50%)"; // Default color if no userId

  // Sum the character codes of the userId to get a seed
  const seed = userId.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  
  // Map the seed to a hue (0-360) for HSL color
  const hue = seed % 360;
  return `hsl(${hue}, 70%, 50%)`;
};

export default function ProfileButton({ userId, email }: { userId?: string; email?: string }) {
  const color = getRandomColor(userId);

  return (
    <div className="relative w-10 h-10 rounded-full overflow-hidden">
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="20" cy="20" r="20" fill={color} />
        <path
          d="M20 20C22.7614 20 25 17.7614 25 15C25 12.2386 22.7614 10 20 10C17.2386 10 15 12.2386 15 15C15 17.7614 17.2386 20 20 20Z"
          fill="white"
        />
        <path
          d="M20 22C16.134 22 13 25.134 13 29V31H27V29C27 25.134 23.866 22 20 22Z"
          fill="white"
        />
      </svg>
    </div>
  );
}

// Predefined Apple-style gradients (Tailwind classes)
const GRADIENTS = [
  "from-blue-400 to-indigo-500",
  "from-emerald-400 to-teal-500",
  "from-orange-400 to-pink-500",
  "from-purple-400 to-violet-500",
  "from-cyan-400 to-blue-500",
  "from-rose-400 to-red-500",
  "from-amber-400 to-orange-500",
  "from-lime-400 to-green-500",
  "from-fuchsia-400 to-pink-500",
  "from-sky-400 to-indigo-500",
];

/**
 * Extracts the first letters of the first two significant words in a course name.
 * e.g., "Software Engineering" -> "SE", "Computer Graphics" -> "CG"
 */
export const getCourseInitials = (name: string): string => {
  if (!name) return "??";
  
  // Remove common prefixes/suffixes or parenthesis content if needed
  const cleanName = name.replace(/\(.*\)/g, "").trim();
  
  const words = cleanName.split(" ").filter(w => w.length > 1); // Skip single chars like '&'
  
  if (words.length === 0) return name.substring(0, 2).toUpperCase();
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  
  return (words[0][0] + words[1][0]).toUpperCase();
};

/**
 * Returns a deterministic gradient class based on the course name string.
 * Same name always gets the same gradient.
 */
export const getCourseStyle = (name: string) => {
  if (!name) return GRADIENTS[0];
  
  // Simple string hash
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % GRADIENTS.length;
  return GRADIENTS[index];
};

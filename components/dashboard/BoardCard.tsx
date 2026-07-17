import { Star } from "lucide-react";
import { useRouter } from "next/navigation";

interface Board {
  id: string;
  title: string;
  color: string;
  starred: boolean;
}

function getBoardBg(color: string) {
  if (!color) return "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500";
  
  if (color.includes("from-") || color.includes("to-")) {
    return `bg-gradient-to-br ${color}`;
  }
  
  const colorLower = color.toLowerCase();
  
  const gradients: Record<string, string> = {
    purple: "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500",
    blue: "bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-500",
    green: "bg-gradient-to-br from-teal-400 via-emerald-500 to-cyan-500",
    red: "bg-gradient-to-br from-rose-500 to-orange-500",
    orange: "bg-gradient-to-br from-amber-500 to-rose-500",
    yellow: "bg-gradient-to-br from-yellow-400 to-amber-500",
    pink: "bg-gradient-to-br from-pink-500 to-rose-500",
    gray: "bg-gradient-to-br from-gray-700 to-slate-900",
  };

  return gradients[colorLower] || "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500";
}

export default function BoardCard({ board, onStar }: { board: Board; onStar: () => void }) {
  const router = useRouter();
  const bgClass = getBoardBg(board.color);
  const isHexColor = board.color && board.color.startsWith("#");

  return (
    <div
      onClick={() => router.push(`/board/${board.id}`)}
      style={isHexColor ? { backgroundColor: board.color } : {}}
      className={`relative h-24 rounded-2xl cursor-pointer group overflow-hidden border border-black/5 dark:border-white/5 shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-[0.99] transition-all duration-200 ease-out select-none ${!isHexColor ? bgClass : ""}`}
    >
      {/* Light mask overlay for card text contrast */}
      <div className="absolute inset-0 bg-black/15 group-hover:bg-black/5 transition-colors duration-200" />
      
      {/* Visual content */}
      <div className="relative p-3.5 h-full flex flex-col justify-between z-10">
        <span className="text-white font-semibold text-sm leading-snug tracking-wide drop-shadow-xs line-clamp-2">
          {board.title}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onStar(); }}
          className="self-end opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-white/20 text-white cursor-pointer active:scale-95 duration-150"
        >
          <Star className={`w-3.5 h-3.5 ${board.starred ? "fill-amber-400 text-amber-400" : "text-white"}`} />
        </button>
      </div>
    </div>
  );
}

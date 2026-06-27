import { Star } from "lucide-react";
import { useRouter } from "next/navigation";

interface Board {
  id: string;
  title: string;
  color: string;
  starred: boolean;
}

export default function BoardCard({ board, onStar }: { board: Board; onStar: () => void }) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/board/${board.id}`)}
      className={`relative h-24 rounded-xl bg-linear-to-br ${board.color} cursor-pointer group overflow-hidden`}
    >
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
      <div className="relative p-3 h-full flex flex-col justify-between">
        <span className="text-white font-semibold text-sm leading-tight line-clamp-2">
          {board.title}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onStar(); }}
          className="self-end opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/20"
        >
          <Star className={`w-3.5 h-3.5 ${board.starred ? "fill-amber-400 text-amber-400" : "text-white"}`} />
        </button>
      </div>
    </div>
  );
}
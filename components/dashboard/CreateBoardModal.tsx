"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";

const BOARD_COLORS = [
  "from-purple-700 to-purple-900",
  "from-rose-700 to-pink-900",
  "from-blue-700 to-indigo-900",
  "from-emerald-700 to-teal-900",
  "from-amber-600 to-orange-800",
  "from-cyan-600 to-blue-800",
];

interface Workspace {
  id: string;
  name: string;
  color: string;
}

interface CreateBoardModalProps {
  workspace: Workspace;
  onClose: () => void;
  onCreate: (title: string, color: string) => void;
}

export default function CreateBoardModal({ workspace, onClose, onCreate }: CreateBoardModalProps) {
  const [title, setTitle] = useState("");
  const [color, setColor] = useState(BOARD_COLORS[0]);
  const [loading, setLoading] = useState(false);

  function handleCreate() {
    if (!title.trim()) return;
    setLoading(true);
    setTimeout(() => {
      onCreate(title.trim(), color);
      setLoading(false);
    }, 600);
  }

  return (
    <Modal title="Tạo Board mới" onClose={onClose}>
      <div className="space-y-4">
        {/* Preview */}
        <div className={`h-20 rounded-xl bg-linear-to-br ${color} flex items-end p-3 transition-all`}>
          <span className="text-white font-semibold text-sm drop-shadow">
            {title || "Tên board..."}
          </span>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">Màu nền</label>
          <div className="flex gap-2 flex-wrap">
            {BOARD_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-lg bg-linear-to-br ${c} transition-transform hover:scale-110 ${
                  color === c ? "ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110" : ""
                }`}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Tiêu đề Board</label>
          <input
            autoFocus
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="VD: Sprint Planning"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Workspace</label>
          <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5">
            <div className={`w-5 h-5 rounded bg-linear-to-br ${workspace.color} shrink-0`} />
            <span className="text-sm text-white">{workspace.name}</span>
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={!title.trim() || loading}
          className="w-full bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all"
        >
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <><Check className="w-4 h-4" /> Tạo Board</>
          }
        </button>
      </div>
    </Modal>
  );
}
"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";

const COLORS = [
  "from-purple-600 to-blue-600",
  "from-pink-600 to-rose-600",
  "from-emerald-600 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-indigo-600 to-violet-600",
  "from-cyan-500 to-blue-500",
];

interface CreateWorkspaceModalProps {
  onClose: () => void;
  onCreate: (name: string, color: string) => void;
}

export default function CreateWorkspaceModal({ onClose, onCreate }: CreateWorkspaceModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);

  function handleCreate() {
    if (!name.trim()) return;
    setLoading(true);
    setTimeout(() => {
      onCreate(name.trim(), color);
      setLoading(false);
    }, 800);
  }

  return (
    <Modal title="Tạo Workspace mới" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Tên Workspace</label>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="VD: Team Marketing"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">Màu sắc</label>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map((c) => (
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

        <button
          onClick={handleCreate}
          disabled={!name.trim() || loading}
          className="w-full bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all"
        >
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <><Check className="w-4 h-4" /> Tạo Workspace</>
          }
        </button>
      </div>
    </Modal>
  );
}
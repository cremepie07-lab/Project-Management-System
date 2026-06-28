"use client";

import { useState, useTransition } from "react";
import { X, Check, Trash2, Tag, Users, Plus, Pencil } from "lucide-react";
import { updateCard } from "@/app/actions/card";
import { toggleCardLabel, toggleCardMember, createLabel, deleteLabel, updateLabel } from "@/app/actions/label";

interface Label { id: string; name: string; color: string; }
interface Member { id: string; name: string; avatarUrl?: string | null; }
interface CardLabel { labelId: string; label: Label; }
interface CardMember { userId: string; user: Member; }
interface Card {
  id: string; title: string; description?: string | null;
  order: number; color?: string | null;
  cardLabels: CardLabel[];
  cardMembers: CardMember[];
}

interface Props {
  card: Card;
  listId: string;
  boardId: string;
  boardLabels: Label[];
  workspaceMembers: Member[];
  onClose: () => void;
  onUpdate: (card: Card) => void;
  onDelete: (cardId: string, listId: string) => void;
  onLabelsChange: (labels: Label[]) => void;
}

const PRESET_COLORS = [
  "#ef4444","#f97316","#eab308","#22c55e",
  "#3b82f6","#8b5cf6","#ec4899","#14b8a6",
];

type Tab = "labels" | "members";

export default function CardModal({
  card, listId, boardId, boardLabels, workspaceMembers,
  onClose, onUpdate, onDelete, onLabelsChange,
}: Props) {
  const [title, setTitle] = useState(card.title);
  const [desc, setDesc] = useState(card.description ?? "");
  const [localCard, setLocalCard] = useState<Card>(card);
  const [tab, setTab] = useState<Tab | null>(null);
  const [, startTransition] = useTransition();
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(PRESET_COLORS[0]);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);

  async function handleSave() {
    await updateCard(card.id, { title, description: desc });
    onUpdate({ ...localCard, title, description: desc });
    onClose();
  }

  async function handleToggleLabel(labelId: string) {
    const res = await toggleCardLabel(card.id, labelId);
    const label = boardLabels.find((l) => l.id === labelId)!;
    setLocalCard((prev) => ({
      ...prev,
      cardLabels: res.action === "added"
        ? [...prev.cardLabels, { labelId, label }]
        : prev.cardLabels.filter((cl) => cl.labelId !== labelId),
    }));
  }

  async function handleToggleMember(userId: string) {
    const res = await toggleCardMember(card.id, userId);
    const user = workspaceMembers.find((m) => m.id === userId)!;
    setLocalCard((prev) => ({
      ...prev,
      cardMembers: res.action === "added"
        ? [...prev.cardMembers, { userId, user }]
        : prev.cardMembers.filter((cm) => cm.userId !== userId),
    }));
  }

  async function handleCreateLabel() {
    if (!newLabelName.trim()) return;
    const label = await createLabel(boardId, newLabelName.trim(), newLabelColor);
    onLabelsChange([...boardLabels, label]);
    setNewLabelName("");
  }

  async function handleUpdateLabel() {
    if (!editingLabel) return;
    await updateLabel(editingLabel.id, { name: editingLabel.name, color: editingLabel.color });
    onLabelsChange(boardLabels.map((l) => l.id === editingLabel.id ? editingLabel : l));
    setEditingLabel(null);
  }

  async function handleDeleteLabel(labelId: string) {
    await deleteLabel(labelId);
    onLabelsChange(boardLabels.filter((l) => l.id !== labelId));
    setLocalCard((prev) => ({ ...prev, cardLabels: prev.cardLabels.filter((cl) => cl.labelId !== labelId) }));
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h3 className="font-semibold text-white">Chi tiết thẻ</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {localCard.cardLabels.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {localCard.cardLabels.map((cl) => (
                <span key={cl.labelId} className="text-xs px-2 py-0.5 rounded-full font-medium text-white" style={{ backgroundColor: cl.label.color }}>
                  {cl.label.name}
                </span>
              ))}
            </div>
          )}

          {localCard.cardMembers.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {localCard.cardMembers.map((cm) => (
                <div key={cm.userId} className="flex items-center gap-1.5 bg-gray-800 rounded-full px-2 py-1">
                  <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-xs text-white font-bold shrink-0">
                    {cm.user.name[0].toUpperCase()}
                  </div>
                  <span className="text-xs text-gray-300">{cm.user.name}</span>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="text-xs text-gray-400 font-medium mb-1.5 block">Tiêu đề</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 font-medium mb-1.5 block">Mô tả</label>
            <textarea rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Thêm mô tả..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500 transition-colors resize-none"
            />
          </div>

          <div className="flex gap-2">
            <button onClick={() => setTab(tab === "labels" ? null : "labels")}
              className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border transition-colors ${tab === "labels" ? "bg-purple-600 border-purple-500 text-white" : "border-gray-700 text-gray-400 hover:text-white hover:border-gray-600"}`}
            >
              <Tag className="w-3.5 h-3.5" /> Nhãn
            </button>
            <button onClick={() => setTab(tab === "members" ? null : "members")}
              className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border transition-colors ${tab === "members" ? "bg-purple-600 border-purple-500 text-white" : "border-gray-700 text-gray-400 hover:text-white hover:border-gray-600"}`}
            >
              <Users className="w-3.5 h-3.5" /> Thành viên
            </button>
          </div>

          {tab === "labels" && (
            <div className="bg-gray-800 rounded-xl p-3 space-y-3">
              <p className="text-xs text-gray-400 font-medium">Chọn nhãn</p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {boardLabels.map((label) => {
                  const active = localCard.cardLabels.some((cl) => cl.labelId === label.id);
                  return editingLabel?.id === label.id ? (
                    <div key={label.id} className="flex items-center gap-2">
                      <input value={editingLabel.name} onChange={(e) => setEditingLabel({ ...editingLabel, name: e.target.value })}
                        className="flex-1 bg-gray-700 text-white text-xs px-2 py-1.5 rounded-lg outline-none border border-purple-500"
                      />
                      <div className="flex gap-1">
                        {PRESET_COLORS.map((c) => (
                          <button key={c} onClick={() => setEditingLabel({ ...editingLabel, color: c })}
                            className="w-4 h-4 rounded-full transition-all"
                            style={{ backgroundColor: c, outline: editingLabel.color === c ? "2px solid white" : "2px solid transparent", outlineOffset: "2px" }}
                          />
                        ))}
                      </div>
                      <button onClick={handleUpdateLabel} className="text-green-400 hover:text-green-300"><Check className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setEditingLabel(null)} className="text-gray-500 hover:text-white"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ) : (
                    <div key={label.id} className="flex items-center gap-2">
                      <button onClick={() => handleToggleLabel(label.id)}
                        className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${active ? "bg-gray-700" : "hover:bg-gray-700"}`}
                      >
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: label.color }} />
                        <span className="text-white">{label.name}</span>
                        {active && <Check className="w-3 h-3 text-purple-400 ml-auto" />}
                      </button>
                      <button onClick={() => setEditingLabel(label)} className="text-gray-500 hover:text-white p-1"><Pencil className="w-3 h-3" /></button>
                      <button onClick={() => handleDeleteLabel(label.id)} className="text-gray-500 hover:text-red-400 p-1"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-gray-700 pt-3 space-y-2">
                <p className="text-xs text-gray-500">Tạo nhãn mới</p>
                <input value={newLabelName} onChange={(e) => setNewLabelName(e.target.value)} placeholder="Tên nhãn..."
                  className="w-full bg-gray-700 text-white text-xs px-2 py-1.5 rounded-lg outline-none border border-gray-600 focus:border-purple-500"
                />
                <div className="flex gap-1.5 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button key={c} onClick={() => setNewLabelColor(c)}
                      className="w-6 h-6 rounded-full transition-all"
                      style={{ backgroundColor: c, outline: newLabelColor === c ? "2px solid white" : "2px solid transparent", outlineOffset: "2px" }}
                    />
                  ))}
                </div>
                <button onClick={handleCreateLabel} className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Tạo nhãn
                </button>
              </div>
            </div>
          )}

          {tab === "members" && (
            <div className="bg-gray-800 rounded-xl p-3 space-y-2">
              <p className="text-xs text-gray-400 font-medium">Phân công thành viên</p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {workspaceMembers.map((member) => {
                  const active = localCard.cardMembers.some((cm) => cm.userId === member.id);
                  return (
                    <button key={member.id} onClick={() => handleToggleMember(member.id)}
                      className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs transition-colors ${active ? "bg-gray-700" : "hover:bg-gray-700"}`}
                    >
                      <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-xs text-white font-bold shrink-0">
                        {member.name[0].toUpperCase()}
                      </div>
                      <span className="text-white flex-1 text-left">{member.name}</span>
                      {active && <Check className="w-3.5 h-3.5 text-purple-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button onClick={handleSave}
              className="flex-1 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <Check className="w-4 h-4" /> Lưu
            </button>
            <button onClick={() => onDelete(card.id, listId)}
              className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Xóa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
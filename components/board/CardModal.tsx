"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import {
  X, Check, Trash2, Tag, Users, Plus, Pencil, Calendar,
  ListChecks, MessageSquare, Clock, Timer, Play, Pause, Square, RotateCcw,
} from "lucide-react";
import { updateCard } from "@/app/actions/card";
import { toggleCardLabel, toggleCardMember, createLabel, deleteLabel, updateLabel } from "@/app/actions/label";
import {
  getChecklists, createChecklist, deleteChecklist,
  createChecklistItem, toggleChecklistItem, deleteChecklistItem,
} from "@/app/actions/checklist";
import { getActivities, createComment, deleteComment } from "@/app/actions/activity";
import {
  getTimeEntries, getRunningTimeEntry, startTimer, stopTimer,
  logPomodoroSession, deleteTimeEntry,
} from "@/app/actions/time-entry";
import { formatDueDate, getDueDateStatus, DUE_DATE_STYLES, toDateInputValue } from "@/lib/due-date";
import { formatDuration, formatClock, sumTrackedSeconds } from "@/lib/time-format";

interface Label { id: string; name: string; color: string; }
interface Member { id: string; name: string; avatarUrl?: string | null; }
interface CardLabel { labelId: string; label: Label; }
interface CardMember { userId: string; user: Member; }
interface ChecklistItemT { id: string; title: string; isDone: boolean; order: number; }
interface ChecklistT { id: string; title: string; order: number; items: ChecklistItemT[]; }
interface ActivityT { id: string; type: string; message: string; createdAt: string | Date; user: Member; }
interface TimeEntryT { id: string; startedAt: string | Date; endedAt: string | Date | null; note?: string | null; user: Member; }

interface Card {
  id: string; title: string; description?: string | null;
  order: number; color?: string | null;
  dueDate?: string | Date | null;
  cardLabels: CardLabel[];
  cardMembers: CardMember[];
  checklists?: ChecklistT[];
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

const POMODORO_WORK = 25 * 60;
const POMODORO_BREAK = 5 * 60;

type Tab = "labels" | "members" | "due" | "checklist" | "comments" | "time" | "pomodoro";

function playBeep() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // bỏ qua nếu trình duyệt không hỗ trợ Web Audio API
  }
}

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
  const [dueDateInput, setDueDateInput] = useState(toDateInputValue(card.dueDate));
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Checklist
  const [checklists, setChecklists] = useState<ChecklistT[]>(card.checklists ?? []);
  const [checklistsLoaded, setChecklistsLoaded] = useState(!!card.checklists);
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [newItemTitleFor, setNewItemTitleFor] = useState<Record<string, string>>({});

  // Bình luận & hoạt động
  const [activities, setActivities] = useState<ActivityT[]>([]);
  const [activitiesLoaded, setActivitiesLoaded] = useState(false);
  const [newComment, setNewComment] = useState("");

  // Time tracking
  const [timeEntries, setTimeEntries] = useState<TimeEntryT[]>([]);
  const [timeEntriesLoaded, setTimeEntriesLoaded] = useState(false);
  const [runningEntryId, setRunningEntryId] = useState<string | null>(null);
  const [runningStartedAt, setRunningStartedAt] = useState<Date | null>(null);
  const [, setTick] = useState(0);

  // Pomodoro (client-side, không cần load)
  const [pomoMode, setPomoMode] = useState<"work" | "break">("work");
  const [pomoSecondsLeft, setPomoSecondsLeft] = useState(POMODORO_WORK);
  const [pomoRunning, setPomoRunning] = useState(false);
  const pomoStartedAtRef = useRef<Date | null>(null);

  const dueStatus = getDueDateStatus(localCard.dueDate);
  const totalItems = checklists.reduce((sum, cl) => sum + cl.items.length, 0);
  const doneItems = checklists.reduce((sum, cl) => sum + cl.items.filter((i) => i.isDone).length, 0);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setCurrentUserId(d.user?.id ?? null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === "checklist" && !checklistsLoaded) {
      getChecklists(card.id).then((data) => {
        setChecklists(data);
        setChecklistsLoaded(true);
      });
    }
    if (tab === "comments" && !activitiesLoaded) {
      getActivities(card.id).then((data) => {
        setActivities(data);
        setActivitiesLoaded(true);
      });
    }
    if (tab === "time" && !timeEntriesLoaded) {
      Promise.all([getTimeEntries(card.id), getRunningTimeEntry(card.id)]).then(([entries, running]) => {
        setTimeEntries(entries);
        setTimeEntriesLoaded(true);
        if (running) {
          setRunningEntryId(running.id);
          setRunningStartedAt(new Date(running.startedAt));
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Tick mỗi giây khi đang có time entry chạy, để tổng thời gian hiển thị tự cập nhật
  useEffect(() => {
    if (!runningStartedAt) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [runningStartedAt]);

  // Đếm ngược Pomodoro
  useEffect(() => {
    if (!pomoRunning) return;
    const id = setInterval(() => setPomoSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [pomoRunning]);

  // Xử lý khi đồng hồ Pomodoro về 0
  useEffect(() => {
    if (pomoSecondsLeft > 0) return;
    setPomoRunning(false);
    playBeep();

    if (pomoMode === "work" && pomoStartedAtRef.current) {
      const startedAt = pomoStartedAtRef.current;
      logPomodoroSession(card.id, startedAt, new Date())
        .then((entry) => {
          setTimeEntries((prev) => [entry, ...prev]);
          setTimeEntriesLoaded(true);
        })
        .catch(() => {});
    }
    pomoStartedAtRef.current = null;
    setPomoMode((m) => (m === "work" ? "break" : "work"));
    setPomoSecondsLeft(pomoMode === "work" ? POMODORO_BREAK : POMODORO_WORK);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pomoSecondsLeft]);

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

  async function handleSaveDueDate() {
    const newDueDate = dueDateInput ? new Date(dueDateInput) : null;
    const updated = await updateCard(card.id, { dueDate: newDueDate });
    setLocalCard((prev) => ({ ...prev, dueDate: updated.dueDate }));
  }

  async function handleClearDueDate() {
    setDueDateInput("");
    const updated = await updateCard(card.id, { dueDate: null });
    setLocalCard((prev) => ({ ...prev, dueDate: updated.dueDate }));
  }

  // ── Checklist ──
  async function handleCreateChecklist() {
    if (!newChecklistTitle.trim()) return;
    const checklist = await createChecklist(card.id, newChecklistTitle.trim());
    setChecklists((prev) => [...prev, { ...checklist, items: [] }]);
    setNewChecklistTitle("");
  }

  async function handleDeleteChecklist(checklistId: string) {
    await deleteChecklist(checklistId);
    setChecklists((prev) => prev.filter((cl) => cl.id !== checklistId));
  }

  async function handleAddItem(checklistId: string) {
    const text = (newItemTitleFor[checklistId] ?? "").trim();
    if (!text) return;
    const item = await createChecklistItem(checklistId, text);
    setChecklists((prev) => prev.map((cl) =>
      cl.id === checklistId ? { ...cl, items: [...cl.items, item] } : cl
    ));
    setNewItemTitleFor((prev) => ({ ...prev, [checklistId]: "" }));
  }

  async function handleToggleItem(checklistId: string, itemId: string) {
    const updated = await toggleChecklistItem(itemId);
    setChecklists((prev) => prev.map((cl) =>
      cl.id === checklistId ? { ...cl, items: cl.items.map((it) => it.id === itemId ? updated : it) } : cl
    ));
  }

  async function handleDeleteItem(checklistId: string, itemId: string) {
    await deleteChecklistItem(itemId);
    setChecklists((prev) => prev.map((cl) =>
      cl.id === checklistId ? { ...cl, items: cl.items.filter((it) => it.id !== itemId) } : cl
    ));
  }

  // ── Bình luận ──
  async function handleAddComment() {
    if (!newComment.trim()) return;
    const comment = await createComment(card.id, newComment.trim());
    setActivities((prev) => [comment, ...prev]);
    setActivitiesLoaded(true);
    setNewComment("");
  }

  async function handleDeleteComment(activityId: string) {
    await deleteComment(activityId);
    setActivities((prev) => prev.filter((a) => a.id !== activityId));
  }

  // ── Time tracking ──
  async function handleStartTimer() {
    const entry = await startTimer(card.id);
    setRunningEntryId(entry.id);
    setRunningStartedAt(new Date(entry.startedAt));
    setTimeEntries((prev) => [entry, ...prev]);
    setTimeEntriesLoaded(true);
  }

  async function handleStopTimer() {
    const stopped = await stopTimer(card.id);
    setRunningEntryId(null);
    setRunningStartedAt(null);
    if (stopped) {
      setTimeEntries((prev) => prev.map((e) => e.id === stopped.id ? stopped : e));
    }
  }

  async function handleDeleteTimeEntry(entryId: string) {
    await deleteTimeEntry(entryId);
    setTimeEntries((prev) => prev.filter((e) => e.id !== entryId));
  }

  // ── Pomodoro ──
  function handlePomoStart() {
    if (!pomoStartedAtRef.current && pomoMode === "work") pomoStartedAtRef.current = new Date();
    setPomoRunning(true);
  }

  function handlePomoPause() {
    setPomoRunning(false);
  }

  function handlePomoReset() {
    setPomoRunning(false);
    pomoStartedAtRef.current = null;
    setPomoMode("work");
    setPomoSecondsLeft(POMODORO_WORK);
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-800 sticky top-0 bg-gray-900">
          <h3 className="font-semibold text-white">Chi tiết thẻ</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {(localCard.cardLabels.length > 0 || dueStatus || totalItems > 0) && (
            <div className="flex flex-wrap items-center gap-1.5">
              {localCard.cardLabels.map((cl) => (
                <span key={cl.labelId} className="text-xs px-2 py-0.5 rounded-full font-medium text-white" style={{ backgroundColor: cl.label.color }}>
                  {cl.label.name}
                </span>
              ))}
              {dueStatus && localCard.dueDate && (
                <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium border ${DUE_DATE_STYLES[dueStatus]}`}>
                  <Calendar className="w-3 h-3" />
                  {formatDueDate(localCard.dueDate)}
                  {dueStatus === "overdue" && " · Quá hạn"}
                </span>
              )}
              {totalItems > 0 && (
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium border bg-gray-700/50 text-gray-300 border-gray-700">
                  <ListChecks className="w-3 h-3" /> {doneItems}/{totalItems}
                </span>
              )}
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

          <div className="flex flex-wrap gap-2">
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
            <button onClick={() => setTab(tab === "due" ? null : "due")}
              className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border transition-colors ${tab === "due" ? "bg-purple-600 border-purple-500 text-white" : "border-gray-700 text-gray-400 hover:text-white hover:border-gray-600"}`}
            >
              <Calendar className="w-3.5 h-3.5" /> Hạn hoàn thành
            </button>
            <button onClick={() => setTab(tab === "checklist" ? null : "checklist")}
              className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border transition-colors ${tab === "checklist" ? "bg-purple-600 border-purple-500 text-white" : "border-gray-700 text-gray-400 hover:text-white hover:border-gray-600"}`}
            >
              <ListChecks className="w-3.5 h-3.5" /> Checklist
            </button>
            <button onClick={() => setTab(tab === "comments" ? null : "comments")}
              className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border transition-colors ${tab === "comments" ? "bg-purple-600 border-purple-500 text-white" : "border-gray-700 text-gray-400 hover:text-white hover:border-gray-600"}`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Bình luận
            </button>
            <button onClick={() => setTab(tab === "time" ? null : "time")}
              className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border transition-colors ${tab === "time" ? "bg-purple-600 border-purple-500 text-white" : "border-gray-700 text-gray-400 hover:text-white hover:border-gray-600"}`}
            >
              <Clock className="w-3.5 h-3.5" /> Thời gian
            </button>
            <button onClick={() => setTab(tab === "pomodoro" ? null : "pomodoro")}
              className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border transition-colors ${tab === "pomodoro" ? "bg-purple-600 border-purple-500 text-white" : "border-gray-700 text-gray-400 hover:text-white hover:border-gray-600"}`}
            >
              <Timer className="w-3.5 h-3.5" /> Pomodoro
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

          {tab === "due" && (
            <div className="bg-gray-800 rounded-xl p-3 space-y-3">
              <p className="text-xs text-gray-400 font-medium">Đặt hạn hoàn thành</p>
              <input
                type="date"
                value={dueDateInput}
                onChange={(e) => setDueDateInput(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500 [color-scheme:dark]"
              />
              <div className="flex gap-2">
                <button onClick={handleSaveDueDate} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium py-2 rounded-lg transition-colors">
                  Lưu hạn
                </button>
                {localCard.dueDate && (
                  <button onClick={handleClearDueDate} className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs transition-colors">
                    Xóa hạn
                  </button>
                )}
              </div>
            </div>
          )}

          {tab === "checklist" && (
            <div className="bg-gray-800 rounded-xl p-3 space-y-4">
              {!checklistsLoaded && <p className="text-xs text-gray-500">Đang tải...</p>}

              {checklists.map((cl) => {
                const done = cl.items.filter((i) => i.isDone).length;
                const total = cl.items.length;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <div key={cl.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white">{cl.title}</p>
                      <button onClick={() => handleDeleteChecklist(cl.id)} className="text-gray-500 hover:text-red-400 p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {total > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{done}/{total}</span>
                      </div>
                    )}
                    <div className="space-y-1">
                      {cl.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 group">
                          <button onClick={() => handleToggleItem(cl.id, item.id)}
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${item.isDone ? "bg-purple-600 border-purple-600" : "border-gray-600 hover:border-gray-500"}`}
                          >
                            {item.isDone && <Check className="w-3 h-3 text-white" />}
                          </button>
                          <span className={`text-xs flex-1 ${item.isDone ? "text-gray-500 line-through" : "text-gray-200"}`}>{item.title}</span>
                          <button onClick={() => handleDeleteItem(cl.id, item.id)} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        value={newItemTitleFor[cl.id] ?? ""}
                        onChange={(e) => setNewItemTitleFor((prev) => ({ ...prev, [cl.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === "Enter") handleAddItem(cl.id); }}
                        placeholder="Thêm mục..."
                        className="flex-1 bg-gray-700 text-white text-xs px-2 py-1.5 rounded-lg outline-none border border-gray-600 focus:border-purple-500"
                      />
                      <button onClick={() => handleAddItem(cl.id)} className="text-purple-400 hover:text-purple-300 px-2">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              <div className="border-t border-gray-700 pt-3 flex gap-1.5">
                <input
                  value={newChecklistTitle}
                  onChange={(e) => setNewChecklistTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreateChecklist(); }}
                  placeholder="Tên checklist mới..."
                  className="flex-1 bg-gray-700 text-white text-xs px-2 py-1.5 rounded-lg outline-none border border-gray-600 focus:border-purple-500"
                />
                <button onClick={handleCreateChecklist} className="bg-purple-600 hover:bg-purple-500 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
                  Thêm
                </button>
              </div>
            </div>
          )}

          {tab === "comments" && (
            <div className="bg-gray-800 rounded-xl p-3 space-y-3">
              <textarea
                rows={2}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                placeholder="Viết bình luận..."
                className="w-full bg-gray-700 text-white text-xs px-2 py-1.5 rounded-lg outline-none border border-gray-600 focus:border-purple-500 resize-none"
              />
              <button onClick={handleAddComment} className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                Gửi bình luận
              </button>

              <div className="space-y-2.5 max-h-64 overflow-y-auto pt-2 border-t border-gray-700">
                {!activitiesLoaded && <p className="text-xs text-gray-500">Đang tải...</p>}
                {activitiesLoaded && activities.length === 0 && (
                  <p className="text-xs text-gray-500">Chưa có bình luận hay hoạt động nào.</p>
                )}
                {activities.map((a) => (
                  <div key={a.id} className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-xs text-white font-bold shrink-0 mt-0.5">
                      {a.user.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-300">
                        <span className="font-medium text-white">{a.user.name}</span>{" "}
                        {a.type === "COMMENT" ? (
                          <span className="text-gray-200">{a.message}</span>
                        ) : (
                          <span className="text-gray-500 italic">{a.message}</span>
                        )}
                      </p>
                      <p className="text-[11px] text-gray-600 mt-0.5">
                        {new Date(a.createdAt).toLocaleString("vi-VN")}
                      </p>
                    </div>
                    {a.type === "COMMENT" && a.user.id === currentUserId && (
                      <button onClick={() => handleDeleteComment(a.id)} className="text-gray-600 hover:text-red-400 shrink-0">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "time" && (
            <div className="bg-gray-800 rounded-xl p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Tổng thời gian đã ghi nhận</p>
                  <p className="text-lg font-bold text-white">{formatDuration(sumTrackedSeconds(timeEntries))}</p>
                </div>
                {runningEntryId ? (
                  <button onClick={handleStopTimer} className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium px-3 py-2 rounded-lg transition-colors">
                    <Square className="w-3.5 h-3.5" /> Dừng
                  </button>
                ) : (
                  <button onClick={handleStartTimer} className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors">
                    <Play className="w-3.5 h-3.5" /> Bắt đầu
                  </button>
                )}
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto border-t border-gray-700 pt-2">
                {!timeEntriesLoaded && <p className="text-xs text-gray-500">Đang tải...</p>}
                {timeEntriesLoaded && timeEntries.length === 0 && (
                  <p className="text-xs text-gray-500">Chưa có phiên làm việc nào được ghi nhận.</p>
                )}
                {timeEntries.map((e) => {
                  const seconds = sumTrackedSeconds([e]);
                  return (
                    <div key={e.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                          {e.user.name[0].toUpperCase()}
                        </div>
                        <span className="text-gray-300 truncate">{e.note ?? "Phiên làm việc"}</span>
                        {!e.endedAt && <span className="text-green-400 shrink-0">● đang chạy</span>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-gray-400">{formatDuration(seconds)}</span>
                        <button onClick={() => handleDeleteTimeEntry(e.id)} className="text-gray-600 hover:text-red-400">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "pomodoro" && (
            <div className="bg-gray-800 rounded-xl p-4 flex flex-col items-center gap-3">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${pomoMode === "work" ? "bg-purple-600/20 text-purple-300" : "bg-green-600/20 text-green-300"}`}>
                {pomoMode === "work" ? "Tập trung" : "Nghỉ ngơi"}
              </span>
              <p className="text-4xl font-bold text-white tabular-nums">{formatClock(pomoSecondsLeft)}</p>
              <div className="flex gap-2">
                {pomoRunning ? (
                  <button onClick={handlePomoPause} className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors">
                    <Pause className="w-3.5 h-3.5" /> Tạm dừng
                  </button>
                ) : (
                  <button onClick={handlePomoStart} className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors">
                    <Play className="w-3.5 h-3.5" /> Bắt đầu
                  </button>
                )}
                <button onClick={handlePomoReset} className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors">
                  <RotateCcw className="w-3.5 h-3.5" /> Đặt lại
                </button>
              </div>
              <p className="text-[11px] text-gray-500 text-center">
                Khi hoàn thành một phiên tập trung 25 phút, thời gian sẽ tự động được ghi vào tab &quot;Thời gian&quot;.
              </p>
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

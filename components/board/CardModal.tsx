"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import {
  X, Check, Trash2, Tag, Users, Plus, Pencil, Calendar,
  ListChecks, MessageSquare, Clock, Timer, Play, Pause, Square, RotateCcw, Repeat, Link
} from "lucide-react";
import { updateCard } from "@/app/actions/card";
import { toggleCardLabel, toggleCardMember, createLabel, deleteLabel, updateLabel } from "@/app/actions/label";
import {
  getChecklists, createChecklist, deleteChecklist,
  createChecklistItem, toggleChecklistItem, deleteChecklistItem,
} from "@/app/actions/checklist";
import { getActivities, createComment, deleteComment } from "@/app/actions/activity";
import {
  startTimeEntry, stopTimeEntry, savePomodoroSession,
  getCardTimeEntries, getRunningEntry, removeTimeEntry,
} from "@/app/actions/time-tracking";
import { formatDueDate, getDueDateStatus, DUE_DATE_STYLES, toDateInputValue } from "@/lib/due-date";
import { usePomodoroStore, WORK_SEC, BREAK_SEC } from "@/store/pomodoroStore";
import { addCardDependency, removeCardDependency, getBlockerCandidates } from "@/app/actions/dependency";

// ─── inline time helpers ─────────────────────────────────────────────────────

function fmt(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function fmtHuman(totalSeconds: number) {
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h}g ${m}p`;
  return `${m} phút`;
}

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleString("vi-VN", {
    hour: "2-digit", minute: "2-digit",
    day: "2-digit", month: "2-digit",
  });
}

function elapsedSec(from: Date) {
  return Math.max(0, Math.floor((Date.now() - from.getTime()) / 1000));
}

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
    osc.stop(ctx.currentTime + 0.4);
  } catch { /* trình duyệt không hỗ trợ Web Audio */ }
}

// ─── types ───────────────────────────────────────────────────────────────────

interface Label { id: string; name: string; color: string; }
interface Member { id: string; name: string; avatarUrl?: string | null; }
interface CardLabel { labelId: string; label: Label; }
interface CardMember { userId: string; user: Member; }
interface ChecklistItemT { id: string; title: string; isDone: boolean; order: number; }
interface ChecklistT { id: string; title: string; order: number; items: ChecklistItemT[]; }
interface ActivityT { id: string; type: string; message: string; createdAt: string | Date; user: Member; }
interface TimeEntryT {
  id: string; startedAt: string | Date; endedAt: string | Date | null;
  note?: string | null; user: Member;
}

interface CardDependencyT {
  cardId: string;
  dependsOnId: string;
  dependsOn: {
    id: string;
    title: string;
    list: {
      id: string;
      title: string;
    };
  };
}

interface Card {
  id: string; title: string; description?: string | null;
  order: number; color?: string | null;
  dueDate?: string | Date | null;
  totalTimeSpent?: number | null;
  cardLabels: CardLabel[];
  cardMembers: CardMember[];
  checklists?: ChecklistT[];
  isRecurring?: boolean;
  recurrenceInterval?: string | null;
  nextRecurrence?: string | Date | null;
  dependencies?: CardDependencyT[];
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

type Tab = "labels" | "members" | "due" | "checklist" | "comments" | "time" | "pomodoro" | "recurring" | "dependencies";

// ─── Slash Commands ──────────────────────────────────────────────────────────

interface SlashCommand {
  name: string;
  description: string;
  icon: string;
  action: () => void;
}

const SLASH_COMMANDS_DEF = [
  { name: "todo",   description: "Thêm việc cần làm (checkbox)", icon: "☑️" },
  { name: "date",   description: "Đặt hạn hoàn thành",         icon: "📅" },
  { name: "label",  description: "Chọn nhãn",                   icon: "🏷️" },
  { name: "assign", description: "Phân công thành viên",        icon: "👤" },
];

// ─── component ───────────────────────────────────────────────────────────────

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

  // Recurrence states
  const [isRecur, setIsRecur] = useState(card.isRecurring ?? false);
  const [recurInterval, setRecurInterval] = useState(card.recurrenceInterval ?? "DAILY");
  const [nextRecurInput, setNextRecurInput] = useState(toDateInputValue(card.nextRecurrence));

  // Dependency states
  const [dependencies, setDependencies] = useState<CardDependencyT[]>(card.dependencies ?? []);
  const [blockerCandidates, setBlockerCandidates] = useState<any[]>([]);
  const [depSearch, setDepSearch] = useState("");

  // Slash command states
  const [slashVisible, setSlashVisible] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashSource, setSlashSource] = useState<"desc" | "comment">("desc");
  const [slashIndex, setSlashIndex] = useState(0);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const commentRef = useRef<HTMLTextAreaElement>(null);

  // Checklist
  const [checklists, setChecklists] = useState<ChecklistT[]>(card.checklists ?? []);
  const [checklistsLoaded, setChecklistsLoaded] = useState(!!card.checklists);
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [newItemTitleFor, setNewItemTitleFor] = useState<Record<string, string>>({});

  // Bình luận & hoạt động
  const [activities, setActivities] = useState<ActivityT[]>([]);
  const [activitiesLoaded, setActivitiesLoaded] = useState(false);
  const [newComment, setNewComment] = useState("");

  // ── Time tracking ─────────────────────────────────────────────────────────
  const [timeEntries, setTimeEntries] = useState<TimeEntryT[]>([]);
  const [timeEntriesLoaded, setTimeEntriesLoaded] = useState(false);
  const [totalSaved, setTotalSaved] = useState<number>(card.totalTimeSpent ?? 0);
  const [runningId, setRunningId] = useState<string | null>(null);
  const runningStartRef = useRef<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);

  // ── Pomodoro — Zustand store (persist qua localStorage) ──────────────────
  const pomo = usePomodoroStore();
  const [pomoRemaining, setPomoRemaining] = useState(pomo.getRemaining());
  const [pomoSaving, setPomoSaving] = useState(false);

  const dueStatus  = getDueDateStatus(localCard.dueDate);
  const totalItems = checklists.reduce((s, cl) => s + cl.items.length, 0);
  const doneItems  = checklists.reduce((s, cl) => s + cl.items.filter(i => i.isDone).length, 0);

  // Lấy user hiện tại
  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => setCurrentUserId(d.user?.id ?? null))
      .catch(() => {});
  }, []);

  // Gắn store vào card này khi modal mở
  useEffect(() => {
    pomo.attachCard(card.id, card.title);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id, card.title]);

  // Load dữ liệu theo tab
  useEffect(() => {
    if (tab === "checklist" && !checklistsLoaded) {
      getChecklists(card.id).then(data => { setChecklists(data); setChecklistsLoaded(true); });
    }
    if (tab === "comments" && !activitiesLoaded) {
      getActivities(card.id).then(data => { setActivities(data); setActivitiesLoaded(true); });
    }
    if ((tab === "time" || tab === "pomodoro") && !timeEntriesLoaded) {
      Promise.all([getCardTimeEntries(card.id), getRunningEntry(card.id)]).then(([list, running]) => {
        setTimeEntries(list);
        setTimeEntriesLoaded(true);
        if (running) {
          setRunningId(running.id);
          runningStartRef.current = new Date(running.startedAt);
          setElapsed(elapsedSec(new Date(running.startedAt)));
        }
      });
    }
    if (tab === "dependencies" && blockerCandidates.length === 0) {
      getBlockerCandidates(boardId, card.id).then(data => {
        setBlockerCandidates(data);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // ── Tick elapsed timer ────────────────────────────────────────────────────
  useEffect(() => {
    if (!runningId) return;
    const id = setInterval(() => {
      if (runningStartRef.current) setElapsed(elapsedSec(runningStartRef.current));
    }, 1000);
    return () => clearInterval(id);
  }, [runningId]);

  // ── Tick Pomodoro remaining từ store (timestamp-based) ───────────────────
  useEffect(() => {
    const id = setInterval(() => setPomoRemaining(pomo.getRemaining()), 500);
    return () => clearInterval(id);
  }, [pomo]);

  // ── Xử lý khi Pomodoro hết giờ ───────────────────────────────────────────
  useEffect(() => {
    if (pomoRemaining > 0 || !pomo.running || pomoSaving) return;

    async function finish() {
      setPomoSaving(true);
      playBeep();
      if (pomo.phase === "work" && pomo.cardId && pomo.workSessionStartedAt) {
        try {
          const endedAt = new Date();
          const entry = await savePomodoroSession(
            pomo.cardId,
            new Date(pomo.workSessionStartedAt),
            endedAt
          );
          if (entry) {
            const sec = Math.round(
              (endedAt.getTime() - pomo.workSessionStartedAt!) / 1000
            );
            setTotalSaved(s => s + sec);
            setTimeEntries(prev => [entry as TimeEntryT, ...prev]);
            setTimeEntriesLoaded(true);
          }
        } catch {}
      }
      pomo.advancePhase();
      setPomoSaving(false);
    }

    finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pomoRemaining]);

  // ── Resync khi quay lại tab ───────────────────────────────────────────────
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (runningStartRef.current) setElapsed(elapsedSec(runningStartRef.current));
      setPomoRemaining(pomo.getRemaining());
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [pomo]);

  // ─── Handlers: card ───────────────────────────────────────────────────────

  async function handleSave() {
    const nextRecurDate = nextRecurInput ? new Date(nextRecurInput) : null;
    await updateCard(card.id, {
      title,
      description: desc,
      isRecurring: isRecur,
      recurrenceInterval: recurInterval,
      nextRecurrence: nextRecurDate,
    });
    onUpdate({
      ...localCard,
      title,
      description: desc,
      isRecurring: isRecur,
      recurrenceInterval: recurInterval,
      nextRecurrence: nextRecurDate,
    });
    onClose();
  }

  // ── Xóa card: dọn dẹp Pomodoro store nếu đang gắn vào chính card này ─────
  function handleDeleteCard() {
    if (pomo.cardId === card.id) {
      pomo.clear();
    }
    onDelete(card.id, listId);
  }

  async function handleAddDep(blockerId: string) {
    const res = await addCardDependency(card.id, blockerId);
    if (res.error) {
      alert(res.error);
      return;
    }
    if (res.success && res.dependency) {
      const newDeps = [...dependencies, res.dependency as any];
      setDependencies(newDeps);
      const updatedCard = { ...localCard, dependencies: newDeps };
      setLocalCard(updatedCard);
      onUpdate(updatedCard);
    }
  }

  async function handleRemoveDep(blockerId: string) {
    const res = await removeCardDependency(card.id, blockerId);
    if (res.success) {
      const updatedDeps = dependencies.filter(d => d.dependsOnId !== blockerId);
      setDependencies(updatedDeps);
      const updatedCard = { ...localCard, dependencies: updatedDeps };
      setLocalCard(updatedCard);
      onUpdate(updatedCard);
    }
  }

  async function handleToggleLabel(labelId: string) {
    const res   = await toggleCardLabel(card.id, labelId);
    const label = boardLabels.find(l => l.id === labelId)!;
    setLocalCard(prev => ({
      ...prev,
      cardLabels: res.action === "added"
        ? [...prev.cardLabels, { labelId, label }]
        : prev.cardLabels.filter(cl => cl.labelId !== labelId),
    }));
  }

  async function handleToggleMember(userId: string) {
    const res  = await toggleCardMember(card.id, userId);
    const user = workspaceMembers.find(m => m.id === userId)!;
    setLocalCard(prev => ({
      ...prev,
      cardMembers: res.action === "added"
        ? [...prev.cardMembers, { userId, user }]
        : prev.cardMembers.filter(cm => cm.userId !== userId),
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
    onLabelsChange(boardLabels.map(l => l.id === editingLabel.id ? editingLabel : l));
    setEditingLabel(null);
  }

  async function handleDeleteLabel(labelId: string) {
    await deleteLabel(labelId);
    onLabelsChange(boardLabels.filter(l => l.id !== labelId));
    setLocalCard(prev => ({ ...prev, cardLabels: prev.cardLabels.filter(cl => cl.labelId !== labelId) }));
  }

  async function handleSaveDueDate() {
    const newDueDate = dueDateInput ? new Date(dueDateInput) : null;
    const updated    = await updateCard(card.id, { dueDate: newDueDate });
    setLocalCard(prev => ({ ...prev, dueDate: updated.dueDate }));
  }

  async function handleClearDueDate() {
    setDueDateInput("");
    const updated = await updateCard(card.id, { dueDate: null });
    setLocalCard(prev => ({ ...prev, dueDate: updated.dueDate }));
  }

  // ─── Handlers: checklist ─────────────────────────────────────────────────

  async function handleCreateChecklist() {
    if (!newChecklistTitle.trim()) return;
    const checklist = await createChecklist(card.id, newChecklistTitle.trim());
    setChecklists(prev => [...prev, { ...checklist, items: [] }]);
    setNewChecklistTitle("");
  }

  async function handleDeleteChecklist(checklistId: string) {
    await deleteChecklist(checklistId);
    setChecklists(prev => prev.filter(cl => cl.id !== checklistId));
  }

  async function handleAddItem(checklistId: string) {
    const text = (newItemTitleFor[checklistId] ?? "").trim();
    if (!text) return;
    const item = await createChecklistItem(checklistId, text);
    setChecklists(prev => prev.map(cl =>
      cl.id === checklistId ? { ...cl, items: [...cl.items, item] } : cl
    ));
    setNewItemTitleFor(prev => ({ ...prev, [checklistId]: "" }));
  }

  async function handleToggleItem(checklistId: string, itemId: string) {
    const updated = await toggleChecklistItem(itemId);
    if (!updated) return;
    setChecklists(prev => prev.map(cl =>
      cl.id === checklistId ? { ...cl, items: cl.items.map(it => it.id === itemId ? updated : it) } : cl
    ));
  }

  async function handleDeleteItem(checklistId: string, itemId: string) {
    await deleteChecklistItem(itemId);
    setChecklists(prev => prev.map(cl =>
      cl.id === checklistId ? { ...cl, items: cl.items.filter(it => it.id !== itemId) } : cl
    ));
  }

  // ─── Handlers: bình luận ─────────────────────────────────────────────────

  async function handleAddComment() {
    if (!newComment.trim()) return;
    const comment = await createComment(card.id, newComment.trim());
    setActivities(prev => [comment, ...prev]);
    setActivitiesLoaded(true);
    setNewComment("");
  }

  async function handleDeleteComment(activityId: string) {
    await deleteComment(activityId);
    setActivities(prev => prev.filter(a => a.id !== activityId));
  }

  // ─── Slash command handlers ──────────────────────────────────────────────

  const filteredSlashCmds = SLASH_COMMANDS_DEF.filter(cmd =>
    cmd.name.toLowerCase().includes(slashQuery.toLowerCase())
  );

  function handleSlashInput(e: React.ChangeEvent<HTMLTextAreaElement>, source: "desc" | "comment") {
    const value = e.target.value;
    const cursor = e.target.selectionStart;

    if (source === "desc") setDesc(value);
    else setNewComment(value);

    const textBeforeCursor = value.slice(0, cursor);
    const lastSlash = textBeforeCursor.lastIndexOf("/");

    if (lastSlash >= 0 && (lastSlash === 0 || textBeforeCursor[lastSlash - 1] === " " || textBeforeCursor[lastSlash - 1] === "\n")) {
      const query = textBeforeCursor.slice(lastSlash + 1);
      if (!query.includes(" ") && query.length <= 20) {
        setSlashVisible(true);
        setSlashQuery(query);
        setSlashSource(source);
        setSlashIndex(0);
        return;
      }
    }
    setSlashVisible(false);
  }

  function executeSlashCommand(cmdName: string) {
    const textarea = slashSource === "desc" ? descRef.current : commentRef.current;
    if (!textarea) return;
    const value = textarea.value;
    const cursor = textarea.selectionStart;
    const textBefore = value.slice(0, cursor);
    const lastSlash = textBefore.lastIndexOf("/");
    const textAfter = value.slice(cursor);

    if (cmdName === "todo") {
      const before = value.slice(0, lastSlash);
      const newVal = before + "- [ ] " + textAfter;
      if (slashSource === "desc") setDesc(newVal);
      else setNewComment(newVal);
    } else if (cmdName === "date") {
      const before = value.slice(0, lastSlash);
      if (slashSource === "desc") setDesc(before + textAfter);
      else setNewComment(before + textAfter);
      setTab("due");
    } else if (cmdName === "label") {
      const before = value.slice(0, lastSlash);
      if (slashSource === "desc") setDesc(before + textAfter);
      else setNewComment(before + textAfter);
      setTab("labels");
    } else if (cmdName === "assign") {
      const before = value.slice(0, lastSlash);
      if (slashSource === "desc") setDesc(before + textAfter);
      else setNewComment(before + textAfter);
      setTab("members");
    }
    setSlashVisible(false);
  }

  function handleSlashKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!slashVisible) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSlashIndex(i => Math.min(i + 1, filteredSlashCmds.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSlashIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filteredSlashCmds.length > 0) {
      e.preventDefault();
      executeSlashCommand(filteredSlashCmds[slashIndex].name);
    } else if (e.key === "Escape") {
      setSlashVisible(false);
    }
  }

  // ─── Handlers: time tracking ─────────────────────────────────────────────

  async function handleStartTimer() {
    const entry = await startTimeEntry(card.id);
    setRunningId(entry.id);
    runningStartRef.current = new Date(entry.startedAt);
    setElapsed(0);
    setTimeEntries(prev => [entry, ...prev]);
    setTimeEntriesLoaded(true);
  }

  async function handleStopTimer() {
    if (!runningId) return;
    const res = await stopTimeEntry(card.id, runningId);
    setRunningId(null);
    runningStartRef.current = null;
    setElapsed(0);
    if (res) {
      setTotalSaved(s => s + res.elapsedSeconds);
      setTimeEntries(prev => prev.map(e => e.id === res.entry.id ? res.entry : e));
    }
  }

  async function handleDeleteTimeEntry(entryId: string) {
    const entry = timeEntries.find(e => e.id === entryId);
    await removeTimeEntry(card.id, entryId);
    setTimeEntries(prev => prev.filter(e => e.id !== entryId));
    if (entry?.endedAt) {
      const sec = Math.round(
        (new Date(entry.endedAt).getTime() - new Date(entry.startedAt).getTime()) / 1000
      );
      setTotalSaved(s => Math.max(0, s - sec));
    }
  }

  // ─── Derived values ───────────────────────────────────────────────────────

  const totalDisplay = totalSaved + (runningId ? elapsed : 0);
  const pomoTotal    = pomo.phase === "work" ? WORK_SEC : BREAK_SEC;
  const pomoPct      = Math.round(((pomoTotal - pomoRemaining) / pomoTotal) * 100);
  const pomoCirc     = 2 * Math.PI * 54;
  const canStart     = pomo.cardId === null || pomo.cardId === card.id;

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-800 sticky top-0 bg-gray-900">
          <h3 className="font-semibold text-white">Chi tiết thẻ</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">

          {/* Labels + due date + checklist badge */}
          {(localCard.cardLabels.length > 0 || dueStatus || totalItems > 0) && (
            <div className="flex flex-wrap items-center gap-1.5">
              {localCard.cardLabels.map(cl => (
                <span key={cl.labelId} className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
                  style={{ backgroundColor: cl.label.color }}>
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

          {/* Members */}
          {localCard.cardMembers.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {localCard.cardMembers.map(cm => (
                <div key={cm.userId} className="flex items-center gap-1.5 bg-gray-800 rounded-full px-2 py-1">
                  <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-xs text-white font-bold shrink-0">
                    {cm.user.name[0].toUpperCase()}
                  </div>
                  <span className="text-xs text-gray-300">{cm.user.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tiêu đề */}
          <div>
            <label className="text-xs text-gray-400 font-medium mb-1.5 block">Tiêu đề</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Mô tả */}
          <div className="relative">
            <label className="text-xs text-gray-400 font-medium mb-1.5 block">Mô tả</label>
            <textarea ref={descRef} rows={3} value={desc}
              onChange={(e) => handleSlashInput(e, "desc")}
              onKeyDown={(e) => handleSlashKeyDown(e)}
              placeholder="Thêm mô tả... (gõ / để mở lệnh nhanh)"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500 transition-colors resize-none"
            />
            {slashVisible && slashSource === "desc" && (
              <div className="absolute left-0 top-full mt-1 z-50 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl py-1 w-64">
                {filteredSlashCmds.length === 0 ? (
                  <p className="text-xs text-gray-500 px-3 py-2">Không có lệnh nào khớp</p>
                ) : (
                  filteredSlashCmds.map((cmd, i) => (
                    <button key={cmd.name} onClick={() => executeSlashCommand(cmd.name)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors ${i === slashIndex ? "bg-purple-600/20 text-purple-300" : "text-gray-300 hover:bg-gray-700"}`}>
                      <span className="text-base">{cmd.icon}</span>
                      <div>
                        <span className="font-medium">/{cmd.name}</span>
                        <span className="text-gray-500 ml-1.5">{cmd.description}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Tab buttons */}
          <div className="flex flex-wrap gap-2">
            {([
              { key: "labels",       icon: <Tag className="w-3.5 h-3.5" />,           label: "Nhãn" },
              { key: "members",      icon: <Users className="w-3.5 h-3.5" />,         label: "Thành viên" },
              { key: "due",          icon: <Calendar className="w-3.5 h-3.5" />,      label: "Hạn" },
              { key: "checklist",    icon: <ListChecks className="w-3.5 h-3.5" />,    label: "Checklist" },
              { key: "comments",     icon: <MessageSquare className="w-3.5 h-3.5" />, label: "Bình luận" },
              { key: "time",         icon: <Clock className="w-3.5 h-3.5" />,         label: "Thời gian" },
              { key: "pomodoro",     icon: <Timer className="w-3.5 h-3.5" />,         label: "Pomodoro" },
              { key: "recurring",    icon: <Repeat className="w-3.5 h-3.5" />,        label: "Lặp lại" },
              { key: "dependencies", icon: <Link className="w-3.5 h-3.5" />,          label: "Liên kết" },
            ] as { key: Tab; icon: React.ReactNode; label: string }[]).map(t => (
              <button key={t.key} onClick={() => setTab(tab === t.key ? null : t.key)}
                className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border transition-colors ${
                  tab === t.key
                    ? "bg-purple-600 border-purple-500 text-white"
                    : "border-gray-700 text-gray-400 hover:text-white hover:border-gray-600"
                }`}
              >
                {t.icon} {t.label}
                {/* Dot indicator khi Pomodoro đang chạy */}
                {t.key === "pomodoro" && pomo.running && tab !== "pomodoro" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                )}
              </button>
            ))}
          </div>

          {/* ── TAB: Nhãn ──────────────────────────────────────────────────── */}
          {tab === "labels" && (
            <div className="bg-gray-800 rounded-xl p-3 space-y-3">
              <p className="text-xs text-gray-400 font-medium">Chọn nhãn</p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {boardLabels.map(label =>
                  editingLabel?.id === label.id ? (
                    <div key={label.id} className="flex items-center gap-2">
                      <input value={editingLabel.name}
                        onChange={e => setEditingLabel({ ...editingLabel, name: e.target.value })}
                        className="flex-1 bg-gray-700 text-white text-xs px-2 py-1.5 rounded-lg outline-none border border-purple-500"
                      />
                      <div className="flex gap-1">
                        {PRESET_COLORS.map(c => (
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
                        className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                          localCard.cardLabels.some(cl => cl.labelId === label.id) ? "bg-gray-700" : "hover:bg-gray-700"
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: label.color }} />
                        <span className="text-white">{label.name}</span>
                        {localCard.cardLabels.some(cl => cl.labelId === label.id) && <Check className="w-3 h-3 text-purple-400 ml-auto" />}
                      </button>
                      <button onClick={() => setEditingLabel(label)} className="text-gray-500 hover:text-white p-1"><Pencil className="w-3 h-3" /></button>
                      <button onClick={() => handleDeleteLabel(label.id)} className="text-gray-500 hover:text-red-400 p-1"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  )
                )}
              </div>
              <div className="border-t border-gray-700 pt-3 space-y-2">
                <p className="text-xs text-gray-500">Tạo nhãn mới</p>
                <input value={newLabelName} onChange={e => setNewLabelName(e.target.value)} placeholder="Tên nhãn..."
                  className="w-full bg-gray-700 text-white text-xs px-2 py-1.5 rounded-lg outline-none border border-gray-600 focus:border-purple-500"
                />
                <div className="flex gap-1.5 flex-wrap">
                  {PRESET_COLORS.map(c => (
                    <button key={c} onClick={() => setNewLabelColor(c)} className="w-6 h-6 rounded-full transition-all"
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

          {/* ── TAB: Thành viên ────────────────────────────────────────────── */}
          {tab === "members" && (
            <div className="bg-gray-800 rounded-xl p-3 space-y-2">
              <p className="text-xs text-gray-400 font-medium">Phân công thành viên</p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {workspaceMembers.map(member => {
                  const active = localCard.cardMembers.some(cm => cm.userId === member.id);
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

          {/* ── TAB: Hạn hoàn thành ────────────────────────────────────────── */}
          {tab === "due" && (
            <div className="bg-gray-800 rounded-xl p-3 space-y-3">
              <p className="text-xs text-gray-400 font-medium">Đặt hạn hoàn thành</p>
              <input type="date" value={dueDateInput} onChange={e => setDueDateInput(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500 scheme-dark"
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

          {/* ── TAB: Checklist ─────────────────────────────────────────────── */}
          {tab === "checklist" && (
            <div className="space-y-4">
              <div className="flex gap-1.5">
                <input value={newChecklistTitle}
                  onChange={e => setNewChecklistTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleCreateChecklist(); }}
                  placeholder="Tên checklist mới..."
                  className="flex-1 bg-gray-800 border border-gray-700 text-white text-sm px-3 py-2 rounded-lg outline-none focus:border-purple-500 transition-colors"
                />
                <button onClick={handleCreateChecklist} disabled={!newChecklistTitle.trim()}
                  className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                  <Plus className="w-4 h-4" /> Tạo
                </button>
              </div>
              {!checklistsLoaded && <p className="text-xs text-gray-500 text-center py-2">Đang tải checklist...</p>}
              {checklistsLoaded && checklists.length === 0 && (
                <div className="text-center py-6 border border-dashed border-gray-700 rounded-xl">
                  <ListChecks className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Chưa có checklist nào. Tạo checklist đầu tiên ở ô phía trên.</p>
                </div>
              )}
              {checklists.map(cl => {
                const done = cl.items.filter(i => i.isDone).length;
                const total = cl.items.length;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                const isComplete = total > 0 && done === total;
                const draft = newItemTitleFor[cl.id] ?? "";
                return (
                  <div key={cl.id} className="bg-gray-800 border border-gray-700 rounded-xl p-3 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-white truncate">{cl.title}</p>
                      <button onClick={() => handleDeleteChecklist(cl.id)} className="text-gray-500 hover:text-red-400 p-1 shrink-0 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-medium text-gray-400 w-9 shrink-0 tabular-nums">{pct}%</span>
                      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={"h-full rounded-full transition-all duration-300 " + (isComplete ? "bg-green-500" : "bg-purple-500")}
                          style={{ width: pct + "%" }}
                          role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}
                        />
                      </div>
                      <span className="text-xs text-gray-500 shrink-0 tabular-nums">{done}/{total}</span>
                    </div>
                    <div className="space-y-1">
                      {cl.items.map(item => (
                        <div key={item.id}
                          className={"flex items-center gap-2.5 group rounded-lg px-2 py-1.5 transition-colors " + (item.isDone ? "bg-gray-700/40" : "hover:bg-gray-700/40")}
                        >
                          <button onClick={() => handleToggleItem(cl.id, item.id)}
                            className={"rounded-full border flex items-center justify-center shrink-0 transition-colors " + (item.isDone ? "bg-purple-600 border-purple-600" : "border-gray-600 hover:border-purple-400")}
                            style={{ width: 18, height: 18 }}
                          >
                            {item.isDone && <Check className="w-3 h-3 text-white" />}
                          </button>
                          <span className={"text-xs flex-1 " + (item.isDone ? "text-gray-500 line-through" : "text-gray-200")}>
                            {item.title}
                          </span>
                          <button onClick={() => handleDeleteItem(cl.id, item.id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity shrink-0">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      {total === 0 && (
                        <p className="text-[11px] text-gray-600 italic px-2 py-1">Chưa có việc phụ nào — thêm việc đầu tiên bên dưới.</p>
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      <input value={draft}
                        onChange={e => setNewItemTitleFor(prev => ({ ...prev, [cl.id]: e.target.value }))}
                        onKeyDown={e => { if (e.key === "Enter") handleAddItem(cl.id); }}
                        placeholder="Thêm việc phụ..."
                        className="flex-1 bg-gray-700 text-white text-xs px-2.5 py-1.5 rounded-lg outline-none border border-gray-600 focus:border-purple-500 transition-colors"
                      />
                      <button onClick={() => handleAddItem(cl.id)} disabled={!draft.trim()}
                        className="flex items-center gap-1 text-purple-400 hover:text-purple-300 text-xs px-2.5 py-1.5 rounded-lg border border-transparent hover:border-purple-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                        <Plus className="w-3.5 h-3.5" /> Thêm
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── TAB: Bình luận ─────────────────────────────────────────────── */}
          {tab === "comments" && (
            <div className="bg-gray-800 rounded-xl p-3 space-y-3">
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-xs text-white font-bold shrink-0">M</div>
                <div className="flex-1 space-y-1.5 relative">
                  <textarea ref={commentRef} rows={2} value={newComment}
                    onChange={(e) => handleSlashInput(e, "comment")}
                    onKeyDown={(e) => { handleSlashKeyDown(e); if (e.key === "Enter" && !e.shiftKey && !slashVisible) { e.preventDefault(); handleAddComment(); } }}
                    placeholder="Viết bình luận... (gõ / để mở lệnh nhanh)"
                    className="w-full bg-gray-700 text-white text-xs px-2 py-1.5 rounded-lg outline-none border border-gray-600 focus:border-purple-500 resize-none"
                  />
                  {slashVisible && slashSource === "comment" && (
                    <div className="absolute left-0 bottom-full mb-1 z-50 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl py-1 w-64">
                      {filteredSlashCmds.length === 0 ? (
                        <p className="text-xs text-gray-500 px-3 py-2">Không có lệnh nào khớp</p>
                      ) : (
                        filteredSlashCmds.map((cmd, i) => (
                          <button key={cmd.name} onClick={() => executeSlashCommand(cmd.name)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors ${i === slashIndex ? "bg-purple-600/20 text-purple-300" : "text-gray-300 hover:bg-gray-700"}`}>
                            <span className="text-base">{cmd.icon}</span>
                            <div>
                              <span className="font-medium">/{cmd.name}</span>
                              <span className="text-gray-500 ml-1.5">{cmd.description}</span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                  <div className="flex justify-end">
                    <button onClick={handleAddComment} disabled={!newComment.trim()}
                      className="text-xs text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                      Gửi bình luận
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-2.5 max-h-64 overflow-y-auto pt-2 border-t border-gray-700">
                {!activitiesLoaded && <p className="text-xs text-gray-500">Đang tải...</p>}
                {activitiesLoaded && activities.length === 0 && (
                  <p className="text-xs text-gray-500">Chưa có bình luận hay hoạt động nào.</p>
                )}
                {activities.map(a =>
                  a.type === "COMMENT" ? (
                    <div key={a.id} className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-xs text-white font-bold shrink-0 mt-0.5">
                        {a.user.name[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-medium text-white">{a.user.name}</span>
                          <span className="text-[11px] text-gray-600">{new Date(a.createdAt).toLocaleString("vi-VN")}</span>
                        </div>
                        <p className="text-xs text-gray-200 bg-gray-700/60 rounded-lg px-2.5 py-1.5 mt-1 inline-block">{a.message}</p>
                      </div>
                      {a.user.id === currentUserId && (
                        <button onClick={() => handleDeleteComment(a.id)} className="text-gray-600 hover:text-red-400 shrink-0">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div key={a.id} className="flex items-center gap-2 pl-1">
                      <Clock className="w-3 h-3 text-gray-600 shrink-0" />
                      <p className="text-[11px] text-gray-500 flex-1 min-w-0">
                        <span className="font-medium text-gray-400">{a.user.name}</span>{" "}
                        <span className="italic">{a.message}</span>
                      </p>
                      <span className="text-[10px] text-gray-700 shrink-0">{new Date(a.createdAt).toLocaleString("vi-VN")}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* ── TAB: Thời gian ─────────────────────────────────────────────── */}
          {tab === "time" && (
            <div className="bg-gray-800 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-gray-500 uppercase tracking-wide mb-0.5">Tổng thời gian</p>
                  <p className="text-2xl font-bold text-white tabular-nums font-mono">{fmt(totalDisplay)}</p>
                </div>
                {runningId ? (
                  <button onClick={handleStopTimer}
                    className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium px-4 py-2.5 rounded-xl border border-red-500/20 transition-colors">
                    <Square className="w-4 h-4 fill-red-400" /> Dừng
                  </button>
                ) : (
                  <button onClick={handleStartTimer}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
                    <Play className="w-4 h-4 fill-white" /> Bắt đầu
                  </button>
                )}
              </div>
              {runningId && (
                <div className="flex items-center gap-3 bg-gray-700/50 border border-gray-700 rounded-lg px-3 py-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
                  <span className="text-xs text-gray-400">Phiên hiện tại</span>
                  <span className="ml-auto text-sm font-bold text-white tabular-nums font-mono">{fmt(elapsed)}</span>
                </div>
              )}
              <div className="border-t border-gray-700 pt-3 space-y-1.5 max-h-52 overflow-y-auto">
                {!timeEntriesLoaded && <p className="text-xs text-gray-500">Đang tải...</p>}
                {timeEntriesLoaded && timeEntries.length === 0 && (
                  <div className="text-center py-4">
                    <Clock className="w-5 h-5 text-gray-600 mx-auto mb-1.5" />
                    <p className="text-xs text-gray-500">Chưa có phiên nào được ghi nhận.</p>
                  </div>
                )}
                {timeEntries.map(e => {
                  const sec = e.endedAt
                    ? Math.round((new Date(e.endedAt).getTime() - new Date(e.startedAt).getTime()) / 1000)
                    : elapsed;
                  return (
                    <div key={e.id} className="flex items-center gap-2.5 group">
                      <div className="w-6 h-6 rounded-full bg-purple-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                        {e.user.name[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-300 truncate">
                          {e.note ?? "Phiên làm việc"}
                          {!e.endedAt && <span className="ml-1.5 text-green-400 font-medium">● đang chạy</span>}
                        </p>
                        <p className="text-[10px] text-gray-600">{fmtDate(e.startedAt)}</p>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0 tabular-nums">{fmtHuman(sec)}</span>
                      <button onClick={() => handleDeleteTimeEntry(e.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-opacity shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── TAB: Pomodoro (Zustand store — persist qua localStorage) ──── */}
          {tab === "pomodoro" && (
            <div className="bg-gray-800 rounded-xl p-4 flex flex-col items-center gap-4">

              {/* Cảnh báo nếu store đang dùng bởi card khác */}
              {pomo.cardId && pomo.cardId !== card.id && (
                <div className="w-full text-center text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2">
                  ⚠️ Đang có phiên Pomodoro chạy cho thẻ khác ({pomo.cardTitle})
                  <button
                    onClick={() => { pomo.forceAttachCard(card.id, card.title); }}
                    className="ml-2 underline hover:text-amber-300"
                  >
                    Dừng và dùng thẻ này
                  </button>
                </div>
              )}

              {/* Phase badge */}
              <span className={`text-xs font-semibold px-3 py-1 rounded-full border transition-colors ${
                pomo.phase === "work"
                  ? "bg-purple-600/25 text-purple-300 border-purple-500/30"
                  : "bg-green-600/25 text-green-300 border-green-500/30"
              }`}>
                {pomo.phase === "work" ? "🎯 Tập trung" : "☕ Nghỉ ngơi"}
              </span>

              {/* SVG ring */}
              <div className="relative w-40 h-40">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="#374151" strokeWidth="8" />
                  <circle
                    cx="60" cy="60" r="54" fill="none"
                    stroke={pomo.phase === "work" ? "#a855f7" : "#22c55e"}
                    strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={pomoCirc}
                    strokeDashoffset={pomoCirc * (1 - pomoPct / 100)}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-white tabular-nums font-mono">{fmt(pomoRemaining)}</span>
                  <span className="text-[10px] text-gray-500 mt-0.5">{pomoPct}%</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex gap-2">
                {pomo.running ? (
                  <button onClick={() => pomo.pause()}
                    className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors">
                    <Pause className="w-4 h-4" /> Tạm dừng
                  </button>
                ) : (
                  <button
                    onClick={() => { pomo.attachCard(card.id, card.title); pomo.start(); }}
                    disabled={!canStart}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    {pomoRemaining < pomoTotal ? "Tiếp tục" : "Bắt đầu"}
                  </button>
                )}
                <button onClick={() => pomo.reset()}
                  className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm px-4 py-2.5 rounded-xl transition-colors">
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Info */}
              <div className="w-full border-t border-gray-700 pt-3 space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Tổng thời gian ghi nhận</span>
                  <span className="text-white font-medium tabular-nums">{fmtHuman(totalSaved)}</span>
                </div>
                <p className="text-[11px] text-gray-600 text-center pt-1">
                  Đóng modal không mất timer — mini timer sẽ nổi ở góc màn hình.
                </p>
              </div>
            </div>
          )}

          {/* ── TAB: Lặp lại ──────────────────────────────────────────────── */}
          {tab === "recurring" && (
            <div className="bg-gray-800 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white font-semibold">Tự động lặp lại thẻ này</p>
                  <p className="text-[11px] text-gray-500">Tạo bản sao thẻ định kỳ hàng ngày, tuần hoặc tháng</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsRecur(!isRecur);
                    if (!isRecur && !nextRecurInput) {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      setNextRecurInput(tomorrow.toISOString().split("T")[0]);
                    }
                  }}
                  className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-colors duration-300 ${isRecur ? "bg-purple-600 justify-end" : "bg-gray-700 justify-start"}`}
                >
                  <span className="w-5 h-5 rounded-full bg-white shadow-md block" />
                </button>
              </div>

              {isRecur && (
                <div className="space-y-3 pt-2 border-t border-gray-700">
                  <div>
                    <label className="text-xs text-gray-400 font-medium mb-1.5 block">Chu kỳ lặp</label>
                    <select
                      value={recurInterval}
                      onChange={(e) => setRecurInterval(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
                    >
                      <option value="DAILY">Hàng ngày (Daily)</option>
                      <option value="WEEKLY">Hàng tuần (Weekly)</option>
                      <option value="MONTHLY">Hàng tháng (Monthly)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 font-medium mb-1.5 block">Ngày bắt đầu lặp tiếp theo</label>
                    <input
                      type="date"
                      value={nextRecurInput}
                      onChange={(e) => setNextRecurInput(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-purple-500 scheme-dark"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: Liên kết phụ thuộc ────────────────────────────────────── */}
          {tab === "dependencies" && (
            <div className="bg-gray-800 rounded-xl p-4 space-y-4">
              <div>
                <p className="text-xs text-white font-semibold mb-1">Thẻ đang bị khóa bởi (Blockers)</p>
                <p className="text-[11px] text-gray-500 mb-3">Các thẻ này cần hoàn thành trước khi thẻ này được làm</p>

                {dependencies.length === 0 ? (
                  <p className="text-xs text-gray-500 italic py-2">Chưa có liên kết phụ thuộc nào.</p>
                ) : (
                  <div className="space-y-2">
                    {dependencies.map((dep) => {
                      const isCompleted = dep.dependsOn.list.title.toLowerCase().includes("done") || 
                                          dep.dependsOn.list.title.toLowerCase().includes("hoàn thành") || 
                                          dep.dependsOn.list.title.toLowerCase().includes("thành công");
                      return (
                        <div key={dep.dependsOnId} className="flex items-center justify-between bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs">
                          <div className="min-w-0 flex-1">
                            <p className="text-white font-medium truncate">{dep.dependsOn.title}</p>
                            <p className="text-[10px] text-gray-500 truncate">Danh sách: {dep.dependsOn.list.title}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${isCompleted ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                              {isCompleted ? "Hoàn thành" : "Chưa xong"}
                            </span>
                            <button
                              onClick={() => handleRemoveDep(dep.dependsOnId)}
                              className="text-gray-500 hover:text-red-400 p-1"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-700 pt-3">
                <label className="text-xs text-gray-400 font-medium mb-1.5 block">Thêm thẻ chặn (Blocker)</label>
                <input
                  type="text"
                  placeholder="Tìm kiếm thẻ chặn..."
                  value={depSearch}
                  onChange={(e) => setDepSearch(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-purple-500 mb-2"
                />

                <div className="max-h-40 overflow-y-auto space-y-1">
                  {blockerCandidates
                    .filter((c) => {
                      const isAlreadyDep = dependencies.some((d) => d.dependsOnId === c.id);
                      const matchesSearch = c.title.toLowerCase().includes(depSearch.toLowerCase());
                      return !isAlreadyDep && matchesSearch;
                    })
                    .slice(0, 5)
                    .map((candidate) => (
                      <button
                        key={candidate.id}
                        onClick={() => handleAddDep(candidate.id)}
                        className="w-full text-left bg-gray-900/40 hover:bg-gray-700 border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-300 transition-colors flex items-center justify-between"
                      >
                        <span className="truncate">{candidate.title}</span>
                        <span className="text-[10px] text-gray-500 font-normal shrink-0 ml-2">({candidate.list.title})</span>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Nút Lưu / Xóa */}
          <div className="flex gap-2 pt-1">
            <button onClick={handleSave}
              className="flex-1 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors">
              <Check className="w-4 h-4" /> Lưu
            </button>
            <button onClick={handleDeleteCard}
              className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium transition-colors flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Xóa
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

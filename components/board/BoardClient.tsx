"use client";

import { useState, useEffect, useRef, useCallback } from "react";
// @ts-ignore
import confetti from "canvas-confetti";
import { Plus, X, GripVertical, Filter, Calendar, ListChecks, MessageSquare, Clock, Lock, CheckCircle2, Circle } from "lucide-react";
import {
  DndContext, DragEndEvent, DragOverEvent, DragStartEvent,
  PointerSensor, useSensor, useSensors, closestCorners, DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext, horizontalListSortingStrategy,
  verticalListSortingStrategy, useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { updateListOrder, rebalanceLists, createList, deleteList, updateListTitle } from "@/app/actions/list";
import { createCard, deleteCard, updateCardOrder, markCardComplete, undoCardComplete } from "@/app/actions/card";
import { calcNewPosition, needsRebalance } from "@/utils/position";
import { useCardFilter } from "@/hooks/useCardFilter";
import { formatDueDate, getDueDateStatus, DUE_DATE_STYLES } from "@/lib/due-date";
import { formatDuration, sumTrackedSeconds } from "@/lib/time-format";
import CardModal from "@/components/board/CardModal";
import { usePomodoroStore } from "@/store/pomodoroStore";
import { getContrastTextColor } from "@/lib/color-utils";
import { getPusherClient } from "@/lib/pusher-client";

// ── Types ──
interface Label { id: string; name: string; color: string; }
interface Member { id: string; name: string; avatarUrl?: string | null; }
interface CardLabel { labelId: string; label: Label; }
interface CardMember { userId: string; user: Member; }
interface ChecklistItemT { id: string; title: string; isDone: boolean; order: number; }
interface ChecklistT { id: string; title: string; order: number; items: ChecklistItemT[]; }
interface Card {
  id: string; title: string; description?: string | null;
  order: number; color?: string | null;
  dueDate?: string | Date | null;
  startDate?: string | Date | null;
  recurring?: "NEVER" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  reminderOffset?: number | null;
  reminderSent?: boolean;
  cardLabels: CardLabel[];
  cardMembers: CardMember[];
  checklists?: ChecklistT[];
  timeEntries?: { startedAt: string | Date; endedAt: string | Date | null }[];
  _count?: { activities: number };
  isCompleted?: boolean;
  completedAt?: string | Date | null;
  dependencies?: {
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
  }[];
}
interface List { id: string; title: string; order: number; cards: Card[]; }

// ── Sortable Card ──
function SortableCard({ card, onClick, onToggleComplete }: { card: Card; onClick: () => void; onToggleComplete: (e: React.MouseEvent) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id, data: { type: "card", card },
  });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  const [mounted, setMounted] = useState(false);
  const [dueStatus, setDueStatus] = useState<ReturnType<typeof getDueDateStatus>>(null);
  useEffect(() => {
    setMounted(true);
    setDueStatus(getDueDateStatus(card.dueDate, card.isCompleted));
  }, [card.dueDate, card.isCompleted]);
  const totalItems = card.checklists?.reduce((sum, cl) => sum + cl.items.length, 0) ?? 0;
  const doneItems = card.checklists?.reduce((sum, cl) => sum + cl.items.filter((i) => i.isDone).length, 0) ?? 0;
  const trackedSeconds = card.timeEntries ? sumTrackedSeconds(card.timeEntries) : 0;
  const commentCount = card._count?.activities ?? 0;

  const blockerCount = card.dependencies?.filter(dep => {
    const listTitle = dep.dependsOn.list.title.toLowerCase();
    const isDone = listTitle.includes("done") || 
                   listTitle.includes("hoàn thành") || 
                   listTitle.includes("thành công");
    return !isDone;
  }).length ?? 0;
  const isBlocked = blockerCount > 0;

  const hasMeta = (mounted && dueStatus) || totalItems > 0 || trackedSeconds > 0 || commentCount > 0 || card.cardMembers.length > 0 || isBlocked || card.isCompleted;

  return (
    <div
      ref={setNodeRef} style={style} {...attributes} {...listeners}
      onClick={onClick}
      className={`group bg-slate-50 dark:bg-slate-800/90 border rounded-xl px-3.5 py-3 cursor-pointer transition-all duration-150 shadow-sm hover:shadow-md active:scale-[0.99] ${
        card.isCompleted
          ? "border-emerald-300/40 dark:border-emerald-500/20 opacity-55"
          : isBlocked
          ? "border-amber-400/60 dark:border-amber-500/40"
          : "border-slate-200 dark:border-slate-700/70 hover:border-slate-300 dark:hover:border-slate-600"
      }`}
    >
      {card.cardLabels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {card.cardLabels.map((cl) => (
            <span key={cl.labelId} className="text-xs px-2 py-0.5 rounded-md font-semibold"
              style={{ backgroundColor: cl.label.color, color: getContrastTextColor(cl.label.color) }}>
              {cl.label.name}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onToggleComplete}
            className="shrink-0 p-0.5 rounded-full transition-all cursor-pointer hover:scale-110 duration-100"
            title={card.isCompleted ? "Bỏ hoàn thành" : "Đánh dấu hoàn thành"}
          >
            {card.isCompleted ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            ) : (
              <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-500 transition-colors" />
            )}
          </button>
          <p className={`text-[13px] font-medium leading-snug ${
            card.isCompleted
              ? "text-slate-400 dark:text-slate-500 line-through"
              : isBlocked
              ? "text-amber-700 dark:text-amber-300"
              : "text-slate-800 dark:text-slate-100"
          }`}>{card.title}</p>
        </div>
        {isBlocked && <Lock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />}
      </div>
      {card.description && <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 line-clamp-2 ml-6 leading-relaxed">{card.description}</p>}

      {hasMeta && (
        <div className="flex items-center gap-1.5 mt-2.5 flex-wrap ml-6">
          {isBlocked && (
            <span className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20" title={`Bị khóa bởi ${blockerCount} thẻ chưa hoàn thành`}>
              Bị chặn
            </span>
          )}
          {mounted && dueStatus && card.dueDate && (
            <span className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${DUE_DATE_STYLES[dueStatus]}`}>
              <Calendar className="w-2.5 h-2.5" />
              {formatDueDate(card.dueDate)}
            </span>
          )}
          {totalItems > 0 && (
            <span className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
              doneItems === totalItems
                ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
                : "bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400"
            }`}>
              <ListChecks className="w-2.5 h-2.5" /> {doneItems}/{totalItems}
            </span>
          )}
          {trackedSeconds > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400">
              <Clock className="w-2.5 h-2.5" /> {formatDuration(trackedSeconds)}
            </span>
          )}
          {commentCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400">
              <MessageSquare className="w-2.5 h-2.5" /> {commentCount}
            </span>
          )}
          {card.cardMembers.length > 0 && (
            <div className="flex -space-x-1 ml-auto">
              {card.cardMembers.map((cm) => (
                <div key={cm.userId} className="w-5 h-5 rounded-full bg-indigo-500 border-2 border-slate-50 dark:border-slate-800 flex items-center justify-center text-[9px] text-white font-semibold" title={cm.user.name}>
                  {cm.user.name[0].toUpperCase()}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sortable List ──
function SortableList({ list, children, onDelete, onRename }: {
  list: List; children: React.ReactNode;
  onDelete: () => void; onRename: (title: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: list.id, data: { type: "list", list },
  });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(list.title);

  return (
    <div ref={setNodeRef} style={style} className="shrink-0 w-68 h-fit bg-slate-100/90 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/10 backdrop-blur-sm rounded-xl flex flex-col shadow-sm">
      <div className="flex items-center gap-2 px-3 pt-3 pb-2.5">
        <GripVertical {...attributes} {...listeners} className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 cursor-grab shrink-0 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" />
        {editing ? (
          <input
            autoFocus value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { onRename(title); setEditing(false); } if (e.key === "Escape") setEditing(false); }}
            onBlur={() => { onRename(title); setEditing(false); }}
            className="flex-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-semibold px-2 py-0.5 rounded-lg outline-none border border-indigo-400 dark:border-indigo-500"
          />
        ) : (
          <span className="flex-1 text-[11px] font-semibold text-slate-600 dark:text-slate-200 cursor-pointer tracking-wide" onDoubleClick={() => setEditing(true)}>
            {list.title}
          </span>
        )}
        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-200 dark:bg-slate-700/70 px-1.5 py-0.5 rounded-full min-w-4.5 text-center">{list.cards.length}</span>
        <button onClick={onDelete} className="text-slate-300 dark:text-slate-600 hover:text-red-400 dark:hover:text-red-400 transition-colors p-0.5 rounded cursor-pointer">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {children}
    </div>
  );
}

// ── Filter Bar ──
function FilterBar({ boardLabels, workspaceMembers, filterLabels, filterMembers, onToggleLabel, onToggleMember, onClear }: {
  boardLabels: Label[]; workspaceMembers: Member[];
  filterLabels: string[]; filterMembers: string[];
  onToggleLabel: (id: string) => void; onToggleMember: (id: string) => void; onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const isFiltering = filterLabels.length > 0 || filterMembers.length > 0;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-colors duration-200 cursor-pointer ${
          isFiltering
            ? "bg-indigo-600 border-indigo-600 text-white dark:bg-indigo-500 dark:border-indigo-500"
            : "border-slate-300 dark:border-white/15 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:border-slate-400 dark:hover:border-white/30 bg-white/80 dark:bg-transparent"
        }`}
      >
        <Filter className="w-3.5 h-3.5" />
        Lọc {isFiltering && `(${filterLabels.length + filterMembers.length})`}
      </button>

      {open && (
        <div className="absolute top-9 left-0 z-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-3 w-64 shadow-xl dark:shadow-black/40 space-y-3 transition-colors duration-200">
          {boardLabels.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5">Nhãn</p>
              <div className="space-y-1">
                {boardLabels.map((l) => (
                  <button key={l.id} onClick={() => onToggleLabel(l.id)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors duration-150 cursor-pointer ${
                      filterLabels.includes(l.id)
                        ? "bg-slate-100 dark:bg-slate-800"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: l.color }} />
                    <span className="text-slate-800 dark:text-slate-100">{l.name}</span>
                    {filterLabels.includes(l.id) && <span className="ml-auto text-indigo-600 dark:text-indigo-400">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
          {workspaceMembers.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5">Thành viên</p>
              <div className="space-y-1">
                {workspaceMembers.map((m) => (
                  <button key={m.id} onClick={() => onToggleMember(m.id)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors duration-150 cursor-pointer ${
                      filterMembers.includes(m.id)
                        ? "bg-slate-100 dark:bg-slate-800"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-indigo-500 dark:bg-indigo-600 flex items-center justify-center text-[9px] text-white font-semibold shrink-0">
                      {m.name[0].toUpperCase()}
                    </div>
                    <span className="text-slate-800 dark:text-slate-100">{m.name}</span>
                    {filterMembers.includes(m.id) && <span className="ml-auto text-indigo-600 dark:text-indigo-400">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
          {isFiltering && (
            <button onClick={onClear} className="w-full text-xs text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 py-1 transition-colors duration-150 cursor-pointer">
              Xóa bộ lọc
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main ──
export default function BoardClient({
  boardId, initialLists, initialLabels, workspaceMembers, userId,
}: {
  boardId: string;
  initialLists: List[];
  initialLabels: Label[];
  workspaceMembers: Member[];
  userId: string;
}) {
  const [lists, setLists] = useState<List[]>([...initialLists].sort((a, b) => a.order - b.order));
  const [boardLabels, setBoardLabels] = useState<Label[]>(initialLabels);
  const [addingList, setAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [addingCardTo, setAddingCardTo] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [selectedCard, setSelectedCard] = useState<{ card: Card; listId: string } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const { filteredLists, filterLabels, filterMembers, toggleLabelFilter, toggleMemberFilter, clearFilters, isFiltering } =
    useCardFilter(lists);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // ── Pusher real-time subscription ──
  const userIdRef = useRef(userId);
  useEffect(() => { userIdRef.current = userId; }, [userId]);

  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(`board-${boardId}`);

    channel.bind("card:created", (data: { card: Card; listId: string; actorId: string }) => {
      if (data.actorId === userIdRef.current) return;
      setLists((prev) =>
        prev.map((l) =>
          l.id === data.listId
            ? { ...l, cards: [...l.cards, data.card] }
            : l
        )
      );
    });

    channel.bind("card:deleted", (data: { cardId: string; actorId: string }) => {
      if (data.actorId === userIdRef.current) return;
      setLists((prev) =>
        prev.map((l) => ({
          ...l,
          cards: l.cards.filter((c) => c.id !== data.cardId),
        }))
      );
      setSelectedCard((prev) => (prev && prev.card.id === data.cardId ? null : prev));
    });

    channel.bind("card:moved", (data: { cardId: string; fromListId: string; toListId: string; order: number; actorId: string }) => {
      if (data.actorId === userIdRef.current) return;
      setLists((prev) => {
        let movedCard: Card | undefined;
        const next = prev.map((l) => {
          if (l.id === data.fromListId) {
            movedCard = l.cards.find((c) => c.id === data.cardId);
            return { ...l, cards: l.cards.filter((c) => c.id !== data.cardId) };
          }
          return l;
        });
        if (!movedCard) return prev;
        return next.map((l) => {
          if (l.id === data.toListId) {
            const exists = l.cards.some((c) => c.id === data.cardId);
            if (exists) return l;
            const updatedCard = { ...movedCard!, order: data.order };
            const without = l.cards.filter((c) => c.id !== data.cardId);
            const inserted = [...without, updatedCard].sort((a, b) => a.order - b.order);
            return { ...l, cards: inserted };
          }
          return l;
        });
      });
    });

    channel.bind("card:updated", (data: { card: Partial<Card> & { id: string }; actorId: string }) => {
      if (data.actorId === userIdRef.current) return;
      setLists((prev) =>
        prev.map((l) => ({
          ...l,
          cards: l.cards.map((c) =>
            c.id === data.card.id ? { ...c, ...data.card } : c
          ),
        }))
      );
      setSelectedCard((prev) => {
        if (prev && prev.card.id === data.card.id) {
          return { ...prev, card: { ...prev.card, ...data.card } };
        }
        return prev;
      });
    });

    channel.bind("list:created", (data: { list: List; actorId: string }) => {
      if (data.actorId === userIdRef.current) return;
      setLists((prev) => {
        if (prev.some((l) => l.id === data.list.id)) return prev;
        return [...prev, data.list].sort((a, b) => a.order - b.order);
      });
    });

    channel.bind("list:deleted", (data: { listId: string; actorId: string }) => {
      if (data.actorId === userIdRef.current) return;
      setLists((prev) => prev.filter((l) => l.id !== data.listId));
      setSelectedCard((prev) => (prev && prev.listId === data.listId ? null : prev));
    });

    channel.bind("list:moved", (data: { listId: string; order: number; actorId: string }) => {
      if (data.actorId === userIdRef.current) return;
      setLists((prev) =>
        prev.map((l) => (l.id === data.listId ? { ...l, order: data.order } : l))
          .sort((a, b) => a.order - b.order)
      );
    });

    channel.bind("list:updated", (data: { listId: string; title: string; actorId: string }) => {
      if (data.actorId === userIdRef.current) return;
      setLists((prev) =>
        prev.map((l) => (l.id === data.listId ? { ...l, title: data.title } : l))
      );
    });

    channel.bind("list:reordered", (data: { lists: { id: string; order: number }[]; actorId: string }) => {
      if (data.actorId === userIdRef.current) return;
      setLists((prev) => {
        const orderMap = new Map(data.lists.map((l) => [l.id, l.order]));
        return prev.map((l) => {
          const newOrder = orderMap.get(l.id);
          return newOrder !== undefined ? { ...l, order: newOrder } : l;
        }).sort((a, b) => a.order - b.order);
      });
    });

    return () => {
      pusher.unsubscribe(`board-${boardId}`);
    };
  }, [boardId]);

  const activeType = activeId ? (lists.some((l) => l.id === activeId) ? "list" : "card") : null;
  const activeCard = activeType === "card" ? lists.flatMap((l) => l.cards).find((c) => c.id === activeId) : null;
  const activeList = activeType === "list" ? lists.find((l) => l.id === activeId) : null;

  async function handleAddList() {
    if (!newListTitle.trim()) return;
    const list = await createList(boardId, newListTitle.trim());
    setLists((prev) => [...prev, { ...list, cards: [] }]);
    setNewListTitle(""); setAddingList(false);
  }

  async function handleDeleteList(listId: string) {
    await deleteList(listId);
    setLists((prev) => prev.filter((l) => l.id !== listId));
  }

  async function handleRenameList(listId: string, title: string) {
    if (!title.trim()) return;
    await updateListTitle(listId, title.trim());
    setLists((prev) => prev.map((l) => l.id === listId ? { ...l, title: title.trim() } : l));
  }

  async function handleAddCard(listId: string) {
    if (!newCardTitle.trim()) return;
    const card = await createCard(listId, newCardTitle.trim());
    setLists((prev) => prev.map((l) => l.id === listId ? { ...l, cards: [...l.cards, { ...card, cardLabels: [], cardMembers: [] }] } : l));
    setNewCardTitle(""); setAddingCardTo(null);
  }

  async function handleDeleteCard(cardId: string, listId: string) {
    await deleteCard(cardId);
    setLists((prev) => prev.map((l) =>
      l.id === listId ? { ...l, cards: l.cards.filter((c) => c.id !== cardId) } : l
    ));
    setSelectedCard(null);
    
    // Nếu card bị xóa đang được track Pomodoro, thì clear luôn pomodoro session
    if (usePomodoroStore.getState().cardId === cardId) {
      usePomodoroStore.getState().clear();
    }
  }

  function handleCardUpdate(updated: Card) {
    setLists((prev) => prev.map((l) => ({
      ...l, cards: l.cards.map((c) => c.id === updated.id ? updated : c),
    })));
    setSelectedCard(null);
  }

  async function handleToggleComplete(cardId: string, currentlyCompleted: boolean, e: React.MouseEvent) {
    e.stopPropagation();
    const updated = currentlyCompleted
      ? await undoCardComplete(cardId)
      : await markCardComplete(cardId);
    // 🎉 Fire confetti when marking a card as complete
    if (!currentlyCompleted) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: {
          x: e.clientX / window.innerWidth,
          y: e.clientY / window.innerHeight,
        },
        colors: ["#6366f1", "#8b5cf6", "#22c55e", "#f59e0b", "#ec4899"],
        disableForReducedMotion: true,
      });
    }
    setLists((prev) => prev.map((l) => ({
      ...l,
      cards: l.cards.map((c) => c.id === cardId
        ? { ...c, isCompleted: updated.isCompleted, completedAt: updated.completedAt, completedBy: updated.completedBy }
        : c),
    })));
  }

  function onDragStart({ active }: DragStartEvent) { setActiveId(active.id as string); }

  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    const aId = active.id as string, oId = over.id as string;
    if (active.data.current?.type !== "card") return;
    const fromList = lists.find((l) => l.cards.some((c) => c.id === aId));
    const toList = lists.find((l) => l.id === oId) ?? lists.find((l) => l.cards.some((c) => c.id === oId));
    if (!fromList || !toList || fromList.id === toList.id) return;
    setLists((prev) => {
      const card = prev.find((l) => l.id === fromList.id)!.cards.find((c) => c.id === aId);
      if (!card) return prev;
      return prev.map((l) => {
        if (l.id === fromList.id) return { ...l, cards: l.cards.filter((c) => c.id !== aId) };
        if (l.id === toList.id) return { ...l, cards: [...l.cards, card] };
        return l;
      });
    });
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const aId = active.id as string, oId = over.id as string;

    if (active.data.current?.type === "list") {
      setLists((prev) => {
        const sorted = [...prev].sort((a, b) => a.order - b.order);
        const fromIdx = sorted.findIndex((l) => l.id === aId);
        const toIdx = sorted.findIndex((l) => l.id === oId);
        const withoutDragged = sorted.filter((_, i) => i !== fromIdx);
        const newOrder = calcNewPosition(withoutDragged, toIdx);
        const updated = sorted.map((l) => l.id === aId ? { ...l, order: newOrder } : l).sort((a, b) => a.order - b.order);
        updateListOrder(aId, newOrder).then(() => { if (needsRebalance(updated)) rebalanceLists(boardId); });
        return updated;
      });
    }

    if (active.data.current?.type === "card") {
      setLists((prev) => {
        let sourceListId: string | null = null;
        let movedCard: Card | undefined;
        for (const l of prev) {
          const found = l.cards.find((c) => c.id === aId);
          if (found) { movedCard = found; sourceListId = l.id; break; }
        }
        if (!movedCard || !sourceListId) return prev;

        const toList = prev.find((l) => l.id === oId) ?? prev.find((l) => l.cards.some((c) => c.id === oId));
        if (!toList) return prev;

        const overCardIdx = toList.cards.findIndex((c) => c.id === oId);
        const insertIdx = overCardIdx !== -1 ? overCardIdx : toList.cards.length;
        const siblings = toList.cards.filter((c) => c.id !== aId);
        const newOrder = calcNewPosition(siblings, insertIdx);

        const next = prev.map((l) => {
          if (l.id === sourceListId) return { ...l, cards: l.cards.filter((c) => c.id !== aId) };
          if (l.id === toList.id) {
            const updated = { ...movedCard!, order: newOrder };
            const without = l.cards.filter((c) => c.id !== aId);
            return { ...l, cards: [...without, updated].sort((a, b) => a.order - b.order) };
          }
          return l;
        });

        updateCardOrder(aId, toList.id, newOrder);
        return next;
      });
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 px-4 pt-3 shrink-0">
        <FilterBar
          boardLabels={boardLabels}
          workspaceMembers={workspaceMembers}
          filterLabels={filterLabels}
          filterMembers={filterMembers}
          onToggleLabel={toggleLabelFilter}
          onToggleMember={toggleMemberFilter}
          onClear={clearFilters}
        />
        {isFiltering && <span className="text-xs text-slate-500 dark:text-slate-400">Đang lọc — một số thẻ bị ẩn</span>}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}
        autoScroll={{ threshold: { x: 40, y: 40 }, acceleration: 10 }}>
        <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-3.5 p-4 h-full items-start">
          <SortableContext items={lists.map((l) => l.id)} strategy={horizontalListSortingStrategy}>
            {filteredLists.map((list) => (
              <SortableList key={list.id} list={list} onDelete={() => handleDeleteList(list.id)} onRename={(t) => handleRenameList(list.id, t)}>
                <SortableContext items={list.cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                  <div className="px-2.5 pb-2 space-y-2 min-h-8">
                    {list.cards.map((card) => (
                      <SortableCard key={card.id} card={card} onClick={() => setSelectedCard({ card, listId: list.id })} onToggleComplete={(e) => handleToggleComplete(card.id, card.isCompleted ?? false, e)} />
                    ))}
                  </div>
                </SortableContext>

                {addingCardTo === list.id ? (
                  <div className="px-2.5 pb-2.5 space-y-2">
                    <textarea autoFocus value={newCardTitle}
                      onChange={(e) => setNewCardTitle(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddCard(list.id); } if (e.key === "Escape") setAddingCardTo(null); }}
                      placeholder="Nhập tiêu đề thẻ..." rows={2}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-[13px] text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 outline-none focus:border-indigo-400 dark:focus:border-indigo-500 resize-none shadow-sm"
                    />
                    <div className="flex gap-1.5">
                      <button onClick={() => handleAddCard(list.id)} className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-sm">Thêm</button>
                      <button onClick={() => setAddingCardTo(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setAddingCardTo(list.id)} className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 text-[11px] font-medium px-3 py-2.5 hover:bg-slate-200/60 dark:hover:bg-slate-700/40 rounded-b-xl transition-all w-full cursor-pointer">
                    <Plus className="w-3.5 h-3.5" /> Thêm thẻ
                  </button>
                )}
              </SortableList>
            ))}
          </SortableContext>

          {addingList ? (
            <div className="shrink-0 w-68 self-start bg-slate-100/90 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/10 backdrop-blur-sm rounded-xl p-2.5 space-y-2 transition-colors duration-200">
              <input autoFocus value={newListTitle} onChange={(e) => setNewListTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddList(); if (e.key === "Escape") setAddingList(false); }}
                placeholder="Nhập tên cột..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-[13px] text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-indigo-400 dark:focus:border-indigo-500 transition-colors duration-200"
              />
              <div className="flex gap-1.5">
                <button onClick={handleAddList} className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors duration-150 cursor-pointer shadow-sm">Thêm cột</button>
                <button onClick={() => setAddingList(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-150 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingList(true)} className="shrink-0 w-68 h-11 self-start bg-transparent hover:bg-slate-900/5 dark:hover:bg-white/5 backdrop-blur-sm rounded-xl flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border-2 border-dashed border-slate-400/40 dark:border-white/15 hover:border-slate-500/50 dark:hover:border-white/30 text-xs font-semibold transition-all duration-200 cursor-pointer">
              <Plus className="w-4 h-4" /> Thêm cột mới
            </button>
          )}
          </div>
        </div>

        <DragOverlay>
          {activeType === "card" && activeCard && (
            <div className="bg-slate-50 dark:bg-slate-800 border border-indigo-400 dark:border-indigo-500 rounded-xl px-3.5 py-3 w-68 shadow-2xl rotate-2 opacity-90">
              <p className="text-[13px] font-medium text-slate-800 dark:text-slate-100">{activeCard.title}</p>
            </div>
          )}
          {activeType === "list" && activeList && (
            <div className="bg-slate-100 dark:bg-slate-800/80 border border-indigo-400/50 dark:border-white/10 rounded-xl w-68 px-3 py-3 shadow-2xl rotate-1 opacity-90">
              <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-200 tracking-wide">{activeList.title}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {selectedCard && (
        <CardModal
          card={selectedCard.card}
          listId={selectedCard.listId}
          boardId={boardId}
          boardLabels={boardLabels}
          workspaceMembers={workspaceMembers}
          onClose={() => setSelectedCard(null)}
          onUpdate={handleCardUpdate}
          onDelete={handleDeleteCard}
          onLabelsChange={setBoardLabels}
        />
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Plus, X, GripVertical, Filter, Calendar, ListChecks, MessageSquare, Clock } from "lucide-react";
import {
  DndContext, DragEndEvent, DragOverEvent, DragStartEvent,
  PointerSensor, useSensor, useSensors, closestCorners, DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext, horizontalListSortingStrategy,
  verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { updateListOrder, rebalanceLists, createList, deleteList, updateListTitle } from "@/app/actions/list";
import { createCard, deleteCard, updateCardOrder } from "@/app/actions/card";
import { calcNewPosition, needsRebalance } from "@/utils/position";
import { useCardFilter } from "@/hooks/useCardFilter";
import { formatDueDate, getDueDateStatus, DUE_DATE_STYLES } from "@/lib/due-date";
import { formatDuration, sumTrackedSeconds } from "@/lib/time-format";
import CardModal from "@/components/board/CardModal";
import { usePomodoroStore } from "@/store/pomodoroStore";

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
  cardLabels: CardLabel[];
  cardMembers: CardMember[];
  checklists?: ChecklistT[];
  timeEntries?: { startedAt: string | Date; endedAt: string | Date | null }[];
  _count?: { activities: number };
}
interface List { id: string; title: string; order: number; cards: Card[]; }

// ── Sortable Card ──
function SortableCard({ card, onClick }: { card: Card; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id, data: { type: "card", card },
  });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  const dueStatus = getDueDateStatus(card.dueDate);
  const totalItems = card.checklists?.reduce((sum, cl) => sum + cl.items.length, 0) ?? 0;
  const doneItems = card.checklists?.reduce((sum, cl) => sum + cl.items.filter((i) => i.isDone).length, 0) ?? 0;
  const trackedSeconds = card.timeEntries ? sumTrackedSeconds(card.timeEntries) : 0;
  const commentCount = card._count?.activities ?? 0;
  const hasMeta = dueStatus || totalItems > 0 || trackedSeconds > 0 || commentCount > 0 || card.cardMembers.length > 0;

  return (
    <div
      ref={setNodeRef} style={style} {...attributes} {...listeners}
      onClick={onClick}
      className="bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-xl px-3 py-2.5 cursor-pointer transition-all"
    >
      {card.cardLabels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {card.cardLabels.map((cl) => (
            <span key={cl.labelId} className="h-1.5 w-8 rounded-full" style={{ backgroundColor: cl.label.color }} />
          ))}
        </div>
      )}
      <p className="text-sm text-white leading-snug">{card.title}</p>
      {card.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{card.description}</p>}

      {hasMeta && (
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          {dueStatus && card.dueDate && (
            <span className={`flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-md border ${DUE_DATE_STYLES[dueStatus]}`}>
              <Calendar className="w-3 h-3" />
              {formatDueDate(card.dueDate)}
            </span>
          )}
          {totalItems > 0 && (
            <span className="flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-md bg-gray-700/60 text-gray-400">
              <ListChecks className="w-3 h-3" /> {doneItems}/{totalItems}
            </span>
          )}
          {trackedSeconds > 0 && (
            <span className="flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-md bg-gray-700/60 text-gray-400">
              <Clock className="w-3 h-3" /> {formatDuration(trackedSeconds)}
            </span>
          )}
          {commentCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-md bg-gray-700/60 text-gray-400">
              <MessageSquare className="w-3 h-3" /> {commentCount}
            </span>
          )}
          {card.cardMembers.map((cm) => (
            <div key={cm.userId} className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-xs text-white font-bold" title={cm.user.name}>
              {cm.user.name[0].toUpperCase()}
            </div>
          ))}
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
    <div ref={setNodeRef} style={style} className="shrink-0 w-64 bg-gray-900/90 backdrop-blur rounded-2xl flex flex-col">
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <GripVertical {...attributes} {...listeners} className="w-3.5 h-3.5 text-gray-600 cursor-grab shrink-0" />
        {editing ? (
          <input
            autoFocus value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { onRename(title); setEditing(false); } if (e.key === "Escape") setEditing(false); }}
            onBlur={() => { onRename(title); setEditing(false); }}
            className="flex-1 bg-gray-800 text-white text-sm font-semibold px-2 py-0.5 rounded-lg outline-none border border-purple-500"
          />
        ) : (
          <span className="flex-1 text-sm font-semibold text-white cursor-pointer" onDoubleClick={() => setEditing(true)}>
            {list.title}
          </span>
        )}
        <span className="text-xs text-gray-500">{list.cards.length}</span>
        <button onClick={onDelete} className="text-gray-600 hover:text-red-400 transition-colors p-0.5 rounded">
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
        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-colors ${isFiltering ? "bg-purple-600 border-purple-500 text-white" : "border-gray-700 text-gray-400 hover:text-white hover:border-gray-600"}`}
      >
        <Filter className="w-3.5 h-3.5" />
        Lọc {isFiltering && `(${filterLabels.length + filterMembers.length})`}
      </button>

      {open && (
        <div className="absolute top-9 left-0 z-40 bg-gray-900 border border-gray-700 rounded-2xl p-3 w-64 shadow-2xl space-y-3">
          {boardLabels.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1.5">Nhãn</p>
              <div className="space-y-1">
                {boardLabels.map((l) => (
                  <button key={l.id} onClick={() => onToggleLabel(l.id)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${filterLabels.includes(l.id) ? "bg-gray-700" : "hover:bg-gray-800"}`}
                  >
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: l.color }} />
                    <span className="text-white">{l.name}</span>
                    {filterLabels.includes(l.id) && <span className="ml-auto text-purple-400">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
          {workspaceMembers.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1.5">Thành viên</p>
              <div className="space-y-1">
                {workspaceMembers.map((m) => (
                  <button key={m.id} onClick={() => onToggleMember(m.id)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${filterMembers.includes(m.id) ? "bg-gray-700" : "hover:bg-gray-800"}`}
                  >
                    <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-xs text-white font-bold shrink-0">
                      {m.name[0].toUpperCase()}
                    </div>
                    <span className="text-white">{m.name}</span>
                    {filterMembers.includes(m.id) && <span className="ml-auto text-purple-400">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
          {isFiltering && (
            <button onClick={onClear} className="w-full text-xs text-red-400 hover:text-red-300 py-1 transition-colors">
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
  boardId, initialLists, initialLabels, workspaceMembers,
}: {
  boardId: string;
  initialLists: List[];
  initialLabels: Label[];
  workspaceMembers: Member[];
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

  function onDragStart({ active }: DragStartEvent) { setActiveId(active.id as string); }

  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    const aId = active.id as string, oId = over.id as string;
    if (active.data.current?.type !== "card") return;
    const fromList = lists.find((l) => l.cards.some((c) => c.id === aId));
    const toList = lists.find((l) => l.id === oId) ?? lists.find((l) => l.cards.some((c) => c.id === oId));
    if (!fromList || !toList || fromList.id === toList.id) return;
    setLists((prev) => {
      const card = prev.find((l) => l.id === fromList.id)!.cards.find((c) => c.id === aId)!;
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
      const toList = lists.find((l) => l.cards.some((c) => c.id === oId)) ?? lists.find((l) => l.id === oId);
      if (!toList) return;
      setLists((prev) => prev.map((l) => {
        if (l.id !== toList.id) return l;
        const oldIdx = l.cards.findIndex((c) => c.id === aId);
        const newIdx = l.cards.findIndex((c) => c.id === oId);
        if (oldIdx === -1 || newIdx === -1) return l;
        const reordered = arrayMove(l.cards, oldIdx, newIdx);
        const newOrder = calcNewPosition(reordered.filter((c) => c.id !== aId), newIdx);
        updateCardOrder(aId, toList.id, newOrder);
        return { ...l, cards: reordered.map((c) => c.id === aId ? { ...c, order: newOrder } : c) };
      }));
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 px-4 pt-3">
        <FilterBar
          boardLabels={boardLabels}
          workspaceMembers={workspaceMembers}
          filterLabels={filterLabels}
          filterMembers={filterMembers}
          onToggleLabel={toggleLabelFilter}
          onToggleMember={toggleMemberFilter}
          onClear={clearFilters}
        />
        {isFiltering && <span className="text-xs text-gray-500">Đang lọc — một số thẻ bị ẩn</span>}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}>
        <div className="flex gap-4 p-4 overflow-x-auto min-h-[calc(100vh-56px)] items-start">
          <SortableContext items={lists.map((l) => l.id)} strategy={horizontalListSortingStrategy}>
            {filteredLists.map((list) => (
              <SortableList key={list.id} list={list} onDelete={() => handleDeleteList(list.id)} onRename={(t) => handleRenameList(list.id, t)}>
                <SortableContext items={list.cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                  <div className="px-2 pb-2 space-y-2 min-h-8">
                    {list.cards.map((card) => (
                      <SortableCard key={card.id} card={card} onClick={() => setSelectedCard({ card, listId: list.id })} />
                    ))}
                  </div>
                </SortableContext>

                {addingCardTo === list.id ? (
                  <div className="px-2 pb-2 space-y-1.5">
                    <textarea autoFocus value={newCardTitle}
                      onChange={(e) => setNewCardTitle(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddCard(list.id); } if (e.key === "Escape") setAddingCardTo(null); }}
                      placeholder="Nhập tiêu đề thẻ..." rows={2}
                      className="w-full bg-gray-800 border border-gray-600 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500 resize-none"
                    />
                    <div className="flex gap-1.5">
                      <button onClick={() => handleAddCard(list.id)} className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">Thêm</button>
                      <button onClick={() => setAddingCardTo(null)} className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setAddingCardTo(list.id)} className="flex items-center gap-1.5 text-gray-500 hover:text-white text-xs px-3 py-2.5 hover:bg-white/5 rounded-b-2xl transition-colors w-full">
                    <Plus className="w-3.5 h-3.5" /> Thêm thẻ
                  </button>
                )}
              </SortableList>
            ))}
          </SortableContext>

          {addingList ? (
            <div className="shrink-0 w-64 bg-gray-900/90 backdrop-blur rounded-2xl p-2 space-y-1.5">
              <input autoFocus value={newListTitle} onChange={(e) => setNewListTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddList(); if (e.key === "Escape") setAddingList(false); }}
                placeholder="Nhập tên cột..."
                className="w-full bg-gray-800 border border-gray-600 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500"
              />
              <div className="flex gap-1.5">
                <button onClick={handleAddList} className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">Thêm cột</button>
                <button onClick={() => setAddingList(false)} className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors"><X className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingList(true)} className="shrink-0 w-64 h-12 bg-white/10 hover:bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center gap-2 text-white/70 hover:text-white text-sm transition-all">
              <Plus className="w-4 h-4" /> Thêm cột mới
            </button>
          )}
        </div>

        <DragOverlay>
          {activeType === "card" && activeCard && (
            <div className="bg-gray-800 border border-purple-500 rounded-xl px-3 py-2.5 w-60 shadow-2xl rotate-2">
              <p className="text-sm text-white">{activeCard.title}</p>
            </div>
          )}
          {activeType === "list" && activeList && (
            <div className="bg-gray-900/90 border border-purple-500 rounded-2xl w-64 px-3 py-3 shadow-2xl rotate-1">
              <p className="text-sm font-semibold text-white">{activeList.title}</p>
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
    </>
  );
}
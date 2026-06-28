"use client";

import { useState } from "react";
import { Plus, X, GripVertical, Trash2, Check } from "lucide-react";
import {
  DndContext, DragEndEvent, DragOverEvent, DragStartEvent,
  PointerSensor, useSensor, useSensors, closestCorners,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext, horizontalListSortingStrategy,
  verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { updateListOrder, rebalanceLists, createList, deleteList, updateListTitle } from "@/app/actions/list";
import { createCard, deleteCard, updateCard, updateCardOrder } from "@/app/actions/card";
import { calcNewPosition, needsRebalance } from "@/utils/position";

interface Card { id: string; title: string; description?: string | null; order: number; color?: string | null; }
interface List { id: string; title: string; order: number; cards: Card[]; }

// ── Sortable Card ──
function SortableCard({ card, onClick }: { card: Card; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: "card", card },
  });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-xl px-3 py-2.5 cursor-pointer transition-all"
    >
      {card.color && <div className={`h-1.5 w-12 rounded-full mb-2 ${card.color}`} />}
      <p className="text-sm text-white leading-snug">{card.title}</p>
      {card.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{card.description}</p>}
    </div>
  );
}

// ── Sortable List ──
function SortableList({ list, children, onDelete, onRename }: {
  list: List; children: React.ReactNode;
  onDelete: () => void; onRename: (title: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: list.id,
    data: { type: "list", list },
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
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { onRename(title); setEditing(false); }
              if (e.key === "Escape") setEditing(false);
            }}
            onBlur={() => { onRename(title); setEditing(false); }}
            className="flex-1 bg-gray-800 text-white text-sm font-semibold px-2 py-0.5 rounded-lg outline-none border border-purple-500"
          />
        ) : (
          <span
            className="flex-1 text-sm font-semibold text-white cursor-pointer"
            onDoubleClick={() => setEditing(true)}
          >
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

// ── Main ──
export default function BoardClient({ boardId, initialLists }: { boardId: string; initialLists: List[] }) {
  const [lists, setLists] = useState<List[]>(
    [...initialLists].sort((a, b) => a.order - b.order)
  );
  const [addingList, setAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [addingCardTo, setAddingCardTo] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [selectedCard, setSelectedCard] = useState<{ card: Card; listId: string } | null>(null);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const activeType = activeId
    ? lists.some((l) => l.id === activeId) ? "list"
    : "card"
    : null;
  const activeCard = activeType === "card"
    ? lists.flatMap((l) => l.cards).find((c) => c.id === activeId)
    : null;
  const activeList = activeType === "list"
    ? lists.find((l) => l.id === activeId)
    : null;

  // ── LIST ACTIONS ──
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

  // ── CARD ACTIONS ──
  async function handleAddCard(listId: string) {
    if (!newCardTitle.trim()) return;
    const card = await createCard(listId, newCardTitle.trim());
    setLists((prev) => prev.map((l) => l.id === listId ? { ...l, cards: [...l.cards, card] } : l));
    setNewCardTitle(""); setAddingCardTo(null);
  }

  async function handleDeleteCard(cardId: string, listId: string) {
    await deleteCard(cardId);
    setLists((prev) => prev.map((l) =>
      l.id === listId ? { ...l, cards: l.cards.filter((c) => c.id !== cardId) } : l
    ));
    setSelectedCard(null);
  }

  async function handleSaveCard(card: Card) {
    await updateCard(card.id, { title: card.title, description: card.description ?? undefined });
    setLists((prev) => prev.map((l) => ({ ...l, cards: l.cards.map((c) => c.id === card.id ? card : c) })));
    setSelectedCard(null); setEditingCard(null);
  }

  // ── DND HANDLERS ──
  function onDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string);
  }

  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;

    const isActiveCard = active.data.current?.type === "card";
    if (!isActiveCard) return;

    // Tìm list chứa card đang kéo và list đang hover
    const fromList = lists.find((l) => l.cards.some((c) => c.id === activeId));
    const toList = lists.find((l) => l.id === overId) ?? lists.find((l) => l.cards.some((c) => c.id === overId));
    if (!fromList || !toList || fromList.id === toList.id) return;

    // Di chuyển card sang list khác (optimistic)
    setLists((prev) => {
      const card = prev.find((l) => l.id === fromList.id)!.cards.find((c) => c.id === activeId)!;
      return prev.map((l) => {
        if (l.id === fromList.id) return { ...l, cards: l.cards.filter((c) => c.id !== activeId) };
        if (l.id === toList.id) return { ...l, cards: [...l.cards, card] };
        return l;
      });
    });
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    if (activeId === overId) return;

    const isActiveList = active.data.current?.type === "list";
    const isActiveCard = active.data.current?.type === "card";

    if (isActiveList) {
      // ── Reorder List ──
      setLists((prev) => {
        const sorted = [...prev].sort((a, b) => a.order - b.order);
        const fromIdx = sorted.findIndex((l) => l.id === activeId);
        const toIdx = sorted.findIndex((l) => l.id === overId);
        const withoutDragged = sorted.filter((_, i) => i !== fromIdx);
        const newOrder = calcNewPosition(withoutDragged, toIdx);
        const updated = sorted
          .map((l) => l.id === activeId ? { ...l, order: newOrder } : l)
          .sort((a, b) => a.order - b.order);

        updateListOrder(activeId, newOrder).then(() => {
          if (needsRebalance(updated)) rebalanceLists(boardId);
        });

        return updated;
      });
    }

    if (isActiveCard) {
      // ── Reorder Card (float) ──
      const toList = lists.find((l) => l.cards.some((c) => c.id === overId))
        ?? lists.find((l) => l.id === overId);
      if (!toList) return;

      setLists((prev) => {
        return prev.map((l) => {
          if (l.id !== toList.id) return l;
          const oldIdx = l.cards.findIndex((c) => c.id === activeId);
          const newIdx = l.cards.findIndex((c) => c.id === overId);
          if (oldIdx === -1 || newIdx === -1) return l;

          const reordered = arrayMove(l.cards, oldIdx, newIdx);
          // Tính float position cho card vừa move
          const newOrder = calcNewPosition(
            reordered.filter((c) => c.id !== activeId),
            newIdx
          );
          const withOrder = reordered.map((c) =>
            c.id === activeId ? { ...c, order: newOrder } : c
          );

          updateCardOrder(activeId, toList.id, newOrder);
          return { ...l, cards: withOrder };
        });
      });
    }
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}>
        <div className="flex gap-4 p-4 overflow-x-auto min-h-[calc(100vh-56px)] items-start">
          <SortableContext items={lists.map((l) => l.id)} strategy={horizontalListSortingStrategy}>
            {lists.map((list) => (
              <SortableList
                key={list.id}
                list={list}
                onDelete={() => handleDeleteList(list.id)}
                onRename={(title) => handleRenameList(list.id, title)}
              >
                <SortableContext items={list.cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                  <div className="px-2 pb-2 space-y-2 min-h-8">
                    {list.cards.map((card) => (
                      <SortableCard
                        key={card.id}
                        card={card}
                        onClick={() => setSelectedCard({ card, listId: list.id })}
                      />
                    ))}
                  </div>
                </SortableContext>

                {addingCardTo === list.id ? (
                  <div className="px-2 pb-2 space-y-1.5">
                    <textarea
                      autoFocus
                      value={newCardTitle}
                      onChange={(e) => setNewCardTitle(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddCard(list.id); } if (e.key === "Escape") setAddingCardTo(null); }}
                      placeholder="Nhập tiêu đề thẻ..."
                      rows={2}
                      className="w-full bg-gray-800 border border-gray-600 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500 resize-none"
                    />
                    <div className="flex gap-1.5">
                      <button onClick={() => handleAddCard(list.id)} className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">Thêm</button>
                      <button onClick={() => setAddingCardTo(null)} className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingCardTo(list.id)}
                    className="flex items-center gap-1.5 text-gray-500 hover:text-white text-xs px-3 py-2.5 hover:bg-white/5 rounded-b-2xl transition-colors w-full"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm thẻ
                  </button>
                )}
              </SortableList>
            ))}
          </SortableContext>

          {addingList ? (
            <div className="shrink-0 w-64 bg-gray-900/90 backdrop-blur rounded-2xl p-2 space-y-1.5">
              <input
                autoFocus
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
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
            <button
              onClick={() => setAddingList(true)}
              className="shrink-0 w-64 h-12 bg-white/10 hover:bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center gap-2 text-white/70 hover:text-white text-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Thêm cột mới
            </button>
          )}
        </div>

        {/* Drag Overlay — ghost item khi kéo */}
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

      {/* Card Detail Modal */}
      {selectedCard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setSelectedCard(null); setEditingCard(null); }}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h3 className="font-semibold text-white">Chi tiết thẻ</h3>
              <button onClick={() => { setSelectedCard(null); setEditingCard(null); }} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-medium mb-1.5 block">Tiêu đề</label>
                <input
                  value={editingCard?.title ?? selectedCard.card.title}
                  onChange={(e) => setEditingCard((prev) => ({ ...(prev ?? selectedCard.card), title: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 font-medium mb-1.5 block">Mô tả</label>
                <textarea
                  rows={3}
                  value={editingCard?.description ?? selectedCard.card.description ?? ""}
                  onChange={(e) => setEditingCard((prev) => ({ ...(prev ?? selectedCard.card), description: e.target.value }))}
                  placeholder="Thêm mô tả..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500 transition-colors resize-none"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => handleSaveCard(editingCard ?? selectedCard.card)} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors">
                  <Check className="w-4 h-4" /> Lưu
                </button>
                <button onClick={() => handleDeleteCard(selectedCard.card.id, selectedCard.listId)} className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium transition-colors flex items-center gap-2">
                  <Trash2 className="w-4 h-4" /> Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
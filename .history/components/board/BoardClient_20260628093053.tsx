"use client";

import { useState, useRef } from "react";
import { Plus, X, GripVertical, Trash2, Check } from "lucide-react";
import { updateListOrder, rebalanceLists, createList, deleteList, updateListTitle } from "@/app/actions/list";
import { createCard, deleteCard, updateCard, moveCard } from "@/app/actions/card";
import { calcNewPosition, needsRebalance } from "@/utils/position";

interface Card { id: string; title: string; description?: string | null; order: number; color?: string | null; }
interface List { id: string; title: string; order: number; cards: Card[]; }

export default function BoardClient({ boardId, initialLists }: { boardId: string; initialLists: List[] }) {
  const [lists, setLists] = useState<List[]>(initialLists);
  const [addingList, setAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [addingCardTo, setAddingCardTo] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [selectedCard, setSelectedCard] = useState<{ card: Card; listId: string } | null>(null);
  const [editingCard, setEditingCard] = useState<Card | null>(null);

  const dragCard = useRef<{ cardId: string; fromListId: string } | null>(null);
  const dragList = useRef<string | null>(null);

  // ── LIST ACTIONS ──
  async function handleAddList() {
    if (!newListTitle.trim()) return;
    const list = await createList(boardId, newListTitle.trim());
    setLists((prev) => [...prev, { ...list, cards: [] }]);
    setNewListTitle("");
    setAddingList(false);
  }

  async function handleDeleteList(listId: string) {
    await deleteList(listId);
    setLists((prev) => prev.filter((l) => l.id !== listId));
  }

  async function handleRenameList(listId: string) {
    if (!editingTitle.trim()) return;
    await updateListTitle(listId, editingTitle.trim());
    setLists((prev) => prev.map((l) => l.id === listId ? { ...l, title: editingTitle.trim() } : l));
    setEditingListId(null);
  }

  // ── CARD ACTIONS ──
  async function handleAddCard(listId: string) {
    if (!newCardTitle.trim()) return;
    const card = await createCard(listId, newCardTitle.trim());
    setLists((prev) => prev.map((l) =>
      l.id === listId ? { ...l, cards: [...l.cards, card] } : l
    ));
    setNewCardTitle("");
    setAddingCardTo(null);
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
    setLists((prev) => prev.map((l) => ({
      ...l,
      cards: l.cards.map((c) => c.id === card.id ? card : c),
    })));
    setSelectedCard(null);
    setEditingCard(null);
  }

  // ── DRAG & DROP ──
  function onCardDragStart(e: React.DragEvent, cardId: string, fromListId: string) {
    e.stopPropagation(); // ngăn list drag start
    dragCard.current = { cardId, fromListId };
    dragList.current = null; // clear list drag
  }

  function onCardDrop(e: React.DragEvent, toListId: string, afterCardId?: string) {
    e.stopPropagation();
    if (!dragCard.current) return;
    const { cardId, fromListId } = dragCard.current;
    if (cardId === afterCardId) return;

    // snapshot trước khi setLists
    const currentLists = lists;
    const toList = currentLists.find((l) => l.id === toListId)!;
    const afterIdx = afterCardId
      ? toList.cards.findIndex((c) => c.id === afterCardId)
      : toList.cards.length - 1;
    const newOrder = afterIdx + 1;

    setLists((prev) => {
      const fromList = prev.find((l) => l.id === fromListId)!;
      const card = fromList.cards.find((c) => c.id === cardId)!;

      const withoutCard = prev.map((l) =>
        l.id === fromListId ? { ...l, cards: l.cards.filter((c) => c.id !== cardId) } : l
      );

      return withoutCard.map((l) => {
        if (l.id !== toListId) return l;
        const idx = afterCardId
          ? l.cards.findIndex((c) => c.id === afterCardId) + 1
          : l.cards.length;
        const newCards = [...l.cards];
        newCards.splice(idx, 0, card);
        return { ...l, cards: newCards.map((c, i) => ({ ...c, order: i })) };
      });
    });

    moveCard(cardId, toListId, newOrder);
    dragCard.current = null;
  }

  function onListDragStart(e: React.DragEvent, listId: string) {
    if (dragCard.current) return; // đang kéo card thì không kéo list
    dragList.current = listId;
  }

  function onListDrop(e: React.DragEvent, toListId: string) {
    // Nếu đang kéo card thì bỏ qua — card tự xử lý
    if (dragCard.current) return;
    if (!dragList.current || dragList.current === toListId) return;

    const sorted = [...lists].sort((a, b) => a.order - b.order);
    const fromIdx = sorted.findIndex((l) => l.id === dragList.current);
    const toIdx = sorted.findIndex((l) => l.id === toListId);

    const withoutDragged = sorted.filter((_, i) => i !== fromIdx);
    const newOrder = calcNewPosition(withoutDragged, toIdx);

    const updatedLists = sorted
      .map((l) => l.id === dragList.current ? { ...l, order: newOrder } : l)
      .sort((a, b) => a.order - b.order);

    setLists(updatedLists);

    const draggedId = dragList.current;
    updateListOrder(draggedId, newOrder).then(() => {
      if (needsRebalance(updatedLists)) rebalanceLists(boardId);
    });

    dragList.current = null;
  }

  return (
    <>
      <div className="flex gap-4 p-4 overflow-x-auto min-h-[calc(100vh-56px)] items-start">
        {lists.map((list) => (
          <div
            key={list.id}
            draggable
            onDragStart={(e) => onListDragStart(e, list.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onListDrop(e, list.id)}
            className="shrink-0 w-64 bg-gray-900/90 backdrop-blur rounded-2xl flex flex-col"
          >
            {/* List header */}
            <div className="flex items-center gap-2 px-3 pt-3 pb-2">
              <GripVertical className="w-3.5 h-3.5 text-gray-600 cursor-grab shrink-0" />
              {editingListId === list.id ? (
                <input
                  autoFocus
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleRenameList(list.id); if (e.key === "Escape") setEditingListId(null); }}
                  onBlur={() => handleRenameList(list.id)}
                  className="flex-1 bg-gray-800 text-white text-sm font-semibold px-2 py-0.5 rounded-lg outline-none border border-purple-500"
                />
              ) : (
                <span
                  className="flex-1 text-sm font-semibold text-white cursor-pointer"
                  onDoubleClick={() => { setEditingListId(list.id); setEditingTitle(list.title); }}
                >
                  {list.title}
                </span>
              )}
              <span className="text-xs text-gray-500">{list.cards.length}</span>
              <button
                onClick={() => handleDeleteList(list.id)}
                className="text-gray-600 hover:text-red-400 transition-colors p-0.5 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Cards drop zone */}
            <div
              className="px-2 pb-2 space-y-2 min-h-8"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.stopPropagation();
                if (dragCard.current) onCardDrop(e, list.id); // drop vào vùng trống → cuối list
              }}
            >
              {list.cards.map((card) => (
                <div
                  key={card.id}
                  draggable
                  onDragStart={(e) => onCardDragStart(e, card.id, list.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.stopPropagation();
                    onCardDrop(e, list.id, card.id);
                  }}
                  onClick={() => setSelectedCard({ card, listId: list.id })}
                  className="bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-gray-600 rounded-xl px-3 py-2.5 cursor-pointer group transition-all"
                >
                  {card.color && (
                    <div className={`h-1.5 w-12 rounded-full mb-2 ${card.color}`} />
                  )}
                  <p className="text-sm text-white leading-snug">{card.title}</p>
                  {card.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{card.description}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Add card */}
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
                  <button onClick={() => handleAddCard(list.id)} className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                    Thêm
                  </button>
                  <button onClick={() => setAddingCardTo(null)} className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
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
          </div>
        ))}

        {/* Add list */}
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
              <button onClick={handleAddList} className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                Thêm cột
              </button>
              <button onClick={() => setAddingList(false)} className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
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
                <button
                  onClick={() => handleSaveCard(editingCard ?? selectedCard.card)}
                  className="flex-1 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Check className="w-4 h-4" /> Lưu
                </button>
                <button
                  onClick={() => handleDeleteCard(selectedCard.card.id, selectedCard.listId)}
                  className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium transition-colors flex items-center gap-2"
                >
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
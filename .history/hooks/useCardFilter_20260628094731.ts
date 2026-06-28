import { useState, useMemo } from "react";

interface Label { id: string; name: string; color: string; }
interface CardLabel { labelId: string; label: Label; }
interface CardMember { userId: string; user: { id: string; name: string; avatarUrl?: string | null }; }
interface Card {
  id: string; title: string; description?: string | null;
  order: number; color?: string | null;
  cardLabels: CardLabel[];
  cardMembers: CardMember[];
}
interface List { id: string; title: string; order: number; cards: Card[]; }

export function useCardFilter(lists: List[]) {
  const [filterLabels, setFilterLabels] = useState<string[]>([]);
  const [filterMembers, setFilterMembers] = useState<string[]>([]);

  const filteredLists = useMemo(() => {
    const noFilter = filterLabels.length === 0 && filterMembers.length === 0;
    if (noFilter) return lists;

    return lists.map((list) => ({
      ...list,
      cards: list.cards.filter((card) => {
        const labelMatch = filterLabels.length === 0 ||
          filterLabels.every((lid) => card.cardLabels.some((cl) => cl.labelId === lid));
        const memberMatch = filterMembers.length === 0 ||
          filterMembers.every((uid) => card.cardMembers.some((cm) => cm.userId === uid));
        return labelMatch && memberMatch;
      }),
    }));
  }, [lists, filterLabels, filterMembers]);

  function toggleLabelFilter(labelId: string) {
    setFilterLabels((prev) =>
      prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId]
    );
  }

  function toggleMemberFilter(userId: string) {
    setFilterMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  function clearFilters() {
    setFilterLabels([]);
    setFilterMembers([]);
  }

  const isFiltering = filterLabels.length > 0 || filterMembers.length > 0;

  return { filteredLists, filterLabels, filterMembers, toggleLabelFilter, toggleMemberFilter, clearFilters, isFiltering };
}
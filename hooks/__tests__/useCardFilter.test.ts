import { renderHook, act } from "@testing-library/react";
import { useCardFilter } from "../useCardFilter";

// Mocks for testing
const mockCard1 = {
  id: "card-1",
  title: "Card 1",
  order: 1,
  cardLabels: [{ labelId: "label-1", label: { id: "label-1", name: "Bug", color: "red" } }],
  cardMembers: [{ userId: "user-1", user: { id: "user-1", name: "Alice" } }],
};

const mockCard2 = {
  id: "card-2",
  title: "Card 2",
  order: 2,
  cardLabels: [{ labelId: "label-2", label: { id: "label-2", name: "Feature", color: "blue" } }],
  cardMembers: [
    { userId: "user-1", user: { id: "user-1", name: "Alice" } },
    { userId: "user-2", user: { id: "user-2", name: "Bob" } }
  ],
};

const mockLists = [
  {
    id: "list-1",
    title: "To Do",
    order: 1,
    cards: [mockCard1, mockCard2],
  },
];

describe("useCardFilter", () => {
  it("should initialize with empty filters and return all cards", () => {
    const { result } = renderHook(() => useCardFilter(mockLists));
    
    expect(result.current.filterLabels).toEqual([]);
    expect(result.current.filterMembers).toEqual([]);
    expect(result.current.isFiltering).toBe(false);
    expect(result.current.filteredLists[0].cards).toHaveLength(2);
  });

  it("should filter cards by label", () => {
    const { result } = renderHook(() => useCardFilter(mockLists));

    act(() => {
      result.current.toggleLabelFilter("label-1");
    });

    expect(result.current.filterLabels).toEqual(["label-1"]);
    expect(result.current.isFiltering).toBe(true);
    expect(result.current.filteredLists[0].cards).toHaveLength(1);
    expect(result.current.filteredLists[0].cards[0].id).toBe("card-1");

    // Toggle off
    act(() => {
      result.current.toggleLabelFilter("label-1");
    });
    expect(result.current.filterLabels).toEqual([]);
    expect(result.current.filteredLists[0].cards).toHaveLength(2);
  });

  it("should filter cards by member", () => {
    const { result } = renderHook(() => useCardFilter(mockLists));

    act(() => {
      result.current.toggleMemberFilter("user-2");
    });

    expect(result.current.filterMembers).toEqual(["user-2"]);
    expect(result.current.isFiltering).toBe(true);
    expect(result.current.filteredLists[0].cards).toHaveLength(1);
    expect(result.current.filteredLists[0].cards[0].id).toBe("card-2");
  });

  it("should filter cards requiring ALL selected labels/members (AND logic)", () => {
    const { result } = renderHook(() => useCardFilter(mockLists));

    act(() => {
      result.current.toggleLabelFilter("label-1");
      result.current.toggleMemberFilter("user-2");
    });

    // Expecting 0 because no card has both label-1 AND user-2
    expect(result.current.filteredLists[0].cards).toHaveLength(0);
  });

  it("should clear all filters", () => {
    const { result } = renderHook(() => useCardFilter(mockLists));

    act(() => {
      result.current.toggleLabelFilter("label-1");
      result.current.toggleMemberFilter("user-1");
    });

    expect(result.current.isFiltering).toBe(true);

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.filterLabels).toEqual([]);
    expect(result.current.filterMembers).toEqual([]);
    expect(result.current.isFiltering).toBe(false);
    expect(result.current.filteredLists[0].cards).toHaveLength(2);
  });
});

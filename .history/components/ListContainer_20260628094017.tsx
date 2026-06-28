// components/ListContainer.tsx (client)
"use client"
import { DndContext, DragEndEvent } from "@dnd-kit/core"
import { SortableContext, arrayMove } from "@dnd-kit/sortable"
import { useState, useTransition } from "react"
import { updateListPosition } from "@/actions/list"

function getNewPosition(
  lists: Array<{ position?: number }>,
  oldIndex: number,
  newIndex: number
) {
  if (oldIndex === newIndex) {
    return lists[oldIndex]?.position ?? oldIndex + 1
  }

  const prevList = lists[Math.max(0, newIndex - 1)]
  const nextList = lists[Math.min(lists.length - 1, newIndex + 1)]

  if (typeof prevList?.position === "number" && typeof nextList?.position === "number") {
    return (prevList.position + nextList.position) / 2
  }

  if (typeof prevList?.position === "number") {
    return prevList.position + 1
  }

  if (typeof nextList?.position === "number") {
    return nextList.position - 1
  }

  return newIndex + 1
}

export function ListContainer({ initialLists }) {
  const [lists, setLists] = useState(initialLists)
  const [isPending, startTransition] = useTransition()

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = lists.findIndex(l => l.id === active.id)
    const newIndex = lists.findIndex(l => l.id === over.id)
    const newPosition = getNewPosition(lists, oldIndex, newIndex)

    // 1. Optimistic update UI ngay
    setLists(prev => arrayMove(prev, oldIndex, newIndex))

    // 2. Gọi server action ngầm
    startTransition(async () => {
      await updateListPosition(active.id as string, newPosition)
    })
  }

  return (
    <DndContext onDragEnd={onDragEnd}>
      <SortableContext items={lists.map(l => l.id)}>
        {lists.map(list => <SortableList key={list.id} list={list} />)}
      </SortableContext>
    </DndContext>
  )
}
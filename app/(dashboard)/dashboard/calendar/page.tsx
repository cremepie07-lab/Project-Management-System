"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import PageHeader from "@/components/layout/PageHeader";

interface CalendarCard {
  id: string;
  title: string;
  dueDate: string;
  isCompleted: boolean;
  list: { title: string; board: { id: string; title: string } };
  cardLabels: { label: { name: string; color: string } }[];
}

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Monday = 0

  const days: { date: Date; isCurrentMonth: boolean }[] = [];

  const prevMonth = new Date(year, month, 0);
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push({ date: new Date(year, month - 1, prevMonth.getDate() - i), isCurrentMonth: false });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ date: new Date(year, month, d), isCurrentMonth: true });
  }

  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    days.push({ date: new Date(year, month + 1, d), isCurrentMonth: false });
  }

  return days;
}

function formatDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [cards, setCards] = useState<CalendarCard[]>([]);
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = getMonthDays(year, month);
  const today = new Date();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/calendar?year=${year}&month=${month + 1}`);
        if (res.ok) {
          const data = await res.json();
          setCards(data.cards ?? []);
        }
      } catch {}
      setLoading(false);
    }
    load();
  }, [year, month]);

  const cardsByDate: Record<string, CalendarCard[]> = {};
  for (const card of cards) {
    const key = card.dueDate.slice(0, 10);
    if (!cardsByDate[key]) cardsByDate[key] = [];
    cardsByDate[key].push(card);
  }

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  return (
    <div className="min-h-screen bg-bg">
        <PageHeader title="Lịch" />

      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-surface-hover text-text-tertiary hover:text-text transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-text">
              Tháng {month + 1} / {year}
            </h2>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-surface-hover text-text-tertiary hover:text-text transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 border-b border-border">
            {WEEKDAYS.map((day) => (
              <div key={day} className="px-2 py-2 text-center text-xs font-semibold text-text-tertiary border-r border-border last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {days.map((day, i) => {
              const key = formatDateKey(day.date);
              const dayCards = cardsByDate[key] ?? [];
              const isToday = day.date.toDateString() === today.toDateString();

              return (
                <div
                  key={i}
                  className={cn(
                    "min-h-25 border-r border-b border-border last:border-r-0 p-1.5",
                    !day.isCurrentMonth && "bg-surface-secondary/50",
                    isToday && "bg-accent/5"
                  )}
                >
                  <span className={cn(
                    "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium",
                    isToday ? "bg-accent text-white" : day.isCurrentMonth ? "text-text" : "text-text-tertiary"
                  )}>
                    {day.date.getDate()}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayCards.slice(0, 3).map((card) => (
                      <div
                        key={card.id}
                        className={cn(
                          "text-[10px] leading-tight px-1.5 py-0.5 rounded truncate",
                          card.isCompleted
                            ? "bg-success/10 text-success line-through"
                            : "bg-accent/10 text-accent"
                        )}
                        title={card.title}
                      >
                        {card.title}
                      </div>
                    ))}
                    {dayCards.length > 3 && (
                      <span className="text-[10px] text-text-tertiary px-1">+{dayCards.length - 3} nữa</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

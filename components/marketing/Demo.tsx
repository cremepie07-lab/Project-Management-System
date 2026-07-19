"use client";

import { useRef, useEffect } from "react";
import {
  CheckCircle2,
  Clock,
  Tag,
  MoreHorizontal,
  Plus,
  ChevronRight,
  Timer,
  Paperclip,
} from "lucide-react";

function CardDetailMock() {
  return (
    <div className="bg-[#141622] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/80 w-72">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-white/60 text-[9px] uppercase tracking-wider font-semibold">Q3 Sprint Planning</span>
          <MoreHorizontal className="w-4 h-4 text-white/50" />
        </div>
        <h4 className="text-white text-xs font-semibold leading-snug">Thiết kế Dashboard v2 & Dark Mode</h4>
      </div>

      <div className="p-4 space-y-4">
        {/* Labels list */}
        <div className="flex gap-1.5 flex-wrap">
          {[
            { text: "UI Design", color: "bg-violet-500/20 text-violet-300 border-violet-500/20" },
            { text: "Khẩn cấp", color: "bg-rose-500/20 text-rose-300 border-rose-500/20" },
          ].map((l) => (
            <span key={l.text} className={`text-[9px] font-semibold px-2 py-0.5 rounded-md border ${l.color}`}>
              {l.text}
            </span>
          ))}
        </div>

        {/* Checklist details */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-white/50 text-[9px] font-semibold uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-white/40" /> Checklist
            </span>
            <span className="text-white/30 text-[9px]">4 / 5</span>
          </div>
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: "80%" }} />
          </div>
          <div className="space-y-1">
            {[
              { text: "Thiết kế Figma wireframe", done: true },
              { text: "Hội ý nhóm về font & màu sắc", done: true },
              { text: "Thiết lập hệ thống CSS v4", done: true },
              { text: "Tạo cấu trúc layout responsive", done: true },
              { text: "Kiểm tra độ tương phản màu chữ", done: false },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2 py-0.5">
                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${
                  item.done ? "bg-emerald-500 border-emerald-500" : "border-white/20 bg-transparent"
                }`}>
                  {item.done && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                </div>
                <span className={`text-[10px] ${item.done ? "line-through text-white/30" : "text-white/60"}`}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Card info footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[9px]">
          <div className="flex items-center gap-1.5 text-amber-400/80">
            <Clock className="w-3 h-3" /> Hạn: 26/07
          </div>
          <div className="flex items-center gap-1.5 text-blue-400/80">
            <Timer className="w-3 h-3" /> 4h 30m
          </div>
          <div className="flex items-center gap-1.5 text-white/30">
            <Paperclip className="w-3 h-3" /> 3 files
          </div>
        </div>
      </div>
    </div>
  );
}

function BoardColMock({ title, dot, cards }: { title: string; dot: string; cards: { text: string; tag?: string; tagColor?: string }[] }) {
  return (
    <div className="w-52 shrink-0">
      <div className="flex items-center gap-2 mb-2 px-1">
        <div className={`w-2.5 h-2.5 rounded-full ${dot}`} />
        <span className="text-white/60 text-[11px] font-bold uppercase tracking-wider">{title}</span>
        <span className="ml-auto text-[10px] text-white/20 bg-white/5 px-1.5 py-0.5 rounded">{cards.length}</span>
      </div>
      <div className="space-y-2">
        {cards.map((c) => (
          <div key={c.text} className="bg-[#141622] border border-white/5 rounded-xl p-3 hover:border-white/10 transition-colors cursor-pointer">
            {c.tag && (
              <span className={`inline-block text-[8px] font-semibold px-2 py-0.5 rounded-full mb-2 ${c.tagColor}`}>
                {c.tag}
              </span>
            )}
            <p className="text-white/70 text-[11px] leading-snug">{c.text}</p>
          </div>
        ))}
        <button className="w-full flex items-center justify-center gap-1 py-2 text-[10px] text-white/20 hover:text-white/40 hover:bg-white/3 rounded-xl transition-colors">
          <Plus className="w-3.5 h-3.5" /> Thêm thẻ mới
        </button>
      </div>
    </div>
  );
}

export default function Demo() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("opacity-100", "scale-100");
          entry.target.classList.remove("opacity-0", "scale-95");
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="demo" className="bg-[#080a10] py-24 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-80 h-80 bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      <div className="max-w-6xl mx-auto px-5 relative z-10">
        {/* Header */}
        <div className="mb-14 text-center">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/8 text-white/50 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
            <Tag className="w-3.5 h-3.5" /> Xem thực tế
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
            Khám phá giao diện{" "}
            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
              trực quan.
            </span>
          </h2>
          <p className="text-white/40 max-w-lg mx-auto text-base">
            Mọi thao tác quản lý, tạo thẻ công việc đều hiển thị cực kỳ dễ hiểu và khoa học.
          </p>
        </div>

        {/* Desktop Mockup Board Area */}
        <div 
          ref={containerRef}
          className="relative transition-all duration-1000 ease-out opacity-0 scale-95"
        >
          <div className="absolute -inset-4 bg-gradient-to-b from-violet-600/10 to-blue-600/5 rounded-3xl blur-3xl opacity-60 pointer-events-none" />
          
          <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/80 bg-[#0f111a]">
            {/* Browser top-bar */}
            <div className="bg-[#0b0c13] px-4 py-3 flex items-center gap-3 border-b border-white/5">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
              </div>
              <div className="flex-1 max-w-xs mx-auto bg-white/5 rounded px-3 py-0.5 text-[10px] text-white/30 text-center select-none">
                workflow.app/workspace/sprint-3
              </div>
            </div>

            {/* Mock Board view layout */}
            <div className="flex bg-[#080a10]/90 overflow-hidden" style={{ height: "400px" }}>
              {/* Fake Workspace sidebar */}
              <div className="w-44 shrink-0 bg-[#0c0d15] border-r border-white/5 p-4 flex flex-col gap-5 hidden md:flex">
                <div className="flex items-center gap-2">
                  <div className="w-5.5 h-5.5 rounded-md bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">W</div>
                  <span className="text-white/80 text-[11px] font-bold truncate">Web Development</span>
                </div>
                <div className="space-y-1">
                  {["Bảng điều khiển", "Sprint Planning", "Danh sách lỗi", "Roadmap Q3"].map((item, idx) => (
                    <div key={idx} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] ${
                      idx === 1 ? "bg-violet-600/15 text-violet-300 font-semibold" : "text-white/40 hover:bg-white/5 hover:text-white/70"
                    } transition-colors cursor-pointer`}>
                      <ChevronRight className="w-3 h-3 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Fake Columns */}
              <div className="flex-1 p-5 relative overflow-hidden flex flex-col">
                <div className="flex gap-4 overflow-x-hidden h-full items-start">
                  <BoardColMock
                    title="Cần làm"
                    dot="bg-slate-400"
                    cards={[
                      { text: "Tối ưu hóa SEO Metadata cho các page", tag: "Marketing", tagColor: "bg-blue-500/15 text-blue-300" },
                      { text: "Tích hợp Google Fonts & CSS tokens", tag: "Design", tagColor: "bg-violet-500/15 text-violet-300" },
                    ]}
                  />
                  <BoardColMock
                    title="Đang làm"
                    dot="bg-amber-400"
                    cards={[
                      { text: "Viết helper tính tương phản màu chữ", tag: "Logic", tagColor: "bg-indigo-500/15 text-indigo-300" },
                    ]}
                  />
                  <BoardColMock
                    title="Đã xong"
                    dot="bg-emerald-500"
                    cards={[
                      { text: "Khởi tạo repo và cài package", tag: "System", tagColor: "bg-emerald-500/15 text-emerald-300" },
                    ]}
                  />

                  {/* Floating Modal card detail representation */}
                  <div className="absolute right-5 top-5 z-20 hidden lg:block">
                    <CardDetailMock />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
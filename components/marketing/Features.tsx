"use client";

import { useEffect, useRef } from "react";
import {
  GripVertical,
  Tag,
  CheckSquare,
  Timer,
  Clock4,
  Users,
  LayoutGrid,
  Bell,
  Sparkles,
} from "lucide-react";

const FEATURES = [
  {
    icon: GripVertical,
    title: "Kéo & Thả mượt mà",
    desc: "Di chuyển thẻ giữa các cột tức thì bằng @dnd-kit. Trực quan, mượt mà và không reload.",
    accent: "from-violet-500 to-indigo-500",
    glow: "shadow-violet-500/20",
  },
  {
    icon: Tag,
    title: "Label màu tương phản",
    desc: "Gắn nhãn màu cho thẻ với màu chữ tự động tương phản tối ưu, dễ dàng quản lý tag.",
    accent: "from-pink-500 to-rose-500",
    glow: "shadow-pink-500/20",
  },
  {
    icon: CheckSquare,
    title: "Checklist tiến độ",
    desc: "Chia nhỏ task thành các đầu việc cụ thể. Hoàn thành đến đâu, tiến trình cập nhật đến đó.",
    accent: "from-emerald-500 to-teal-500",
    glow: "shadow-emerald-500/20",
  },
  {
    icon: Timer,
    title: "Pomodoro tích hợp",
    desc: "Tập trung tối đa bằng đồng hồ Pomodoro tích hợp trực tiếp ngay trong từng thẻ công việc.",
    accent: "from-amber-500 to-orange-500",
    glow: "shadow-amber-500/20",
  },
  {
    icon: Clock4,
    title: "Theo dõi thời gian",
    desc: "Ghi nhận chính xác số giờ đã bỏ ra cho mỗi task. Xuất báo cáo thời gian trực quan.",
    accent: "from-blue-500 to-cyan-500",
    glow: "shadow-blue-500/20",
  },
  {
    icon: Users,
    title: "Không gian làm việc chung",
    desc: "Tạo Workspace, quản lý thành viên, gửi lời mời và cùng làm việc theo thời gian thực.",
    accent: "from-indigo-500 to-violet-500",
    glow: "shadow-indigo-500/20",
  },
  {
    icon: LayoutGrid,
    title: "Đa bảng dự án",
    desc: "Quản lý nhiều board khác nhau song song. Chuyển đổi qua lại cực kỳ dễ dàng.",
    accent: "from-teal-500 to-emerald-500",
    glow: "shadow-teal-500/20",
  },
  {
    icon: Bell,
    title: "Thông báo tức thì",
    desc: "Nhận cập nhật khi có bình luận mới, thẻ sắp đến hạn hoặc khi được phân công.",
    accent: "from-rose-500 to-pink-500",
    glow: "shadow-rose-500/20",
  },
];

export default function Features() {
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observerOptions = { threshold: 0.1 };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("opacity-100", "translate-y-0");
          entry.target.classList.remove("opacity-0", "translate-y-8");
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    if (headerRef.current) observer.observe(headerRef.current);
    if (gridRef.current) {
      const children = gridRef.current.children;
      for (let i = 0; i < children.length; i++) {
        observer.observe(children[i]);
      }
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="features" className="bg-[#0a0c13] py-24 relative overflow-hidden">
      {/* Subtle border gradients */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      {/* Radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-5 relative z-10">
        {/* Header */}
        <div 
          ref={headerRef} 
          className="text-center mb-16 opacity-0 translate-y-8 transition-all duration-700 ease-out"
        >
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/8 text-white/50 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
            <Sparkles className="w-3.5 h-3.5" /> Tính năng nổi bật
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
            Mọi tính năng cần thiết,{" "}
            <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
              trong một nền tảng.
            </span>
          </h2>
          <p className="text-white/40 max-w-lg mx-auto text-base">
            WorkFlow cung cấp các công cụ thiết yếu để quản lý công việc và thời gian hiệu quả.
          </p>
        </div>

        {/* Features grid */}
        <div ref={gridRef} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group relative bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 cursor-default opacity-0 translate-y-8"
              >
                {/* Icon box */}
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.accent} flex items-center justify-center mb-5 shadow-lg ${f.glow} group-hover:scale-110 transition-transform duration-200`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>

                <h3 className="text-white font-semibold text-sm mb-2">{f.title}</h3>
                <p className="text-white/40 text-xs leading-relaxed">{f.desc}</p>

                {/* Hover inner gradient glow */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${f.accent} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300 pointer-events-none`} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
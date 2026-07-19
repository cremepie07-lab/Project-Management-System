"use client";

import Link from "next/link";
import { ArrowRight, Star, CheckCircle2, LayoutGrid } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 bg-[#080a10] text-white">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[45%] h-[45%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Decorative Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-5 relative z-10 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-violet-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-8 backdrop-blur-md">
          <Star className="w-3.5 h-3.5 fill-violet-400 text-violet-400" />
          Quản lý công việc thông minh
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.15] mb-6">
          Đơn giản hóa dự án.<br />
          <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
            Tối ưu hiệu suất nhóm.
          </span>
        </h1>

        {/* Description */}
        <p className="text-white/50 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          Trải nghiệm phần mềm quản lý Kanban board hiện đại được thiết kế riêng cho sinh viên, 
          nhóm nhỏ và lập trình viên. Trực quan, mượt mà và hoàn toàn miễn phí.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Link
            href="/register"
            className="w-full sm:w-auto group flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-bold px-8 py-4 rounded-xl transition-all duration-200 shadow-lg shadow-violet-600/25 hover:shadow-violet-500/35 hover:-translate-y-0.5 text-sm"
          >
            Bắt đầu miễn phí
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto flex items-center justify-center bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 text-sm"
          >
            Đăng nhập tài khoản
          </Link>
        </div>

        {/* Feature quick bullets */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-white/30 mb-20">
          {["Miễn phí mãi mãi", "Không cần thẻ tín dụng", "Thiết lập trong 1 phút"].map((t) => (
            <span key={t} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500/60" /> {t}
            </span>
          ))}
        </div>

        {/* Product Kanban Mockup */}
        <div className="relative mx-auto max-w-4xl">
          <div className="absolute -inset-1 bg-gradient-to-r from-violet-500/20 to-blue-500/20 rounded-2xl blur-xl opacity-50 pointer-events-none" />
          
          <div className="relative rounded-2xl bg-[#0f111a] border border-white/10 shadow-2xl overflow-hidden">
            {/* Fake browser header */}
            <div className="bg-[#0b0c13] px-4 py-3 border-b border-white/5 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <div className="flex-1 max-w-[280px] mx-auto bg-white/5 rounded px-3 py-1 text-[10px] text-white/30 text-center tracking-wide">
                workflow.app/workspace/board-q3
              </div>
            </div>

            {/* Mockup Board content */}
            <div className="p-5 md:p-6 bg-[#080a10]/80">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-6 h-6 rounded bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow">
                  <LayoutGrid className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-bold text-white/80 text-sm">Sprint Planning Q3</span>
              </div>

              {/* Kanban columns */}
              <div className="flex gap-4 overflow-x-auto pb-2 select-none">
                {/* ToDo */}
                <div className="shrink-0 w-64 bg-white/[0.02] border border-white/5 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span className="text-[11px] font-bold text-white/60 uppercase tracking-wide">Cần làm</span>
                    <span className="ml-auto text-[10px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded">3</span>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-[#121420] border border-white/5 rounded-xl p-3 shadow-sm hover:border-white/10 transition-colors">
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/10">UI Design</span>
                      </div>
                      <p className="text-[12px] text-white/80 font-medium text-left">Thiết kế Mockup Landing Page</p>
                    </div>
                    <div className="bg-[#121420] border border-white/5 rounded-xl p-3 shadow-sm hover:border-white/10 transition-colors">
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/10">Backend</span>
                      </div>
                      <p className="text-[12px] text-white/80 font-medium text-left">Setup Prisma & Neon Postgres</p>
                    </div>
                  </div>
                </div>

                {/* Doing */}
                <div className="shrink-0 w-64 bg-white/[0.02] border border-white/5 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <span className="w-2 h-2 rounded-full bg-violet-500" />
                    <span className="text-[11px] font-bold text-white/60 uppercase tracking-wide">Đang làm</span>
                    <span className="ml-auto text-[10px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded">2</span>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-[#121420] border border-violet-500/30 rounded-xl p-3 shadow-sm hover:border-violet-500/50 transition-all scale-[1.01] shadow-violet-500/5">
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/10">Kéo Thả</span>
                        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/10">Cao</span>
                      </div>
                      <p className="text-[12px] text-white/90 font-semibold text-left">Tích hợp thư viện @dnd-kit</p>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                        <span className="text-[9px] text-amber-400/80">Hạn: 24/07</span>
                        <div className="w-4 h-4 rounded-full bg-violet-600 flex items-center justify-center text-[8px] font-bold">L</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Done */}
                <div className="shrink-0 w-64 bg-white/[0.02] border border-white/5 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[11px] font-bold text-white/60 uppercase tracking-wide">Đã xong</span>
                    <span className="ml-auto text-[10px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded">1</span>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-[#121420] border border-white/5 rounded-xl p-3 shadow-sm opacity-50">
                      <p className="text-[12px] text-white/80 font-medium text-left line-through">Khởi tạo dự án Next.js 15</p>
                    </div>
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
"use client";

import Link from "next/link";
import { LayoutGrid, ArrowRight, CheckCircle2, Zap, Users, BarChart3, Star, ChevronRight } from "lucide-react";
import Image from "next/image";

const FEATURES = [
  { icon: <Zap className="w-5 h-5" />, title: "Kéo thả trực quan", desc: "Di chuyển thẻ giữa các cột mượt mà, không cần reload trang." },
  { icon: <Users className="w-5 h-5" />, title: "Cộng tác nhóm", desc: "Mời thành viên, phân quyền và làm việc cùng nhau theo thời gian thực." },
  { icon: <BarChart3 className="w-5 h-5" />, title: "Theo dõi tiến độ", desc: "Dashboard tổng quan giúp bạn nắm bắt tiến độ dự án một cách dễ dàng." },
];

const BOARDS = [
  { title: "Sprint Planning", cards: ["Thiết kế UI", "Kết nối API", "Review code"], color: "bg-violet-500" },
  { title: "In Progress", cards: ["Tích hợp Auth", "Tối ưu DB"], color: "bg-blue-500" },
  { title: "Done", cards: ["Setup project", "Prisma schema", "Deploy staging"], color: "bg-emerald-500" },
];

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <img src="/logo.svg" alt="WorkFlow" className="h-7 w-auto object-contain" />

          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-500">
            <a href="#features" className="hover:text-slate-900 transition-colors">Tính năng</a>
            <a href="#preview" className="hover:text-slate-900 transition-colors">Xem trước</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Đăng nhập
            </Link>
            <Link href="/register" className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5">
              Dùng miễn phí <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <Star className="w-3.5 h-3.5 fill-violet-500" />
          CÔNG CỤ QUẢN LÝ DỰ ÁN SỐ 1
        </div>

        <h1 className="text-5xl md:text-6xl font-black text-slate-900 leading-tight mb-4">
          WorkFlow giúp nhóm bạn<br />
          <span className="relative inline-block mt-1">
            <span className="relative z-10 text-white px-4 py-1 rounded-2xl">làm việc tốt hơn.</span>
            <span className="absolute inset-0 bg-linear-to-r from-violet-600 to-blue-600 rounded-2xl" />
          </span>
        </h1>

        <p className="text-slate-500 text-lg max-w-xl mx-auto mt-6 mb-8 leading-relaxed">
          Quản lý dự án, cộng tác nhóm và theo dõi tiến độ — tất cả trong một nơi. Miễn phí cho nhóm nhỏ.
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link href="/register" className="bg-slate-900 hover:bg-slate-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors flex items-center gap-2 text-sm shadow-lg shadow-slate-900/20">
            Bắt đầu miễn phí <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/login" className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold px-6 py-3 rounded-xl transition-colors text-sm shadow-sm">
            Đã có tài khoản
          </Link>
        </div>

        <div className="flex items-center justify-center gap-6 mt-8 text-xs text-slate-400">
          {["Miễn phí mãi mãi", "Không cần thẻ tín dụng", "Cài đặt trong 2 phút"].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> {t}
            </span>
          ))}
        </div>
      </section>

      {/* KANBAN PREVIEW */}
      <section id="preview" className="max-w-6xl mx-auto px-6 pb-24">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/60 overflow-hidden">
          {/* fake browser bar */}
          <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
            </div>
            <div className="flex-1 max-w-xs mx-auto bg-white rounded-md px-3 py-1 text-xs text-slate-400 border border-slate-200 text-center">
              workflow.app/sprint-planning
            </div>
          </div>

          {/* kanban board */}
          <div className="p-6 bg-linear-to-br from-violet-50 to-blue-50">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded bg-linear-to-br from-violet-600 to-blue-600 flex items-center justify-center">
                <LayoutGrid className="w-3 h-3 text-white" />
              </div>
              <span className="font-semibold text-slate-700 text-sm">Sprint Planning Q2</span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {BOARDS.map((col) => (
                <div key={col.title} className="shrink-0 w-56 bg-slate-100 rounded-2xl p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                    <span className="text-xs font-semibold text-slate-600">{col.title}</span>
                    <span className="ml-auto text-xs text-slate-400">{col.cards.length}</span>
                  </div>
                  <div className="space-y-2">
                    {col.cards.map((card) => (
                      <div key={card} className="bg-white rounded-xl px-3 py-2.5 text-xs text-slate-700 font-medium shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer">
                        {card}
                      </div>
                    ))}
                    <button className="w-full text-xs text-slate-400 hover:text-slate-600 py-2 rounded-xl hover:bg-white/60 transition-colors flex items-center gap-1 justify-center">
                      + Thêm thẻ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="bg-white border-y border-slate-100 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-3">Mọi thứ bạn cần trong một nơi</h2>
            <p className="text-slate-500 max-w-md mx-auto">WorkFlow được thiết kế để giúp nhóm làm việc hiệu quả hơn mỗi ngày.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:border-violet-200 hover:shadow-md transition-all group">
                <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center mb-4 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                  {f.icon}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="bg-linear-to-br from-violet-600 to-blue-600 rounded-3xl p-12 text-white">
          <h2 className="text-3xl font-black mb-3">Sẵn sàng bắt đầu chưa?</h2>
          <p className="text-white/70 mb-8 max-w-sm mx-auto">Tham gia cùng hàng nghìn nhóm đang dùng WorkFlow để làm việc hiệu quả hơn.</p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-white text-violet-700 font-bold px-6 py-3 rounded-xl hover:bg-violet-50 transition-colors text-sm">
            Tạo tài khoản miễn phí <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-linear-to-br from-violet-600 to-blue-600 flex items-center justify-center">
              <LayoutGrid className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold text-slate-600">WorkFlow</span>
          </div>
          <span>© 2026 WorkFlow. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
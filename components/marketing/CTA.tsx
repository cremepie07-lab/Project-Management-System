"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowRight, Zap, CheckCircle2 } from "lucide-react";

export default function CTA() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("opacity-100", "translate-y-0");
          entry.target.classList.remove("opacity-0", "translate-y-10");
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="cta" className="bg-[#0a0c13] py-24 relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />

      {/* Deep backing glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[700px] h-[400px] bg-violet-600/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-4xl mx-auto px-5 relative z-10">
        <div
          ref={containerRef}
          className="relative rounded-3xl overflow-hidden border border-white/5 bg-gradient-to-br from-[#12111e] via-[#0f0f1d] to-[#0d0d1a] px-6 py-16 sm:px-12 md:py-20 text-center flex flex-col items-center opacity-0 translate-y-10 transition-all duration-1000 ease-out"
        >
          {/* Subtle inside gradient top line */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

          {/* Glowing bubbles */}
          <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/25 text-violet-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
            <Zap className="w-3.5 h-3.5 fill-violet-400 text-violet-400" />
            Bắt đầu trong 30 giây
          </div>

          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.2] mb-6 max-w-2xl">
            Sẵn sàng nâng tầm cách làm việc của{" "}
            <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
              nhóm của bạn?
            </span>
          </h2>

          {/* Subheading */}
          <p className="text-white/40 text-base max-w-md leading-relaxed mb-9">
            Tạo Workspace đầu tiên miễn phí ngay hôm nay. Không giới hạn thành viên, không giới hạn bảng Kanban.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
            <Link
              href="/register"
              className="group flex items-center justify-center gap-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold px-8 py-3.5 rounded-xl transition-all duration-200 shadow-xl shadow-violet-600/20 hover:-translate-y-0.5 text-sm"
            >
              Tạo tài khoản miễn phí
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 text-white/50 hover:text-white/80 font-medium text-sm transition-colors duration-200 underline underline-offset-4"
            >
              Đăng nhập tài khoản
            </Link>
          </div>

          {/* Trust bullets */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/20">
            {["Không cài đặt phức tạp", "Bảo mật tuyệt đối", "Giao diện Tiếng Việt"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/40" /> {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
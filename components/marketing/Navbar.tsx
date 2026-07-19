"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { ArrowRight, Menu, X } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#080a10]/80 backdrop-blur-xl border-b border-white/5 shadow-xl shadow-black/20"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <Image
            src="/logo.svg"
            alt="WorkFlow"
            width={28}
            height={28}
            className="h-7 w-auto object-contain"
          />
          <span className="font-bold text-white text-[15px] tracking-tight">WorkFlow</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7 text-sm text-white/60">
          <a href="#features" className="hover:text-white transition-colors duration-200">Tính năng</a>
          <a href="#demo" className="hover:text-white transition-colors duration-200">Demo</a>
          <a href="#cta" className="hover:text-white transition-colors duration-200">Bắt đầu</a>
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-200 px-3 py-1.5"
          >
            Đăng nhập
          </Link>
          <Link
            href="/register"
            className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all duration-200 shadow-md shadow-violet-600/10 hover:shadow-violet-500/20 hover:-translate-y-0.5 flex items-center gap-1.5"
          >
            Dùng miễn phí <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-white/70 hover:text-white p-1"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden absolute top-16 inset-x-0 bg-[#080a10] border-b border-white/5 py-6 px-5 flex flex-col gap-5 shadow-2xl z-40">
          <a
            href="#features"
            onClick={() => setMobileOpen(false)}
            className="text-white/70 hover:text-white text-sm font-medium transition-colors"
          >
            Tính năng
          </a>
          <a
            href="#demo"
            onClick={() => setMobileOpen(false)}
            className="text-white/70 hover:text-white text-sm font-medium transition-colors"
          >
            Demo
          </a>
          <a
            href="#cta"
            onClick={() => setMobileOpen(false)}
            className="text-white/70 hover:text-white text-sm font-medium transition-colors"
          >
            Bắt đầu
          </a>
          <div className="h-px bg-white/5 my-1" />
          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="text-center text-white/70 hover:text-white text-sm font-medium py-2 rounded-xl transition-colors"
            >
              Đăng nhập
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileOpen(false)}
              className="bg-violet-600 hover:bg-violet-500 text-white text-center text-sm font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              Dùng miễn phí <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
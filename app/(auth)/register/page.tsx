"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate() {
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2) errs.name = "Tên quá ngắn";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Email không hợp lệ";
    if (form.password.length < 6) errs.password = "Mật khẩu tối thiểu 6 ký tự";
    if (form.confirm !== form.password) errs.confirm = "Mật khẩu không khớp";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setErrors({ form: err.message || "Đăng ký thất bại" });
    } finally {
      setLoading(false);
    }
  }

  const pwStrength = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 6) s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p) && /[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          <Image src="/logo.svg" alt="WorkFlow" width={28} height={28} className="h-7 w-auto object-contain" />
          <span className="text-xl font-bold text-white">WorkFlow</span>
        </div>

        <h2 className="text-2xl font-bold text-white mb-1 text-center">Tạo tài khoản</h2>
        <p className="text-gray-400 text-sm mb-6 text-center">Bắt đầu quản lý công việc nhóm</p>

        {errors.form && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">
            {errors.form}
          </div>
        )}

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Họ và tên</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={form.name}
                onChange={update("name")}
                placeholder="Nguyễn Văn A"
                className={`w-full bg-gray-900 border rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500 transition-colors ${errors.name ? "border-red-500" : "border-gray-800"}`}
              />
            </div>
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                value={form.email}
                onChange={update("email")}
                placeholder="ban@vidu.com"
                className={`w-full bg-gray-900 border rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500 transition-colors ${errors.email ? "border-red-500" : "border-gray-800"}`}
              />
            </div>
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type={showPw ? "text" : "password"}
                value={form.password}
                onChange={update("password")}
                placeholder="••••••••"
                className={`w-full bg-gray-900 border rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500 transition-colors ${errors.password ? "border-red-500" : "border-gray-800"}`}
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            {form.password && (
              <div className="flex gap-1 mt-2">
                {[0,1,2,3].map((i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                    i < pwStrength
                      ? pwStrength <= 1 ? "bg-red-500" : pwStrength <= 2 ? "bg-amber-500" : "bg-emerald-500"
                      : "bg-gray-800"
                  }`} />
                ))}
              </div>
            )}
          </div>

          {/* Confirm */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Xác nhận mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="password"
                value={form.confirm}
                onChange={update("confirm")}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="••••••••"
                className={`w-full bg-gray-900 border rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500 transition-colors ${errors.confirm ? "border-red-500" : "border-gray-800"}`}
              />
            </div>
            {errors.confirm && <p className="text-red-400 text-xs mt-1">{errors.confirm}</p>}
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-900/30 mt-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tạo tài khoản"}
          </button>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Đã có tài khoản?{" "}
          <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}

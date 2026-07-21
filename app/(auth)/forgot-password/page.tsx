"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { requestPasswordReset } from "@/app/actions/password-reset";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setError("");
    if (!email.trim()) {
      setError("Vui lòng nhập email");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Email không hợp lệ");
      return;
    }

    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSubmitted(true);
    } catch {
      setError("Đã xảy ra lỗi, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <Image src="/logo.svg" alt="WorkFlow" width={28} height={28} className="h-7 w-auto object-contain" />
          <span className="text-xl font-bold text-white">WorkFlow</span>
        </div>

        {submitted ? (
          <>
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1 text-center">Kiểm tra email của bạn</h2>
            <p className="text-gray-400 text-sm mb-6 text-center">
              Nếu email tồn tại trong hệ thống, chúng tôi đã gửi link đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.
            </p>
            <Link
              href="/login"
              className="w-full bg-gray-900 border border-gray-800 hover:border-gray-700 text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại đăng nhập
            </Link>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-white mb-1 text-center">Quên mật khẩu?</h2>
            <p className="text-gray-400 text-sm mb-6 text-center">
              Nhập email của bạn và chúng tôi sẽ gửi link đặt lại mật khẩu
            </p>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    placeholder="ban@vidu.com"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-900/30 mt-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Gửi link đặt lại mật khẩu"}
              </button>
            </div>

            <p className="text-center text-gray-500 text-sm mt-6">
              <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium inline-flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                Quay lại đăng nhập
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Lock, Eye, EyeOff, Loader2, ArrowLeft, AlertTriangle, CheckCircle2 } from "lucide-react";
import { resetPassword } from "@/app/actions/password-reset";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [form, setForm] = useState({ password: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const update = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate() {
    const errs: Record<string, string> = {};
    if (form.password.length < 8) errs.password = "Mật khẩu tối thiểu 8 ký tự";
    else if (!/[A-Z]/.test(form.password)) errs.password = "Mật khẩu phải có ít nhất 1 chữ hoa";
    else if (!/[a-z]/.test(form.password)) errs.password = "Mật khẩu phải có ít nhất 1 chữ thường";
    else if (!/[0-9]/.test(form.password)) errs.password = "Mật khẩu phải có ít nhất 1 chữ số";
    if (form.confirm !== form.password) errs.confirm = "Mật khẩu không khớp";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await resetPassword(token || "", form.password);
      if (result.error) {
        setErrors({ form: result.error });
      } else {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 3000);
      }
    } catch {
      setErrors({ form: "Đã xảy ra lỗi, vui lòng thử lại" });
    } finally {
      setLoading(false);
    }
  }

  const pwStrength = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (p.length >= 12) s++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p) && /[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="w-12 h-12 text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">Liên kết không hợp lệ</h2>
          <p className="text-gray-400 text-sm mb-6">
            Không tìm thấy token đặt lại mật khẩu. Vui lòng yêu cầu lại liên kết mới.
          </p>
          <Link
            href="/forgot-password"
            className="w-full bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-900/30"
          >
            <ArrowLeft className="w-4 h-4" />
            Yêu cầu lại
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <Image src="/logo.svg" alt="WorkFlow" width={28} height={28} className="h-7 w-auto object-contain" />
          <span className="text-xl font-bold text-white">WorkFlow</span>
        </div>

        {success ? (
          <>
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1 text-center">Đổi mật khẩu thành công</h2>
            <p className="text-gray-400 text-sm mb-6 text-center">
              Mật khẩu đã được cập nhật. Bạn sẽ được chuyển đến trang đăng nhập...
            </p>
            <Link
              href="/login"
              className="w-full bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-900/30"
            >
              Đăng nhập ngay
            </Link>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-white mb-1 text-center">Đặt lại mật khẩu</h2>
            <p className="text-gray-400 text-sm mb-6 text-center">Nhập mật khẩu mới cho tài khoản của bạn</p>

            {errors.form && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">
                {errors.form}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Mật khẩu mới</label>
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

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Xác nhận mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={form.confirm}
                    onChange={update("confirm")}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    placeholder="••••••••"
                    className={`w-full bg-gray-900 border rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500 transition-colors ${errors.confirm ? "border-red-500" : "border-gray-800"}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirm && <p className="text-red-400 text-xs mt-1">{errors.confirm}</p>}
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-900/30 mt-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Đặt lại mật khẩu"}
              </button>
            </div>

            <p className="text-center text-gray-500 text-sm mt-6">
              <Link href="/forgot-password" className="text-purple-400 hover:text-purple-300 font-medium inline-flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                Yêu cầu lại liên kết
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

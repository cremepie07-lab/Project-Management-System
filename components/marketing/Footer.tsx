import Link from "next/link";
import Image from "next/image";

const LINKS = {
  "Giải pháp": ["Tính năng", "Demo bảng", "Quy trình"],
  "Tài nguyên": ["Tài liệu hướng dẫn", "Hỗ trợ khách hàng", "Blog công nghệ"],
  "Chính sách": ["Điều khoản sử dụng", "Quyền riêng tư", "Chính sách Cookie"],
};

export default function Footer() {
  return (
    <footer className="bg-[#080a10] border-t border-white/5 relative z-10">
      <div className="max-w-6xl mx-auto px-5 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <Image
                src="/logo.svg"
                alt="WorkFlow"
                width={24}
                height={24}
                className="h-6 w-auto object-contain"
              />
              <span className="font-bold text-white text-sm tracking-tight">WorkFlow</span>
            </div>
            <p className="text-white/30 text-xs leading-relaxed max-w-[180px]">
              Bảng quản trị Kanban thông minh dành cho sinh viên và nhóm lập trình nhỏ.
            </p>
          </div>

          {/* Links Column */}
          {Object.entries(LINKS).map(([group, links]) => (
            <div key={group}>
              <h4 className="text-white/50 text-[11px] font-bold uppercase tracking-wider mb-3.5">{group}</h4>
              <ul className="space-y-2">
                {links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-white/35 hover:text-white/70 text-xs transition-colors duration-200">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/20">
          <span>© {new Date().getFullYear()} WorkFlow. Tất cả quyền được bảo lưu.</span>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-white/40 transition-colors">Đăng nhập</Link>
            <Link href="/register" className="hover:text-white/40 transition-colors">Đăng ký</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
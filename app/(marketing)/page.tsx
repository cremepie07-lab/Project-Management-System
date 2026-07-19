import type { Metadata } from "next";
import Navbar from "@/components/marketing/Navbar";
import Hero from "@/components/marketing/Hero";
import Features from "@/components/marketing/Features";
import Demo from "@/components/marketing/Demo";
import CTA from "@/components/marketing/CTA";
import Footer from "@/components/marketing/Footer";

export const metadata: Metadata = {
  title: "WorkFlow — Kanban Board cho nhóm hiện đại",
  description:
    "Quản lý dự án Kanban board dành cho sinh viên, nhóm nhỏ và dev team. Kéo thả, giao việc, track thời gian — miễn phí, không cài đặt.",
  openGraph: {
    title: "WorkFlow — Kanban Board cho nhóm hiện đại",
    description: "Kanban board tối giản, miễn phí cho nhóm nhỏ và dev team.",
    type: "website",
  },
};

export default function MarketingPage() {
  return (
    <div className="bg-[#080a10] min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Demo />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

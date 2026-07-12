"use client";

import { useState, useEffect } from "react";
import { QA_TEST_CASES, CATEGORIES, QACategory } from "../../lib/qa-data";
import { CheckCircle2, Circle, Wand2, RotateCcw, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function QAPage() {
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<QACategory>("All Categories");
  
  // Trạng thái các test case đã done (lưu lại dạng mảng ID)
  const [doneIds, setDoneIds] = useState<string[]>([]);

  // Lấy dữ liệu từ localStorage khi load
  useEffect(() => {
    const saved = localStorage.getItem("workflow-qa-progress");
    if (saved) {
      try {
        setDoneIds(JSON.parse(saved));
      } catch (e) {
        console.error("Error parsing QA progress", e);
      }
    }
    setMounted(true);
  }, []);

  // Lưu dữ liệu vào localStorage khi có thay đổi
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("workflow-qa-progress", JSON.stringify(doneIds));
    }
  }, [doneIds, mounted]);

  if (!mounted) return null; // Avoid hydration mismatch

  const toggleStatus = (id: string) => {
    setDoneIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const resetProgress = () => {
    if (confirm("Bạn có chắc chắn muốn reset toàn bộ tiến trình test không?")) {
      setDoneIds([]);
    }
  };

  const filteredCases = activeCategory === "All Categories" 
    ? QA_TEST_CASES 
    : QA_TEST_CASES.filter(tc => tc.category === activeCategory);

  const totalCases = QA_TEST_CASES.length;
  const completedCases = doneIds.length;
  const progressPct = totalCases === 0 ? 0 : Math.round((completedCases / totalCases) * 100);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* HEADER SECTION (GRADIENT) */}
      <div className="bg-linear-to-br from-blue-600 to-indigo-600 text-white pt-12 pb-24 px-6 sm:px-12 relative overflow-hidden">
        <Link 
          href="/" 
          className="absolute top-6 left-6 flex items-center text-blue-100 hover:text-white transition-colors text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Quay lại App
        </Link>

        <div className="max-w-5xl mx-auto flex flex-col items-center text-center mt-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold mb-6 backdrop-blur-md">
            <Wand2 className="w-3.5 h-3.5" />
            Interactive QA
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 drop-shadow-sm">
            Project Management Test Cases
          </h1>
          <p className="text-blue-100 text-lg max-w-2xl">
            Tương tác check off các kịch bản kiểm thử ở bên dưới khi bạn đã xác nhận tính năng hoạt động chính xác.
          </p>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-12 pb-20">
        
        {/* PROGRESS CARD */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-end justify-between mb-2">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Testing Progress</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Click vào checkbox trên từng dòng khi bạn test thành công.
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-slate-700">{progressPct}% Hoàn thành</span>
                <span className="text-xs text-slate-500 block">{completedCases} / {totalCases}</span>
              </div>
            </div>
            {/* Progress Bar */}
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-linear-to-r from-blue-500 to-indigo-500 transition-all duration-500 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
          
          <button 
            onClick={resetProgress}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Progress
          </button>
        </div>

        {/* CATEGORY TABS */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                activeCategory === cat 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" 
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* TEST CASES TABLE */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                  <th className="px-6 py-4 w-16 text-center">Done</th>
                  <th className="px-6 py-4 w-24">ID</th>
                  <th className="px-6 py-4 w-1/4">Test Scenario</th>
                  <th className="px-6 py-4 w-1/3">Steps to Execute</th>
                  <th className="px-6 py-4 w-1/3">Expected Result</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCases.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      Không có test case nào trong danh mục này.
                    </td>
                  </tr>
                ) : (
                  filteredCases.map(tc => {
                    const isDone = doneIds.includes(tc.id);
                    return (
                      <tr 
                        key={tc.id} 
                        className={`transition-colors hover:bg-slate-50 ${isDone ? 'bg-slate-50/50' : ''}`}
                      >
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => toggleStatus(tc.id)}
                            className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full p-1"
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-6 h-6 text-green-500 transition-transform scale-110" />
                            ) : (
                              <Circle className="w-6 h-6 text-slate-300 hover:text-slate-400 transition-colors" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            {tc.id}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className={`font-semibold text-slate-800 ${isDone ? 'line-through text-slate-500' : ''}`}>
                            {tc.scenario}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <ul className="text-sm text-slate-600 space-y-1">
                            {tc.steps.map((step, idx) => (
                              <li key={idx}>{step}</li>
                            ))}
                          </ul>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-slate-600">
                            {tc.expected}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${
                            isDone 
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}>
                            {isDone ? "Passed" : "Pending"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Loader2, ChevronRight, X } from "lucide-react";
import {
  ApiError,
  ClauseContent,
  ClauseIndustry,
  ClauseSummary,
  getClauseContent,
  getClauseIndustries,
  getClausesByIndustry,
  getMe,
} from "@/lib/api";

export default function ClauseLibraryPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  const [industries, setIndustries] = useState<ClauseIndustry[]>([]);
  const [loadingIndustries, setLoadingIndustries] = useState(true);

  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(
    null
  );
  const [clauses, setClauses] = useState<ClauseSummary[]>([]);
  const [loadingClauses, setLoadingClauses] = useState(false);

  const [openClause, setOpenClause] = useState<ClauseContent | null>(null);
  const [loadingClauseContent, setLoadingClauseContent] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMe()
      .then(() => setAuthChecked(true))
      .catch(() => router.push("/login"));
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;
    getClauseIndustries()
      .then((res) => setIndustries(res.industries))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Có lỗi xảy ra")
      )
      .finally(() => setLoadingIndustries(false));
  }, [authChecked]);

  function openIndustry(key: string) {
    setSelectedIndustry(key);
    setClauses([]);
    setLoadingClauses(true);
    setError(null);
    getClausesByIndustry(key)
      .then((res) => setClauses(res.clauses))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Có lỗi xảy ra")
      )
      .finally(() => setLoadingClauses(false));
  }

  function openClauseContent(clauseName: string) {
    if (!selectedIndustry) return;
    setLoadingClauseContent(true);
    setError(null);
    getClauseContent(selectedIndustry, clauseName)
      .then(setOpenClause)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Có lỗi xảy ra")
      )
      .finally(() => setLoadingClauseContent(false));
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F3]">
        <Loader2 className="animate-spin text-[#9C7A3C]" size={28} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <header className="bg-[#16213E] text-white px-6 py-4 flex items-center gap-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white"
        >
          <ArrowLeft size={16} />
          Quay lại
        </Link>
        <div className="flex items-center gap-2">
          <BookOpen size={20} className="text-[#C6A15C]" />
          <h1 className="text-lg font-semibold">Thư viện điều khoản theo ngành</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {error && (
          <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        {!selectedIndustry ? (
          <>
            <p className="text-[#5B6472] mb-6">
              Chọn một ngành/loại hợp đồng để xem các điều khoản mẫu có
              sẵn, dùng để tham khảo khi tự soạn thảo hoặc đối chiếu với
              hợp đồng đang review.
            </p>

            {loadingIndustries ? (
              <p className="text-[#5B6472]">Đang tải...</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {industries.map((ind) => (
                  <button
                    key={ind.key}
                    onClick={() => openIndustry(ind.key)}
                    className="text-left bg-white border border-[#DCD7C9] rounded-lg p-5 hover:border-[#9C7A3C] hover:shadow-sm transition"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-[#1C2333]">
                        {ind.label}
                      </h3>
                      <ChevronRight size={18} className="text-[#9C7A3C]" />
                    </div>
                    <p className="text-sm text-[#5B6472] mt-1">
                      {ind.clause_count} điều khoản mẫu
                    </p>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <button
              onClick={() => {
                setSelectedIndustry(null);
                setClauses([]);
              }}
              className="flex items-center gap-1.5 text-sm text-[#9C7A3C] hover:underline mb-4"
            >
              <ArrowLeft size={14} />
              Chọn ngành khác
            </button>

            <h2 className="text-xl font-semibold text-[#1C2333] mb-4">
              {industries.find((i) => i.key === selectedIndustry)?.label ??
                selectedIndustry}
            </h2>

            {loadingClauses ? (
              <p className="text-[#5B6472]">Đang tải...</p>
            ) : (
              <div className="space-y-2">
                {clauses.map((clause) => (
                  <button
                    key={clause.clause_name}
                    onClick={() => openClauseContent(clause.clause_name)}
                    className="w-full text-left bg-white border border-[#DCD7C9] rounded-md p-4 hover:border-[#9C7A3C] transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[#1C2333]">
                        {clause.label}
                      </span>
                      <ChevronRight size={16} className="text-[#9C7A3C]" />
                    </div>
                    {clause.preview && (
                      <p className="text-sm text-[#5B6472] mt-1 line-clamp-1">
                        {clause.preview}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Modal nội dung điều khoản */}
      {(openClause || loadingClauseContent) && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          onClick={() => setOpenClause(null)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#1C2333]">
                {openClause?.clause_name ?? "Đang tải..."}
              </h3>
              <button
                onClick={() => setOpenClause(null)}
                className="text-[#5B6472] hover:text-[#1C2333]"
              >
                <X size={20} />
              </button>
            </div>
            {loadingClauseContent ? (
              <p className="text-[#5B6472]">Đang tải...</p>
            ) : (
              <pre className="whitespace-pre-wrap text-sm text-[#1C2333] font-sans leading-relaxed">
                {openClause?.content}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

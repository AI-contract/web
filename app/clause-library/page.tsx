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
import { useLang, type Lang } from "@/lib/lang";
import LangSwitcher from "@/app/components/LangSwitcher";

// ---- văn bản giao diện (tiêu đề/nút/thông báo) dịch đủ 5 ngôn ngữ.
// LƯU Ý: tên ngành, tên điều khoản và NỘI DUNG điều khoản do backend trả về
// bằng tiếng Việt và được giữ nguyên, vì văn bản hợp đồng luôn soạn bằng
// tiếng Việt theo quy định pháp luật. ----
const TEXT: Record<
  Lang,
  {
    back: string;
    title: string;
    intro: string;
    loading: string;
    errGeneric: string;
    sampleClauses: (n: number) => string;
    chooseOther: string;
  }
> = {
  vi: {
    back: "Quay lại",
    title: "Thư viện điều khoản theo ngành",
    intro:
      "Chọn một ngành/loại hợp đồng để xem các điều khoản mẫu có sẵn, dùng để tham khảo khi tự soạn thảo hoặc đối chiếu với hợp đồng đang review.",
    loading: "Đang tải...",
    errGeneric: "Có lỗi xảy ra",
    sampleClauses: (n) => `${n} điều khoản mẫu`,
    chooseOther: "Chọn ngành khác",
  },
  en: {
    back: "Back",
    title: "Clause Library by Industry",
    intro:
      "Choose an industry/contract type to browse the available sample clauses, for reference when drafting your own contract or comparing against a contract under review.",
    loading: "Loading...",
    errGeneric: "Something went wrong",
    sampleClauses: (n) => `${n} sample clause${n === 1 ? "" : "s"}`,
    chooseOther: "Choose another industry",
  },
  zh: {
    back: "返回",
    title: "按行业分类的条款库",
    intro:
      "选择行业/合同类型，查看现有的示范条款，可在自行起草或对照正在审查的合同时参考。",
    loading: "加载中...",
    errGeneric: "出错了",
    sampleClauses: (n) => `${n} 条示范条款`,
    chooseOther: "选择其他行业",
  },
  ko: {
    back: "뒤로",
    title: "업종별 조항 라이브러리",
    intro:
      "업종/계약 유형을 선택하여 제공되는 샘플 조항을 확인하세요. 계약서를 직접 작성하거나 검토 중인 계약서와 대조할 때 참고할 수 있습니다.",
    loading: "불러오는 중...",
    errGeneric: "오류가 발생했습니다",
    sampleClauses: (n) => `샘플 조항 ${n}개`,
    chooseOther: "다른 업종 선택",
  },
  ja: {
    back: "戻る",
    title: "業種別条項ライブラリ",
    intro:
      "業種／契約の種類を選ぶと、利用可能なサンプル条項を確認できます。契約書を自作する際や、レビュー中の契約書との照合の参考にしてください。",
    loading: "読み込み中...",
    errGeneric: "エラーが発生しました",
    sampleClauses: (n) => `サンプル条項 ${n} 件`,
    chooseOther: "別の業種を選ぶ",
  },
};

export default function ClauseLibraryPage() {
  const router = useRouter();
  const [lang] = useLang();
  const t = TEXT[lang];
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
  // Nhãn hiển thị của điều khoản đang mở (vd "Điều 3. Mục đích đặt cọc")
  const [openLabel, setOpenLabel] = useState<string>("");

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
        setError(err instanceof ApiError ? err.message : t.errGeneric)
      )
      .finally(() => setLoadingIndustries(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked]);

  function openIndustry(key: string) {
    setSelectedIndustry(key);
    setClauses([]);
    setLoadingClauses(true);
    setError(null);
    getClausesByIndustry(key)
      .then((res) => setClauses(res.clauses))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : t.errGeneric)
      )
      .finally(() => setLoadingClauses(false));
  }

  function openClauseContent(clauseName: string, label: string) {
    if (!selectedIndustry) return;
    setOpenLabel(label);
    setLoadingClauseContent(true);
    setError(null);
    getClauseContent(selectedIndustry, clauseName)
      .then(setOpenClause)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : t.errGeneric)
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
          {t.back}
        </Link>
        <div className="flex items-center gap-2">
          <BookOpen size={20} className="text-[#C6A15C]" />
          <h1 className="text-lg font-semibold">{t.title}</h1>
        </div>
        <LangSwitcher />
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {error && (
          <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        {!selectedIndustry ? (
          <>
            <p className="text-[#5B6472] mb-6">{t.intro}</p>

            {loadingIndustries ? (
              <p className="text-[#5B6472]">{t.loading}</p>
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
                      {t.sampleClauses(ind.clause_count)}
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
              {t.chooseOther}
            </button>

            <h2 className="text-xl font-semibold text-[#1C2333] mb-4">
              {industries.find((i) => i.key === selectedIndustry)?.label ??
                selectedIndustry}
            </h2>

            {loadingClauses ? (
              <p className="text-[#5B6472]">{t.loading}</p>
            ) : (
              <div className="space-y-2">
                {clauses.map((clause) => (
                  <button
                    key={clause.clause_name}
                    onClick={() =>
                      openClauseContent(clause.clause_name, clause.label)
                    }
                    className="w-full text-left bg-white border border-[#DCD7C9] rounded-md p-4 hover:border-[#9C7A3C] transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[#1C2333]">
                        {clause.label}
                      </span>
                      <ChevronRight size={16} className="text-[#9C7A3C]" />
                    </div>
                    {clause.preview && clause.article_number == null && (
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
                {openLabel || (openClause?.clause_name ?? t.loading)}
              </h3>
              <button
                onClick={() => setOpenClause(null)}
                className="text-[#5B6472] hover:text-[#1C2333]"
              >
                <X size={20} />
              </button>
            </div>
            {loadingClauseContent ? (
              <p className="text-[#5B6472]">{t.loading}</p>
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

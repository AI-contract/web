"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Loader2, Plus, Trash2, CheckCircle2 } from "lucide-react";
import {
  ApiError,
  ContractDeadline,
  createDeadline,
  deleteDeadline,
  listDeadlines,
  updateDeadline,
  getMe,
} from "@/lib/api";
import { useLang, type Lang } from "@/lib/lang";
import LangSwitcher from "@/app/components/LangSwitcher";

// ---- văn bản giao diện (nhãn/nút/thông báo) dịch đủ 5 ngôn ngữ.
// Lưu ý: "key" của loại mốc (expiry, renewal...) là mã gửi cho backend,
// KHÔNG đổi; chỉ nhãn hiển thị được dịch. ----
const TEXT: Record<
  Lang,
  {
    back: string;
    title: string;
    errGeneric: string;
    types: Record<string, string>;
    showResolved: string;
    addBtn: string;
    titlePlaceholder: string;
    notifyLabel: string;
    notePlaceholder: string;
    saving: string;
    saveBtn: string;
    loading: string;
    empty: string;
    dueLabel: string;
    resolved: string;
    overdue: (n: number) => string;
    today: string;
    remaining: (n: number) => string;
    markResolved: string;
    del: string;
  }
> = {
  vi: {
    back: "Quay lại",
    title: "Nhắc hạn hợp đồng",
    errGeneric: "Có lỗi xảy ra",
    types: {
      expiry: "Hết hạn hợp đồng",
      renewal: "Gia hạn",
      payment: "Thanh toán",
      liquidation: "Thanh lý",
      other: "Khác",
    },
    showResolved: "Hiện cả mốc đã xử lý",
    addBtn: "Thêm mốc nhắc hạn",
    titlePlaceholder: "Tên mốc, vd: Hết hạn hợp đồng dịch vụ với công ty ABC",
    notifyLabel: "Nhắc trước bao nhiêu ngày (phân tách bằng dấu phẩy)",
    notePlaceholder: "Ghi chú (không bắt buộc)",
    saving: "Đang lưu...",
    saveBtn: "Lưu mốc nhắc hạn",
    loading: "Đang tải...",
    empty: "Chưa có mốc nhắc hạn nào.",
    dueLabel: "Hạn:",
    resolved: "Đã xử lý",
    overdue: (n) => `Đã quá hạn ${n} ngày`,
    today: "Đến hạn hôm nay",
    remaining: (n) => `Còn ${n} ngày`,
    markResolved: "Đánh dấu đã xử lý",
    del: "Xoá",
  },
  en: {
    back: "Back",
    title: "Contract Deadline Reminders",
    errGeneric: "Something went wrong",
    types: {
      expiry: "Contract expiry",
      renewal: "Renewal",
      payment: "Payment",
      liquidation: "Liquidation",
      other: "Other",
    },
    showResolved: "Show resolved deadlines",
    addBtn: "Add deadline reminder",
    titlePlaceholder: "Title, e.g.: Service contract with ABC Company expires",
    notifyLabel: "Days in advance to remind (comma-separated)",
    notePlaceholder: "Note (optional)",
    saving: "Saving...",
    saveBtn: "Save reminder",
    loading: "Loading...",
    empty: "No deadline reminders yet.",
    dueLabel: "Due:",
    resolved: "Resolved",
    overdue: (n) => `Overdue by ${n} day${n === 1 ? "" : "s"}`,
    today: "Due today",
    remaining: (n) => `${n} day${n === 1 ? "" : "s"} left`,
    markResolved: "Mark as resolved",
    del: "Delete",
  },
  zh: {
    back: "返回",
    title: "合同到期提醒",
    errGeneric: "出错了",
    types: {
      expiry: "合同到期",
      renewal: "续约",
      payment: "付款",
      liquidation: "合同清算",
      other: "其他",
    },
    showResolved: "显示已处理的提醒",
    addBtn: "添加到期提醒",
    titlePlaceholder: "名称，例如：与 ABC 公司的服务合同到期",
    notifyLabel: "提前多少天提醒（用逗号分隔）",
    notePlaceholder: "备注（可选）",
    saving: "保存中...",
    saveBtn: "保存提醒",
    loading: "加载中...",
    empty: "暂无到期提醒。",
    dueLabel: "到期：",
    resolved: "已处理",
    overdue: (n) => `已逾期 ${n} 天`,
    today: "今天到期",
    remaining: (n) => `还剩 ${n} 天`,
    markResolved: "标记为已处理",
    del: "删除",
  },
  ko: {
    back: "뒤로",
    title: "계약 기한 알림",
    errGeneric: "오류가 발생했습니다",
    types: {
      expiry: "계약 만료",
      renewal: "갱신",
      payment: "결제",
      liquidation: "계약 정산",
      other: "기타",
    },
    showResolved: "처리 완료된 항목도 표시",
    addBtn: "기한 알림 추가",
    titlePlaceholder: "항목명 예: ABC 회사와의 용역 계약 만료",
    notifyLabel: "며칠 전에 알릴지 (쉼표로 구분)",
    notePlaceholder: "메모 (선택)",
    saving: "저장 중...",
    saveBtn: "알림 저장",
    loading: "불러오는 중...",
    empty: "아직 기한 알림이 없습니다.",
    dueLabel: "기한:",
    resolved: "처리 완료",
    overdue: (n) => `${n}일 지남`,
    today: "오늘 기한",
    remaining: (n) => `${n}일 남음`,
    markResolved: "처리 완료로 표시",
    del: "삭제",
  },
  ja: {
    back: "戻る",
    title: "契約期限リマインダー",
    errGeneric: "エラーが発生しました",
    types: {
      expiry: "契約満了",
      renewal: "更新",
      payment: "支払い",
      liquidation: "契約清算",
      other: "その他",
    },
    showResolved: "処理済みも表示",
    addBtn: "期限リマインダーを追加",
    titlePlaceholder: "名称（例：ABC社とのサービス契約の満了）",
    notifyLabel: "何日前に通知するか（カンマ区切り）",
    notePlaceholder: "メモ（任意）",
    saving: "保存中...",
    saveBtn: "リマインダーを保存",
    loading: "読み込み中...",
    empty: "期限リマインダーはまだありません。",
    dueLabel: "期限：",
    resolved: "処理済み",
    overdue: (n) => `${n}日超過`,
    today: "本日期限",
    remaining: (n) => `残り${n}日`,
    markResolved: "処理済みにする",
    del: "削除",
  },
};

function badgeColor(daysRemaining: number): string {
  if (daysRemaining < 0) return "bg-red-100 text-red-700 border-red-300";
  if (daysRemaining <= 7)
    return "bg-amber-100 text-amber-800 border-amber-300";
  return "bg-emerald-100 text-emerald-700 border-emerald-300";
}

export default function DeadlinesPage() {
  const router = useRouter();
  const [lang] = useLang();
  const t = TEXT[lang];
  const [authChecked, setAuthChecked] = useState(false);

  const [deadlines, setDeadlines] = useState<ContractDeadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [includeResolved, setIncludeResolved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [deadlineType, setDeadlineType] = useState("expiry");
  const [dueDate, setDueDate] = useState("");
  const [notifyOffsets, setNotifyOffsets] = useState("30,7");
  const [note, setNote] = useState("");

  function daysLabel(daysRemaining: number): string {
    if (daysRemaining < 0) return t.overdue(-daysRemaining);
    if (daysRemaining === 0) return t.today;
    return t.remaining(daysRemaining);
  }

  useEffect(() => {
    getMe()
      .then(() => setAuthChecked(true))
      .catch(() => router.push("/login"));
  }, [router]);

  function reload() {
    setLoading(true);
    listDeadlines(includeResolved)
      .then(setDeadlines)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : t.errGeneric)
      )
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!authChecked) return;
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, includeResolved]);

  async function handleCreate() {
    if (!title.trim() || !dueDate) return;
    setSaving(true);
    setError(null);
    try {
      await createDeadline({
        title: title.trim(),
        deadline_type: deadlineType,
        due_date: dueDate,
        notify_offsets_days: notifyOffsets,
        note: note.trim() || undefined,
      });
      setTitle("");
      setDueDate("");
      setNote("");
      setNotifyOffsets("30,7");
      setShowForm(false);
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.errGeneric);
    } finally {
      setSaving(false);
    }
  }

  async function handleResolve(id: number) {
    try {
      await updateDeadline(id, { is_resolved: true });
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.errGeneric);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteDeadline(id);
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.errGeneric);
    }
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
          <Calendar size={20} className="text-[#C6A15C]" />
          <h1 className="text-lg font-semibold">{t.title}</h1>
        </div>
        <LangSwitcher />
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {error && (
          <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between mb-6">
          <label className="flex items-center gap-2 text-sm text-[#5B6472]">
            <input
              type="checkbox"
              checked={includeResolved}
              onChange={(e) => setIncludeResolved(e.target.checked)}
            />
            {t.showResolved}
          </label>

          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 bg-[#16213E] text-white px-4 py-2 rounded-md text-sm hover:bg-[#1C2333] transition"
          >
            <Plus size={16} />
            {t.addBtn}
          </button>
        </div>

        {showForm && (
          <div className="bg-white border border-[#DCD7C9] rounded-lg p-5 mb-6 space-y-3">
            <input
              type="text"
              placeholder={t.titlePlaceholder}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-[#DCD7C9] px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={deadlineType}
                onChange={(e) => setDeadlineType(e.target.value)}
                className="rounded-md border border-[#DCD7C9] px-3 py-2 text-sm"
              >
                {Object.entries(t.types).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="rounded-md border border-[#DCD7C9] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-[#5B6472] block mb-1">
                {t.notifyLabel}
              </label>
              <input
                type="text"
                value={notifyOffsets}
                onChange={(e) => setNotifyOffsets(e.target.value)}
                placeholder="30,7"
                className="w-full rounded-md border border-[#DCD7C9] px-3 py-2 text-sm"
              />
            </div>
            <textarea
              placeholder={t.notePlaceholder}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-md border border-[#DCD7C9] px-3 py-2 text-sm"
              rows={2}
            />
            <button
              onClick={handleCreate}
              disabled={saving || !title.trim() || !dueDate}
              className="bg-[#9C7A3C] text-white px-4 py-2 rounded-md text-sm hover:bg-[#8A6B34] disabled:opacity-50 transition"
            >
              {saving ? t.saving : t.saveBtn}
            </button>
          </div>
        )}

        {loading ? (
          <p className="text-[#5B6472]">{t.loading}</p>
        ) : deadlines.length === 0 ? (
          <p className="text-[#5B6472]">{t.empty}</p>
        ) : (
          <div className="space-y-3">
            {deadlines.map((d) => (
              <div
                key={d.id}
                className={`bg-white border rounded-lg p-4 ${
                  d.is_resolved ? "opacity-60 border-[#DCD7C9]" : "border-[#DCD7C9]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium text-[#1C2333]">{d.title}</h3>
                    <p className="text-sm text-[#5B6472] mt-0.5">
                      {t.types[d.deadline_type] ?? d.deadline_type}{" "}
                      · {t.dueLabel} {d.due_date}
                    </p>
                    {d.note && (
                      <p className="text-sm text-[#5B6472] mt-1">{d.note}</p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 text-xs font-medium px-2 py-1 rounded-full border ${badgeColor(
                      d.days_remaining
                    )}`}
                  >
                    {d.is_resolved ? t.resolved : daysLabel(d.days_remaining)}
                  </span>
                </div>

                <div className="flex gap-3 mt-3">
                  {!d.is_resolved && (
                    <button
                      onClick={() => handleResolve(d.id)}
                      className="flex items-center gap-1 text-xs text-emerald-700 hover:underline"
                    >
                      <CheckCircle2 size={14} />
                      {t.markResolved}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="flex items-center gap-1 text-xs text-red-600 hover:underline"
                  >
                    <Trash2 size={14} />
                    {t.del}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
